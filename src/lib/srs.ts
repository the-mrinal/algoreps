import { SRSResult } from "@/types";

/**
 * Adaptive doubling interval sequence (in days).
 * Each step roughly doubles the previous interval.
 */
const INTERVAL_SEQUENCE = [1, 2, 4, 8, 16, 32, 64, 128, 256] as const;

const MAX_INTERVAL_STEP = INTERVAL_SEQUENCE.length - 1; // 8

/**
 * Calculate the next revision date using adaptive doubling intervals.
 *
 * Score 1-2 (struggled): reset interval_step to 0, schedule +1 day
 * Score 3 (acceptable):  keep same interval_step, schedule same interval
 * Score 4-5 (strong):    advance interval_step by 1 (capped), schedule next interval
 *
 * @param score - Performance score 1-5
 * @param currentIntervalStep - Current position in interval sequence (default 0)
 */
export function calculateNextRevisionDate(
  score: number,
  currentIntervalStep: number = 0,
): SRSResult {
  let newIntervalStep: number;
  let daysToAdd: number;

  if (score <= 2) {
    // Struggled: reset to beginning
    newIntervalStep = 0;
    daysToAdd = INTERVAL_SEQUENCE[0];
  } else if (score === 3) {
    // Acceptable: stay at same step
    newIntervalStep = currentIntervalStep;
    daysToAdd = INTERVAL_SEQUENCE[currentIntervalStep] ?? INTERVAL_SEQUENCE[MAX_INTERVAL_STEP];
  } else {
    // Strong (4-5): advance one step
    newIntervalStep = Math.min(currentIntervalStep + 1, MAX_INTERVAL_STEP);
    daysToAdd = INTERVAL_SEQUENCE[newIntervalStep];
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + daysToAdd);

  return {
    next_revision_date: nextDate,
    days_to_add: daysToAdd,
    interval_step: newIntervalStep,
  };
}
