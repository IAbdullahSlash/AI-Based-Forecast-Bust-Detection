import {
  RegionalData,
  HistoricalAnalogue,
  ConfidenceByDay,
  SummaryStats,
  StatePosition,
  RegionFullData,
  Confidence,
} from '../types';

export const STATE_POSITIONS: StatePosition[] = [
  { name: 'Jammu & Kashmir', x: 420, y: 110, lat: 33.8, lng: 74.8 },
  { name: 'Himachal Pradesh', x: 470, y: 175, lat: 31.1, lng: 77.2 },
  { name: 'Punjab', x: 530, y: 230, lat: 30.7, lng: 75.8 },
  { name: 'Haryana', x: 570, y: 285, lat: 29.4, lng: 76.5 },
  { name: 'Uttarakhand', x: 505, y: 240, lat: 30.3, lng: 78.0 },
  { name: 'Uttar Pradesh', x: 600, y: 340, lat: 26.8, lng: 80.9 },
  { name: 'Bihar', x: 655, y: 395, lat: 25.1, lng: 85.3 },
  { name: 'Jharkhand', x: 675, y: 445, lat: 23.6, lng: 85.3 },
  { name: 'West Bengal', x: 730, y: 430, lat: 22.9, lng: 87.8 },
  { name: 'Sikkim', x: 705, y: 345, lat: 27.5, lng: 88.5 },
  { name: 'Arunachal Pradesh', x: 740, y: 250, lat: 27.1, lng: 93.6 },
  { name: 'Assam', x: 710, y: 380, lat: 26.1, lng: 92.9 },
  { name: 'Meghalaya', x: 695, y: 430, lat: 25.5, lng: 91.9 },
  { name: 'Odisha', x: 680, y: 495, lat: 20.5, lng: 85.8 },
  { name: 'Chhattisgarh', x: 600, y: 465, lat: 21.3, lng: 81.8 },
  { name: 'Madhya Pradesh', x: 530, y: 440, lat: 22.7, lng: 78.8 },
  { name: 'Rajasthan', x: 400, y: 325, lat: 26.9, lng: 73.9 },
  { name: 'Gujarat', x: 370, y: 345, lat: 22.3, lng: 70.8 },
  { name: 'Maharashtra', x: 445, y: 500, lat: 19.8, lng: 75.7 },
  { name: 'Goa', x: 415, y: 565, lat: 15.3, lng: 74.1 },
  { name: 'Karnataka', x: 485, y: 555, lat: 15.3, lng: 75.7 },
  { name: 'Kerala', x: 445, y: 645, lat: 10.0, lng: 76.3 },
  { name: 'Tamil Nadu', x: 565, y: 610, lat: 11.1, lng: 78.2 },
  { name: 'Andhra Pradesh', x: 615, y: 535, lat: 15.9, lng: 79.8 },
  { name: 'Telangana', x: 565, y: 485, lat: 17.4, lng: 78.5 },
];

