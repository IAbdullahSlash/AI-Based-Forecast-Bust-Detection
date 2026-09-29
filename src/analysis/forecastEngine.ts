import type {
  Confidence, ConfidenceByDay, ErrorProneRegion, EvaluatedVariable, ForecastFingerprint,
  HistoricalAnalogue, LeadErrorPoint, ReasonItem, RegionalData, SummaryStats,
} from '../types/index.ts';
import { EVENT_PROFILES, REGION_CLIMATOLOGY, STATE_POSITIONS } from '../data/regions.ts';
import { getFingerprint } from '../data/scenario.ts';
import { ALIGNED_RECORDS, bustThreshold, calculateErrorMetrics, clamp, forecastError, recordOutcomes, round } from './metrics.ts';
import { predictBust } from './model.ts';

export { alignForecastsAndObservations, calculateErrorMetrics } from './metrics.ts';
export { getModelMetrics } from './model.ts';
export { getActiveSystems, SCENARIO } from '../data/scenario.ts';

export const DAYS = Array.from({ length: 10 }, (_, i) => i + 1);
export const UNITS: Record<EvaluatedVariable, string> = { rainfall: 'mm', temperature: '°C' };
const ANALOGUE_COUNT = 7;
/** Blend weights: trained model vs. nearest-neighbour analogue bust rate. */
const ML_WEIGHT = 0.6;

export function confidenceFor(bustProbability: number): Confidence {
  if (bustProbability >= 40) return 'low';
  if (bustProbability >= 20) return 'medium';
  return 'high';
}

function forecastValue(fingerprint: ForecastFingerprint, variable: EvaluatedVariable) {
  return variable === 'rainfall' ? fingerprint.rainfall : fingerprint.temperature;
}

// ---------------------------------------------------------------------------
// Analogue retrieval (k-nearest neighbours over forecast-time predictors)
// ---------------------------------------------------------------------------

interface ScoredAnalogue { analogue: HistoricalAnalogue; bust: boolean }

const analogueCache = new Map<string, ScoredAnalogue[]>();

function scoredAnalogues(region: string, day: number, variable: EvaluatedVariable): ScoredAnalogue[] {
  const key = `${region}|${day}|${variable}`;
  const cached = analogueCache.get(key);
  if (cached) return cached;

  const current = getFingerprint(region, day);
  const climate = REGION_CLIMATOLOGY[region];
  const { absErrors } = recordOutcomes(variable);
  const result = ALIGNED_RECORDS
    .map((record, index) => ({ record, index }))
    .filter(({ record }) => Math.abs(record.leadDays - day) <= 1)
    .map(({ record, index }) => {
      const recordClimate = REGION_CLIMATOLOGY[record.region];
      const distance =
        Math.abs(Math.log1p(current.rainfall) - Math.log1p(record.rainfallForecast)) * 0.9 +
        Math.abs((current.temperature - climate.temperature) - (record.temperatureForecast - recordClimate.temperature)) / 3 +
        Math.abs(current.windSpeed - record.windSpeed) / 15 +
        Math.abs((current.pressure - climate.pressure) - (record.pressure - recordClimate.pressure)) / 6 +
        Math.abs(Math.abs(current.pressureTendency) - Math.abs(record.pressureTendency)) / 3 +
        Math.abs(record.leadDays - day) * 0.3 +
        (record.eventType === current.eventType ? 0 : 1.5) +
        (record.region === region ? 0 : 0.25);
      const error = absErrors[index];
      const threshold = bustThreshold(record.region, variable);
      const bustStatus: HistoricalAnalogue['bustStatus'] =
        error >= threshold ? 'Forecast Bust' : error >= threshold * 0.7 ? 'Large Error' : 'Normal';
      return {
        analogue: {
          eventType: record.eventType,
          region: record.region,
          date: record.validAt,
          leadDays: record.leadDays,
          similarity: Math.round(clamp(100 * Math.exp(-distance / 3), 1, 99)),
          forecastError: variable === 'rainfall' ? Math.round(error) : round(error),
          bustStatus,
        },
        bust: bustStatus === 'Forecast Bust',
      };
    })
    .sort((a, b) => b.analogue.similarity - a.analogue.similarity)
    // One entry per historical event: its best-matching lead time.
    .filter(function firstPerEvent(this: Set<string>, item) {
      const event = `${item.analogue.region}|${item.analogue.date}`;
      if (this.has(event)) return false;
      this.add(event);
      return true;
    }, new Set<string>())
    .slice(0, ANALOGUE_COUNT);
  analogueCache.set(key, result);
  return result;
}

