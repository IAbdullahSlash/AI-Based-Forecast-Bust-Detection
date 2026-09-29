import type { EvaluatedVariable, EventType, ModelDriver, ModelMetrics } from '../types/index.ts';
import { EVENT_TYPES, REGION_CLIMATOLOGY } from '../data/regions.ts';
import { HINDCAST_YEARS } from '../data/demoDataset.ts';
import { ALIGNED_RECORDS, recordOutcomes } from './metrics.ts';

// L2-regularised logistic regression that learns P(bust) from forecast-time
// predictors. Trained in-process on the hindcast archive; the latest year is
// held out for verification. Small and dependency-free on purpose: the
// coefficients are directly interpretable as meteorological drivers.

export interface ModelInput {
  region: string;
  leadDays: number;
  eventType: EventType;
  rainfall: number;
  temperature: number;
  windSpeed: number;
  pressure: number;
  pressureTendency: number;
}

const REGIME_FEATURES = EVENT_TYPES.filter((type) => type !== 'Fair weather');

export const FEATURE_NAMES = [
  'Forecast rainfall intensity',
  'Temperature anomaly',
  'Wind speed',
  'Pressure anomaly',
  'Pressure tendency (rate of change)',
  'Lead time',
  ...REGIME_FEATURES.map((type) => `${type} regime`),
];

function features(input: ModelInput): number[] {
  const climate = REGION_CLIMATOLOGY[input.region];
  return [
    Math.log1p(Math.max(0, input.rainfall)),
    input.temperature - (climate?.temperature ?? input.temperature),
    input.windSpeed,
    input.pressure - (climate?.pressure ?? input.pressure),
    Math.abs(input.pressureTendency),
    input.leadDays,
    ...REGIME_FEATURES.map((type) => (input.eventType === type ? 1 : 0)),
  ];
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

interface TrainedModel {
  weights: number[];
  bias: number;
  mean: number[];
  std: number[];
  metrics: ModelMetrics;
}

function standardise(row: number[], mean: number[], std: number[]) {
  return row.map((value, i) => (value - mean[i]) / std[i]);
}

function auc(scores: number[], labels: number[]) {
  const pairs = scores.map((score, i) => ({ score, label: labels[i] })).sort((a, b) => a.score - b.score);
  let rankSum = 0;
  let positives = 0;
  pairs.forEach((pair, i) => {
    if (pair.label) { rankSum += i + 1; positives += 1; }
  });
  const negatives = pairs.length - positives;
  if (!positives || !negatives) return 0.5;
  return (rankSum - (positives * (positives + 1)) / 2) / (positives * negatives);
}

function train(variable: EvaluatedVariable): TrainedModel {
  const testYear = HINDCAST_YEARS[HINDCAST_YEARS.length - 1];
  const { busts } = recordOutcomes(variable);
  const rows = ALIGNED_RECORDS.map((record, index) => ({
    x: features({
      region: record.region,
      leadDays: record.leadDays,
      eventType: record.eventType,
      rainfall: record.rainfallForecast,
      temperature: record.temperatureForecast,
      windSpeed: record.windSpeed,
      pressure: record.pressure,
      pressureTendency: record.pressureTendency,
    }),
    y: busts[index],
    test: record.validAt.startsWith(String(testYear)),
  }));
  const trainRows = rows.filter((row) => !row.test);
  const testRows = rows.filter((row) => row.test);

  const width = FEATURE_NAMES.length;
  const mean = Array.from({ length: width }, (_, i) => trainRows.reduce((sum, row) => sum + row.x[i], 0) / trainRows.length);
  const std = Array.from({ length: width }, (_, i) => {
    const variance = trainRows.reduce((sum, row) => sum + (row.x[i] - mean[i]) ** 2, 0) / trainRows.length;
    return Math.sqrt(variance) || 1;
  });
  const trainX = trainRows.map((row) => standardise(row.x, mean, std));

  const weights = new Array(width).fill(0);
  let bias = 0;
  const learningRate = 0.5;
  const l2 = 0.002;
  for (let iteration = 0; iteration < 400; iteration += 1) {
    const gradient = new Array(width).fill(0);
    let biasGradient = 0;
    trainX.forEach((x, n) => {
      const error = sigmoid(bias + x.reduce((sum, value, i) => sum + value * weights[i], 0)) - trainRows[n].y;
      biasGradient += error;
      for (let i = 0; i < width; i += 1) gradient[i] += error * x[i];
    });
    for (let i = 0; i < width; i += 1) {
      weights[i] -= learningRate * (gradient[i] / trainX.length + l2 * weights[i]);
    }
    bias -= learningRate * biasGradient / trainX.length;
  }

  const testScores = testRows.map((row) => sigmoid(bias + standardise(row.x, mean, std).reduce((sum, value, i) => sum + value * weights[i], 0)));
  const testLabels = testRows.map((row) => row.y);
  const baseRate = trainRows.reduce((sum, row) => sum + row.y, 0) / trainRows.length;
  const brier = testScores.reduce((sum, p, i) => sum + (p - testLabels[i]) ** 2, 0) / testScores.length;
  const climatologyBrier = testLabels.reduce((sum, y) => sum + (baseRate - y) ** 2, 0) / testLabels.length;
  const accuracy = testScores.filter((p, i) => (p >= 0.5 ? 1 : 0) === testLabels[i]).length / testScores.length;

  return {
    weights, bias, mean, std,
    metrics: {
      variable,
      trainSize: trainRows.length,
      testSize: testRows.length,
      testYear,
      baseRate: Math.round(baseRate * 1000) / 10,
      accuracy: Math.round(accuracy * 1000) / 10,
      auc: Math.round(auc(testScores, testLabels) * 1000) / 1000,
      brier: Math.round(brier * 1000) / 1000,
      climatologyBrier: Math.round(climatologyBrier * 1000) / 1000,
    },
  };
}

const models = new Map<EvaluatedVariable, TrainedModel>();

function model(variable: EvaluatedVariable) {
  let trained = models.get(variable);
  if (!trained) {
    trained = train(variable);
    models.set(variable, trained);
  }
  return trained;
}

export function predictBust(variable: EvaluatedVariable, input: ModelInput): { probability: number; drivers: ModelDriver[] } {
  const { weights, bias, mean, std } = model(variable);
  const x = standardise(features(input), mean, std);
  const contributions = x.map((value, i) => value * weights[i]);
  const probability = sigmoid(bias + contributions.reduce((sum, value) => sum + value, 0));
  const drivers = contributions
    .map((contribution, i) => ({ feature: FEATURE_NAMES[i], contribution: Math.round(contribution * 100) / 100 }))
    .filter((driver) => driver.contribution >= 0.1)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3);
  return { probability, drivers };
}

export function getModelMetrics(variable: EvaluatedVariable): ModelMetrics {
  return model(variable).metrics;
}
