/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Movie, KPIStats, AnalyticsCharts } from "../types.js";
import { normalizeText } from "./dataLoader.js";

// Computes all statistics and aggregates for the Dashboard
export function computeDashboardStats(movies: Movie[]): KPIStats {
  const totalMovies = movies.filter((m) => m.type === "Movie").length;
  const totalTVShows = movies.filter((m) => m.type === "TV Show").length;

  const genresSet = new Set<string>();
  const countriesSet = new Set<string>();
  const directorsSet = new Set<string>();

  let movieDurationSum = 0;
  let movieCountWithDuration = 0;
  let tvShowSeasonsSum = 0;
  let tvShowCountWithSeasons = 0;
  let releaseYearSum = 0;

  const ratingsCount: Record<string, number> = {};

  movies.forEach((m) => {
    // Release Year
    releaseYearSum += m.release_year;

    // Genres
    if (m.cleaned_genres) {
      m.cleaned_genres.forEach((g) => genresSet.add(g));
    }

    // Country
    if (m.country && m.country !== "Unknown Country") {
      m.country.split(",").forEach((c) => countriesSet.add(c.trim()));
    }

    // Director
    if (m.director && m.director !== "Unknown Director") {
      m.director.split(",").forEach((d) => directorsSet.add(d.trim()));
    }

    // Duration Averages
    if (m.type === "Movie") {
      const match = m.duration.match(/(\d+)\s*min/);
      if (match) {
        movieDurationSum += parseInt(match[1], 10);
        movieCountWithDuration++;
      }
    } else {
      const match = m.duration.match(/(\d+)\s*Season/);
      if (match) {
        tvShowSeasonsSum += parseInt(match[1], 10);
        tvShowCountWithSeasons++;
      }
    }

    // Rating
    if (m.rating) {
      ratingsCount[m.rating] = (ratingsCount[m.rating] || 0) + 1;
    }
  });

  // Calculate Most Popular Rating
  let mostPopularRating = "N/A";
  let maxRatingCount = -1;
  Object.entries(ratingsCount).forEach(([r, count]) => {
    if (count > maxRatingCount) {
      maxRatingCount = count;
      mostPopularRating = r;
    }
  });

  const avgDurationMovie = movieCountWithDuration > 0 ? Math.round(movieDurationSum / movieCountWithDuration) : 0;
  const avgDurationTVShow = tvShowCountWithSeasons > 0 ? parseFloat((tvShowSeasonsSum / tvShowCountWithSeasons).toFixed(1)) : 0;
  const avgReleaseYear = movies.length > 0 ? Math.round(releaseYearSum / movies.length) : 0;

  // Latest Added Content (Sorted by Added Year desc)
  const latestAdded = [...movies]
    .filter((m) => m.date_added)
    .sort((a, b) => {
      const yearDiff = (b.added_year || 0) - (a.added_year || 0);
      if (yearDiff !== 0) return yearDiff;
      // Secondary sort by release year
      return b.release_year - a.release_year;
    })
    .slice(0, 5);

  return {
    totalMovies,
    totalTVShows,
    totalGenres: genresSet.size,
    totalCountries: countriesSet.size,
    totalDirectors: directorsSet.size,
    avgDurationMovie,
    avgDurationTVShow,
    avgReleaseYear,
    mostPopularRating,
    latestAdded,
  };
}

