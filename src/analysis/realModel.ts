import { getRealVerification, type RealPair } from './verification.ts';
import { getTempVerification, type TempPair } from './tempVerification.ts';

// Bust models trained on REAL NCMRWF S2S forecasts verified against IMD
// (rainfall and maximum temperature). Evaluated with leave-one-run-out
// cross-validation: each run's probabilities come from a model fitted on the
// other runs only, so case-study predictions are genuinely out of sample.
// Features use forecast-time information only.

/** Steep terrain where grid-scale models under-resolve orographic rain (a priori). */
export const OROGRAPHIC = new Set([
  'Meghalaya', 'Sikkim', 'Arunachal Pradesh', 'Kerala', 'Karnataka', 'Goa', 'Uttarakhand', 'Himachal Pradesh', 'Jammu & Kashmir',
]);

export const REAL_FEATURES = [
  'Forecast rainfall (log)',
  'Forecast vs observed P95',
  'Pressure anomaly (forecast low)',
  'Pressure change (|hPa/day|)',
  'Steep terrain',
  'Lead day',
];

function rainFeatures(pair: RealPair): number[] {
  const p95Ratio = pair.observedP95 ? Math.min(3, pair.forecast / Math.max(pair.observedP95, 1)) : 0;
  return [
    Math.log1p(Math.max(0, pair.forecast)),
    p95Ratio,
    -(pair.mslpAnomaly ?? 0),               // positive = deeper-than-normal low
    Math.abs(pair.pressureTendency ?? 0),
    OROGRAPHIC.has(pair.region) ? 1 : 0,
    pair.leadDay,
  ];
}

export const TEMP_FEATURES = [
  'Forecast far from IMD normal (|°C|)',
  'Forecast change (|°C/day|)',
  'Rain forecast (log)',
  'Pressure far from model normal (|hPa|)',
  'Lead day',
];

function tempFeatures(pair: TempPair): number[] {
  return [
    // Magnitudes, not signs: busts come from forecasts that stray far from normal in
    // either direction, and the direction flips between runs (too hot in July 2015).
    pair.normal === null ? 0 : Math.abs(pair.forecast - pair.normal),
    Math.abs(pair.forecastChange ?? 0),
    Math.log1p(Math.max(0, pair.rainForecast)),
    Math.abs(pair.mslpAnomaly ?? 0),
    pair.leadDay,
  ];
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

interface Fitted { weights: number[]; bias: number; mean: number[]; std: number[]; baseRate: number }
interface Sample { initDate: string; bust: boolean }

function fit(rows: number[][], labels: number[]): Fitted {
  const width = rows[0]?.length ?? 0;
  const mean = Array.from({ length: width }, (_, i) => rows.reduce((s, r) => s + r[i], 0) / rows.length);
  const std = Array.from({ length: width }, (_, i) => Math.sqrt(rows.reduce((s, r) => s + (r[i] - mean[i]) ** 2, 0) / rows.length) || 1);
  const x = rows.map((row) => row.map((value, i) => (value - mean[i]) / std[i]));
  const weights = new Array(width).fill(0);
  let bias = 0;
  const l2 = 0.02; // stronger regularisation: the real sample is small
  for (let iteration = 0; iteration < 300; iteration += 1) {
    const gradient = new Array(width).fill(0);
    let biasGradient = 0;
    x.forEach((row, n) => {
      const error = sigmoid(bias + row.reduce((s, v, i) => s + v * weights[i], 0)) - labels[n];
      biasGradient += error;
      row.forEach((v, i) => { gradient[i] += error * v; });
    });
    for (let i = 0; i < width; i += 1) weights[i] -= 0.8 * (gradient[i] / x.length + l2 * weights[i]);
    bias -= 0.8 * biasGradient / x.length;
  }
  return { weights, bias, mean, std, baseRate: labels.reduce((s, v) => s + v, 0) / labels.length };
}

function predict(model: Fitted, row: number[]) {
  const z = row.map((value, i) => (value - model.mean[i]) / model.std[i]);
  const contributions = z.map((value, i) => value * model.weights[i]);
  return { probability: sigmoid(model.bias + contributions.reduce((s, v) => s + v, 0)), contributions };
}

export function auc(scores: number[], labels: number[]) {
  const ranked = scores.map((score, i) => ({ score, label: labels[i] })).sort((a, b) => a.score - b.score);
  let rankSum = 0; let positives = 0;
  // Average ranks for ties so coarse scores (e.g. rule points) are scored fairly.
  let i = 0;
  while (i < ranked.length) {
    let j = i;
    while (j + 1 < ranked.length && ranked[j + 1].score === ranked[i].score) j += 1;
    const averageRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k += 1) if (ranked[k].label) { rankSum += averageRank; positives += 1; }
    i = j + 1;
  }
  const negatives = ranked.length - positives;
  return positives && negatives ? (rankSum - (positives * (positives + 1)) / 2) / (positives * negatives) : 0.5;
}

