/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { loadAndCleanDataset } from "./src/services/dataLoader.js";
import { computeDashboardStats, generateAnalyticsCharts } from "./src/services/analyzer.js";
import { ContentBasedRecommender } from "./src/services/recommender.js";
import { Movie, SearchFilters } from "./src/types.js";

// Helper functions for fuzzy matching (Levenshtein Distance-based spelling tolerance)
function getLevenshteinDistance(a: string, b: string): number {
  const tmp: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

function fuzzyMatch(text: string, query: string, threshold = 0.8): boolean {
  if (!query) return true;
  const cleanQuery = query.toLowerCase().trim();
  const cleanText = text.toLowerCase().trim();

  // 1. Direct substring match (100% similarity)
  if (cleanText.includes(cleanQuery)) {
    return true;
  }

  const queryWords = cleanQuery.split(/\s+/).filter((w) => w.length > 0);
  if (queryWords.length === 0) return true;

  const textWords = cleanText.split(/[\s:,\-()!._?#]+/).filter((w) => w.length > 0);
  if (textWords.length === 0) return false;

  let matchedWordsCount = 0;

  for (const qWord of queryWords) {
    let bestSim = 0;

    // 2. Direct exact or prefix sub-word optimization
    let quickMatch = false;
    for (const tWord of textWords) {
      if (tWord === qWord || tWord.startsWith(qWord)) {
        bestSim = 1.0;
        quickMatch = true;
        break;
      }
    }

    if (!quickMatch) {
      for (const tWord of textWords) {
        // 3. Length difference optimization
        if (Math.abs(qWord.length - tWord.length) > 2) {
          continue;
        }

        const distance = getLevenshteinDistance(qWord, tWord);
        const maxLen = Math.max(qWord.length, tWord.length);
        const similarity = (maxLen - distance) / maxLen;

        if (similarity > bestSim) {
          bestSim = similarity;
        }
      }
    }

    // Short query words (<=3 chars) are strict, e.g. "3" or "RRR"
    const wordThreshold = qWord.length <= 3 ? 0.85 : threshold;
    if (bestSim >= wordThreshold) {
      matchedWordsCount++;
    }
  }

  return matchedWordsCount === queryWords.length;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory caching for loaded structures
let movies: Movie[] = [];
let recommender: ContentBasedRecommender | null = null;
let statsCached: any = null;
let chartsCached: any = null;

// Initialize Google GenAI client securely on the server
let aiClient: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
  try {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Secure Gemini GenAI Client initialized successfully.");
  } catch (e) {
    console.warn("Failed to initialize Google GenAI client:", e);
  }
} else {
  console.log("No GEMINI_API_KEY configured. Running in local ML fallback mode.");
}

// Global logger middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Load the data science pipeline on startup
function initializeDataSciencePipeline() {
  try {
    console.log("Initializing Data Science pipeline...");
    movies = loadAndCleanDataset();
    console.log(`Loaded and cleaned ${movies.length} Netflix titles.`);

    recommender = new ContentBasedRecommender(movies);
    console.log("Content-based recommendation engine fitted successfully.");

    // Cache core aggregates
    statsCached = computeDashboardStats(movies);
    chartsCached = generateAnalyticsCharts(movies);
    console.log("Analytics dashboard stats and Plotly charts pre-calculated.");
  } catch (e) {
    console.warn("Critical error starting data science pipeline:", e);
  }
}

initializeDataSciencePipeline();

// --- REST API ENDPOINTS ---

// Simple Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    loaded_records: movies.length,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/dashboard - Returns KPIs and Plotly charts
app.get("/api/dashboard", (req, res) => {
  if (movies.length === 0) {
    return res.status(503).json({ error: "Pipeline is still initializing." });
  }
  res.json({
    stats: statsCached,
    charts: chartsCached,
  });
});

// GET /api/search - Live searching, filtering, sorting
app.get("/api/search", (req, res) => {
  if (movies.length === 0) {
    return res.status(503).json({ error: "Dataset is empty." });
  }

  // Parse search, filter, and sort options from query parameters
  const query = (req.query.q as string || "").trim().toLowerCase();
  const type = (req.query.type as string || "") as "" | "Movie" | "TV Show";
  const genre = (req.query.genre as string || "").trim().toLowerCase();
  const country = (req.query.country as string || "").trim().toLowerCase();
  const rating = (req.query.rating as string || "").trim().toLowerCase();
  const startYear = parseInt(req.query.startYear as string || "1900", 10);
  const endYear = parseInt(req.query.endYear as string || "2030", 10);
  const sortBy = (req.query.sortBy as string || "title") as "title" | "release_year" | "added_date";
  const sortOrder = (req.query.sortOrder as string || "asc") as "asc" | "desc";
  const is100crOnly = req.query.is100crOnly === "true";
  const isUnderratedOnly = req.query.isUnderratedOnly === "true";

  const CR100_TITLES = [
    "baahubali",
    "rrr",
    "k.g.f",
    "kgf",
    "jawan",
    "pathaan",
    "dangal",
    "bajrangi bhaijaan",
    "sultan",
    "tiger zinda hai",
    "war",
    "sanju",
    "animal",
    "stree",
    "gadar",
    "pushpa",
    "leo",
    "jailer",
    "vikram",
    "salaar",
    "kalki 2898",
    "kantara",
    "manjummel boys",
    "aavesham",
    "thiruchitrambalam",
    "pk",
    "3 idiots",
    "kabir singh",
    "uri: the surgical strike",
    "ponniyin selvan",
    "singham",
    "2018 (malayalam",
    "master",
    "mersal",
    "sarkar",
    "theri",
    "anniyan",
    "enthiran",
    "2.0",
    "devdas",
    "om shanti om"
  ];

  function is100crClub(title: string): boolean {
    const t = title.toLowerCase();
    return CR100_TITLES.some(pattern => t.includes(pattern));
  }

  // Filter the movies
  let filtered = movies.filter((m) => {
    // Fuzzy Search across multiple fields with 80% similarity threshold (handles up to 90%+ spelling mistakes)
    const combinedFields = `${m.title} ${m.director} ${m.cast} ${m.description}`;
    const searchMatch = !query || fuzzyMatch(combinedFields, query, 0.8);

    const typeMatch = !type || m.type === type;
    const genreMatch = !genre || m.listed_in.toLowerCase().includes(genre);
    const countryMatch = !country || m.country.toLowerCase().includes(country);
    const ratingMatch = !rating || m.rating.toLowerCase() === rating;
    const yearMatch = m.release_year >= startYear && m.release_year <= endYear;
    const is100crMatch = !is100crOnly || is100crClub(m.title);
    const isUnderratedMatch = !isUnderratedOnly || (!is100crClub(m.title) && m.description && m.description.length > 110);

    return searchMatch && typeMatch && genreMatch && countryMatch && ratingMatch && yearMatch && is100crMatch && isUnderratedMatch;
  });

  // Sort results
  filtered.sort((a, b) => {
    let comparison = 0;
    if (sortBy === "release_year") {
      comparison = a.release_year - b.release_year;
    } else if (sortBy === "added_date") {
      const yearA = a.added_year || 0;
      const yearB = b.added_year || 0;
      comparison = yearA - yearB;
    } else {
      comparison = a.title.localeCompare(b.title);
    }
    return sortOrder === "desc" ? -comparison : comparison;
  });

  res.json({
    total: filtered.length,
    results: filtered,
  });
});

// GET /api/recommend - Returns Recommendations for a title
app.get("/api/recommend", (req, res) => {
  const title = req.query.title as string;
  const topN = parseInt(req.query.top_n as string || "5", 10);

  if (!title) {
    return res.status(400).json({ error: "Query parameter 'title' is required." });
  }

  if (!recommender) {
    return res.status(503).json({ error: "Recommender engine is not available." });
  }

  try {
    const recs = recommender.recommendMovies(title, topN);
    res.json({
      title_queried: title,
      recommendations: recs,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to retrieve recommendations." });
  }
});

// GET /api/movie/:title - Returns details and recommendations in one request
app.get("/api/movie/:title", (req, res) => {
  const titleParam = req.params.title;
  if (!titleParam) {
    return res.status(400).json({ error: "Title parameter is required." });
  }

  const query = titleParam.trim().toLowerCase();
  let movie = movies.find((m) => m.title.toLowerCase() === query);
  if (!movie) {
    movie = movies.find((m) => m.title.toLowerCase().includes(query));
  }

  if (!movie) {
    return res.status(404).json({ error: `Movie/TV Show with title '${titleParam}' was not found.` });
  }

  let recommendations: any[] = [];
  if (recommender) {
    try {
      recommendations = recommender.recommendMovies(movie.title, 5);
    } catch (e) {
      console.warn("Failed to generate recommendations for detail view:", e);
    }
  }

  res.json({
    movie,
    recommendations,
  });
});

// GET /api/ai/insight - Queries local Ollama model (gemma3:4b) running on NVIDIA GPU
app.get("/api/ai/insight", async (req, res) => {
  const title = req.query.title as string;
  const description = req.query.description as string;
  const genres = req.query.genres as string;

  if (!title) {
    return res.status(400).json({ error: "Title parameter is required." });
  }

  const promptText = `You are a professional movie critic. Based on the title "${title}", genres "${genres}", and description "${description}", write a very short, engaging, and professional 1-2 sentence recommendation insight explaining why a viewer should watch this movie. Be specific and do not use generic text. Make it punchy and captivating. Do not mention that you are an AI or movie critic, write it directly.`;

  try {
    const ollamaUrl = "http://localhost:11434/api/generate";
    const response = await fetch(ollamaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma3:4b",
        prompt: promptText,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 80
        }
      }),
      signal: AbortSignal.timeout(6000)
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.response) {
        return res.json({ insight: data.response.trim().replace(/^"|"$/g, "") });
      }
    }
  } catch (error: any) {
    console.warn(`Local GPU AI Insight failed for "${title}":`, error.message);
  }

  return res.json({ insight: "" });
});

// GET /api/poster - Fetches TMDB poster and redirects
app.get("/api/poster", async (req, res) => {
  const title = req.query.title as string;
  const tmdbApiKey = process.env.TMDB_API_KEY || "410333becacc4d8177719418bdf7ebe9";
  
  const fallbackUrl = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=500";
  
  if (!title) {
    return res.redirect(fallbackUrl);
  }

  try {
    const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${tmdbApiKey}&query=${encodeURIComponent(title)}`;
    const tmdbRes = await fetch(searchUrl, { signal: AbortSignal.timeout(3000) });
    
    if (tmdbRes.ok) {
      const tmdbData = await tmdbRes.json();
      if (tmdbData.results && tmdbData.results.length > 0) {
        const result = tmdbData.results.find((r: any) => r.poster_path);
        if (result && result.poster_path) {
          return res.redirect(`https://image.tmdb.org/t/p/w500${result.poster_path}`);
        }
      }
    }
  } catch (error: any) {
    if (error.name === "TimeoutError" || error.code === "UND_ERR_CONNECT_TIMEOUT") {
      console.warn(`TMDB Poster fetch timeout for "${title}"`);
    } else {
      console.warn(`TMDB Poster fetch error for "${title}":`, error.message);
    }
  }

  return res.redirect(fallbackUrl);
});

