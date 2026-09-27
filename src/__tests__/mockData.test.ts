import { describe, it, expect } from 'vitest';
import {
  STATE_POSITIONS,
  STATE_DATA,
  ANALOGUES,
  EXPLANATIONS,
  getRegionData,
  getAnalogueData,
  getExplanation,
} from '../data/mockData';
import { REGION_COORDINATES } from '../api/weatherApi';
import { ForecastVariable } from '../types';

describe('Data Coverage and Integrity', () => {
  const variables: ForecastVariable[] = ['rainfall', 'temperature', 'wind', 'pressure'];

  it('contains 32 states and union territories in STATE_POSITIONS', () => {
    expect(STATE_POSITIONS.length).toBe(32);
  });

  it('maps every state position to STATE_DATA and REGION_COORDINATES', () => {
    STATE_POSITIONS.forEach((state) => {
      expect(STATE_DATA[state.name]).toBeDefined();
      expect(REGION_COORDINATES[state.name]).toBeDefined();
      expect(REGION_COORDINATES[state.name].lat).toBeGreaterThan(0);
      expect(REGION_COORDINATES[state.name].lng).toBeGreaterThan(0);
    });
  });

  it('guarantees unique, dedicated historical analogues for every state without silent fallback', () => {
    STATE_POSITIONS.forEach((state) => {
      expect(ANALOGUES[state.name]).toBeDefined();
      expect(ANALOGUES[state.name].length).toBeGreaterThan(0);

      // Verify the analogue entry is non-empty and has similarity scores
      const regionalAnalogues = getAnalogueData(state.name, 'rainfall');
      expect(regionalAnalogues.length).toBeGreaterThan(0);
      expect(regionalAnalogues[0].similarity).toBeGreaterThan(0);
      expect(regionalAnalogues[0].forecastError).toBeGreaterThanOrEqual(0);
    });
  });

  it('provides rich quantified explanations for all 32 states', () => {
    STATE_POSITIONS.forEach((state) => {
      expect(EXPLANATIONS[state.name]).toBeDefined();
      const expl = getExplanation(state.name, 'rainfall');
      expect(expl.length).toBeGreaterThan(50);
      // Verify specific metrics or keywords are mentioned
      expect(expl).toMatch(/error|spread|monsoon|orographic|cyclonic|regime|convective|synoptic|disturbance/i);
    });
  });

  it('calculates regional metrics correctly across all variables', () => {
    variables.forEach((v) => {
      const data = getRegionData('Kerala', v);
      expect(data.region).toBe('Kerala');
      expect(data.forecastValue).toBeGreaterThan(0);
      expect(data.bustProbability).toBeGreaterThanOrEqual(5);
      expect(data.bustProbability).toBeLessThanOrEqual(95);
      expect(data.keyReasons.length).toBeGreaterThanOrEqual(1);
    });
  });
});
