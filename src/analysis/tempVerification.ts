import type { Confidence } from '../types/index.ts';
import nwp from '../data/nwpForecasts.json' with { type: 'json' };
import { observedTmax, observedTmaxMonthly } from '../data/observations.ts';
import { STATE_POSITIONS } from '../data/regions.ts';
import { percentile, round } from './metrics.ts';

// Real temperature verification. S2S has no 2 m temperature, so the forecast is
// the 925 hPa temperature converted to a surface maximum-temperature forecast
// with MOS (model output statistics): Tmax ≈ a_state + b · T925, where the
// per-state offset a and the shared slope b are fitted on the OTHER runs only
// (leave-one-run-out). Observations are IMD 1° gridded Tmax.

interface NwpCell { mean: number; mslp?: number; t925?: number; t850?: number }
interface NwpFile { initializations: Record<string, { days: number[]; regions: Record<string, NwpCell[]> }> }

export interface TempPair {
  region: string;
  initDate: string;
  validDate: string;
  leadDay: number;
  t925: number;
  t850: number | null;
  rawForecast: number;
  forecast: number;      // MOS-corrected Tmax forecast (°C)
  observed: number;
  error: number;         // forecast − observed
  bust: boolean;
  forecastChange: number | null;   // corrected forecast change from the previous lead (°C/day)
  rainForecast: number;
  mslpAnomaly: number | null;
  normal: number | null;           // IMD monthly mean Tmax
  p95: number | null;
}

export interface TempVerification {
  pairs: TempPair[];
  bustThreshold: number;
  overall: { mae: number; bias: number; rmse: number; rawMae: number } | null;
  slope: number;
  byLead: { leadDay: number; pairs: number; mae: number; bias: number; bustRate: number }[];
  byRegion: { region: string; pairs: number; mae: number; bias: number; busts: number; confidence: Confidence }[];
  worstCases: TempPair[];
}

const MIN_BUST_C = 2;
const DAY_MS = 86_400_000;
const addDays = (iso: string, days: number) => new Date(Date.parse(iso) + days * DAY_MS).toISOString().slice(0, 10);
const mean = (values: number[]) => (values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0);

interface Raw { region: string; initDate: string; validDate: string; leadDay: number; t925: number; t850: number | null; observed: number; rain: number; mslp: number | null }

/** Fit Tmax ≈ a_state + b·T925 on training rows (within-state slope, pooled). */
function fitMos(rows: Raw[]) {
  const byRegion = new Map<string, Raw[]>();
  rows.forEach((row) => byRegion.set(row.region, [...(byRegion.get(row.region) ?? []), row]));
  let covariance = 0; let variance = 0;
  byRegion.forEach((group) => {
    const mx = mean(group.map((r) => r.t925)); const my = mean(group.map((r) => r.observed));
    group.forEach((r) => { covariance += (r.t925 - mx) * (r.observed - my); variance += (r.t925 - mx) ** 2; });
  });
  const slope = variance ? Math.max(0.2, Math.min(1.5, covariance / variance)) : 1;
  const offsets = new Map<string, number>();
  byRegion.forEach((group, region) => offsets.set(region, mean(group.map((r) => r.observed - slope * r.t925))));
  const globalOffset = mean(rows.map((r) => r.observed - slope * r.t925));
  return { slope, offset: (region: string) => offsets.get(region) ?? globalOffset };
}

let cached: TempVerification | null = null;