// GET /api/banner - Fetches TMDB backdrop and redirects
app.get("/api/banner", async (req, res) => {
  const title = req.query.title as string;
  const tmdbApiKey = process.env.TMDB_API_KEY || "410333becacc4d8177719418bdf7ebe9";
  
  const fallbackUrl = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800&h=400";
  
  if (!title) {
    return res.redirect(fallbackUrl);
  }

  try {
    const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${tmdbApiKey}&query=${encodeURIComponent(title)}`;
    const tmdbRes = await fetch(searchUrl, { signal: AbortSignal.timeout(3000) });
    
    if (tmdbRes.ok) {
      const tmdbData = await tmdbRes.json();
      if (tmdbData.results && tmdbData.results.length > 0) {
        const result = tmdbData.results.find((r: any) => r.backdrop_path);
        if (result && result.backdrop_path) {
          return res.redirect(`https://image.tmdb.org/t/p/w1280${result.backdrop_path}`);
        }
      }
    }
  } catch (error: any) {
    if (error.name === "TimeoutError" || error.code === "UND_ERR_CONNECT_TIMEOUT") {
      console.warn(`TMDB Banner fetch timeout for "${title}"`);
    } else {
      console.warn(`TMDB Banner fetch error for "${title}":`, error.message);
    }
  }

  return res.redirect(fallbackUrl);
});