// Generates data structures for Plotly Charts
export function generateAnalyticsCharts(movies: Movie[]): AnalyticsCharts {
  // 1. Type Distribution
  const totalMovies = movies.filter((m) => m.type === "Movie").length;
  const totalTVShows = movies.filter((m) => m.type === "TV Show").length;
  const typeDistribution = [
    { label: "Movies", value: totalMovies },
    { label: "TV Shows", value: totalTVShows },
  ];

  // 2. Top Genres
  const genreCounts: Record<string, number> = {};
  movies.forEach((m) => {
    if (m.cleaned_genres) {
      m.cleaned_genres.forEach((g) => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    }
  });
  const topGenres = Object.entries(genreCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // 3. Top Countries
  const countryCounts: Record<string, number> = {};
  movies.forEach((m) => {
    if (m.country && m.country !== "Unknown Country") {
      m.country.split(",").forEach((c) => {
        const cleaned = c.trim();
        if (cleaned) {
          countryCounts[cleaned] = (countryCounts[cleaned] || 0) + 1;
        }
      });
    }
  });
  const topCountries = Object.entries(countryCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // 4. Top Directors
  const directorCounts: Record<string, number> = {};
  movies.forEach((m) => {
    if (m.director && m.director !== "Unknown Director") {
      m.director.split(",").forEach((d) => {
        const cleaned = d.trim();
        if (cleaned) {
          directorCounts[cleaned] = (directorCounts[cleaned] || 0) + 1;
        }
      });
    }
  });
  const topDirectors = Object.entries(directorCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // 5. Top Actors (Cast)
  const castCounts: Record<string, number> = {};
  movies.forEach((m) => {
    if (m.cast && m.cast !== "Unknown Cast") {
      m.cast.split(",").forEach((c) => {
        const cleaned = c.trim();
        if (cleaned) {
          castCounts[cleaned] = (castCounts[cleaned] || 0) + 1;
        }
      });
    }
  });
  const topActors = Object.entries(castCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);

  // 6. Rating Distribution
  const ratingCounts: Record<string, number> = {};
  movies.forEach((m) => {
    if (m.rating) {
      ratingCounts[m.rating] = (ratingCounts[m.rating] || 0) + 1;
    }
  });
  const ratingDistribution = Object.entries(ratingCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  // 7. Year-wise Releases
  const releaseYearCounts: Record<number, number> = {};
  movies.forEach((m) => {
    releaseYearCounts[m.release_year] = (releaseYearCounts[m.release_year] || 0) + 1;
  });
  const yearWiseReleases = Object.entries(releaseYearCounts)
    .map(([year, count]) => ({ year: parseInt(year, 10), count }))
    .sort((a, b) => a.year - b.year);

  // 8. Year-wise Additions
  const addedYearCounts: Record<number, number> = {};
  movies.forEach((m) => {
    if (m.added_year) {
      addedYearCounts[m.added_year] = (addedYearCounts[m.added_year] || 0) + 1;
    }
  });
  const yearWiseAdditions = Object.entries(addedYearCounts)
    .map(([year, count]) => ({ year: parseInt(year, 10), count }))
    .sort((a, b) => a.year - b.year);

  // 9. Word Frequency & Word Cloud Data
  const wordCounts: Record<string, number> = {};
  movies.forEach((m) => {
    const tokens = normalizeText(m.description);
    tokens.forEach((t) => {
      wordCounts[t] = (wordCounts[t] || 0) + 1;
    });
  });
  const wordFrequency = Object.entries(wordCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 40); // Top 40 words for visuals

  // 10. Genre Co-occurrence Heatmap
  // Collect top 10 genres to keep matrix concise and legible
  const top10GenreLabels = topGenres.map((g) => g.label);
  const size = top10GenreLabels.length;
  const zMatrix: number[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(0));

  movies.forEach((m) => {
    if (m.cleaned_genres) {
      const movieGenres = m.cleaned_genres.filter((g) => top10GenreLabels.includes(g));
      for (let i = 0; i < movieGenres.length; i++) {
        const gA = movieGenres[i];
        const idxA = top10GenreLabels.indexOf(gA);
        for (let j = 0; j < movieGenres.length; j++) {
          const gB = movieGenres[j];
          const idxB = top10GenreLabels.indexOf(gB);
          if (idxA !== -1 && idxB !== -1) {
            zMatrix[idxA][idxB]++;
          }
        }
      }
    }
  });

  const genreHeatmap = {
    x: top10GenreLabels,
    y: top10GenreLabels,
    z: zMatrix,
  };

  return {
    typeDistribution,
    topGenres,
    topCountries,
    topDirectors,
    topActors,
    ratingDistribution,
    yearWiseReleases,
    yearWiseAdditions,
    wordFrequency,
    genreHeatmap,
  };
}
