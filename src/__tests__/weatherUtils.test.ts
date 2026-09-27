import { describe, it, expect } from 'vitest';
import {
  confidenceColor,
  confidenceBg,
  bustColor,
  bustBg,
  mapColor,
  getConfidence,
  getBustProb,
  getForecastVal,
} from '../utils/weatherUtils';
import { ConfidenceByDay } from '../types';

describe('Weather Utility Functions', () => {
  it('correctly maps confidence to distinct semantic colors', () => {
    expect(confidenceColor('high')).toBe('#22c55e');
    expect(confidenceColor('medium')).toBe('#eab308');
    expect(confidenceColor('low')).toBe('#ef4444');

    expect(confidenceBg('high')).toContain('green');
    expect(confidenceBg('medium')).toContain('yellow');
    expect(confidenceBg('low')).toContain('red');
  });

  it('correctly categorizes bust probability levels', () => {
    // Low risk (< 40)
    expect(bustColor(25)).toBe('#3b82f6');
    expect(bustBg(25)).toContain('blue');

    // Moderate risk (40-60)
    expect(bustColor(50)).toBe('#eab308');
    expect(bustBg(50)).toContain('yellow');

    // High risk (> 60)
    expect(bustColor(75)).toBe('#ef4444');
    expect(bustBg(75)).toContain('red');
  });

  it('switches mapColor based on view mode', () => {
    expect(mapColor('confidence', 'high', 80)).toBe('#22c55e');
    expect(mapColor('bust', 'high', 80)).toBe('#ef4444');
  });

  it('safely extracts confidence, bust prob, and forecast values from dataset', () => {
    const mockCb: ConfidenceByDay = {
      1: {
        'Delhi': { confidence: 'high', bustProbability: 22, forecastValue: 35 },
      },
    };

    expect(getConfidence(1, 'Delhi', mockCb)).toBe('high');
    expect(getBustProb(1, 'Delhi', mockCb)).toBe(22);
    expect(getForecastVal(1, 'Delhi', mockCb)).toBe(35);

    // Fallbacks when missing
    expect(getConfidence(2, 'Delhi', mockCb)).toBe('medium');
    expect(getBustProb(2, 'Delhi', mockCb)).toBe(50);
    expect(getForecastVal(2, 'Delhi', mockCb)).toBe(100);
  });
});