export const STATE_DATA: Record<string, RegionalData> = {
  'Jammu & Kashmir': {
    region: 'Jammu & Kashmir', forecastValue: 45, bustProbability: 32,
    confidence: 'high', historicalMeanError: 18, similarCases: 12,
    casesWithLargeError: 3, historicalBustFrequency: 25,
    keyReasons: ['Stable atmospheric pattern', 'Low ensemble spread', 'Consistent NWP model agreement'],
  },
  'Himachal Pradesh': {
    region: 'Himachal Pradesh', forecastValue: 62, bustProbability: 28,
    confidence: 'high', historicalMeanError: 15, similarCases: 10,
    casesWithLargeError: 2, historicalBustFrequency: 20,
    keyReasons: ['Stable orographic lift pattern', 'Low model divergence', 'Consistent moisture profile'],
  },
  Punjab: {
    region: 'Punjab', forecastValue: 38, bustProbability: 35,
    confidence: 'high', historicalMeanError: 14, similarCases: 14,
    casesWithLargeError: 4, historicalBustFrequency: 28,
    keyReasons: ['Monsoon onset established', 'Low variability', 'Strong model consensus'],
  },
  Haryana: {
    region: 'Haryana', forecastValue: 42, bustProbability: 38,
    confidence: 'medium', historicalMeanError: 22, similarCases: 11,
    casesWithLargeError: 5, historicalBustFrequency: 40,
    keyReasons: ['Moderate ensemble spread', 'Seasonal transition zone', 'Variable moisture convergence'],
  },
  Uttarakhand: {
    region: 'Uttarakhand', forecastValue: 55, bustProbability: 45,
    confidence: 'medium', historicalMeanError: 30, similarCases: 16,
    casesWithLargeError: 8, historicalBustFrequency: 52,
    keyReasons: ['Complex orography affects NWP resolution', 'High atmospheric instability', 'Variable monsoon trough position'],
  },
  'Uttar Pradesh': {
    region: 'Uttar Pradesh', forecastValue: 78, bustProbability: 55,
    confidence: 'medium', historicalMeanError: 35, similarCases: 20,
    casesWithLargeError: 10, historicalBustFrequency: 50,
    keyReasons: ['Large forecast revision history', 'High atmospheric variability', 'Monsoon trough fluctuations'],
  },
  Bihar: {
    region: 'Bihar', forecastValue: 85, bustProbability: 62,
    confidence: 'low', historicalMeanError: 42, similarCases: 22,
    casesWithLargeError: 15, historicalBustFrequency: 68,
    keyReasons: ['High historical forecast error', 'Large forecast revision', 'High ensemble spread'],
  },
  Jharkhand: {
    region: 'Jharkhand', forecastValue: 82, bustProbability: 65,
    confidence: 'low', historicalMeanError: 45, similarCases: 20,
    casesWithLargeError: 14, historicalBustFrequency: 70,
    keyReasons: ['High atmospheric variability', 'Large ensemble spread', 'Complex terrain effects'],
  },
  'West Bengal': {
    region: 'West Bengal', forecastValue: 95, bustProbability: 70,
    confidence: 'low', historicalMeanError: 52, similarCases: 25,
    casesWithLargeError: 19, historicalBustFrequency: 75,
    keyReasons: ['High historical forecast error', 'Large forecast revision', 'High ensemble spread', 'Bay of Bengal influences'],
  },
  Sikkim: {
    region: 'Sikkim', forecastValue: 58, bustProbability: 30,
    confidence: 'high', historicalMeanError: 16, similarCases: 8,
    casesWithLargeError: 2, historicalBustFrequency: 22,
    keyReasons: ['Stable orographic pattern', 'Low model divergence', 'Consistent rainfall pattern'],
  },
  'Arunachal Pradesh': {
    region: 'Arunachal Pradesh', forecastValue: 72, bustProbability: 58,
    confidence: 'low', historicalMeanError: 48, similarCases: 18,
    casesWithLargeError: 12, historicalBustFrequency: 66,
    keyReasons: ['Sparse observation network', 'High terrain complexity', 'Large ensemble spread'],
  },
  Assam: {
    region: 'Assam', forecastValue: 90, bustProbability: 72,
    confidence: 'low', historicalMeanError: 55, similarCases: 24,
    casesWithLargeError: 18, historicalBustFrequency: 74,
    keyReasons: ['High historical forecast error', 'Large forecast revision', 'High atmospheric variability'],
  },
  Meghalaya: {
    region: 'Meghalaya', forecastValue: 88, bustProbability: 68,
    confidence: 'low', historicalMeanError: 44, similarCases: 16,
    casesWithLargeError: 12, historicalBustFrequency: 72,
    keyReasons: ['Extreme orographic effects', 'High precipitation variability', 'Sparse station network'],
  },
  Odisha: {
    region: 'Odisha', forecastValue: 140, bustProbability: 72,
    confidence: 'low', historicalMeanError: 68, similarCases: 24,
    casesWithLargeError: 18, historicalBustFrequency: 75,
    keyReasons: ['High historical forecast error', 'Large forecast revision', 'High atmospheric variability', 'High ensemble spread', 'Day 5 forecast uncertainty'],
  },
  Chhattisgarh: {
    region: 'Chhattisgarh', forecastValue: 110, bustProbability: 58,
    confidence: 'low', historicalMeanError: 40, similarCases: 19,
    casesWithLargeError: 11, historicalBustFrequency: 60,
    keyReasons: ['Moderate ensemble spread', 'Seasonal uncertainty', 'Variable moisture convergence'],
  },
  'Madhya Pradesh': {
    region: 'Madhya Pradesh', forecastValue: 95, bustProbability: 60,
    confidence: 'low', historicalMeanError: 44, similarCases: 21,
    casesWithLargeError: 13, historicalBustFrequency: 62,
    keyReasons: ['High atmospheric variability', 'Large ensemble spread', 'Monsoon onset ambiguity'],
  },
  Rajasthan: {
    region: 'Rajasthan', forecastValue: 55, bustProbability: 42,
    confidence: 'medium', historicalMeanError: 28, similarCases: 15,
    casesWithLargeError: 7, historicalBustFrequency: 45,
    keyReasons: ['Moderate ensemble spread', 'Desert-monsoonal transition zone', 'Variable moisture arrival'],
  },
  Gujarat: {
    region: 'Gujarat', forecastValue: 60, bustProbability: 40,
    confidence: 'medium', historicalMeanError: 25, similarCases: 13,
    casesWithLargeError: 6, historicalBustFrequency: 42,
    keyReasons: ['Moderate ensemble spread', 'Arabian Sea influence variability', 'Coastal effect uncertainty'],
  },
  Maharashtra: {
    region: 'Maharashtra', forecastValue: 120, bustProbability: 65,
    confidence: 'low', historicalMeanError: 50, similarCases: 22,
    casesWithLargeError: 15, historicalBustFrequency: 68,
    keyReasons: ['High historical forecast error', 'Large forecast revision', 'High atmospheric variability'],
  },
  Goa: {
    region: 'Goa', forecastValue: 98, bustProbability: 63,
    confidence: 'low', historicalMeanError: 38, similarCases: 14,
    casesWithLargeError: 9, historicalBustFrequency: 58,
    keyReasons: ['High atmospheric variability', 'Moderate ensemble spread', 'Monsoon onset uncertainty'],
  },
  Karnataka: {
    region: 'Karnataka', forecastValue: 105, bustProbability: 55,
    confidence: 'medium', historicalMeanError: 35, similarCases: 18,
    casesWithLargeError: 10, historicalBustFrequency: 52,
    keyReasons: ['Moderate ensemble spread', 'Variable WMO influence', 'Seasonal transition zone'],
  },
  Kerala: {
    region: 'Kerala', forecastValue: 155, bustProbability: 70,
    confidence: 'low', historicalMeanError: 58, similarCases: 26,
    casesWithLargeError: 19, historicalBustFrequency: 73,
    keyReasons: ['High historical forecast error', 'Large forecast revision', 'High ensemble spread', 'Early monsoon withdrawal uncertainty'],
  },
  'Tamil Nadu': {
    region: 'Tamil Nadu', forecastValue: 115, bustProbability: 58,
    confidence: 'low', historicalMeanError: 42, similarCases: 20,
    casesWithLargeError: 12, historicalBustFrequency: 58,
    keyReasons: ['Northeast monsoon influence', 'Moderate ensemble spread', 'Variable retreat timing'],
  },
  'Andhra Pradesh': {
    region: 'Andhra Pradesh', forecastValue: 100, bustProbability: 60,
    confidence: 'low', historicalMeanError: 44, similarCases: 21,
    casesWithLargeError: 13, historicalBustFrequency: 62,
    keyReasons: ['High atmospheric variability', 'Large ensemble spread', 'Monsoon trough position uncertainty'],
  },
  Telangana: {
    region: 'Telangana', forecastValue: 95, bustProbability: 58,
    confidence: 'low', historicalMeanError: 40, similarCases: 19,
    casesWithLargeError: 11, historicalBustFrequency: 58,
    keyReasons: ['Moderate ensemble spread', 'Monsoon onset ambiguity', 'Variable moisture convergence'],
  },
};

