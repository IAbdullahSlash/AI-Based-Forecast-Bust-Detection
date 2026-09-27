import { useMemo } from 'react';
import { getConfidenceByDay } from '../data/mockData';
import { ForecastVariable, ConfidenceByDay } from '../types';

/**
 * Memoized confidence data hook.
 *
 * Returns a stable ConfidenceByDay map that only re-computes when `variable`
 * changes. This prevents the O(states × days) recomputation from firing on
 * every parent render cycle.
 */
export function useConfidenceData(variable: ForecastVariable): ConfidenceByDay {
  return useMemo(() => getConfidenceByDay(variable), [variable]);
}