export function getTempVerification(): TempVerification {
  if (cached) return cached;
  const file = nwp as NwpFile;
  const mslpClimate = new Map<string, number>();
  for (const { name } of STATE_POSITIONS) {
    const values = Object.values(file.initializations).flatMap((run) => run.regions[name] ?? []).map((c) => c.mslp).filter((v): v is number => typeof v === 'number');
    if (values.length) mslpClimate.set(name, mean(values));
  }

  const raw: Raw[] = [];
  for (const [initDate, run] of Object.entries(file.initializations)) {
    run.days.forEach((leadDay, index) => {
      const validDate = addDays(initDate, leadDay);
      for (const { name: region } of STATE_POSITIONS) {
        const cell = run.regions[region]?.[index];
        const observed = observedTmax(region, validDate);
        if (!cell || typeof cell.t925 !== 'number' || observed === null) continue;
        raw.push({ region, initDate, validDate, leadDay, t925: cell.t925, t850: cell.t850 ?? null, observed, rain: cell.mean, mslp: cell.mslp ?? null });
      }
    });
  }

  const runs = [...new Set(raw.map((r) => r.initDate))];
  let slopeSum = 0;
  const pairs: TempPair[] = [];
  for (const run of runs) {
    const mos = fitMos(raw.filter((r) => r.initDate !== run));
    slopeSum += mos.slope;
    const test = raw.filter((r) => r.initDate === run);
    const corrected = new Map(test.map((r) => [`${r.region}|${r.leadDay}`, mos.offset(r.region) + mos.slope * r.t925]));
    for (const r of test) {
      const forecast = round(corrected.get(`${r.region}|${r.leadDay}`)!);
      const previous = corrected.get(`${r.region}|${r.leadDay - 1}`);
      const month = Number(r.validDate.slice(5, 7));
      const climate = observedTmaxMonthly(r.region, month);
      const mslpNormal = mslpClimate.get(r.region);
      pairs.push({
        region: r.region, initDate: r.initDate, validDate: r.validDate, leadDay: r.leadDay,
        t925: r.t925, t850: r.t850, rawForecast: r.t925, forecast, observed: r.observed,
        error: round(forecast - r.observed), bust: false,
        forecastChange: previous === undefined ? null : round(forecast - previous),
        rainForecast: r.rain,
        mslpAnomaly: r.mslp !== null && mslpNormal !== undefined ? round(r.mslp - mslpNormal) : null,
        normal: climate?.mean ?? null,
        p95: climate?.p95 ?? null,
      });
    }
  }

  const bustThreshold = round(Math.max(MIN_BUST_C, percentile(pairs.map((p) => Math.abs(p.error)), 0.9)));
  pairs.forEach((pair) => { pair.bust = Math.abs(pair.error) >= bustThreshold; });

  const stats = (subset: TempPair[]) => ({
    mae: round(mean(subset.map((p) => Math.abs(p.error)))),
    bias: round(mean(subset.map((p) => p.error))),
  });
  const leads = [...new Set(pairs.map((p) => p.leadDay))].sort((a, b) => a - b);
  cached = {
    pairs,
    bustThreshold,
    slope: round(slopeSum / Math.max(runs.length, 1) * 100) / 100,
    overall: pairs.length ? {
      ...stats(pairs),
      rmse: round(Math.sqrt(mean(pairs.map((p) => p.error ** 2)))),
      rawMae: round(mean(pairs.map((p) => Math.abs(p.rawForecast - p.observed)))),
    } : null,
    byLead: leads.map((leadDay) => {
      const subset = pairs.filter((p) => p.leadDay === leadDay);
      return { leadDay, pairs: subset.length, ...stats(subset), bustRate: Math.round((subset.filter((p) => p.bust).length / Math.max(subset.length, 1)) * 100) };
    }),
    byRegion: STATE_POSITIONS.map(({ name }) => {
      const subset = pairs.filter((p) => p.region === name);
      const busts = subset.filter((p) => p.bust).length;
      const share = busts / Math.max(subset.length, 1);
      const confidence: Confidence = share >= 0.25 ? 'low' : share > 0 ? 'medium' : 'high';
      return { region: name, pairs: subset.length, ...stats(subset), busts, confidence };
    }).filter((r) => r.pairs > 0).sort((a, b) => b.mae - a.mae),
    worstCases: [...pairs].sort((a, b) => Math.abs(b.error) - Math.abs(a.error)).slice(0, 8),
  };
  return cached;
}