export const ANALOGUES: Record<string, HistoricalAnalogue[]> = {
  'Odisha': [
    { eventType: 'Monsoon Depression', region: 'Odisha', date: 'July 2023', similarity: 92, forecastError: 78, bustStatus: 'Forecast Bust' },
    { eventType: 'Heavy Rainfall Event', region: 'Odisha', date: 'August 2022', similarity: 87, forecastError: 65, bustStatus: 'Large Error' },
    { eventType: 'Monsoon Low', region: 'Chhattisgarh / Odisha', date: 'July 2021', similarity: 81, forecastError: 58, bustStatus: 'Large Error' },
    { eventType: 'Cyclonic Storm', region: 'Odisha', date: 'June 2020', similarity: 76, forecastError: 52, bustStatus: 'Normal' },
    { eventType: 'Depression', region: 'Odisha', date: 'September 2019', similarity: 73, forecastError: 48, bustStatus: 'Normal' },
  ],
  'Assam': [
    { eventType: 'Monsoon Depression', region: 'Assam', date: 'June 2023', similarity: 89, forecastError: 62, bustStatus: 'Forecast Bust' },
    { eventType: 'Heavy Rainfall Event', region: 'Assam', date: 'July 2022', similarity: 84, forecastError: 58, bustStatus: 'Large Error' },
    { eventType: 'Monsoon Low', region: 'Assam', date: 'June 2021', similarity: 79, forecastError: 55, bustStatus: 'Large Error' },
    { eventType: 'Depression', region: 'Meghalaya / Assam', date: 'July 2020', similarity: 74, forecastError: 48, bustStatus: 'Normal' },
  ],
  'Bihar': [
    { eventType: 'Monsoon Depression', region: 'Bihar', date: 'August 2023', similarity: 88, forecastError: 55, bustStatus: 'Forecast Bust' },
    { eventType: 'Heavy Rainfall Event', region: 'Bihar', date: 'July 2022', similarity: 82, forecastError: 48, bustStatus: 'Large Error' },
    { eventType: 'Monsoon Low', region: 'Bihar / Jharkhand', date: 'August 2021', similarity: 77, forecastError: 45, bustStatus: 'Large Error' },
    { eventType: 'Depression', region: 'Bihar', date: 'September 2020', similarity: 72, forecastError: 40, bustStatus: 'Normal' },
  ],
  'Maharashtra': [
    { eventType: 'Heavy Rainfall Event', region: 'Maharashtra', date: 'July 2023', similarity: 86, forecastError: 68, bustStatus: 'Forecast Bust' },
    { eventType: 'Monsoon Depression', region: 'Maharashtra', date: 'August 2022', similarity: 81, forecastError: 60, bustStatus: 'Large Error' },
    { eventType: 'Monsoon Low', region: 'Maharashtra', date: 'July 2021', similarity: 76, forecastError: 55, bustStatus: 'Large Error' },
    { eventType: 'Depression', region: 'Maharashtra', date: 'June 2020', similarity: 71, forecastError: 50, bustStatus: 'Normal' },
  ],
  'Kerala': [
    { eventType: 'Heavy Rainfall Event', region: 'Kerala', date: 'June 2023', similarity: 90, forecastError: 72, bustStatus: 'Forecast Bust' },
    { eventType: 'Monsoon Onset Event', region: 'Kerala', date: 'May 2022', similarity: 85, forecastError: 65, bustStatus: 'Large Error' },
    { eventType: 'Monsoon Low', region: 'Kerala', date: 'June 2021', similarity: 79, forecastError: 58, bustStatus: 'Large Error' },
    { eventType: 'Depression', region: 'Kerala', date: 'July 2020', similarity: 74, forecastError: 52, bustStatus: 'Normal' },
  ],
  'Uttar Pradesh': [
    { eventType: 'Monsoon Depression', region: 'Uttar Pradesh', date: 'August 2023', similarity: 84, forecastError: 48, bustStatus: 'Forecast Bust' },
    { eventType: 'Heavy Rainfall Event', region: 'Uttar Pradesh', date: 'July 2022', similarity: 79, forecastError: 42, bustStatus: 'Large Error' },
    { eventType: 'Monsoon Low', region: 'Uttar Pradesh / Bihar', date: 'August 2021', similarity: 74, forecastError: 38, bustStatus: 'Normal' },
  ],
};

