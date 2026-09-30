export type Confidence = 'high' | 'medium' | 'low';
export type ForecastVariable = 'rainfall' | 'temperature' | 'wind' | 'pressure';
/** Variables backed by paired forecast/observation records in the engine. */
export type EvaluatedVariable = 'rainfall' | 'temperature';

export type EventType =
  | 'Cyclone'
  | 'Monsoon depression'
  | 'Western disturbance'
  | 'Heat wave'
  | 'Active monsoon'
  | 'Break monsoon'
  | 'Heavy rainfall'
  | 'Monsoon trough'
  | 'Fair weather';

export interface StatePosition {
  name: string;
  x: number;
  y: number;
  lat?: number;
  lng?: number;
}

export interface RegionClimatology {
  rainfall: number;
  temperature: number;
  windSpeed: number;
  pressure: number;
  events: Partial<Record<EventType, number>>;
}

export interface ForecastFingerprint {
  rainfall: number;
  temperature: number;
  windSpeed: number;
  pressure: number;
  /** Forecast pressure change from the previous day (hPa/day). */
  pressureTendency: number;
  eventType: EventType;
  systemName: string | null;
  systemIntensity: number;
}

export interface ReasonItem {
  kind: 'system' | 'dynamics' | 'intensity' | 'lead' | 'analogue' | 'model' | 'history';
  text: string;
}

export interface ModelDriver {
  feature: string;
  contribution: number;
}

export interface RegionalData {
  region: string;
  variable: EvaluatedVariable;
  unit: string;
  forecastValue: number;
  bustProbability: number;
  mlProbability: number;
  analogueProbability: number;
  confidence: Confidence;
  historicalMeanError: number;
  bustThreshold: number;
  similarCases: number;
  casesWithLargeError: number;
  historicalBustFrequency: number;
  fingerprint: ForecastFingerprint;
  reasons: ReasonItem[];
  keyReasons: string[];
  mlDrivers: ModelDriver[];
}

export interface HistoricalAnalogue {
  eventType: string;
  region: string;
  date: string;
  leadDays: number;
  similarity: number;
  forecastError: number;
  bustStatus: 'Large Error' | 'Normal' | 'Forecast Bust';
}

export interface ConfidenceByDay {
  [day: number]: {
    [region: string]: {
      confidence: Confidence;
      bustProbability: number;
      forecastValue: number;
    };
  };
}

export interface SummaryStats {
  regionsAnalyzed: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
}

export interface ForecastObservation {
  region: string;
  forecastIssuedAt: string;
  validAt: string;
  leadDays: number;
  eventType: EventType;
  rainfallForecast: number;
  rainfallObserved: number;
  temperatureForecast: number;
  temperatureObserved: number;
  windSpeed: number;
  pressure: number;
  pressureTendency: number;
}

export interface ErrorMetrics {
  mae: number;
  rmse: number;
  bias: number;
  bustThreshold: number;
}

export interface LeadErrorPoint {
  leadDays: number;
  mae: number;
  bustRate: number;
}

export interface ModelMetrics {
  variable: EvaluatedVariable;
  trainSize: number;
  testSize: number;
  testYear: number;
  baseRate: number;
  accuracy: number;
  auc: number;
  brier: number;
  climatologyBrier: number;
}

export interface ErrorProneRegion {
  region: string;
  lowConfidenceDays: number[];
  peakDay: number;
  peakProbability: number;
  driver: string;
}