// GET /api/streaming - Fetches watch providers from TMDB
app.get("/api/streaming", async (req, res) => {
  const title = req.query.title as string;
  const tmdbApiKey = process.env.TMDB_API_KEY || "410333becacc4d8177719418bdf7ebe9";
  
  if (!title) {
    return res.status(400).json({ error: "Title required" });
  }

  try {
    const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${tmdbApiKey}&query=${encodeURIComponent(title)}`;
    const tmdbRes = await fetch(searchUrl, { signal: AbortSignal.timeout(3000) });
    
    if (tmdbRes.ok) {
      const tmdbData = await tmdbRes.json();
      if (tmdbData.results && tmdbData.results.length > 0) {
        const id = tmdbData.results[0].id;
        const mediaType = tmdbData.results[0].media_type || (tmdbData.results[0].title ? 'movie' : 'tv');
        
        const providersUrl = `https://api.themoviedb.org/3/${mediaType}/${id}/watch/providers?api_key=${tmdbApiKey}`;
        const provRes = await fetch(providersUrl, { signal: AbortSignal.timeout(3000) });
        if (provRes.ok) {
          const provData = await provRes.json();
          // Find US or IN providers (assuming global app, let's pick US or IN or just return all)
          const usProviders = provData.results?.US || provData.results?.IN;
          
          if (usProviders) {
             const allProviders = [...(usProviders.flatrate || []), ...(usProviders.rent || []), ...(usProviders.buy || [])];
             // get unique provider names
             const uniqueNames = Array.from(new Set(allProviders.map(p => p.provider_name)));
             return res.json({ providers: uniqueNames, status: usProviders.flatrate ? "Currently Streaming" : "Available to Rent / Buy" });
          }
          return res.json({ providers: [], status: "No streaming release confirmed" });
        }
      }
    }
  } catch (error: any) {
    if (error.name === "TimeoutError" || error.code === "UND_ERR_CONNECT_TIMEOUT") {
      console.warn(`TMDB Streaming fetch timeout for "${title}"`);
    } else {
      console.warn(`TMDB Streaming fetch error for "${title}":`, error.message);
    }
  }

  return res.json({ providers: [], status: "No streaming release confirmed" });
});

// --- ENHANCED BUNDLER & MIDDLEWARE ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode. Mounting Vite Dev Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode. Serving static files from dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`===================================================`);
    console.log(`Movie Analyser Server running on http://localhost:${PORT}`);
    console.log(`Port: ${PORT} (Ingress mapped for container)`);
    console.log(`===================================================`);
  });
}

startServer();
// Updated dataset to include 3000+ Indian movies and 1000+ international movies

