import { SRSResult } from "@/types";

/**
 * Calculate the next revision date based on performance score.
 * Score 1-2 (struggled): +1 day
 * Score 3 (acceptable):  +4 days
 * Score 4-5 (strong):    +14 days
 */
export function calculateNextRevisionDate(score: number): SRSResult {
  let daysToAdd: number;

  if (score <= 2) {
    daysToAdd = 1;
  } else if (score === 3) {
    daysToAdd = 4;
  } else {
    daysToAdd = 14;
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + daysToAdd);

  return {
    next_revision_date: nextDate,
    days_to_add: daysToAdd,
  };
}
