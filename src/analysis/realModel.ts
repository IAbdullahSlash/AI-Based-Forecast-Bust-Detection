import { getRealVerification, type RealPair } from './verification.ts';

// Bust model trained on REAL NCMRWF S2S forecasts verified against IMD.
// Evaluated with leave-one-run-out cross-validation: each run's probabilities
// come from a model fitted on the other runs only, so case-study predictions are
// genuinely out of sample. Features use forecast-time information only.

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

function features(pair: RealPair): number[] {
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

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

interface Fitted { weights: number[]; bias: number; mean: number[]; std: number[]; baseRate: number }

function fit(pairs: RealPair[]): Fitted {
  const rows = pairs.map(features);
  const labels = pairs.map((pair) => (pair.bust ? 1 : 0));
  const width = REAL_FEATURES.length;
  const mean = Array.from({ length: width }, (_, i) => rows.reduce((s, r) => s + r[i], 0) / rows.length);
  const std = Array.from({ length: width }, (_, i) => Math.sqrt(rows.reduce((s, r) => s + (r[i] - mean[i]) ** 2, 0) / rows.length) || 1);
  const x = rows.map((row) => row.map((value, i) => (value - mean[i]) / std[i]));
  const weights = new Array(width).fill(0);
  let bias = 0;
  const l2 = 0.02; // stronger regularisation: the real sample is small
  for (let iteration = 0; iteration < 600; iteration += 1) {
    const gradient = new Array(width).fill(0);
    let biasGradient = 0;
    x.forEach((row, n) => {
      const error = sigmoid(bias + row.reduce((s, v, i) => s + v * weights[i], 0)) - labels[n];
      biasGradient += error;
      row.forEach((v, i) => { gradient[i] += error * v; });
    });
    for (let i = 0; i < width; i += 1) weights[i] -= 0.4 * (gradient[i] / x.length + l2 * weights[i]);
    bias -= 0.4 * biasGradient / x.length;
  }
  return { weights, bias, mean, std, baseRate: labels.reduce((s, v) => s + v, 0) / labels.length };
}

function predict(model: Fitted, pair: RealPair) {
  const row = features(pair).map((value, i) => (value - model.mean[i]) / model.std[i]);
  const contributions = row.map((value, i) => value * model.weights[i]);
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

export interface RealModelResult {
  runs: string[];
  pairs: number;
  busts: number;
  auc: number;
  brier: number;
  climatologyBrier: number;
  baselineAuc: number;          // forecast rainfall amount alone
  byRun: { run: string; auc: number; busts: number }[];
  drivers: { feature: string; weight: number }[];
  outOfFold: Map<RealPair, { probability: number; contributions: number[] }>;
}

let cached: RealModelResult | null = null;

export function getRealModel(): RealModelResult {
  if (cached) return cached;
  const pairs = getRealVerification().pairs;
  const runs = [...new Set(pairs.map((pair) => pair.initDate))].sort();
  const outOfFold = new Map<RealPair, { probability: number; contributions: number[] }>();
  let brier = 0; let climatologyBrier = 0;
  const byRun = runs.map((run) => {
    const train = pairs.filter((pair) => pair.initDate !== run);
    const test = pairs.filter((pair) => pair.initDate === run);
    const model = fit(train);
    const scores = test.map((pair) => {
      const prediction = predict(model, pair);
      outOfFold.set(pair, prediction);
      brier += (prediction.probability - (pair.bust ? 1 : 0)) ** 2;
      climatologyBrier += (model.baseRate - (pair.bust ? 1 : 0)) ** 2;
      return prediction.probability;
    });
    return { run, auc: Math.round(auc(scores, test.map((pair) => (pair.bust ? 1 : 0))) * 100) / 100, busts: test.filter((pair) => pair.bust).length };
  });
  const labels = pairs.map((pair) => (pair.bust ? 1 : 0));
  const full = fit(pairs);
  cached = {
    runs,
    pairs: pairs.length,
    busts: labels.reduce((s, v) => s + v, 0),
    auc: Math.round(auc(pairs.map((pair) => outOfFold.get(pair)!.probability), labels) * 1000) / 1000,
    brier: Math.round((brier / pairs.length) * 1000) / 1000,
    climatologyBrier: Math.round((climatologyBrier / pairs.length) * 1000) / 1000,
    baselineAuc: Math.round(auc(pairs.map((pair) => pair.forecast), labels) * 1000) / 1000,
    byRun,
    drivers: REAL_FEATURES.map((feature, i) => ({ feature, weight: Math.round(full.weights[i] * 100) / 100 }))
      .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)),
    outOfFold,
  };
  return cached;
}
