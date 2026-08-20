/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Movie {
  show_id: string;
  type: "Movie" | "TV Show";
  title: string;
  director: string;
  cast: string;
  country: string;
  date_added: string;
  release_year: number;
  rating: string;
  duration: string;
  listed_in: string; // Comma separated genres
  description: string;
  // Extracted fields
  added_year?: number;
  added_month?: string;
  cleaned_genres?: string[];
  normalized_country?: string;
}

export interface KPIStats {
  totalMovies: number;
  totalTVShows: number;
  totalGenres: number;
  totalCountries: number;
  totalDirectors: number;
  avgDurationMovie: number; // in minutes
  avgDurationTVShow: number; // in seasons
  avgReleaseYear: number;
  mostPopularRating: string;
  latestAdded: Movie[];
}

export interface RecommendationResult {
  title: string;
  score: number;
  type: string;
  genre: string;
  director: string;
  release_year: number;
  description: string;
  duration: string;
  rating: string;
}

export interface ClassificationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  report: Record<string, { precision: number; recall: number; f1: number; support: number }>;
  confusionMatrix: {
    labels: string[];
    matrix: number[][];
  };
}

export interface AnalyticsCharts {
  typeDistribution: { label: string; value: number }[];
  topGenres: { label: string; value: number }[];
  topCountries: { label: string; value: number }[];
  topDirectors: { label: string; value: number }[];
  topActors: { label: string; value: number }[];
  ratingDistribution: { label: string; value: number }[];
  yearWiseReleases: { year: number; count: number }[];
  yearWiseAdditions: { year: number; count: number }[];
  wordFrequency: { word: string; count: number }[];
  genreHeatmap: {
    x: string[];
    y: string[];
    z: number[][];
  };
}

export interface SearchFilters {
  query: string;
  type: "" | "Movie" | "TV Show";
  genre: string;
  country: string;
  rating: string;
  startYear: number;
  endYear: number;
  sortBy: "title" | "release_year" | "added_date";
  sortOrder: "asc" | "desc";
  is100crOnly: boolean;
  isUnderratedOnly: boolean;
}