export function getAnalogueData(region: string, day = 5, variable: EvaluatedVariable = 'rainfall'): HistoricalAnalogue[] {
  return scoredAnalogues(region, day, variable).map((item) => item.analogue);
}

// ---------------------------------------------------------------------------
// Historical error behaviour by lead time
// ---------------------------------------------------------------------------

const leadCurveCache = new Map<string, LeadErrorPoint[]>();

export function getLeadErrorCurve(region: string, variable: EvaluatedVariable = 'rainfall'): LeadErrorPoint[] {
  const key = `${region}|${variable}`;
  const cached = leadCurveCache.get(key);
  if (cached) return cached;
  const threshold = bustThreshold(region, variable);
  const regional = ALIGNED_RECORDS.filter((record) => record.region === region);
  const curve = Array.from({ length: 10 }, (_, i) => {
    const records = regional.filter((record) => record.leadDays === i + 1);
    const errors = records.map((record) => Math.abs(forecastError(record, variable)));
    return {
      leadDays: i + 1,
      mae: round(errors.reduce((sum, value) => sum + value, 0) / Math.max(errors.length, 1)),
      bustRate: Math.round((errors.filter((error) => error >= threshold).length / Math.max(errors.length, 1)) * 100),
    };
  });
  leadCurveCache.set(key, curve);
  return curve;
}

// ---------------------------------------------------------------------------
// Explainability: rule-based meteorological reasons
// ---------------------------------------------------------------------------

function rainfallCategory(mm: number) {
  // IMD 24 h rainfall intensity categories.
  if (mm >= 204.5) return 'extremely heavy';
  if (mm >= 115.6) return 'very heavy';
  if (mm >= 64.5) return 'heavy';
  return null;
}

