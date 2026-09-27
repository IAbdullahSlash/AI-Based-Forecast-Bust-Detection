export type Confidence = 'high' | 'medium' | 'low';
export type ForecastVariable = 'rainfall' | 'temperature' | 'wind' | 'pressure';

export interface StatePosition {
  name: string;
  x: number;
  y: number;
  lat?: number;
  lng?: number;
}

export interface RegionalData {
  region: string;
  forecastValue: number;
  bustProbability: number;
  confidence: Confidence;
  historicalMeanError: number;
  similarCases: number;
  casesWithLargeError: number;
  historicalBustFrequency: number;
  keyReasons: string[];
  unit?: string;
}

export interface HistoricalAnalogue {
  eventType: string;
  region: string;
  date: string;
  similarity: number;
  forecastError: number;
  bustStatus: 'Large Error' | 'Normal' | 'Forecast Bust';
  unit?: string;
}

export function getVariableUnit(variable: ForecastVariable): string {
  switch (variable) {
    case 'rainfall':
      return 'mm';
    case 'temperature':
      return '°C';
    case 'wind':
      return 'km/h';
    case 'pressure':
      return 'hPa';
    default:
      return '';
  }
}

export interface RegionFullData {
  regional: RegionalData;
  analogues: HistoricalAnalogue[];
  explanation: string;
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

export interface CaseStudyStep {
  stepIndex: number;
  title: string;
  timestamp: string;
  description: string;
  data: Record<string, any>;
}

export interface CaseStudy {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  targetRegion: string;
  variable: ForecastVariable;
  leadTimeDays: number;
  nwpForecastValue: number;
  observedValue: number;
  actualError: number;
  p90Threshold: number;
  bustProbability: number;
  confidence: Confidence;
  wasBust: boolean;
  topAnalogues: HistoricalAnalogue[];
  geminiMeteorologicalContext: string;
  verificationSummary: Record<string, any>;
  timelineSteps: CaseStudyStep[];
}

export interface EvaluationMetrics {
  precision: number;
  recall: number;
  f1Score: number;
  brierScore: number;
  detectionLeadTimeDays: number;
  sampleEventsCount: number;
  p90ThresholdSummary: Record<string, number>;
}

export interface BackendHealth {
  status: string;
  service: string;
  version: string;
  dataset: string;
  p90_bust_definition: string;
  analogues_count: number;
}

export type { WeatherData } from '../api/weatherApi';
