import type { ErrorMetrics, EvaluatedVariable, ForecastObservation } from '../types/index.ts';
import { SYNTHETIC_FORECAST_OBSERVATIONS } from '../data/syntheticArchive.ts';

export const round = (value: number) => Math.round(value * 10) / 10;
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function percentile(values: number[], p: number) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

export function alignForecastsAndObservations(records = SYNTHETIC_FORECAST_OBSERVATIONS) {
  return records.filter((record) => record.forecastIssuedAt < record.validAt && record.leadDays > 0);
}

export const ALIGNED_RECORDS = alignForecastsAndObservations();

export function forecastError(record: ForecastObservation, variable: EvaluatedVariable) {
  return variable === 'rainfall'
    ? record.rainfallForecast - record.rainfallObserved
    : record.temperatureForecast - record.temperatureObserved;
}

export function calculateErrorMetrics(records: ForecastObservation[], variable: EvaluatedVariable, threshold?: number): ErrorMetrics {
  const errors = records.map((record) => forecastError(record, variable));
  const absoluteErrors = errors.map(Math.abs);
  const size = Math.max(records.length, 1);
  return {
    mae: round(absoluteErrors.reduce((sum, value) => sum + value, 0) / size),
    rmse: round(Math.sqrt(errors.reduce((sum, value) => sum + value * value, 0) / size)),
    bias: round(errors.reduce((sum, value) => sum + value, 0) / size),
    bustThreshold: round(threshold ?? percentile(absoluteErrors, 0.9)),
  };
}

/** Floor so tiny errors in dry or stable regions never count as busts. */
const MIN_BUST_ERROR: Record<EvaluatedVariable, number> = { rainfall: 15, temperature: 2 };

const thresholdCache = new Map<string, number>();

export const REFERENCE_LEADS = 3;

/** P90 of Day 1–3 absolute errors; fixed across leads, so longer leads bust more often. */
export function bustThreshold(region: string, variable: EvaluatedVariable) {
  const key = `${region}|${variable}`;
  const cached = thresholdCache.get(key);
  if (cached !== undefined) return cached;
  const errors = ALIGNED_RECORDS
    .filter((record) => record.region === region && record.leadDays <= REFERENCE_LEADS)
    .map((record) => Math.abs(forecastError(record, variable)));
  const threshold = round(Math.max(MIN_BUST_ERROR[variable], percentile(errors, 0.9)));
  thresholdCache.set(key, threshold);
  return threshold;
}

export function isBust(record: ForecastObservation, variable: EvaluatedVariable) {
  return Math.abs(forecastError(record, variable)) >= bustThreshold(record.region, variable);
}

const bustFlags = new Map<EvaluatedVariable, { absErrors: Float64Array; busts: Uint8Array }>();

export function recordOutcomes(variable: EvaluatedVariable) {
  let outcomes = bustFlags.get(variable);
  if (!outcomes) {
    const absErrors = Float64Array.from(ALIGNED_RECORDS, (record) => Math.abs(forecastError(record, variable)));
    const busts = Uint8Array.from(ALIGNED_RECORDS, (record, i) => (absErrors[i] >= bustThreshold(record.region, variable) ? 1 : 0));
    outcomes = { absErrors, busts };
    bustFlags.set(variable, outcomes);
  }
  return outcomes;
}
