export function calculateAttemptScore(correctCount: number): number {
  return correctCount;
}

export function calculateRankingScore(params: {
  correctCount: number;
  totalTimeSec: number;
  durationMinutes: number;
  timeBonusFactor: number;
}): number {
  const { correctCount, totalTimeSec, durationMinutes, timeBonusFactor } = params;
  const durationSec = Math.max(1, durationMinutes * 60);
  const remainingRatio = Math.max(0, (durationSec - totalTimeSec) / durationSec);
  return Number((correctCount + remainingRatio * timeBonusFactor * correctCount).toFixed(4));
}

export function isEligibleForRanking(totalTimeSec: number, questionCount: number, minAvgSeconds: number): boolean {
  if (questionCount <= 0) return false;
  return totalTimeSec / questionCount >= minAvgSeconds;
}
