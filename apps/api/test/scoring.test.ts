import { describe, expect, it } from "vitest";
import { calculateRankingScore, isEligibleForRanking } from "../src/domain/scoring.js";

describe("scoring", () => {
  it("calcula score com bonus de tempo", () => {
    const score = calculateRankingScore({
      correctCount: 60,
      totalTimeSec: 10000,
      durationMinutes: 300,
      timeBonusFactor: 0.2
    });

    expect(score).toBeGreaterThan(60);
  });

  it("bloqueia ranking quando tempo médio é menor que limite", () => {
    expect(isEligibleForRanking(600, 80, 10)).toBe(false);
    expect(isEligibleForRanking(1200, 80, 10)).toBe(true);
  });
});
