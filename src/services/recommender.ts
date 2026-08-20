/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Movie, RecommendationResult } from "../types.js";
import { normalizeText } from "./dataLoader.js";

// L2 normalization helper for a sparse vector represented as a Map
interface SparseVector {
  terms: Map<string, number>;
  magnitude: number;
}

export class ContentBasedRecommender {
  private movies: Movie[] = [];
  private vocabulary: string[] = [];
  private idfs: Map<string, number> = new Map();
  // Store pre-calculated L2-normalized TF-IDF sparse vectors for speed
  private vectors: SparseVector[] = [];

  constructor(movies: Movie[]) {
    this.movies = movies;
    this.fit();
  }

  // Trains the TF-IDF vectorizer and builds the sparse vectors
  private fit(): void {
    if (this.movies.length === 0) return;

    const N = this.movies.length;
    const docTermCounts: Map<string, number> = new Map(); // Number of docs containing each term
    const rawDocs: string[][] = [];

    // 1. Combine features and tokenize
    this.movies.forEach((m) => {
      // Feature formula: Genre + Director + Cast + Description
      // Weighted combinations - repeat important fields like genres and director to give them higher priority
      const combinedText = `
        ${m.listed_in} ${m.listed_in}
        ${m.director !== "Unknown Director" ? `${m.director} ${m.director}` : ""}
        ${m.cast !== "Unknown Cast" ? m.cast : ""}
        ${m.description}
      `;
      const tokens = normalizeText(combinedText);
      rawDocs.push(tokens);

      // Count term occurrences across docs (for IDF)
      const uniqueTermsInDoc = new Set(tokens);
      uniqueTermsInDoc.forEach((term) => {
        docTermCounts.set(term, (docTermCounts.get(term) || 0) + 1);
      });
    });

    // 2. Build Vocabulary and compute IDF weights
    // IDF formulation: log(1 + N / df) + 1
    docTermCounts.forEach((df, term) => {
      const idf = Math.log(1 + N / df) + 1;
      this.idfs.set(term, idf);
      this.vocabulary.push(term);
    });

    // 3. Construct TF-IDF sparse vectors with L2 normalization
    for (let i = 0; i < N; i++) {
      const tokens = rawDocs[i];
      const termCountsInDoc: Map<string, number> = new Map();

      tokens.forEach((term) => {
        termCountsInDoc.set(term, (termCountsInDoc.get(term) || 0) + 1);
      });

      const tfIdfTerms: Map<string, number> = new Map();
      let sqSum = 0;

      termCountsInDoc.forEach((count, term) => {
        const tf = count / tokens.length; // augmented tf
        const idf = this.idfs.get(term) || 1.0;
        const tfIdf = tf * idf;
        tfIdfTerms.set(term, tfIdf);
        sqSum += tfIdf * tfIdf;
      });

      const magnitude = Math.sqrt(sqSum);

      // Store normalized sparse vector
      const normalizedTerms: Map<string, number> = new Map();
      if (magnitude > 0) {
        tfIdfTerms.forEach((val, term) => {
          normalizedTerms.set(term, val / magnitude);
        });
      }

      this.vectors.push({
        terms: normalizedTerms,
        magnitude: magnitude > 0 ? 1.0 : 0.0,
      });
    }
  }

  // Computes the dot product between two sparse L2-normalized vectors (which equals cosine similarity)
  private computeCosineSimilarity(v1: SparseVector, v2: SparseVector): number {
    if (v1.magnitude === 0 || v2.magnitude === 0) return 0;

    let dotProduct = 0;
    // Iterate over the smaller vector to optimize performance
    const [smaller, larger] = v1.terms.size < v2.terms.size ? [v1.terms, v2.terms] : [v2.terms, v1.terms];

    smaller.forEach((val, term) => {
      const largerVal = larger.get(term);
      if (largerVal !== undefined) {
        dotProduct += val * largerVal;
      }
    });

    return dotProduct;
  }

  // Returns top N recommendations for a movie by title
  public recommendMovies(title: string, topN: number = 5): RecommendationResult[] {
    if (this.movies.length === 0) return [];

    const query = title.trim().toLowerCase();
    // 1. Find target movie index (with fuzzy substring match if exact match fails)
    let targetIdx = this.movies.findIndex((m) => m.title.toLowerCase() === query);

    if (targetIdx === -1) {
      // Try substring matching
      targetIdx = this.movies.findIndex((m) => m.title.toLowerCase().includes(query));
    }

    if (targetIdx === -1) {
      console.warn(`Movie title "${title}" not found for recommendations.`);
      return []; // Return empty if not found
    }

    const targetVector = this.vectors[targetIdx];
    const targetMovie = this.movies[targetIdx];
    const scores: { index: number; score: number }[] = [];

    // 2. Compute similarity against all other shows
    for (let i = 0; i < this.movies.length; i++) {
      if (i === targetIdx) continue; // Skip comparing with itself

      // Also skip duplicates with the same title to ensure recommendations are unique
      if (this.movies[i].title.toLowerCase() === targetMovie.title.toLowerCase()) {
        continue;
      }

      const score = this.computeCosineSimilarity(targetVector, this.vectors[i]);
      scores.push({ index: i, score });
    }

    // 3. Sort by similarity score in descending order
    scores.sort((a, b) => b.score - a.score);

    // 4. Map the top N entries to the RecommendationResult schema
    return scores.slice(0, topN).map(({ index, score }) => {
      const m = this.movies[index];
      return {
        title: m.title,
        score: parseFloat(score.toFixed(4)), // 4 decimal accuracy
        type: m.type,
        genre: m.listed_in,
        director: m.director,
        release_year: m.release_year,
        description: m.description,
        duration: m.duration,
        rating: m.rating,
      };
    });
  }
}
