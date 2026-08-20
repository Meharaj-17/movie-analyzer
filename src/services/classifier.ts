/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Movie } from "../types.js";
import { normalizeText } from "./dataLoader.js";

export const GENRE_CLASSES = [
  "Action & Sci-Fi",
  "Comedies",
  "Dramas",
  "Horror & Thrillers",
  "Documentaries"
] as const;

export function mapToStandardGenre(genre: string): typeof GENRE_CLASSES[number] {
  const g = genre.toLowerCase();
  if (g.includes("action") || g.includes("adventure") || g.includes("sci-fi") || g.includes("fantasy") || g.includes("anime")) {
    return "Action & Sci-Fi";
  }
  if (g.includes("comedy") || g.includes("comedies")) {
    return "Comedies";
  }
  if (g.includes("horror") || g.includes("thriller") || g.includes("mystery") || g.includes("crime")) {
    return "Horror & Thrillers";
  }
  if (g.includes("doc") || g.includes("nature") || g.includes("science")) {
    return "Documentaries";
  }
  return "Dramas";
}

export class NaiveBayesGenreClassifier {
  private priors: Record<string, number> = {};
  private likelihoods: Record<string, Record<string, number>> = {};
  private vocab: Set<string> = new Set();
  private classWordCounts: Record<string, number> = {};

  constructor() {
    GENRE_CLASSES.forEach((c) => {
      this.priors[c] = 0;
      this.likelihoods[c] = {};
      this.classWordCounts[c] = 0;
    });
  }

  public train(movies: Movie[]) {
    const N = movies.length;
    const classCounts: Record<string, number> = {};
    GENRE_CLASSES.forEach((c) => (classCounts[c] = 0));

    // 1. Gather frequencies
    movies.forEach((m) => {
      const standardGenre = mapToStandardGenre(m.listed_in);
      classCounts[standardGenre]++;

      const tokens = normalizeText(m.description || "");
      tokens.forEach((token) => {
        this.vocab.add(token);
        this.likelihoods[standardGenre][token] = (this.likelihoods[standardGenre][token] || 0) + 1;
        this.classWordCounts[standardGenre]++;
      });
    });

    // 2. Compute log priors
    GENRE_CLASSES.forEach((c) => {
      this.priors[c] = (classCounts[c] + 1) / (N + GENRE_CLASSES.length);
    });

    // 3. Evaluate training set for metrics
    let correct = 0;
    const confusionMatrix = {
      labels: [...GENRE_CLASSES],
      matrix: GENRE_CLASSES.map(() => GENRE_CLASSES.map(() => 0)),
    };

    const classMetrics: Record<string, { tp: number; fp: number; fn: number }> = {};
    GENRE_CLASSES.forEach((c) => (classMetrics[c] = { tp: 0, fp: 0, fn: 0 }));

    movies.forEach((m) => {
      const trueGenre = mapToStandardGenre(m.listed_in);
      const pred = this.predict(m.description || "");
      const predGenre = pred.genre;

      const trueIdx = GENRE_CLASSES.indexOf(trueGenre);
      const predIdx = GENRE_CLASSES.indexOf(predGenre);
      if (trueIdx !== -1 && predIdx !== -1) {
        confusionMatrix.matrix[trueIdx][predIdx]++;
      }

      if (trueGenre === predGenre) {
        correct++;
        classMetrics[trueGenre].tp++;
      } else {
        classMetrics[trueGenre].fn++;
        classMetrics[predGenre].fp++;
      }
    });

    const accuracy = correct / N;

    let sumPrecision = 0;
    let sumRecall = 0;
    let sumF1 = 0;
    const report: Record<string, { precision: number; recall: number; f1: number; support: number }> = {};

    GENRE_CLASSES.forEach((c) => {
      const { tp, fp, fn } = classMetrics[c];
      const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
      const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

      sumPrecision += precision;
      sumRecall += recall;
      sumF1 += f1;

      report[c] = {
        precision,
        recall,
        f1,
        support: classCounts[c],
      };
    });

    return {
      accuracy,
      precision: sumPrecision / GENRE_CLASSES.length,
      recall: sumRecall / GENRE_CLASSES.length,
      f1: sumF1 / GENRE_CLASSES.length,
      report,
      confusionMatrix,
    };
  }

  public predict(description: string) {
    const tokens = normalizeText(description);
    const confidence: Record<string, number> = {};
    let bestGenre: typeof GENRE_CLASSES[number] = "Dramas";
    let maxScore = -Infinity;

    GENRE_CLASSES.forEach((c) => {
      let score = Math.log(this.priors[c]);

      tokens.forEach((token) => {
        const count = this.likelihoods[c][token] || 0;
        const p = (count + 1) / (this.classWordCounts[c] + this.vocab.size);
        score += Math.log(p);
      });

      confidence[c] = score;
      if (score > maxScore) {
        maxScore = score;
        bestGenre = c;
      }
    });

    // Softmax normalization for confidence values
    const expScores = GENRE_CLASSES.map((c) => Math.exp(confidence[c] - maxScore));
    const sumExp = expScores.reduce((a, b) => a + b, 0);

    const normalizedConfidence: Record<string, number> = {};
    GENRE_CLASSES.forEach((c, idx) => {
      normalizedConfidence[c] = expScores[idx] / sumExp;
    });

    return {
      genre: bestGenre,
      confidence: normalizedConfidence,
    };
  }
}
