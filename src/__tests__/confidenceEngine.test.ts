import { describe, it, expect } from 'vitest';
import { getConfidenceByDay, STATE_POSITIONS } from '../data/mockData';
import { ForecastVariable } from '../types';

describe('Confidence & Bust Degradation Engine', () => {
  const variables: ForecastVariable[] = ['rainfall', 'temperature', 'wind', 'pressure'];

  it('generates deterministic data across multiple calls (no Math.random jitter)', () => {
    const run1 = getConfidenceByDay('rainfall');
    const run2 = getConfidenceByDay('rainfall');

    expect(run1[1]['Odisha']).toEqual(run2[1]['Odisha']);
    expect(run1[5]['Maharashtra']).toEqual(run2[5]['Maharashtra']);
    expect(run1[10]['Delhi']).toEqual(run2[10]['Delhi']);
  });

  it('provides complete 10-day coverage for all 32 states and union territories', () => {
    const data = getConfidenceByDay('temperature');

    expect(Object.keys(data)).toHaveLength(10);

    for (let day = 1; day <= 10; day++) {
      const regionsForDay = Object.keys(data[day]);
      expect(regionsForDay).toHaveLength(STATE_POSITIONS.length);
      STATE_POSITIONS.forEach((s) => {
        expect(data[day][s.name]).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(data[day][s.name].confidence);
        expect(data[day][s.name].bustProbability).toBeGreaterThanOrEqual(5);
        expect(data[day][s.name].bustProbability).toBeLessThanOrEqual(95);
      });
    }
  });

  it('reflects forecast lead-time degradation (Day 10 bust risk > Day 1 bust risk)', () => {
    variables.forEach((variable) => {
      const data = getConfidenceByDay(variable);
      let day1Sum = 0;
      let day10Sum = 0;

      STATE_POSITIONS.forEach((s) => {
        day1Sum += data[1][s.name].bustProbability;
        day10Sum += data[10][s.name].bustProbability;
      });

      const day1Avg = day1Sum / STATE_POSITIONS.length;
      const day10Avg = day10Sum / STATE_POSITIONS.length;

      expect(day10Avg).toBeGreaterThan(day1Avg);
    });
  });
});