export interface RealModelResult<T = RealPair> {
  variable: 'rainfall' | 'temperature';
  runs: string[];
  pairs: number;
  busts: number;
  auc: number;
  brier: number;
  climatologyBrier: number;
  baselineAuc: number;          // single naive predictor (rain amount / forecast Tmax anomaly)
  baselineLabel: string;
  byRun: { run: string; auc: number; busts: number }[];
  drivers: { feature: string; weight: number }[];
  featureNames: string[];
  outOfFold: Map<T, { probability: number; contributions: number[] }>;
}

function crossValidate<T extends Sample>(
  variable: RealModelResult['variable'], pairs: T[], features: (pair: T) => number[], featureNames: string[],
  baseline: (pair: T) => number, baselineLabel: string,
): RealModelResult<T> {
  const runs = [...new Set(pairs.map((pair) => pair.initDate))].sort();
  const outOfFold = new Map<T, { probability: number; contributions: number[] }>();
  let brier = 0; let climatologyBrier = 0;
  const byRun = runs.map((run) => {
    const train = pairs.filter((pair) => pair.initDate !== run);
    const test = pairs.filter((pair) => pair.initDate === run);
    const model = fit(train.map(features), train.map((pair) => (pair.bust ? 1 : 0)));
    const scores = test.map((pair) => {
      const prediction = predict(model, features(pair));
      outOfFold.set(pair, prediction);
      brier += (prediction.probability - (pair.bust ? 1 : 0)) ** 2;
      climatologyBrier += (model.baseRate - (pair.bust ? 1 : 0)) ** 2;
      return prediction.probability;
    });
    return { run, auc: Math.round(auc(scores, test.map((pair) => (pair.bust ? 1 : 0))) * 100) / 100, busts: test.filter((pair) => pair.bust).length };
  });
  const labels = pairs.map((pair) => (pair.bust ? 1 : 0));
  const full = fit(pairs.map(features), labels);
  return {
    variable,
    runs,
    pairs: pairs.length,
    busts: labels.reduce((s, v) => s + v, 0),
    auc: Math.round(auc(pairs.map((pair) => outOfFold.get(pair)!.probability), labels) * 1000) / 1000,
    brier: Math.round((brier / pairs.length) * 1000) / 1000,
    climatologyBrier: Math.round((climatologyBrier / pairs.length) * 1000) / 1000,
    baselineAuc: Math.round(auc(pairs.map(baseline), labels) * 1000) / 1000,
    baselineLabel,
    byRun,
    drivers: featureNames.map((feature, i) => ({ feature, weight: Math.round(full.weights[i] * 100) / 100 }))
      .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)),
    featureNames,
    outOfFold,
  };
}

let rainModel: RealModelResult<RealPair> | null = null;
let tempModel: RealModelResult<TempPair> | null = null;

export function getRealModel(): RealModelResult<RealPair> {
  rainModel ??= crossValidate('rainfall', getRealVerification().pairs, rainFeatures, REAL_FEATURES,
    (pair) => pair.forecast, 'Forecast rainfall alone');
  return rainModel;
}

export function getRealTempModel(): RealModelResult<TempPair> {
  tempModel ??= crossValidate('temperature', getTempVerification().pairs, tempFeatures, TEMP_FEATURES,
    (pair) => Math.abs(pair.normal === null ? 0 : pair.forecast - pair.normal), 'Forecast anomaly alone');
  return tempModel;
}
