import type { Confidence } from '../types/index.ts';
import nwp from '../data/nwpForecasts.json' with { type: 'json' };
import { IMD_YEARS, observedRainfall } from '../data/observations.ts';
import { STATE_POSITIONS } from '../data/regions.ts';
import { percentile, round } from './metrics.ts';

// Real verification: NCMRWF Unified Model rainfall forecasts (dataset/*.nc)
// joined with IMD gridded observations (dataset/IMD/*.nc) on state and valid
// date. File dayNN of a run initialised on date D is matched to IMD date D+NN;
// that alignment correlates best with the observations (checked against ±1 day).
// Both sides are state means over the same boundary masks.

interface NwpFile {
  source: string;
  initializations: Record<string, { days: number[]; regions: Record<string, { mean: number; max: number }[]> }>;
}

export interface RealPair {
  region: string;
  initDate: string;
  validDate: string;
  leadDay: number;
  forecast: number;
  observed: number;
  error: number;
}

export interface LeadVerification {
  leadDay: number;
  pairs: number;
  mae: number;
  bias: number;
  correlation: number;
  bustRate: number;
}

export interface RegionVerification {
  region: string;
  pairs: number;
  mae: number;
  bias: number;
  busts: number;
  confidence: Confidence;
}

export interface RealVerification {
  forecastSource: string;
  forecastInits: string[];
  observationYears: string[];
  pairs: RealPair[];
  bustThreshold: number;
  overall: { mae: number; bias: number; correlation: number; rmse: number } | null;
  byLead: LeadVerification[];
  byRegion: RegionVerification[];
  worstCases: RealPair[];
}

const MIN_BUST_MM = 10;
const DAY_MS = 86_400_000;

function addDays(isoDate: string, days: number) {
  return new Date(Date.parse(isoDate) + days * DAY_MS).toISOString().slice(0, 10);
}

function correlation(a: number[], b: number[]) {
  if (a.length < 3) return 0;
  const meanA = a.reduce((s, v) => s + v, 0) / a.length;
  const meanB = b.reduce((s, v) => s + v, 0) / b.length;
  let cov = 0; let varA = 0; let varB = 0;
  a.forEach((value, i) => {
    cov += (value - meanA) * (b[i] - meanB);
    varA += (value - meanA) ** 2;
    varB += (b[i] - meanB) ** 2;
  });
  return varA && varB ? Math.round((cov / Math.sqrt(varA * varB)) * 100) / 100 : 0;
}

function summarise(pairs: RealPair[]) {
  const errors = pairs.map((pair) => pair.error);
  const n = Math.max(errors.length, 1);
  return {
    mae: round(errors.reduce((s, e) => s + Math.abs(e), 0) / n),
    bias: round(errors.reduce((s, e) => s + e, 0) / n),
    rmse: round(Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / n)),
    correlation: correlation(pairs.map((p) => p.forecast), pairs.map((p) => p.observed)),
  };
}

let cached: RealVerification | null = null;

export function getRealVerification(): RealVerification {
  if (cached) return cached;
  const file = nwp as NwpFile;
  const pairs: RealPair[] = [];
  for (const [initDate, run] of Object.entries(file.initializations)) {
    run.days.forEach((leadDay, index) => {
      const validDate = addDays(initDate, leadDay);
      for (const { name: region } of STATE_POSITIONS) {
        const forecast = run.regions[region]?.[index]?.mean;
        const observed = observedRainfall(region, validDate);
        if (typeof forecast !== 'number' || observed === null) continue;
        pairs.push({ region, initDate, validDate, leadDay, forecast, observed, error: round(forecast - observed) });
      }
    });
  }

  // Pooled P90 absolute error: too few pairs per state for regional thresholds yet.
  const bustThreshold = round(Math.max(MIN_BUST_MM, percentile(pairs.map((p) => Math.abs(p.error)), 0.9)));
  const isBust = (pair: RealPair) => Math.abs(pair.error) >= bustThreshold;

  const leads = [...new Set(pairs.map((p) => p.leadDay))].sort((a, b) => a - b);
  const byLead = leads.map((leadDay) => {
    const subset = pairs.filter((p) => p.leadDay === leadDay);
    const stats = summarise(subset);
    return {
      leadDay, pairs: subset.length, mae: stats.mae, bias: stats.bias, correlation: stats.correlation,
      bustRate: Math.round((subset.filter(isBust).length / Math.max(subset.length, 1)) * 100),
    };
  });

  const byRegion = STATE_POSITIONS
    .map(({ name }) => {
      const subset = pairs.filter((p) => p.region === name);
      const stats = summarise(subset);
      const busts = subset.filter(isBust).length;
      const bustShare = busts / Math.max(subset.length, 1);
      const confidence: Confidence = bustShare >= 0.25 ? 'low' : bustShare > 0 ? 'medium' : 'high';
      return { region: name, pairs: subset.length, mae: stats.mae, bias: stats.bias, busts, confidence };
    })
    .filter((region) => region.pairs > 0)
    .sort((a, b) => b.mae - a.mae);

  cached = {
    forecastSource: file.source.trim(),
    forecastInits: Object.keys(file.initializations),
    observationYears: IMD_YEARS,
    pairs,
    bustThreshold,
    overall: pairs.length ? summarise(pairs) : null,
    byLead,
    byRegion,
    worstCases: [...pairs].sort((a, b) => Math.abs(b.error) - Math.abs(a.error)).slice(0, 8),
  };
  return cached;
}
