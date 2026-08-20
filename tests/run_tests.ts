/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { loadAndCleanDataset, normalizeText } from "../src/services/dataLoader.js";
import { computeDashboardStats, generateAnalyticsCharts } from "../src/services/analyzer.js";
import { ContentBasedRecommender } from "../src/services/recommender.js";
import { NaiveBayesGenreClassifier, mapToStandardGenre, GENRE_CLASSES } from "../src/services/classifier.js";

// Colors for terminal formatting
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  [${GREEN}PASS${RESET}] ${message}`);
    passCount++;
  } else {
    console.error(`  [${RED}FAIL${RESET}] ${message}`);
    failCount++;
  }
}

async function runTests() {
  console.log(`========================================`);
  console.log(`🚀 Starting Movie Analyser Test Suite...`);
  console.log(`========================================\n`);

  // --- 1. Data Loader & Cleansing Tests ---
  console.log(`${YELLOW}■ Testing Module: Data Loader & Cleansing${RESET}`);
  try {
    const movies = loadAndCleanDataset();
    assert(movies.length > 0, `Successfully loaded ${movies.length} netflix titles.`);
    
    const sample = movies[0];
    assert(sample.show_id !== undefined, "Loaded shows have unique 'show_id'.");
    assert(sample.title !== undefined && sample.title !== "", "Loaded shows have a valid title.");
    assert(sample.type === "Movie" || sample.type === "TV Show", "Type is standardized to 'Movie' or 'TV Show'.");
    assert(Array.isArray(sample.cleaned_genres), "Genres are standardized into clean arrays.");
    assert(sample.added_year !== undefined && !isNaN(sample.added_year), `Extracted added year: ${sample.added_year}`);
    assert(sample.added_month !== undefined, `Extracted added month: ${sample.added_month}`);

    // Test text normalization
    const normalizedTokens = normalizeText("Bored with being the Lord of Hell, Wednesday investigates a mystery.");
    assert(normalizedTokens.includes("bored"), "Normalized text is lowercased.");
    assert(!normalizedTokens.includes("the") && !normalizedTokens.includes("of"), "Stop words are removed from text.");
    assert(!normalizedTokens.some(t => /[^\w]/.test(t)), "Punctuation is stripped from words.");
  } catch (e: any) {
    assert(false, `Data Loader failed with error: ${e.message}`);
  }

  // --- 2. Analytics Dashboard Calculations ---
  console.log(`\n${YELLOW}■ Testing Module: Dashboard & Exploratory Analytics${RESET}`);
  try {
    const movies = loadAndCleanDataset();
    const stats = computeDashboardStats(movies);
    const charts = generateAnalyticsCharts(movies);

    assert(stats.totalMovies + stats.totalTVShows === movies.length, "Total KPI count sum matches total movies loaded.");
    assert(stats.totalGenres > 0, `Extracted unique genres KPI count: ${stats.totalGenres}`);
    assert(stats.avgReleaseYear > 1900, `Calculated average release year KPI: ${stats.avgReleaseYear}`);
    assert(stats.avgDurationMovie > 0, `Calculated average Movie duration KPI: ${stats.avgDurationMovie} min`);
    assert(stats.latestAdded.length === 5, "KPI returns top 5 recently added content.");

    assert(charts.typeDistribution.length === 2, "Chart data contains correct Movies vs TV Shows ratios.");
    assert(charts.topGenres.length <= 10, "Chart aggregates top 10 genres correctly.");
    assert(charts.topCountries.length <= 10, "Chart aggregates top 10 countries correctly.");
    assert(charts.genreHeatmap.x.length === charts.genreHeatmap.y.length, "Genre Heatmap matrix is symmetric.");
    assert(charts.wordFrequency.length === 40, "Aggregated exactly 40 words for Word Cloud frequency chart.");
  } catch (e: any) {
    assert(false, `Dashboard Analyzer failed with error: ${e.message}`);
  }

  // --- 3. Content-Based Recommender Tests ---
  console.log(`\n${YELLOW}■ Testing Module: Content-Based Recommendation Engine${RESET}`);
  try {
    const movies = loadAndCleanDataset();
    const recommender = new ContentBasedRecommender(movies);

    // Test successful recommendation
    const targetTitle = "Stranger Things";
    const recs = recommender.recommendMovies(targetTitle, 5);
    
    assert(recs.length === 5, `Retrieved exactly 5 recommendations for "${targetTitle}".`);
    assert(!recs.some((r) => r.title === targetTitle), "Recommendations exclude the queried item itself.");
    assert(recs[0].score >= recs[4].score, "Recommendations are sorted in descending order of similarity score.");
    assert(recs.every((r) => r.score >= 0 && r.score <= 1.0), "Similarity scores are bounded within [0, 1.0].");

    // Test unknown movie recommendation
    const unknownRecs = recommender.recommendMovies("NonExistentMovie999", 5);
    assert(unknownRecs.length === 0, "Unknown movies return empty array gracefully without crashing.");
  } catch (e: any) {
    assert(false, `Recommender failed with error: ${e.message}`);
  }

  // --- 4. Naive Bayes Classifier Tests ---
  console.log(`\n${YELLOW}■ Testing Module: Machine Learning Classifier${RESET}`);
  try {
    const movies = loadAndCleanDataset();
    const classifier = new NaiveBayesGenreClassifier();
    
    // Train & Evaluate
    const metrics = classifier.train(movies);
    assert(metrics.accuracy > 0 && metrics.accuracy <= 1.0, `Calculated accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
    assert(metrics.precision > 0 && metrics.precision <= 1.0, `Calculated precision: ${(metrics.precision * 100).toFixed(2)}%`);
    assert(metrics.f1 > 0 && metrics.f1 <= 1.0, `Calculated macro F1-score: ${(metrics.f1 * 100).toFixed(2)}%`);
    assert(metrics.confusionMatrix.matrix.length === 5, "Confusion matrix matches standard 5x5 layout.");

    // Test predictions schema and capability
    const comedyDesc = "A group of funny friends get into hilarious stand-up situations and laugh out loud in a comedy show.";
    const comedyPred = classifier.predict(comedyDesc);
    assert(GENRE_CLASSES.includes(comedyPred.genre as any), `Predicted genre: ${comedyPred.genre} is a valid catalog genre.`);
    assert(comedyPred.confidence[comedyPred.genre] > 0, `Confidence score for prediction is valid: ${comedyPred.confidence[comedyPred.genre]}`);

    const horrorDesc = "A terrifying serial killer terrorizes teenagers in a haunted house with blood and jump scares.";
    const horrorPred = classifier.predict(horrorDesc);
    assert(GENRE_CLASSES.includes(horrorPred.genre as any), `Predicted genre: ${horrorPred.genre} is a valid catalog genre.`);

    const docDesc = "A science nature documentary exploring climate change and wild marine species in the deep ocean.";
    const docPred = classifier.predict(docDesc);
    assert(GENRE_CLASSES.includes(docPred.genre as any), `Predicted genre: ${docPred.genre} is a valid catalog genre.`);

    // Mapping testing
    assert(mapToStandardGenre("TV Action & Adventure") === "Action & Sci-Fi", "Standard genre mapper groups action subgenres.");
    assert(mapToStandardGenre("Docuseries, Science & Nature") === "Documentaries", "Standard genre mapper groups science subgenres.");
  } catch (e: any) {
    assert(false, `Classifier failed with error: ${e.message}`);
  }

  // --- Summary ---
  console.log(`\n========================================`);
  console.log(`🏁 Test execution complete.`);
  console.log(`Passed: ${GREEN}${passCount}${RESET}, Failed: ${failCount > 0 ? RED : GREEN}${failCount}${RESET}`);
  console.log(`========================================`);

  if (failCount > 0) {
    process.exit(1);
  } else {
    console.log(`All systems operational. Preflight check ${GREEN}SUCCESSFUL${RESET}.\n`);
  }
}

runTests();