function meteorologicalReasons(
  region: string, day: number, variable: EvaluatedVariable, fingerprint: ForecastFingerprint,
  analogues: ScoredAnalogue[], curve: LeadErrorPoint[],
): ReasonItem[] {
  const reasons: ReasonItem[] = [];
  const climate = REGION_CLIMATOLOGY[region];
  const unit = UNITS[variable];

  if (fingerprint.systemName) {
    reasons.push({
      kind: 'system',
      text: `${fingerprint.systemName} influencing the region (intensity ${Math.round(fingerprint.systemIntensity * 100)}%): ${EVENT_PROFILES[fingerprint.eventType].description}.`,
    });
  } else {
    reasons.push({ kind: 'system', text: 'No organised weather system forecast; regime is stable, which historically favours skill.' });
  }

  if (Math.abs(fingerprint.pressureTendency) >= 2.5) {
    reasons.push({
      kind: 'dynamics',
      text: `Rapidly evolving pattern: forecast surface pressure changes ${fingerprint.pressureTendency > 0 ? '+' : ''}${fingerprint.pressureTendency} hPa/day.`,
    });
  }
  const pressureAnomaly = round(fingerprint.pressure - climate.pressure);
  if (pressureAnomaly <= -6) {
    reasons.push({ kind: 'dynamics', text: `Deep low pressure: ${fingerprint.pressure} hPa, ${Math.abs(pressureAnomaly)} hPa below the June normal.` });
  }

  const category = rainfallCategory(fingerprint.rainfall);
  if (category) {
    reasons.push({ kind: 'intensity', text: `Forecast rainfall ${fingerprint.rainfall} mm/24 h falls in the IMD "${category}" category, where amounts are hardest to pin down.` });
  }
  const temperatureAnomaly = round(fingerprint.temperature - climate.temperature);
  if (fingerprint.temperature >= 40 && temperatureAnomaly >= 4.5) {
    reasons.push({ kind: 'intensity', text: `Heat-wave criteria met: Tmax ${fingerprint.temperature} °C, +${temperatureAnomaly} °C above normal; models tend to under-forecast such peaks.` });
  }
  if (fingerprint.windSpeed >= 45) {
    reasons.push({ kind: 'intensity', text: `Strong winds of ${fingerprint.windSpeed} km/h indicate a vigorous, fast-changing circulation.` });
  }

  const dayOne = curve[0];
  const current = curve[day - 1];
  if (day >= 4 && current && dayOne && current.mae > dayOne.mae * 1.3) {
    reasons.push({
      kind: 'lead',
      text: `Day ${day} lead time: historical ${variable} MAE here grows from ${dayOne.mae} ${unit} at Day 1 to ${current.mae} ${unit}; bust rate ${dayOne.bustRate}% → ${current.bustRate}%.`,
    });
  }

  const busts = analogues.filter((item) => item.bust).length;
  const closest = analogues[0]?.analogue;
  if (closest) {
    reasons.push({
      kind: 'analogue',
      text: `${busts} of ${analogues.length} closest historical analogues were forecast busts; closest: ${closest.eventType}, ${closest.region} ${closest.date} (${closest.similarity}% similar, ${closest.forecastError} ${unit} error).`,
    });
  }
  return reasons;
}

// ---------------------------------------------------------------------------
// Regional result
// ---------------------------------------------------------------------------

const regionCache = new Map<string, RegionalData>();

export function getRegionData(region: string, day = 5, variable: EvaluatedVariable = 'rainfall'): RegionalData {
  const key = `${region}|${day}|${variable}`;
  const cached = regionCache.get(key);
  if (cached) return cached;

  const fingerprint = getFingerprint(region, day);
  const analogues = scoredAnalogues(region, day, variable);
  const curve = getLeadErrorCurve(region, variable);
  const threshold = bustThreshold(region, variable);

  const similarityTotal = analogues.reduce((sum, item) => sum + item.analogue.similarity, 0) || 1;
  const analogueProbability = analogues.reduce((sum, item) => sum + (item.bust ? item.analogue.similarity : 0), 0) / similarityTotal;
  const { probability: mlProbability, drivers } = predictBust(variable, {
    region, leadDays: day, eventType: fingerprint.eventType, rainfall: fingerprint.rainfall,
    temperature: fingerprint.temperature, windSpeed: fingerprint.windSpeed,
    pressure: fingerprint.pressure, pressureTendency: fingerprint.pressureTendency,
  });
  const bustProbability = Math.round(clamp((ML_WEIGHT * mlProbability + (1 - ML_WEIGHT) * analogueProbability) * 100, 2, 97));

  const reasons = meteorologicalReasons(region, day, variable, fingerprint, analogues, curve);
  if (drivers.length) {
    reasons.push({
      kind: 'model',
      text: `ML model drivers: ${drivers.map((driver) => `${driver.contribution > 0 ? '↑' : '↓'} ${driver.feature}`).join(', ')}.`,
    });
  }

  const regionalAtLead = ALIGNED_RECORDS.filter((record) => record.region === region && record.leadDays === day);
  const data: RegionalData = {
    region,
    variable,
    unit: UNITS[variable],
    forecastValue: forecastValue(fingerprint, variable),
    bustProbability,
    mlProbability: Math.round(mlProbability * 100),
    analogueProbability: Math.round(analogueProbability * 100),
    confidence: confidenceFor(bustProbability),
    historicalMeanError: calculateErrorMetrics(regionalAtLead, variable).mae,
    bustThreshold: threshold,
    similarCases: ALIGNED_RECORDS.filter((record) => record.eventType === fingerprint.eventType && Math.abs(record.leadDays - day) <= 1).length,
    casesWithLargeError: analogues.filter((item) => item.analogue.bustStatus !== 'Normal').length,
    historicalBustFrequency: curve[day - 1]?.bustRate ?? 0,
    fingerprint,
    reasons,
    keyReasons: reasons.map((reason) => reason.text),
    mlDrivers: drivers,
  };
  regionCache.set(key, data);
  return data;
}