export const EXPLANATIONS: Record<string, string> = {
  'Odisha': 'Forecast confidence is low over Odisha for the selected day because the current atmospheric pattern closely resembles historical monsoon depression cases that produced large rainfall forecast errors. The combination of a developing monsoon trough and high sea surface temperatures in the Bay of Bengal creates conditions where small model initialization differences lead to significant forecast divergence.',
  'Assam': 'Forecast confidence is low over Assam due to the complex orographic effects of the Himalayas interacting with monsoon flow. The steep terrain causes rapid changes in precipitation intensity and distribution that current NWP models struggle to resolve accurately, leading to consistently large forecast errors in this region.',
  'Bihar': 'Forecast confidence is low over Bihar because of persistent atmospheric instability and high ensemble spread. The region sits in a transition zone between monsoon and dry season influences, making the timing and magnitude of rainfall events particularly difficult to predict accurately.',
  'Maharashtra': 'Forecast confidence is low over Maharashtra due to the complex interaction between Western Ghats orography and monsoon flow patterns. The orographic lifting creates highly variable precipitation distributions that are sensitive to small changes in model initialization, contributing to large forecast revisions.',
  'Kerala': 'Forecast confidence is low over Kerala during the monsoon onset and withdrawal periods. The transition between seasonal patterns creates high atmospheric variability and large ensemble spread, making it difficult for NWP models to accurately predict rainfall timing and magnitude.',
  'Uttar Pradesh': 'Forecast confidence is moderate over Uttar Pradesh, with periodic reductions due to monsoon trough fluctuations. The region experiences variable moisture convergence patterns that affect precipitation prediction accuracy, particularly during the peak monsoon months.',
};

