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
