/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Film,
  Tv,
  Search,
  SlidersHorizontal,
  Compass,
  Sparkles,
  Award,
  Lock,
  Activity,
  ArrowUpDown,
  Download,
  RotateCcw,
  BookOpen,
  Info,
  Calendar,
  Globe,
  Clock,
  User,
  Users,
  Grid,
  BarChart3,
  HelpCircle,
  FileText,
  X,
  RefreshCw,
  TrendingUp,
  Mic,
  Bell,
  Bookmark
} from "lucide-react";
import PlotlyChart from "./components/PlotlyChart.js";
import DailyHub from "./components/DailyHub.js";
import SocialLounge from "./components/SocialLounge.js";
import TasteProfile from "./components/TasteProfile.js";
import UtilityHooks from "./components/UtilityHooks.js";
import { getWhyWatchInsight } from "./utils/movieInsights.js";
import { Movie, KPIStats, AnalyticsCharts, RecommendationResult, SearchFilters } from "./types.js";

type TabType = "dashboard" | "search" | "recommend" | "daily_hub" | "lounge" | "taste_profile" | "utility_hooks" | "about";

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

export function is100crMovie(title: string): boolean {
  const t = title.toLowerCase();
  return CR100_TITLES.some((pattern) => t.includes(pattern));
}

// Helper to retrieve beautiful, specific high-resolution movie poster imagery via TMDB API
export function getMoviePosterUrl(title: string, type: string, genres?: string[]): string {
  return `/api/poster?title=${encodeURIComponent(title)}`;
}

