import {
  Confidence, ConfidenceByDay, ErrorMetrics, ForecastObservation,
  HistoricalAnalogue, RegionalData, SummaryStats,
} from '../types';
import { DEMO_FORECAST_OBSERVATIONS } from '../data/demoDataset';
import { STATE_POSITIONS } from '../data/mockData';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value * 10) / 10;

function percentile(values: number[], p: number) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

export function alignForecastsAndObservations(records = DEMO_FORECAST_OBSERVATIONS) {
  // Each local record already contains the matched forecast/observation pair.
  // This one clear boundary is where an API or CSV join belongs later.
  return records.filter((record) => record.forecastIssuedAt < record.validAt && record.leadDays > 0);
}

export function calculateErrorMetrics(records: ForecastObservation[]): ErrorMetrics {
  const errors = records.map((record) => record.rainfallForecast - record.rainfallObserved);
  const absoluteErrors = errors.map(Math.abs);
  const size = Math.max(records.length, 1);
  return {
    mae: round(absoluteErrors.reduce((sum, value) => sum + value, 0) / size),
    rmse: round(Math.sqrt(errors.reduce((sum, value) => sum + value * value, 0) / size)),
    bias: round(errors.reduce((sum, value) => sum + value, 0) / size),
    bustThreshold: round(percentile(absoluteErrors, 0.9)),
  };
}

function recordsFor(region: string) {
  const regional = alignForecastsAndObservations().filter((record) => record.region === region);
  return regional.length >= 3 ? regional : alignForecastsAndObservations();
}

function currentFingerprint(region: string, day: number) {
  const index = Math.max(0, STATE_POSITIONS.findIndex((state) => state.name === region));
  const seasonalWave = Math.sin((index + 2) * 1.71 + day * 0.63);
  return {
    rainfall: Math.round(clamp(48 + index * 1.9 + day * 3.2 + seasonalWave * 28, 12, 165)),
    temperature: round(clamp(31 - index * 0.12 + Math.cos(day + index) * 2.2, 20, 35)),
    windSpeed: round(clamp(18 + (index % 6) * 2.4 + Math.sin(day * 0.9 + index) * 6, 6, 42)),
    pressure: Math.round(1007 - (index % 5) * 1.7 + Math.cos(day + index * 0.4) * 4),
  };
}

function similarity(current: ReturnType<typeof currentFingerprint>, record: ForecastObservation) {
  const rainfallDistance = Math.abs(current.rainfall - record.rainfallForecast) / 130;
  const temperatureDistance = Math.abs(current.temperature - record.temperature) / 12;
  const windDistance = Math.abs(current.windSpeed - record.windSpeed) / 35;
  const pressureDistance = Math.abs(current.pressure - record.pressure) / 18;
  return Math.round(clamp(100 * (1 - (rainfallDistance * 0.5 + temperatureDistance * 0.15 + windDistance * 0.2 + pressureDistance * 0.15)), 5, 99));
}

function status(error: number, threshold: number): HistoricalAnalogue['bustStatus'] {
  if (error >= threshold) return 'Forecast Bust';
  if (error >= threshold * 0.7) return 'Large Error';
  return 'Normal';
}

export function getAnalogueData(region: string, day = 5): HistoricalAnalogue[] {
  const records = recordsFor(region);
  const metrics = calculateErrorMetrics(records);
  const current = currentFingerprint(region, day);
  return records
    .map((record) => {
      const forecastError = Math.round(Math.abs(record.rainfallForecast - record.rainfallObserved));
      return {
        eventType: record.eventType,
        region: record.region,
        date: record.validAt,
        similarity: similarity(current, record),
        forecastError,
        bustStatus: status(forecastError, metrics.bustThreshold),
      };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);
}

export function getRegionData(region: string, day = 5): RegionalData {
  const records = recordsFor(region);
  const metrics = calculateErrorMetrics(records);
  const analogues = getAnalogueData(region, day);
  const busts = analogues.filter((item) => item.bustStatus === 'Forecast Bust').length;
  const largeErrors = analogues.filter((item) => item.bustStatus !== 'Normal').length;
  const analogueBustRate = busts / Math.max(analogues.length, 1);
  const errorRisk = clamp(metrics.mae / Math.max(metrics.bustThreshold, 1), 0, 1);
  const intensityRisk = clamp(currentFingerprint(region, day).rainfall / 150, 0, 1);
  const bustProbability = Math.round(clamp((analogueBustRate * 0.55 + errorRisk * 0.25 + intensityRisk * 0.2) * 100, 5, 95));
  const confidence: Confidence = bustProbability > 60 ? 'low' : bustProbability >= 40 ? 'medium' : 'high';
  const fingerprint = currentFingerprint(region, day);
  const closest = analogues[0];

  return {
    region,
    forecastValue: fingerprint.rainfall,
    bustProbability,
    confidence,
    historicalMeanError: metrics.mae,
    similarCases: records.length,
    casesWithLargeError: largeErrors,
    historicalBustFrequency: Math.round(analogueBustRate * 100),
    keyReasons: [
      `P90 regional absolute-error threshold: ${metrics.bustThreshold} mm`,
      `${busts} of ${analogues.length} closest analogue cases were historical busts`,
      `Closest match: ${closest.eventType} (${closest.similarity}% similarity, ${closest.forecastError} mm error)`,
      `Current rainfall fingerprint: ${fingerprint.rainfall} mm for Day ${day}`,
    ],
  };
}

export function getExplanation(region: string, day = 5) {
  const data = getRegionData(region, day);
  const analogue = getAnalogueData(region, day)[0];
  return `This ${data.confidence}-confidence result is calculated from local paired forecast/observation records. ` +
    `For Day ${day}, ${data.historicalBustFrequency}% of the closest historical analogues crossed the regional P90 error threshold. ` +
    `The closest case was a ${analogue.eventType} (${analogue.similarity}% similar) with ${analogue.forecastError} mm absolute error. ` +
    `The displayed ${data.bustProbability}% probability is a transparent combination of analogue bust rate, historical MAE, and forecast intensity—not an LLM prediction.`;
}

export function getConfidenceByDay(): ConfidenceByDay {
  const output: ConfidenceByDay = {};
  for (let day = 1; day <= 10; day += 1) {
    output[day] = {};
    for (const state of STATE_POSITIONS) {
      const data = getRegionData(state.name, day);
      output[day][state.name] = {
        confidence: data.confidence,
        bustProbability: data.bustProbability,
        forecastValue: data.forecastValue,
      };
    }
  }
  return output;
}

export function getSummaryStats(day = 5): SummaryStats {
  const records = STATE_POSITIONS.map((state) => getRegionData(state.name, day));
  return {
    regionsAnalyzed: records.length,
    highConfidence: records.filter((record) => record.confidence === 'high').length,
    mediumConfidence: records.filter((record) => record.confidence === 'medium').length,
    lowConfidence: records.filter((record) => record.confidence === 'low').length,
  };
}