const defaultExplanation =
  'Forecast confidence for this region is based on current atmospheric pattern similarity to historical cases. The combination of model ensemble spread, historical forecast error patterns, and atmospheric variability determines the confidence level. Key factors include ensemble divergence, seasonal transition effects, and observational network density.';

export function getExplanation(region: string): string {
  return EXPLANATIONS[region] || defaultExplanation;
}

export function getAnalogueData(region: string): HistoricalAnalogue[] {
  return ANALOGUES[region] || ANALOGUES['Odisha'] || [];
}

export function getRegionData(region: string): RegionalData {
  return STATE_DATA[region] || STATE_DATA['Odisha'];
}

export function getSummaryStats(): SummaryStats {
  let high = 0, medium = 0, low = 0;
  Object.values(STATE_DATA).forEach((d) => {
    if (d.confidence === 'high') high++;
    else if (d.confidence === 'medium') medium++;
    else low++;
  });
  return { regionsAnalyzed: Object.keys(STATE_DATA).length, highConfidence: high, mediumConfidence: medium, lowConfidence: low };
}

export function getConfidence(day: number, region: string): Confidence {
  const cb = getConfidenceByDay();
  return cb[day]?.[region]?.confidence || 'medium';
}

export function getBustProb(day: number, region: string): number {
  const cb = getConfidenceByDay();
  return cb[day]?.[region]?.bustProbability || 50;
}

export function getForecastVal(day: number, region: string): number {
  const cb = getConfidenceByDay();
  return cb[day]?.[region]?.forecastValue || 100;
}

export function getConfidenceByDay(): ConfidenceByDay {
  const data: ConfidenceByDay = {};
  for (let day = 1; day <= 10; day++) {
    data[day] = {};
    Object.entries(STATE_DATA).forEach(([region, d]) => {
      const baseBust = d.bustProbability;
      const dayVariation = Math.sin(day * 0.5 + Object.keys(STATE_DATA).indexOf(region)) * 15;
      const bustProb = Math.min(95, Math.max(5, Math.round(baseBust + dayVariation)));
      let confidence: Confidence = 'medium';
      if (bustProb < 40) confidence = 'high';
      else if (bustProb > 60) confidence = 'low';
      data[day][region] = { confidence, bustProbability: bustProb, forecastValue: Math.round(d.forecastValue * (0.8 + Math.random() * 0.4)) };
    });
  }
  return data;
}
