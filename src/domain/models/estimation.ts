/**
 * Valid Fibonacci point values for effort estimation.
 */
export type FibonacciPoints = 1 | 2 | 3 | 5 | 8 | 13;

/**
 * Result of an effort estimation.
 */
export interface EstimationResult {
  points: FibonacciPoints;
  reasoning: string;
}

/**
 * Result of evaluating a ticket field (description or title).
 */
export interface EvaluationResult {
  isAdequate: boolean;
  feedback: string;
}

/**
 * Array of valid Fibonacci points for validation.
 */
export const VALID_FIBONACCI_POINTS: FibonacciPoints[] = [1, 2, 3, 5, 8, 13];

/**
 * Finds the nearest Fibonacci number from the valid set.
 */
export function nearestFibonacci(n: number): FibonacciPoints {
  let closest = VALID_FIBONACCI_POINTS[0];
  let minDiff = Math.abs(n - closest);

  for (const point of VALID_FIBONACCI_POINTS) {
    const diff = Math.abs(n - point);
    if (diff < minDiff) {
      minDiff = diff;
      closest = point;
    }
  }

  return closest;
}