export function getExplanation(region: string, day = 5, variable: EvaluatedVariable = 'rainfall') {
  const data = getRegionData(region, day, variable);
  const system = data.fingerprint.systemName
    ? `${data.fingerprint.systemName} (${data.fingerprint.eventType.toLowerCase()})`
    : 'a stable fair-weather regime';
  return `Day ${day} ${variable} confidence for ${region} is ${data.confidence.toUpperCase()} (${data.bustProbability}% bust probability). ` +
    `The forecast is dominated by ${system}. The trained bust model gives ${data.mlProbability}% and the ${ANALOGUE_COUNT} most similar ` +
    `historical cases give ${data.analogueProbability}%; the blend is ${Math.round(ML_WEIGHT * 100)}/${Math.round((1 - ML_WEIGHT) * 100)}. ` +
    `A bust here means an absolute error ≥ ${data.bustThreshold} ${data.unit} (P90 of this region's Day 1–3 errors). This is a transparent calculation, not an LLM prediction.`;
}

// ---------------------------------------------------------------------------
// Map, heatmap and error-prone area views
// ---------------------------------------------------------------------------

const byDayCache = new Map<EvaluatedVariable, ConfidenceByDay>();

export function getConfidenceByDay(variable: EvaluatedVariable = 'rainfall'): ConfidenceByDay {
  const cached = byDayCache.get(variable);
  if (cached) return cached;
  const output: ConfidenceByDay = {};
  for (const day of DAYS) {
    output[day] = {};
    for (const state of STATE_POSITIONS) {
      const data = getRegionData(state.name, day, variable);
      output[day][state.name] = {
        confidence: data.confidence,
        bustProbability: data.bustProbability,
        forecastValue: data.forecastValue,
      };
    }
  }
  byDayCache.set(variable, output);
  return output;
}

export function getSummaryStats(day = 5, variable: EvaluatedVariable = 'rainfall'): SummaryStats {
  const records = STATE_POSITIONS.map((state) => getRegionData(state.name, day, variable));
  return {
    regionsAnalyzed: records.length,
    highConfidence: records.filter((record) => record.confidence === 'high').length,
    mediumConfidence: records.filter((record) => record.confidence === 'medium').length,
    lowConfidence: records.filter((record) => record.confidence === 'low').length,
  };
}

/** Regions where the model forecast is likely unreliable at one or more lead times. */
export function getErrorProneRegions(variable: EvaluatedVariable = 'rainfall'): ErrorProneRegion[] {
  return STATE_POSITIONS
    .map((state) => {
      const days = DAYS.map((day) => getRegionData(state.name, day, variable));
      const peak = days.reduce((best, data, i) => (data.bustProbability > days[best].bustProbability ? i : best), 0);
      const peakData = days[peak];
      return {
        region: state.name,
        lowConfidenceDays: DAYS.filter((_, i) => days[i].confidence === 'low'),
        peakDay: peak + 1,
        peakProbability: peakData.bustProbability,
        driver: peakData.fingerprint.systemName ?? (peak + 1 >= 7 ? 'Long lead-time error growth' : 'Regional error history'),
      };
    })
    .filter((region) => region.lowConfidenceDays.length > 0)
    .sort((a, b) => b.lowConfidenceDays.length - a.lowConfidenceDays.length || b.peakProbability - a.peakProbability);
}
