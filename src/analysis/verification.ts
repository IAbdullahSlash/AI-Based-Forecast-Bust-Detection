import type { Confidence } from '../types/index.ts';
import nwp from '../data/nwpForecasts.json' with { type: 'json' };
import { IMD_YEARS, observedMonthly, observedRainfall } from '../data/observations.ts';
import { STATE_POSITIONS } from '../data/regions.ts';
import { percentile, round } from './metrics.ts';

// File dayNN of a run initialised on D matches IMD date D+NN (correlates best; ±1 day was checked).

interface NwpFile {
  source: string;
  initializations: Record<string, { days: number[]; regions: Record<string, NwpCell[]> }>;
}

interface NwpCell { mean: number; max: number; mslp?: number; wind?: number; u10?: number; v10?: number }

export interface RealPair {
  region: string;
  initDate: string;
  validDate: string;
  leadDay: number;
  forecast: number;
  observed: number;
  error: number;
  bust: boolean;
  /** Forecast-time predictors (null where the file for that lead has no such variable). */
  mslp: number | null;
  mslpAnomaly: number | null;
  pressureTendency: number | null;
  wind: number | null;
  observedP95: number | null;
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
  // Pressure anomalies are relative to the model's own climatology (mean over all runs and leads).
  const mslpClimate = new Map<string, number>();
  for (const { name } of STATE_POSITIONS) {
    const values = Object.values(file.initializations)
      .flatMap((run) => run.regions[name] ?? [])
      .map((cell) => cell.mslp)
      .filter((value): value is number => typeof value === 'number');
    if (values.length) mslpClimate.set(name, values.reduce((sum, value) => sum + value, 0) / values.length);
  }

  const pairs: RealPair[] = [];
  for (const [initDate, run] of Object.entries(file.initializations)) {
    run.days.forEach((leadDay, index) => {
      const validDate = addDays(initDate, leadDay);
      for (const { name: region } of STATE_POSITIONS) {
        const cell = run.regions[region]?.[index];
        const observed = observedRainfall(region, validDate);
        if (!cell || observed === null) continue;
        const previous = run.regions[region]?.[index - 1];
        const mslp = cell.mslp ?? null;
        const climate = mslpClimate.get(region);
        pairs.push({
          region, initDate, validDate, leadDay, forecast: cell.mean, observed, error: round(cell.mean - observed), bust: false,
          mslp,
          mslpAnomaly: mslp !== null && climate !== undefined ? round(mslp - climate) : null,
          pressureTendency: mslp !== null && typeof previous?.mslp === 'number' ? round(mslp - previous.mslp) : null,
          wind: cell.wind ?? null,
          observedP95: observedMonthly(region, Number(validDate.slice(5, 7)))?.p95 ?? null,
        });
      }
    });
  }

  // Pooled P90 absolute error: too few pairs per state for regional thresholds yet.
  const bustThreshold = round(Math.max(MIN_BUST_MM, percentile(pairs.map((p) => Math.abs(p.error)), 0.9)));
  const isBust = (pair: RealPair) => Math.abs(pair.error) >= bustThreshold;
  pairs.forEach((pair) => { pair.bust = isBust(pair); });

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