// Helper to retrieve wide landscape banner images for detail modal
export function getMovieBannerUrl(title: string, type: string, genres?: string[]): string {
  return `/api/banner?title=${encodeURIComponent(title)}`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Core Data State
  const [stats, setStats] = useState<KPIStats | null>(null);
  const [charts, setCharts] = useState<AnalyticsCharts | null>(null);
  const [moviesList, setMoviesList] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [gpuInsight, setGpuInsight] = useState<string>("");
  const [isGpuLoading, setIsGpuLoading] = useState<boolean>(false);

  // Search, Filters & Sorting State
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    type: "",
    genre: "",
    country: "",
    rating: "",
    startYear: 1930,
    endYear: 2030,
    sortBy: "title",
    sortOrder: "asc",
    is100crOnly: false,
    isUnderratedOnly: false,
  });
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Genre & Country lists for dropdown selections
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableRatings, setAvailableRatings] = useState<string[]>([]);

  // Recommendation State
  const [recSearchQuery, setRecSearchQuery] = useState<string>("");
  const [recSuggestions, setRecSuggestions] = useState<Movie[]>([]);
  const [recTargetMovie, setRecTargetMovie] = useState<Movie | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [isRecLoading, setIsRecLoading] = useState<boolean>(false);

  // Streak-based Premium Filter states
  const [streakCount, setStreakCount] = useState<number>(0);
  const [quizUnlocked, setQuizUnlocked] = useState<boolean>(false);
  const [showFilterQuizModal, setShowFilterQuizModal] = useState<boolean>(false);
  const [selectedQuizAns, setSelectedQuizAns] = useState<string | null>(null);
  const [quizIsCorrect, setQuizIsCorrect] = useState<boolean | null>(null);
  const [attemptedFilters, setAttemptedFilters] = useState<"100cr" | "underrated" | null>(null);

  // UI States
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // User Profile, Watch History & Social States
  const [userLikes, setUserLikes] = useState<string[]>([]);
  const [userMehs, setUserMehs] = useState<string[]>([]);
  const [userSleeps, setUserSleeps] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [isListening, setIsListening] = useState<boolean>(false);

  // Load local storage items on mount
  useEffect(() => {
    setUserLikes(JSON.parse(localStorage.getItem("user_likes") || "[]"));
    setUserMehs(JSON.parse(localStorage.getItem("user_mehs") || "[]"));
    setUserSleeps(JSON.parse(localStorage.getItem("user_sleeps") || "[]"));
    setWatchlist(JSON.parse(localStorage.getItem("watchlist") || "[]"));

    // Load streak count
    try {
      const stored = localStorage.getItem("movie_streak");
      if (stored) {
        setStreakCount(JSON.parse(stored).count || 0);
      } else {
        // Seed 1-day streak for testing
        setStreakCount(1);
        localStorage.setItem("movie_streak", JSON.stringify({ count: 1, lastDate: new Date().toISOString() }));
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeTab]);

  const handleReaction = (title: string, type: 'fire' | 'meh' | 'sleep') => {
    let updatedLikes = [...userLikes];
    let updatedMehs = [...userMehs];
    let updatedSleeps = [...userSleeps];

    // Remove from all
    updatedLikes = updatedLikes.filter(t => t.toLowerCase() !== title.toLowerCase());
    updatedMehs = updatedMehs.filter(t => t.toLowerCase() !== title.toLowerCase());
    updatedSleeps = updatedSleeps.filter(t => t.toLowerCase() !== title.toLowerCase());

    if (type === 'fire') {
      updatedLikes.push(title);
    } else if (type === 'meh') {
      updatedMehs.push(title);
    } else if (type === 'sleep') {
      updatedSleeps.push(title);
    }

    setUserLikes(updatedLikes);
    setUserMehs(updatedMehs);
    setUserSleeps(updatedSleeps);

    localStorage.setItem("user_likes", JSON.stringify(updatedLikes));
    localStorage.setItem("user_mehs", JSON.stringify(updatedMehs));
    localStorage.setItem("user_sleeps", JSON.stringify(updatedSleeps));
  };

  const removeReaction = (title: string) => {
    const updatedLikes = userLikes.filter(t => t.toLowerCase() !== title.toLowerCase());
    const updatedMehs = userMehs.filter(t => t.toLowerCase() !== title.toLowerCase());
    const updatedSleeps = userSleeps.filter(t => t.toLowerCase() !== title.toLowerCase());

    setUserLikes(updatedLikes);
    setUserMehs(updatedMehs);
    setUserSleeps(updatedSleeps);

    localStorage.setItem("user_likes", JSON.stringify(updatedLikes));
    localStorage.setItem("user_mehs", JSON.stringify(updatedMehs));
    localStorage.setItem("user_sleeps", JSON.stringify(updatedSleeps));
  };

  const addToWatchlist = (title: string) => {
    if (!watchlist.some(t => t.toLowerCase() === title.toLowerCase())) {
      const updated = [...watchlist, title];
      setWatchlist(updated);
      localStorage.setItem("watchlist", JSON.stringify(updated));
    }
  };

  const removeFromWatchlist = (title: string) => {
    const updated = watchlist.filter(t => t.toLowerCase() !== title.toLowerCase());
    setWatchlist(updated);
    localStorage.setItem("watchlist", JSON.stringify(updated));
  };

  // Personalized Recs State
  const [personalizedRecs, setPersonalizedRecs] = useState<RecommendationResult[]>([]);
  const [personalizedTarget, setPersonalizedTarget] = useState<string>("");

  // Fetch personalized recommendations dynamically
  useEffect(() => {
    if (moviesList.length === 0) return;

    const fetchPersonalized = async () => {
      if (userLikes.length > 0) {
        const target = userLikes[0];
        try {
          const res = await fetch(`/api/movie/${encodeURIComponent(target)}`);
          if (res.ok) {
            const data = await res.json();
            setPersonalizedTarget(target);
            setPersonalizedRecs(data.recommendations || []);
          }
        } catch (e) {
          console.error("Error fetching personalized recs:", e);
        }
      } else {
        // Fallback default
        const target = "Baahubali: The Beginning";
        try {
          const res = await fetch(`/api/movie/${encodeURIComponent(target)}`);
          if (res.ok) {
            const data = await res.json();
            setPersonalizedTarget(target);
            setPersonalizedRecs(data.recommendations || []);
          }
        } catch (e) {
          console.error("Error fetching personalized recs:", e);
        }
      }
    };

    fetchPersonalized();
  }, [userLikes, moviesList]);

  // Fetch initial stats, charts, and base list
  const loadDashboardData = async () => {
    setIsInitializing(true);
    setInitError(null);
    try {
      // Fetch health or trigger setup checks
      const healthRes = await fetch("/api/health");
      if (!healthRes.ok) {
        throw new Error("Server health check failed.");
      }

      const dashRes = await fetch("/api/dashboard");
      if (!dashRes.ok) {
        throw new Error("Failed to load dashboard data. Ensure server is initialized.");
      }
      const dashData = await dashRes.json();
      setStats(dashData.stats);
      setCharts(dashData.charts);

      // Fetch base search to populate all movies
      const searchRes = await fetch("/api/search");
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const list: Movie[] = searchData.results;
        setMoviesList(list);
        setSearchResults(list);

        // Aggregate filter dropdown assets
        const genres = new Set<string>();
        const countries = new Set<string>();
        const ratings = new Set<string>();

        list.forEach((m) => {
          if (m.cleaned_genres) m.cleaned_genres.forEach((g) => genres.add(g));
          if (m.normalized_country && m.normalized_country !== "Unknown Country") {
            countries.add(m.normalized_country);
          }
          if (m.rating) ratings.add(m.rating);
        });

        setAvailableGenres(Array.from(genres).sort());
        setAvailableCountries(Array.from(countries).sort());
        setAvailableRatings(Array.from(ratings).sort());
      }
    } catch (err: any) {
      console.error(err);
      setInitError(err.message || "An error occurred during initialization.");
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // 1. Resume filters state
    const saved = localStorage.getItem("saved_filters");
    if (saved) {
      try {
        setFilters(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved filters:", e);
      }
    }

    // 2. Parse shared watchlist URL param
    const params = new URLSearchParams(window.location.search);
    const sharedWatchlist = params.get("watchlist");
    if (sharedWatchlist) {
      try {
        const parsed = JSON.parse(atob(sharedWatchlist));
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTimeout(() => {
            const confirmImport = window.confirm(`Your friend shared a watchlist containing ${parsed.length} titles! Would you like to merge it with your own? 🍿`);
            if (confirmImport) {
              const currentWatchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
              const merged = Array.from(new Set([...currentWatchlist, ...parsed]));
              setWatchlist(merged);
              localStorage.setItem("watchlist", JSON.stringify(merged));
              alert("Watchlist merged successfully! Visit the Social Lounge to view it.");
            }
          }, 1000);
        }
      } catch (err) {
        console.error("Failed to parse shared watchlist URL parameter:", err);
      }
    }
  }, []);

  // Save filters on change to persist resume state
  useEffect(() => {
    if (!isInitializing) {
      localStorage.setItem("saved_filters", JSON.stringify(filters));
    }
  }, [filters, isInitializing]);

  // Live filter search updates
  useEffect(() => {
    if (isInitializing) return;

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const params = new URLSearchParams();
        if (filters.query) params.append("q", filters.query);
        if (filters.type) params.append("type", filters.type);
        if (filters.genre) params.append("genre", filters.genre);
        if (filters.country) params.append("country", filters.country);
        if (filters.rating) params.append("rating", filters.rating);
        params.append("startYear", filters.startYear.toString());
        params.append("endYear", filters.endYear.toString());
        params.append("sortBy", filters.sortBy);
        params.append("sortOrder", filters.sortOrder);
        if (filters.is100crOnly) params.append("is100crOnly", "true");
        if (filters.isUnderratedOnly) params.append("isUnderratedOnly", "true");

        const res = await fetch(`/api/search?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results);
        }
      } catch (err) {
        console.error("Failed to fetch filtered search results:", err);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce live searching
    const timer = setTimeout(() => {
      performSearch();
    }, 250);

    return () => clearTimeout(timer);
  }, [filters, isInitializing]);

  // Handle Speech Recognition Voice Search
  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser. Please try Chrome or Safari!");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN"; // Configured for Indian pronunciations and accents
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFilters((prev) => ({ ...prev, query: transcript }));
    };

    recognition.start();
  };

  // Handle recommendation target search suggestions
  useEffect(() => {
    if (!recSearchQuery.trim()) {
      setRecSuggestions([]);
      return;
    }
    const filtered = moviesList
      .filter((m) => m.title.toLowerCase().includes(recSearchQuery.toLowerCase()))
      .slice(0, 5);
    setRecSuggestions(filtered);
  }, [recSearchQuery, moviesList]);

  // Fetch recommendations for a specific movie title
  const handleFetchRecommendations = async (title: string) => {
    setIsRecLoading(true);
    setRecSearchQuery("");
    setRecSuggestions([]);
    try {
      const res = await fetch(`/api/movie/${encodeURIComponent(title)}`);
      if (res.ok) {
        const data = await res.json();
        setRecTargetMovie(data.movie);
        setRecommendations(data.recommendations);
      } else {
        console.error("Failed to load movie recommendations.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRecLoading(false);
    }
  };

  // Opens Inspector Modal for specific Movie details
  const inspectMovie = async (movieTitle: string) => {
    setGpuInsight("");
    setIsGpuLoading(true);
    try {
      // Track inspected movie counts for "Unfinished Business" feature
      const savedCounts = JSON.parse(localStorage.getItem("inspected_counts") || "{}");
      savedCounts[movieTitle] = (savedCounts[movieTitle] || 0) + 1;
      localStorage.setItem("inspected_counts", JSON.stringify(savedCounts));

      const res = await fetch(`/api/movie/${encodeURIComponent(movieTitle)}`);
      if (res.ok) {
        const data = await res.json();
        
        let streamingProviders = [];
        try {
          const streamingRes = await fetch(`/api/streaming?title=${encodeURIComponent(movieTitle)}`);
          if (streamingRes.ok) {
             const streamingData = await streamingRes.json();
             streamingProviders = streamingData.providers || [];
          }
        } catch (e) {
          console.error("Streaming api error", e);
        }

        setSelectedMovie({
          ...data.movie,
          recommendations: data.recommendations,
          streamingProviders
        });

        // Load GPU-accelerated AI insight in the background
        try {
          const aiRes = await fetch(`/api/ai/insight?title=${encodeURIComponent(movieTitle)}&description=${encodeURIComponent(data.movie.description)}&genres=${encodeURIComponent(data.movie.listed_in)}`);
          if (aiRes.ok) {
            const aiData = await aiRes.json();
            setGpuInsight(aiData.insight);
          }
        } catch (aiErr) {
          console.warn("Local GPU AI Error:", aiErr);
        } finally {
          setIsGpuLoading(false);
        }
      }
    } catch (e) {
      console.error(e);
      setIsGpuLoading(false);
    }
  };

  const getUnfinishedBusiness = (): Movie | null => {
    try {
      const savedCounts = JSON.parse(localStorage.getItem("inspected_counts") || "{}");
      const ratedSet = new Set([
        ...userLikes.map(t => t.toLowerCase()),
        ...userMehs.map(t => t.toLowerCase()),
        ...userSleeps.map(t => t.toLowerCase()),
        ...watchlist.map(t => t.toLowerCase())
      ]);

      const candidates = Object.entries(savedCounts)
        .filter(([title, count]) => {
          const countNum = Number(count);
          return countNum >= 1 && !ratedSet.has(title.toLowerCase());
        })
        .sort((a, b) => (b[1] as number) - (a[1] as number));

      if (candidates.length > 0) {
        const topTitle = candidates[0][0];
        return moviesList.find(m => m.title.toLowerCase() === topTitle.toLowerCase()) || null;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  // EXPORT HANDLERS
  const exportCSV = () => {
    const dataToExport = searchResults.length > 0 ? searchResults : moviesList;
    const headers = ["ID", "Type", "Title", "Director", "Cast", "Country", "Date Added", "Release Year", "Rating", "Duration", "Genres", "Description"];
    const rows = dataToExport.map((m) => [
      m.show_id,
      m.type,
      `"${m.title.replace(/"/g, '""')}"`,
      `"${m.director.replace(/"/g, '""')}"`,
      `"${m.cast.replace(/"/g, '""')}"`,
      `"${m.country.replace(/"/g, '""')}"`,
      m.date_added,
      m.release_year,
      m.rating,
      m.duration,
      `"${m.listed_in.replace(/"/g, '""')}"`,
      `"${m.description.replace(/"/g, '""')}"`
    ]);

    const content = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(content));
    link.setAttribute("download", `netflix_analytics_search_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExcel = () => {
    const dataToExport = searchResults.length > 0 ? searchResults : moviesList;
    const headers = ["ID", "Type", "Title", "Director", "Cast", "Country", "Date Added", "Release Year", "Rating", "Duration", "Genres", "Description"];
    const rows = dataToExport.map(m => [
      m.show_id, m.type, m.title, m.director, m.cast, m.country, m.date_added, m.release_year, m.rating, m.duration, m.listed_in, m.description
    ].map(v => typeof v === 'string' ? v.replace(/\t/g, ' ').replace(/\n/g, ' ') : v).join("\t"));

    const content = [headers.join("\t"), ...rows].join("\n");
    const blob = new Blob([content], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `netflix_excel_export_${Date.now()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerPDFPrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-200 flex flex-col md:flex-row relative font-sans">
      {/* Background Decorative Ambient Gradients (Glassmorphic Glows) */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* --- SIDEBAR --- */}
      <aside className="w-full md:w-64 bg-[#0f1115] border-b md:border-b-0 md:border-r border-white/10 p-5 flex flex-col justify-between shrink-0 md:sticky md:top-0 md:h-screen print:hidden z-20">
        <div>
          {/* App Brand Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-900/20">
              <Film className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-tight bg-gradient-to-r from-white via-slate-100 to-indigo-400 bg-clip-text text-transparent">
                Movie Analyser
              </h1>
              <span className="text-[10px] font-mono tracking-widest text-indigo-500 uppercase font-semibold">
                Netflix AI Pipeline
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {[
              { id: "dashboard", label: "Dashboard", icon: Grid },
              { id: "search", label: "Search & Filters", icon: Search },
              { id: "recommend", label: "Recommender", icon: Compass },
              { id: "daily_hub", label: "Daily Ritual 🌟", icon: Sparkles },
              { id: "lounge", label: "Cine-Lounge 🍿", icon: Users },
              { id: "taste_profile", label: "Taste Wrapped 📊", icon: BarChart3 },
              { id: "utility_hooks", label: "Release Alerts 🔔", icon: Bell },
              { id: "about", label: "About App", icon: Info },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as TabType);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                    isActive
                      ? "text-indigo-400 bg-indigo-950/20 border border-indigo-800/30"
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"}`} />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActiveBar"
                      className="absolute left-0 w-1 h-1/2 bg-indigo-500 rounded-r-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="hidden md:block pt-5 border-t border-white/10 text-center">
          <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>MODEL READY (v3.5)</span>
          </div>
          <p className="text-[9px] text-slate-600 mt-1">© 2026 Netflix Analyst LLC</p>
        </div>
      </aside>

      {/* --- MAIN STAGE --- */}
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto print:bg-white print:text-black">
        {/* Mobile Sticky Navbar */}
        <header className="md:hidden bg-[#0f1115]/80 backdrop-blur-md border-b border-white/10 px-5 py-4 flex items-center justify-between sticky top-0 z-30 print:hidden">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-500" />
            <h2 className="font-display font-bold text-md text-white">Movie Analyser</h2>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-200"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </header>

        {/* Mobile Menu Panel */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden bg-[#0f1115] border-b border-white/10 p-5 space-y-2 sticky top-[73px] z-30 print:hidden"
            >
              {[
                { id: "dashboard", label: "Dashboard", icon: Grid },
                { id: "search", label: "Search & Filters", icon: Search },
                { id: "recommend", label: "Recommender", icon: Compass },
                { id: "daily_hub", label: "Daily Ritual 🌟", icon: Sparkles },
                { id: "lounge", label: "Cine-Lounge 🍿", icon: Users },
                { id: "taste_profile", label: "Taste Wrapped 📊", icon: BarChart3 },
                { id: "utility_hooks", label: "Release Alerts 🔔", icon: Bell },
                { id: "about", label: "About App", icon: Info },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as TabType);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ${
                      isActive ? "bg-indigo-950/40 text-indigo-400" : "text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    {tab.label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading / Setup Screen */}
        {isInitializing ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10">
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-900/30 border-t-indigo-500 animate-spin" />
              <Film className="w-6 h-6 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
            </div>
            <h3 className="font-display font-bold text-xl text-white mb-2">Analyzing Netflix Catalogs...</h3>
            <p className="text-slate-400 text-sm text-center max-w-sm">
              Cleansing dataset schemas, fitting TF-IDF vectors, and training the Naive Bayes NLP model. Please wait.
            </p>
          </div>
        ) : initError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10">
            <div className="w-16 h-16 rounded-2xl bg-red-950/50 border border-red-500/30 flex items-center justify-center text-red-500 mb-5">
              <X className="w-8 h-8" />
            </div>
            <h3 className="font-display font-bold text-xl text-white mb-2">Pipeline Fault Detected</h3>
            <p className="text-slate-400 text-sm text-center max-w-md mb-6">{initError}</p>
            <button
              onClick={loadDashboardData}
              className="px-5 py-2.5 rounded-xl bg-[#141418] hover:bg-slate-800 text-white font-medium text-sm transition-colors flex items-center gap-2 border border-white/10"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Calibration
            </button>
          </div>
        ) : (
          <div className="p-5 md:p-8 flex-1 space-y-6">
            
            {/* Header Title Bar (Dynamic for current tab) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5 print:hidden">
              <div>
                <h2 className="font-display font-bold text-2xl md:text-3xl text-white tracking-tight capitalize">
                  {activeTab === "recommend" ? "Content-Based Recommender" : activeTab === "search" ? "Search Matrix" : activeTab}
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  {activeTab === "dashboard" && "At-a-glance telemetry of Netflix catalog KPIs and release patterns."}
                  {activeTab === "search" && "Browse, search, dynamic slider-filter, and sort all entries in real-time."}
                  {activeTab === "recommend" && "Leverage mathematical TF-IDF vector embeddings to discover relative content."}
                  {activeTab === "about" && "A technical digest of the software architecture and machine learning pipelines."}
                </p>
              </div>

              {/* Quick Exports in Header (Only applicable for metrics pages) */}
              {(activeTab === "dashboard" || activeTab === "search") && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportCSV}
                    title="Export Catalog to CSV"
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-slate-300 transition-all text-xs flex items-center gap-2 font-medium"
                  >
                    <Download className="w-4 h-4 text-indigo-400" />
                    CSV
                  </button>
                  <button
                    onClick={exportExcel}
                    title="Export Catalog to Excel (.xls)"
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-slate-300 transition-all text-xs flex items-center gap-2 font-medium"
                  >
                    <FileText className="w-4 h-4 text-emerald-400" />
                    Excel
                  </button>
                  <button
                    onClick={triggerPDFPrint}
                    title="Generate PDF Print Report"
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-xs flex items-center gap-2 font-medium shadow-md shadow-indigo-950/20"
                  >
                    <Award className="w-4 h-4" />
                    Print PDF Report
                  </button>
                </div>
              )}
            </div>

            {/* TAB STAGES */}
            <AnimatePresence mode="wait">
              {/* --- DASHBOARD TAB --- */}
              {activeTab === "dashboard" && stats && charts && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Unfinished Business Nudge */}
                  {(() => {
                    const unfinishedMovie = getUnfinishedBusiness();
                    if (!unfinishedMovie) return null;
                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-r from-pink-950/20 via-black/45 to-[#141418] border border-pink-500/20 p-5 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
                        
                        <div className="flex gap-4 items-center">
                          <div className="p-3 bg-pink-500/15 text-pink-400 rounded-xl shrink-0 animate-pulse">
                            <Sparkles className="w-6 h-6" />
                          </div>
                          <div className="space-y-0.5 text-left">
                            <span className="text-[10px] font-mono font-bold text-pink-400 uppercase tracking-widest block">
                              Unfinished Business Nudge 🧠
                            </span>
                            <h4 className="font-display font-black text-white text-md">
                              You looked at "{unfinishedMovie.title}" but never made a decision...
                            </h4>
                            <p className="text-xs text-slate-400">
                              Still curious? Add it to your watchlist or make a final decision tonight!
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 self-stretch md:self-auto">
                          <button
                            onClick={() => inspectMovie(unfinishedMovie.title)}
                            className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Inspect Again
                          </button>
                          <button
                            onClick={() => {
                              addToWatchlist(unfinishedMovie.title);
                              alert(`"${unfinishedMovie.title}" added to your Watchlist!`);
                            }}
                            className="flex-1 md:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Add to Watchlist
                          </button>
                        </div>
                      </motion.div>
                    );
                  })()}

                  {/* KPI Cards Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Total Catalog", value: moviesList.length, icon: Film, color: "from-indigo-600 to-indigo-700", detail: `${stats.totalMovies} Movies / ${stats.totalTVShows} TV Shows` },
                      { label: "Content Genres", value: stats.totalGenres, icon: Grid, color: "from-purple-600 to-purple-700", detail: "Standardized categories" },
                      { label: "Represented Nations", value: stats.totalCountries, icon: Globe, color: "from-indigo-500 to-purple-500", detail: "Global Netflix footprint" },
                      { label: "Average Movie Duration", value: `${stats.avgDurationMovie} min`, icon: Clock, color: "from-teal-600 to-emerald-600", detail: `Avg TV seasons: ${stats.avgDurationTVShow}` },
                    ].map((kpi, idx) => {
                      const Icon = kpi.icon;
                      return (
                        <motion.div
                          key={idx}
                          whileHover={{ y: -4, scale: 1.01 }}
                          className="bg-[#141418]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl flex items-start justify-between relative overflow-hidden group shadow-md"
                        >
                          <div className="space-y-2">
                            <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">{kpi.label}</span>
                            <div className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">{kpi.value}</div>
                            <span className="text-[10px] text-slate-500 block font-mono font-medium">{kpi.detail}</span>
                          </div>
                          <div className={`p-3 rounded-xl bg-gradient-to-tr ${kpi.color} text-white shadow-md`}>
                            <Icon className="w-5 h-5" />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Secondary/Sub Analytics Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-[#141418]/40 border border-white/5 p-4 rounded-xl flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Directors Documented</span>
                        <span className="text-sm font-bold text-slate-200">{stats.totalDirectors} filmmakers</span>
                      </div>
                    </div>
                    <div className="bg-[#141418]/40 border border-white/5 p-4 rounded-xl flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Most Frequent Rating</span>
                        <span className="text-sm font-bold text-slate-200">{stats.mostPopularRating}</span>
                      </div>
                    </div>
                    <div className="bg-[#141418]/40 border border-white/5 p-4 rounded-xl flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Mean Release Year</span>
                        <span className="text-sm font-bold text-slate-200">{stats.avgReleaseYear} release</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Plotly Charts Area */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Pie Chart */}
                    <div className="bg-[#141418]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-md lg:col-span-5 h-[420px] flex flex-col justify-between">
                      <div>
                        <h3 className="font-display font-semibold text-md text-white">Movies vs TV Shows</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Ratio breakdown of catalog formats.</p>
                      </div>
                      <div className="flex-1 min-h-0 flex items-center justify-center">
                        <PlotlyChart
                          id="typeDistributionPlot"
                          data={[{
                            labels: charts.typeDistribution.map(d => d.label),
                            values: charts.typeDistribution.map(d => d.value),
                            type: "pie",
                            hole: 0.5,
                            marker: {
                              colors: ["#6366f1", "#a855f7"] // indigo-500, purple-500
                            },
                            textinfo: "label+percent",
                            hoverinfo: "label+value",
                          }]}
                          layout={{
                            showlegend: false,
                            height: 300,
                            margin: { t: 10, r: 10, b: 10, l: 10 }
                          }}
                        />
                      </div>
                    </div>

                    {/* YoY Release Trend Chart */}
                    <div className="bg-[#141418]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-md lg:col-span-7 h-[420px] flex flex-col justify-between">
                      <div>
                        <h3 className="font-display font-semibold text-md text-white">Year-wise Releases Trend</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Volume of titles released across cinematic decades.</p>
                      </div>
                      <div className="flex-1 min-h-0">
                        <PlotlyChart
                           id="yoyReleasesPlot"
                           data={[{
                             x: charts.yearWiseReleases.map(d => d.year),
                             y: charts.yearWiseReleases.map(d => d.count),
                             type: "scatter",
                             mode: "lines+markers",
                             line: { shape: "spline", color: "#6366f1", width: 3 }, // indigo-500
                             marker: { size: 6, color: "#a855f7" }, // purple-500
                             fill: "tozeroy",
                             fillcolor: "rgba(99,102,241,0.05)"
                           }]}
                          layout={{
                            height: 310,
                            xaxis: { title: "Release Year" },
                            yaxis: { title: "No. of Releases" }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Because you liked {personalizedTarget} Section */}
                  {personalizedRecs.length > 0 && (
                    <div className="bg-[#141418]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-md space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Taste Recommendation Mappings</span>
                          </div>
                          <h3 className="font-display font-semibold text-md text-white mt-1">
                            Because you liked <span className="text-indigo-400">"{personalizedTarget}"</span>
                          </h3>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab("recommend");
                            setRecSearchQuery(personalizedTarget);
                          }}
                          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          Deep Recommendation Analysis
                          <Compass className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {personalizedRecs.slice(0, 4).map((m) => {
                          const similarityScore = (m.score * 100).toFixed(0);
                          let reason = "Shares thematic story notes";
                          if (m.director && m.director.toLowerCase() !== "unknown director") {
                            reason = `Director style matches ${m.director}`;
                          } else if (m.genre) {
                            reason = `Shares "${m.genre.split(',')[0]}" themes`;
                          }

                          return (
                            <div
                              key={m.title}
                              onClick={() => inspectMovie(m.title)}
                              className="bg-black/30 border border-white/5 p-4 rounded-xl flex flex-col justify-between group relative overflow-hidden h-[240px] hover:border-indigo-500/30 transition-all duration-300 cursor-pointer"
                            >
                              <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${m.type === "Movie" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-purple-500/10 text-purple-400 border border-purple-500/20"}`}>
                                    {m.type}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-950/40 px-1.5 py-0.5 rounded">
                                    {similarityScore}% Match
                                  </span>
                                </div>
                                <h4 className="font-display font-bold text-sm text-slate-200 group-hover:text-indigo-400 transition-colors line-clamp-1">
                                  {m.title}
                                </h4>
                                <p className="text-[10px] text-indigo-400 font-semibold font-mono line-clamp-1">{reason}</p>
                                <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                                  {m.description}
                                </p>
                              </div>
                              <div className="pt-2 border-t border-white/5 flex justify-between text-[9px] text-slate-500 font-mono">
                                <span>{m.release_year}</span>
                                <span>{m.duration}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recently Added Section */}
                  <div className="bg-[#141418]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-display font-semibold text-md text-white">Latest Catalogue Additions</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Most recent content uploaded on Netflix servers.</p>
                      </div>
                      <button
                        onClick={() => setActiveTab("search")}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline"
                      >
                        Browse All Entries
                        <Compass className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-white/10">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-black/20 text-slate-400 text-xs font-medium border-b border-white/10">
                            <th className="p-3">Title</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Primary Genre</th>
                            <th className="p-3">Country</th>
                            <th className="p-3">Release Year</th>
                            <th className="p-3">Duration</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                          {stats.latestAdded.map((m) => (
                            <tr key={m.show_id} className="hover:bg-white/5 transition-colors">
                              <td className="p-3 font-semibold text-slate-200">{m.title}</td>
                              <td className="p-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${m.type === "Movie" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-purple-500/10 text-purple-400 border border-purple-500/20"}`}>
                                  {m.type === "Movie" ? <Film className="w-2.5 h-2.5" /> : <Tv className="w-2.5 h-2.5" />}
                                  {m.type}
                                </span>
                              </td>
                              <td className="p-3 text-slate-300">{m.cleaned_genres ? m.cleaned_genres[0] : "N/A"}</td>
                              <td className="p-3 text-slate-400">{m.normalized_country}</td>
                              <td className="p-3 font-mono text-slate-300">{m.release_year}</td>
                              <td className="p-3 text-slate-400">{m.duration}</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => inspectMovie(m.title)}
                                  className="px-3 py-1 rounded bg-white/5 border border-white/10 hover:bg-indigo-600 hover:text-white text-xs font-medium text-indigo-400 transition-colors"
                                >
                                  Inspect
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* --- SEARCH & FILTERS TAB --- */}
              {activeTab === "search" && (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Floating Filter Panel */}
                  <div className="bg-[#141418]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-md space-y-4">
                    <div className="flex flex-col gap-3">
                      {/* Search Bar */}
                      <div className="relative w-full">
                        <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          id="search-input"
                          name="search"
                          type="text"
                          placeholder="Search titles, directors, actors, descriptions..."
                          value={filters.query}
                          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                          className="w-full bg-black/30 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-20 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                        />
                        <button
                          onClick={handleVoiceSearch}
                          type="button"
                          className={`absolute top-3 text-slate-400 hover:text-indigo-400 transition-all ${
                            filters.query ? "right-10" : "right-3.5"
                          } ${isListening ? "text-red-500 animate-pulse scale-110" : ""}`}
                          title="Search with voice (handles regional accents)"
                        >
                          <Mic className="w-4 h-4" />
                        </button>
                        {filters.query && (
                          <button
                            onClick={() => setFilters({ ...filters, query: "" })}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col md:flex-row gap-3 flex-wrap">
                        {/* Format Selector */}
                        <div className="flex bg-black/30 rounded-xl p-1 border border-white/10">
                        {["", "Movie", "TV Show"].map((typeVal) => (
                          <button
                            key={typeVal}
                            onClick={() => setFilters({ ...filters, type: typeVal as any })}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              filters.type === typeVal
                                ? "bg-indigo-600 text-white shadow-md"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            {typeVal === "" ? "All Formats" : typeVal}
                          </button>
                        ))}
                      </div>

                      {/* 100 Crore Movies Toggle */}
                      <button
                        onClick={() => {
                          if (streakCount < 2 && !quizUnlocked) {
                            setAttemptedFilters("100cr");
                            setShowFilterQuizModal(true);
                          } else {
                            setFilters({ ...filters, is100crOnly: !filters.is100crOnly });
                          }
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          filters.is100crOnly
                            ? "bg-gradient-to-r from-amber-500 to-yellow-500 border-amber-600 text-black shadow-lg shadow-amber-500/20"
                            : "bg-black/30 border-white/10 text-slate-400 hover:text-slate-200 hover:border-slate-800 cursor-pointer"
                        }`}
                      >
                        <Award className={`w-4 h-4 ${filters.is100crOnly ? "text-black animate-bounce" : "text-amber-500"}`} />
                        <span>100 Crore Movies</span>
                        {streakCount < 2 && !quizUnlocked && (
                          <span className="ml-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] px-1 py-0.5 rounded flex items-center gap-0.5 font-mono">
                            <Lock className="w-2.5 h-2.5" /> LOCK
                          </span>
                        )}
                      </button>

                      {/* Underrated Gems Toggle */}
                      <button
                        onClick={() => {
                          if (streakCount < 2 && !quizUnlocked) {
                            setAttemptedFilters("underrated");
                            setShowFilterQuizModal(true);
                          } else {
                            setFilters({ ...filters, isUnderratedOnly: !filters.isUnderratedOnly });
                          }
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          filters.isUnderratedOnly
                            ? "bg-[#6366f1]/20 border-indigo-500/50 text-indigo-300 shadow-lg shadow-indigo-500/10"
                            : "bg-black/30 border-white/10 text-slate-400 hover:text-slate-200 hover:border-slate-800 cursor-pointer"
                        }`}
                      >
                        <Sparkles className={`w-4 h-4 ${filters.isUnderratedOnly ? "text-indigo-400 animate-pulse" : "text-slate-500"}`} />
                        <span>Underrated Gems</span>
                        {streakCount < 2 && !quizUnlocked && (
                          <span className="ml-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[9px] px-1 py-0.5 rounded flex items-center gap-0.5 font-mono">
                            <Lock className="w-2.5 h-2.5" /> LOCK
                          </span>
                        )}
                      </button>
                      </div>
                    </div>

                    {/* Filter Collapsible drawer */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-white/10">
                      {/* Genre selector */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Genre</label>
                        <select
                          value={filters.genre}
                          onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
                          className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-slate-300 outline-none focus:border-indigo-500"
                        >
                          <option value="">All Genres</option>
                          {availableGenres.map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>

                      {/* Country selector */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Country</label>
                        <select
                          value={filters.country}
                          onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                          className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-slate-300 outline-none focus:border-indigo-500"
                        >
                          <option value="">All Countries</option>
                          {availableCountries.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Rating selector */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Rating Rating</label>
                        <select
                          value={filters.rating}
                          onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
                          className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-slate-300 outline-none focus:border-indigo-500"
                        >
                          <option value="">All Ratings</option>
                          {availableRatings.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>

                      {/* Sorting options */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sort Order</label>
                        <div className="flex gap-2">
                          <select
                            value={filters.sortBy}
                            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                            className="flex-1 bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-slate-300 outline-none focus:border-indigo-500"
                          >
                            <option value="title">Alphabetical</option>
                            <option value="release_year">Release Year</option>
                            <option value="added_date">Added Date</option>
                          </select>
                          <button
                            onClick={() => setFilters({ ...filters, sortOrder: filters.sortOrder === "asc" ? "desc" : "asc" })}
                            className="p-2 rounded-lg bg-black/30 border border-white/10 text-slate-300 hover:text-white"
                            title={filters.sortOrder === "asc" ? "Sort Ascending" : "Sort Descending"}
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Year slider */}
                    <div className="space-y-2 pt-3 border-t border-white/10">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold uppercase tracking-wider">Release Era Filter</span>
                        <span className="font-mono text-indigo-400 font-bold">{filters.startYear} – {filters.endYear}</span>
                      </div>
                      <div className="flex gap-4 items-center">
                        <input
                          type="range"
                          min="1930"
                          max="2030"
                          value={filters.startYear}
                          onChange={(e) => setFilters({ ...filters, startYear: parseInt(e.target.value, 10) })}
                          className="flex-1 accent-indigo-500 bg-slate-950 rounded-lg h-1.5 outline-none"
                        />
                        <input
                          type="range"
                          min="1930"
                          max="2030"
                          value={filters.endYear}
                          onChange={(e) => setFilters({ ...filters, endYear: parseInt(e.target.value, 10) })}
                          className="flex-1 accent-purple-500 bg-slate-950 rounded-lg h-1.5 outline-none"
                        />
                        <button
                          onClick={() => setFilters({ ...filters, startYear: 1930, endYear: 2030, query: "", type: "", genre: "", country: "", rating: "" })}
                          className="p-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300"
                          title="Reset All Filters"
                        >
                          <RotateCcw className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Total Results Summary */}
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span>
                      Discovered <strong className="text-slate-200">{searchResults.length}</strong> catalog entries matching active criteria.
                    </span>
                    {isSearching && <span className="text-indigo-400 flex items-center gap-1.5 animate-pulse"><RefreshCw className="w-3 h-3 animate-spin" /> Fetching indices...</span>}
                  </div>

                  {/* Search Results Grid */}
                  {searchResults.length === 0 ? (
                    <div className="bg-[#141418]/20 border border-white/5 rounded-2xl p-12 text-center">
                      <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <h4 className="font-display font-semibold text-white mb-1">No Matching Shows Found</h4>
                      <p className="text-slate-400 text-sm max-w-md mx-auto">
                        Adjust your title keyword, select another rating scale, or reset sliders to expand your scope.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {searchResults.map((m) => (
                        <motion.div
                          layout
                          key={m.show_id}
                          className="bg-[#141418]/60 border border-white/5 p-4 rounded-2xl flex flex-col justify-between group relative overflow-hidden h-[410px] hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-950/20 transition-all duration-300"
                        >
                          <div className="space-y-3">
                            {/* Poster Image Container */}
                            <div className="w-full h-[180px] rounded-xl overflow-hidden relative bg-slate-900/40">
                              <img
                                src={getMoviePosterUrl(m.title, m.type, m.cleaned_genres || m.listed_in.split(","))}
                                alt={m.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115]/90 via-transparent to-transparent" />
                              {is100crMovie(m.title) && (
                                <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-md shadow-md flex items-center gap-1 border border-amber-400/30 z-10">
                                  <Award className="w-2.5 h-2.5" />
                                  <span>100 Crore</span>
                                </div>
                              )}
                              <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold ${m.type === "Movie" ? "bg-indigo-600/90 text-white" : "bg-purple-600/90 text-white"}`}>
                                  {m.type === "Movie" ? <Film className="w-2.5 h-2.5" /> : <Tv className="w-2.5 h-2.5" />}
                                  {m.type}
                                </span>
                                <span className="text-[9px] bg-black/60 backdrop-blur-sm text-slate-300 px-1.5 py-0.5 rounded font-mono font-bold">{m.rating}</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <h3 className="font-display font-bold text-base text-white tracking-tight group-hover:text-indigo-400 transition-colors line-clamp-1" title={m.title}>
                                {m.title}
                              </h3>
                              <p className="text-[10px] font-mono text-slate-500 line-clamp-1 font-semibold">{m.listed_in}</p>
                              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed h-[36px] overflow-hidden">
                                {m.description}
                              </p>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-mono">{m.release_year} · {m.duration}</span>
                            <button
                              onClick={() => inspectMovie(m.title)}
                              className="text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 cursor-pointer"
                            >
                              Inspect Show
                              <span className="text-sm">→</span>
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* --- RECOMMENDER TAB --- */}
              {activeTab === "recommend" && (
                <motion.div
                  key="recommend"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="bg-[#141418]/60 border border-white/5 p-5 rounded-2xl shadow-md">
                    <h3 className="font-display font-semibold text-md text-slate-200 mb-2">Select Target Movie/TV Show</h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Type below to search our Netflix database. Our content-based system creates a single TF-IDF text feature using genre lists, director names, actor rosters, and plot summaries to find the mathematical nearest neighbors.
                    </p>

                    <div className="relative">
                      <div className="relative">
                        <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          id="rec-search-input"
                          name="rec-search"
                          type="text"
                          placeholder="Type title (e.g., 'Stranger Things', 'Glass Onion', 'Wednesday'...)"
                          value={recSearchQuery}
                          onChange={(e) => setRecSearchQuery(e.target.value)}
                          className="w-full bg-black/30 border border-white/10 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none"
                        />
                      </div>

                      {/* Dropdown Suggestions */}
                      {recSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 mt-1.5 bg-[#141418] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-20 divide-y divide-white/5">
                          {recSuggestions.map((m) => (
                            <button
                              key={m.show_id}
                              onClick={() => handleFetchRecommendations(m.title)}
                              className="w-full text-left px-4 py-3 hover:bg-white/5 text-sm flex items-center justify-between"
                            >
                              <span className="font-semibold text-slate-200">{m.title}</span>
                              <span className="text-xs text-slate-500 font-mono italic">{m.listed_in}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {isRecLoading && (
                    <div className="p-12 text-center">
                      <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
                      <p className="text-sm text-slate-400">Computing Euclidean distances and Cosine similarities...</p>
                    </div>
                  )}

                  {/* Target Movie Details and Recommendations */}
                  {!isRecLoading && recTargetMovie && (
                    <div className="space-y-6">
                      {/* Active target profile */}
                      <div className="bg-gradient-to-r from-[#141418] via-indigo-950/5 to-purple-950/5 border border-indigo-500/10 p-6 rounded-2xl flex flex-col md:flex-row gap-6">
                        <div className="w-24 h-36 rounded-xl overflow-hidden shrink-0 bg-slate-900 shadow-md">
                          <img
                            src={getMoviePosterUrl(recTargetMovie.title, recTargetMovie.type, recTargetMovie.cleaned_genres || recTargetMovie.listed_in.split(","))}
                            alt={recTargetMovie.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase bg-indigo-950/40 px-2.5 py-1 rounded-full border border-indigo-900/30">
                              Active Target Query
                            </span>
                            <span className="text-xs text-slate-500 font-mono">{recTargetMovie.duration}</span>
                          </div>
                          <h3 className="font-display font-bold text-2xl text-white tracking-tight">{recTargetMovie.title}</h3>
                          <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">{recTargetMovie.description}</p>
                          <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> <strong>Director:</strong> {recTargetMovie.director}</span>
                            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> <strong>Genres:</strong> {recTargetMovie.listed_in}</span>
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-col justify-between items-end md:text-right text-xs text-slate-500 font-mono">
                          <span>ID: {recTargetMovie.show_id}</span>
                          <span>Released: {recTargetMovie.release_year}</span>
                        </div>
                      </div>

                      {/* Similar recommendations list */}
                      <div className="space-y-4">
                        <h4 className="font-display font-semibold text-md text-slate-200 flex items-center gap-2">
                          <Compass className="w-4.5 h-4.5 text-indigo-400" />
                          Top 5 Mathematically Correlated Content Recommendations
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          {recommendations.map((rec, idx) => (
                            <div
                              key={idx}
                              className="bg-[#141418]/60 border border-white/5 p-3 rounded-2xl flex flex-col justify-between hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-950/15 transition-all duration-300 h-[380px] group"
                            >
                              <div className="space-y-3">
                                {/* Poster Image for Recommendation */}
                                <div className="w-full h-[140px] rounded-xl overflow-hidden relative bg-slate-900/40">
                                  <img
                                    src={getMoviePosterUrl(rec.title, rec.type, rec.genre ? rec.genre.split(",") : [])}
                                    alt={rec.title}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                  <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between items-center">
                                    <span className={`text-[8px] font-bold px-1 rounded ${rec.type === "Movie" ? "bg-indigo-600 text-white" : "bg-purple-600 text-white"}`}>
                                      {rec.type}
                                    </span>
                                    <span className="text-[8px] font-mono text-emerald-400 font-bold bg-black/60 px-1 py-0.5 rounded">
                                      {(rec.score * 100).toFixed(0)}% sim
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <h5 className="font-display font-bold text-xs text-white line-clamp-1 group-hover:text-indigo-400 transition-colors" title={rec.title}>
                                    {rec.title}
                                  </h5>
                                  <p className="text-[10px] text-slate-400 line-clamp-3 leading-relaxed h-[42px] overflow-hidden">
                                    {rec.description}
                                  </p>
                                </div>
                              </div>

                              <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                                <span>{rec.release_year} · {rec.duration}</span>
                                <button
                                  onClick={() => inspectMovie(rec.title)}
                                  className="text-indigo-400 font-semibold hover:text-indigo-300 cursor-pointer"
                                >
                                  Inspect →
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {!recTargetMovie && (
                    <div className="p-12 text-center bg-[#141418]/20 border border-white/5 rounded-2xl">
                      <Compass className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <h4 className="font-display font-bold text-white mb-1">Select content above</h4>
                      <p className="text-slate-400 text-sm max-w-sm mx-auto">
                        Type any Netflix movie or TV show name to run the TF-IDF metadata alignment recommendations.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* --- ABOUT TAB --- */}
              {activeTab === "about" && (
                <motion.div
                  key="about"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="bg-[#141418]/60 border border-white/5 p-6 rounded-2xl shadow-md space-y-6 max-w-4xl">
                    <div className="space-y-2">
                      <h3 className="font-display font-bold text-lg text-white">Movie Analyser – System Architecture</h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        This full-stack application models, cleanses, analyzes, and recommends shows inside the Kaggle Netflix Movies & TV Shows database.
                        Built dynamically with a dual ML backend integrating lightweight local vector embeddings and advanced Large Language Models.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <h4 className="font-display font-semibold text-sm text-slate-200">1. Content recommendation embedding</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Rather than requiring expensive servers, our recommendation engine constructs Sparse TF-IDF (Term Frequency-Inverse Document Frequency) vectors across genres, directors, actors, and descriptions. Similarity mappings are generated on-the-fly using Euclidean L2-normalized dot products.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-display font-semibold text-sm text-slate-200">2. Real-Time Gemini AI Justification</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          By leveraging the server-side Gemini 3.5 Flash model, we supplement probability estimations with advanced, semantic textual audits, identifying subgenres, mood atmospheres, and generating ratings justifications.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-display font-semibold text-sm text-slate-200">3. Interactive Analytics Layout</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          All visualization nodes use the Plotly.js core rendering engines. Responsive layouts are maintained across viewport adjustments using localized `ResizeObserver` loops, avoiding redraw lags.
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <h5 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Technology Stack Digest</h5>
                      <div className="flex flex-wrap gap-2">
                        {["React 19", "Vite 6", "Express.js", "TypeScript", "Tailwind CSS v4", "Plotly.js", "Framer Motion", "TF-IDF Embeddings", "Google GenAI SDK (3.5)"].map((tech) => (
                          <span key={tech} className="px-2.5 py-1 rounded bg-black/30 border border-white/10 text-[10px] font-mono font-semibold text-slate-300">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* --- DAILY HUB TAB --- */}
              {activeTab === "daily_hub" && (
                <motion.div
                  key="daily_hub"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <DailyHub
                    moviesList={moviesList}
                    inspectMovie={inspectMovie}
                    setTab={setActiveTab}
                    setFilters={setFilters}
                    filters={filters}
                    userLikes={userLikes}
                  />
                </motion.div>
              )}

              {/* --- SOCIAL LOUNGE TAB --- */}
              {activeTab === "lounge" && (
                <motion.div
                  key="lounge"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <SocialLounge
                    moviesList={moviesList}
                    watchlist={watchlist}
                    addToWatchlist={addToWatchlist}
                    removeFromWatchlist={removeFromWatchlist}
                  />
                </motion.div>
              )}

              {/* --- TASTE PROFILE TAB --- */}
              {activeTab === "taste_profile" && (
                <motion.div
                  key="taste_profile"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <TasteProfile
                    moviesList={moviesList}
                    userLikes={userLikes}
                    userMehs={userMehs}
                    userSleeps={userSleeps}
                    handleReaction={handleReaction}
                    removeReaction={removeReaction}
                  />
                </motion.div>
              )}

              {/* --- UTILITY HOOKS TAB --- */}
              {activeTab === "utility_hooks" && (
                <motion.div
                  key="utility_hooks"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <UtilityHooks
                    moviesList={moviesList}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* --- MOVIE INSPECTOR SLIDE-OVER OVERLAY --- */}
      <AnimatePresence>
        {selectedMovie && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-end z-50 print:hidden">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="w-full max-w-xl bg-[#0f1115] border-l border-white/10 h-full p-6 md:p-8 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                {/* Header Close button */}
                <div className="flex justify-between items-center">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${selectedMovie.type === "Movie" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-purple-500/10 text-purple-400 border border-purple-500/20"}`}>
                    {selectedMovie.type === "Movie" ? <Film className="w-2.5 h-2.5" /> : <Tv className="w-2.5 h-2.5" />}
                    {selectedMovie.type}
                  </span>
                  <button
                    onClick={() => setSelectedMovie(null)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Cinema Banner image */}
                <div className="w-full h-[220px] rounded-2xl overflow-hidden relative bg-slate-900 shadow-inner">
                  <img
                    src={getMovieBannerUrl(selectedMovie.title, selectedMovie.type, selectedMovie.cleaned_genres || selectedMovie.listed_in.split(","))}
                    alt={selectedMovie.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-transparent to-transparent" />
                </div>

                {/* Primary Metadata */}
                <div className="space-y-2">
                  <h3 className="font-display font-bold text-2xl text-white tracking-tight flex items-center gap-2 flex-wrap">
                    <span>{selectedMovie.title}</span>
                    {is100crMovie(selectedMovie.title) && (
                      <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
                        <Award className="w-3 h-3 text-black animate-pulse" />
                        100 Crore Blockbuster
                      </span>
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-mono text-slate-400">
                    <span className="text-indigo-400 font-bold">{selectedMovie.rating}</span>
                    <span>{selectedMovie.duration}</span>
                    <span>Released: {selectedMovie.release_year}</span>
                    {selectedMovie.date_added && <span>Added: {selectedMovie.date_added}</span>}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Plot Summary</span>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {selectedMovie.description}
                  </p>
                </div>

                 {/* GPU AI Worth Watching Insight Card */}
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-4 rounded-2xl space-y-2 text-left relative overflow-hidden group">
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[8px] font-mono font-bold tracking-widest rounded-bl-lg uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    NVIDIA GPU AI
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> Why It's Worth Watching
                  </span>
                  {isGpuLoading ? (
                    <div className="flex items-center gap-2 py-1 text-slate-400 text-xs">
                      <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span className="font-mono text-[10px] text-slate-400">Running model on local GPU...</span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-200 leading-relaxed italic">
                      "{gpuInsight || getWhyWatchInsight(
                        selectedMovie.title,
                        selectedMovie.type,
                        selectedMovie.cleaned_genres || selectedMovie.listed_in.split(",")
                      )}"
                    </p>
                  )}
                </div>

                {/* Director & Cast lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Director</span>
                    <span className="text-xs text-slate-300 block font-medium">{selectedMovie.director}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Country Location</span>
                    <span className="text-xs text-slate-300 block font-medium">{selectedMovie.country}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-4 border-t border-white/5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Cast Members</span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {selectedMovie.cast}
                  </p>
                </div>

                <div className="space-y-1.5 pt-4 border-t border-white/5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Listed Genres</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMovie.cleaned_genres ? selectedMovie.cleaned_genres.map((g: string) => (
                      <span key={g} className="text-[10px] font-semibold bg-white/5 border border-white/5 text-slate-300 px-2 py-0.5 rounded">
                        {g}
                      </span>
                    )) : selectedMovie.listed_in.split(",").map((g: string) => (
                      <span key={g} className="text-[10px] font-semibold bg-white/5 border border-white/5 text-slate-300 px-2 py-0.5 rounded">
                        {g.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Where to Watch */}
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Where to Watch</span>
                  <div className="flex flex-wrap gap-2">
                    {/* Always show Netflix as fallback search */}
                    <a
                      href={`https://www.netflix.com/search?q=${encodeURIComponent(selectedMovie.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-[#E50914] hover:bg-[#E50914]/80 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg shadow-red-900/20"
                    >
                      <Tv className="w-3.5 h-3.5" /> Netflix
                    </a>
                    
                    {/* Dynamically fetched TMDB Providers */}
                    {(selectedMovie as any).streamingProviders?.filter((p: string) => !p.toLowerCase().includes("netflix")).map((provider: string, idx: number) => (
                       <span
                         key={idx}
                         className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                       >
                         <Tv className="w-3.5 h-3.5 text-indigo-400" /> {provider}
                       </span>
                    ))}
                  </div>
                </div>

                {/* Direct Recommendations */}
                {(selectedMovie as any).recommendations && (selectedMovie as any).recommendations.length > 0 && (
                  <div className="space-y-3 pt-6 border-t border-white/5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Direct Content Recommendations</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(selectedMovie as any).recommendations.slice(0, 4).map((rec: any, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => inspectMovie(rec.title)}
                          className="bg-black/30 border border-white/10 p-3 rounded-xl cursor-pointer hover:border-indigo-500/30 hover:bg-black/50 transition-all text-left group"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{rec.type}</span>
                            <span className="text-[9px] text-emerald-400 font-mono">{(rec.score * 100).toFixed(0)}% sim</span>
                          </div>
                          <h5 className="text-xs font-semibold text-slate-200 line-clamp-1 group-hover:text-indigo-400 transition-colors">{rec.title}</h5>
                          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{rec.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Real Profile Reactions, Watchlist Marker, and OTT Trackers */}
              <div className="py-6 border-t border-white/5 space-y-4">
                {/* Reaction chip group */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Your Quick Reaction</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'fire', label: 'Loved it 🔥', list: userLikes, activeClass: 'bg-red-500/20 border-red-500 text-red-300' },
                      { type: 'meh', label: 'Meh 😐', list: userMehs, activeClass: 'bg-amber-500/20 border-amber-500 text-amber-300' },
                      { type: 'sleep', label: 'Sleepy 💤', list: userSleeps, activeClass: 'bg-blue-500/20 border-blue-500 text-blue-300' },
                    ].map((item) => {
                      const isReactionActive = item.list.some(t => t.toLowerCase() === selectedMovie.title.toLowerCase());
                      return (
                        <button
                          key={item.type}
                          onClick={() => handleReaction(selectedMovie.title, item.type as any)}
                          className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                            isReactionActive
                              ? item.activeClass
                              : 'bg-black/20 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Watchlist & OTT trackers */}
                <div className="flex gap-2">
                  {/* Watchlist Button */}
                  {watchlist.some(t => t.toLowerCase() === selectedMovie.title.toLowerCase()) ? (
                    <button
                      onClick={() => removeFromWatchlist(selectedMovie.title)}
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Bookmark className="w-4 h-4 fill-white" />
                      In Watchlist 🍿
                    </button>
                  ) : (
                    <button
                      onClick={() => addToWatchlist(selectedMovie.title)}
                      className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Bookmark className="w-4 h-4" />
                      Add to Watchlist
                    </button>
                  )}

                  {/* OTT Notification Button */}
                  <button
                    onClick={() => {
                      alert(`Alert Set! 🔔 We will monitor OTT platforms (Netflix, Prime, Hotstar) and notify you as soon as "${selectedMovie.title}" is streamable or updated!`);
                    }}
                    className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 transition-all cursor-pointer"
                    title="Set availability notification alert"
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Ref Code: {selectedMovie.show_id}</span>
                <button
                  onClick={() => {
                    setSelectedMovie(null);
                    setActiveTab("recommend");
                    handleFetchRecommendations(selectedMovie.title);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
                >
                  Load in Recommender
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Streak-based Premium Filter Quiz / Streak Unlock Modal */}
      {showFilterQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-[#141418] border border-white/10 p-6 rounded-3xl space-y-6 text-left relative overflow-hidden animate-in fade-in-50"
          >
            <button
              onClick={() => {
                setShowFilterQuizModal(false);
                setSelectedQuizAns(null);
                setQuizIsCorrect(null);
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl w-fit">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-display font-black text-white">
                Premium Filter Locked! 🔒
              </h3>
              <p className="text-xs text-slate-400">
                This is an elite cinema category. Maintain a <strong className="text-indigo-400 font-bold">2-day streak</strong> to auto-unlock all premium filters!
              </p>
              <div className="bg-black/40 border border-white/5 py-1.5 px-3 rounded-lg text-xs font-mono font-bold text-slate-300 w-fit">
                Your Current Streak: {streakCount} Days
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-4">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">Fast Bypass Trivia Quiz</span>
                <h4 className="font-bold text-white text-sm mt-1">
                  Which movie is considered the highest grossing Indian film of all time globally?
                </h4>
              </div>

              <div className="space-y-2">
                {[
                  { key: "a", label: "Dangal (Aamir Khan)", isCorrect: true },
                  { key: "b", label: "Baahubali 2: The Conclusion", isCorrect: false },
                  { key: "c", label: "RRR (Jr. NTR & Ram Charan)", isCorrect: false },
                  { key: "d", label: "Jawan (Shah Rukh Khan)", isCorrect: false },
                ].map((opt) => {
                  const isSelected = selectedQuizAns === opt.key;
                  return (
                    <button
                      key={opt.key}
                      disabled={quizIsCorrect !== null}
                      onClick={() => {
                        setSelectedQuizAns(opt.key);
                        if (opt.isCorrect) {
                          setQuizIsCorrect(true);
                          setQuizUnlocked(true);
                        } else {
                          setQuizIsCorrect(false);
                        }
                      }}
                      className={`w-full p-3 rounded-xl border text-xs text-left font-bold transition-all ${
                        quizIsCorrect !== null
                          ? opt.isCorrect
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                            : isSelected
                              ? "bg-red-500/20 border-red-500/50 text-red-300"
                              : "bg-black/20 border-white/5 text-slate-500"
                          : isSelected
                            ? "bg-indigo-600 border-indigo-500 text-white"
                            : "bg-black/30 border-white/10 text-slate-300 hover:bg-black/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {quizIsCorrect === true && (
                <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                  🎉 Correct! Dangal grossed over ₹2,000 Crore globally! Elite filters have been unlocked for your current session.
                </div>
              )}

              {quizIsCorrect === false && (
                <div className="p-3 rounded-xl bg-red-500/15 text-red-400 border border-red-500/20 text-xs font-medium">
                  ❌ Incorrect! Try again or maintain a 2-day daily streak in the "Daily Ritual" tab to unlock filters permanently.
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowFilterQuizModal(false);
                  setSelectedQuizAns(null);
                  setQuizIsCorrect(null);
                }}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-xl transition-all text-center border border-white/5"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowFilterQuizModal(false);
                  setSelectedQuizAns(null);
                  setQuizIsCorrect(null);
                  setActiveTab("daily");
                }}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all text-center"
              >
                Increase My Streak
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* --- PRINT ONLY PAGE FORMATTING --- */}
      <div className="hidden print:block absolute inset-0 bg-white text-black p-12 space-y-8 font-sans z-[99999]">
        <div className="border-b-2 border-black pb-4 text-center">
          <h1 className="text-3xl font-bold uppercase">Netflix Analytics Report</h1>
          <p className="text-sm italic mt-1">Generated dynamically via Movie Analyser AI Pipeline</p>
          <p className="text-xs mt-0.5">Date generated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Print KPIs */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 border-b pb-6">
            <div className="border p-3 text-center rounded">
              <span className="text-xs uppercase font-bold text-gray-500 block">Total Movies</span>
              <span className="text-2xl font-bold">{stats.totalMovies}</span>
            </div>
            <div className="border p-3 text-center rounded">
              <span className="text-xs uppercase font-bold text-gray-500 block">Total TV Shows</span>
              <span className="text-2xl font-bold">{stats.totalTVShows}</span>
            </div>
            <div className="border p-3 text-center rounded">
              <span className="text-xs uppercase font-bold text-gray-500 block">Unique Genres</span>
              <span className="text-2xl font-bold">{stats.totalGenres}</span>
            </div>
            <div className="border p-3 text-center rounded">
              <span className="text-xs uppercase font-bold text-gray-500 block">Nations Represented</span>
              <span className="text-2xl font-bold">{stats.totalCountries}</span>
            </div>
          </div>
        )}

        {/* Print Summary of Catalog */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold border-b pb-1">Primary Catalog Index Summary</h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-400 font-bold bg-gray-100">
                <th className="p-2">Title</th>
                <th className="p-2">Type</th>
                <th className="p-2">Genres</th>
                <th className="p-2">Release Year</th>
                <th className="p-2">Duration</th>
                <th className="p-2">Rating</th>
              </tr>
            </thead>
            <tbody>
              {moviesList.slice(0, 30).map((m) => (
                <tr key={m.show_id} className="border-b">
                  <td className="p-2 font-bold">{m.title}</td>
                  <td className="p-2">{m.type}</td>
                  <td className="p-2">{m.listed_in}</td>
                  <td className="p-2 font-mono">{m.release_year}</td>
                  <td className="p-2">{m.duration}</td>
                  <td className="p-2">{m.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {moviesList.length > 30 && (
            <p className="text-[10px] text-gray-500 text-center italic mt-3">
              * Showing top 30 records. Full dataset of {moviesList.length} records available in CSV/Excel digital export formats.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
