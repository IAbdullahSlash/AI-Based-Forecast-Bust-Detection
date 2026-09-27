import {
  RegionalData,
  HistoricalAnalogue,
  ConfidenceByDay,
  SummaryStats,
  StatePosition,
  RegionFullData,
  Confidence,
  ForecastVariable,
  getVariableUnit,
} from '../types';

// Deterministic pseudo-random: replaces Math.random() in render paths
// to prevent flickering/hydration mismatches on each re-render.
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297 * 233.0) * 43758.5453;
  return x - Math.floor(x);
}

export const STATE_POSITIONS: StatePosition[] = [
  { name: 'Jammu & Kashmir', x: 420, y: 110, lat: 33.8, lng: 74.8 },
  { name: 'Ladakh', x: 380, y: 95, lat: 34.2, lng: 77.6 },
  { name: 'Himachal Pradesh', x: 470, y: 175, lat: 31.1, lng: 77.2 },
  { name: 'Punjab', x: 530, y: 230, lat: 30.7, lng: 75.8 },
  { name: 'Haryana', x: 570, y: 285, lat: 29.4, lng: 76.5 },
  { name: 'Delhi', x: 555, y: 305, lat: 28.7, lng: 77.1 },
  { name: 'Uttarakhand', x: 505, y: 240, lat: 30.3, lng: 78.0 },
  { name: 'Uttar Pradesh', x: 600, y: 340, lat: 26.8, lng: 80.9 },
  { name: 'Bihar', x: 655, y: 395, lat: 25.1, lng: 85.3 },
  { name: 'Jharkhand', x: 675, y: 445, lat: 23.6, lng: 85.3 },
  { name: 'West Bengal', x: 730, y: 430, lat: 22.9, lng: 87.8 },
  { name: 'Sikkim', x: 705, y: 345, lat: 27.5, lng: 88.5 },
  { name: 'Arunachal Pradesh', x: 760, y: 270, lat: 27.1, lng: 93.6 },
  { name: 'Assam', x: 740, y: 320, lat: 26.1, lng: 92.9 },
  { name: 'Meghalaya', x: 725, y: 365, lat: 25.5, lng: 91.9 },
  { name: 'Manipur', x: 760, y: 355, lat: 24.8, lng: 93.9 },
  { name: 'Mizoram', x: 748, y: 400, lat: 23.2, lng: 92.9 },
  { name: 'Tripura', x: 730, y: 410, lat: 23.9, lng: 91.5 },
  { name: 'Nagaland', x: 775, y: 310, lat: 26.2, lng: 94.6 },
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
  { name: 'Puducherry', x: 590, y: 630, lat: 11.9, lng: 79.8 },
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
  // --- Added missing states ---
  Delhi: {
    region: 'Delhi', forecastValue: 48, bustProbability: 44,
    confidence: 'medium', historicalMeanError: 26, similarCases: 16,
    casesWithLargeError: 7, historicalBustFrequency: 43,
    keyReasons: ['Urban heat island effects distort NWP surface boundary layer', 'Dust aerosol loading alters convective available potential energy', 'Sharp rural-urban moisture gradient creates localised forecast divergence'],
  },
  Ladakh: {
    region: 'Ladakh', forecastValue: 12, bustProbability: 28,
    confidence: 'high', historicalMeanError: 8, similarCases: 9,
    casesWithLargeError: 2, historicalBustFrequency: 22,
    keyReasons: ['High-altitude arid zone with stable synoptic pattern', 'Low convective activity limits forecast uncertainty', 'Westerly wave dominance provides strong NWP signal'],
  },
  Manipur: {
    region: 'Manipur', forecastValue: 76, bustProbability: 60,
    confidence: 'low', historicalMeanError: 44, similarCases: 14,
    casesWithLargeError: 9, historicalBustFrequency: 64,
    keyReasons: ['Complex hill terrain disrupts NWP wind and precipitation fields', 'Sparse observation network degrades model initialisation', 'Strong cross-border moisture advection variability from Myanmar'],
  },
  Mizoram: {
    region: 'Mizoram', forecastValue: 82, bustProbability: 63,
    confidence: 'low', historicalMeanError: 46, similarCases: 12,
    casesWithLargeError: 8, historicalBustFrequency: 67,
    keyReasons: ['Rugged topography with deep valleys creates sub-grid precipitation extremes', 'Low radiosonde coverage limits upper-air analysis accuracy', 'Bay of Bengal moisture surges interact unpredictably with terrain'],
  },
  Tripura: {
    region: 'Tripura', forecastValue: 79, bustProbability: 57,
    confidence: 'low', historicalMeanError: 40, similarCases: 13,
    casesWithLargeError: 8, historicalBustFrequency: 61,
    keyReasons: ['Surrounded by Bangladesh on three sides causing boundary moisture heterogeneity', 'Monsoon onset dates highly variable year-to-year', 'Low station density in western districts'],
  },
  Nagaland: {
    region: 'Nagaland', forecastValue: 68, bustProbability: 55,
    confidence: 'medium', historicalMeanError: 38, similarCases: 11,
    casesWithLargeError: 6, historicalBustFrequency: 52,
    keyReasons: ['Moderate ensemble spread over Naga Hills', 'Asymmetric north-south rainfall gradient across ridges', 'Limited surface observation network'],
  },
  Puducherry: {
    region: 'Puducherry', forecastValue: 88, bustProbability: 54,
    confidence: 'medium', historicalMeanError: 34, similarCases: 14,
    casesWithLargeError: 8, historicalBustFrequency: 50,
    keyReasons: ['Northeast monsoon dominates with moderate predictability', 'Sea-breeze interaction creates afternoon convection uncertainty', 'Bay of Bengal sea surface temperature drives inter-annual variability'],
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
  // --- Added analogue data for previously uncovered states ---
  'West Bengal': [
    { eventType: 'Bay of Bengal Cyclone', region: 'West Bengal', date: 'October 2023', similarity: 91, forecastError: 70, bustStatus: 'Forecast Bust' },
    { eventType: 'Monsoon Depression', region: 'West Bengal', date: 'July 2022', similarity: 86, forecastError: 62, bustStatus: 'Large Error' },
    { eventType: 'Heavy Rainfall Event', region: 'Gangetic WB', date: 'August 2021', similarity: 80, forecastError: 55, bustStatus: 'Large Error' },
    { eventType: 'Pre-Monsoon Squall', region: 'West Bengal', date: 'May 2020', similarity: 74, forecastError: 44, bustStatus: 'Normal' },
  ],
  'Arunachal Pradesh': [
    { eventType: 'Monsoon Depression', region: 'Arunachal Pradesh', date: 'June 2023', similarity: 88, forecastError: 65, bustStatus: 'Forecast Bust' },
    { eventType: 'Heavy Rainfall Event', region: 'Eastern Arunachal', date: 'July 2022', similarity: 83, forecastError: 58, bustStatus: 'Large Error' },
    { eventType: 'Flash Flood Event', region: 'Arunachal Pradesh', date: 'August 2021', similarity: 77, forecastError: 52, bustStatus: 'Large Error' },
    { eventType: 'Monsoon Low', region: 'Arunachal Pradesh', date: 'September 2020', similarity: 71, forecastError: 45, bustStatus: 'Normal' },
  ],
  Meghalaya: [
    { eventType: 'Extreme Orographic Rainfall', region: 'Meghalaya', date: 'June 2023', similarity: 94, forecastError: 82, bustStatus: 'Forecast Bust' },
    { eventType: 'Heavy Rainfall Event', region: 'Cherrapunji Belt', date: 'July 2022', similarity: 88, forecastError: 74, bustStatus: 'Forecast Bust' },
    { eventType: 'Monsoon Low', region: 'Meghalaya', date: 'August 2021', similarity: 82, forecastError: 60, bustStatus: 'Large Error' },
    { eventType: 'Depression', region: 'Meghalaya', date: 'June 2020', similarity: 76, forecastError: 52, bustStatus: 'Normal' },
  ],
  Jharkhand: [
    { eventType: 'Monsoon Depression', region: 'Jharkhand', date: 'August 2023', similarity: 87, forecastError: 58, bustStatus: 'Forecast Bust' },
    { eventType: 'Heavy Rainfall Event', region: 'Jharkhand Plateau', date: 'July 2022', similarity: 82, forecastError: 52, bustStatus: 'Large Error' },
    { eventType: 'Monsoon Low', region: 'Jharkhand / Odisha', date: 'August 2021', similarity: 76, forecastError: 47, bustStatus: 'Large Error' },
    { eventType: 'Depression', region: 'Jharkhand', date: 'September 2020', similarity: 70, forecastError: 40, bustStatus: 'Normal' },
  ],
  'Madhya Pradesh': [
    { eventType: 'Monsoon Depression', region: 'Madhya Pradesh', date: 'August 2023', similarity: 85, forecastError: 62, bustStatus: 'Forecast Bust' },
    { eventType: 'Heavy Rainfall Event', region: 'Central MP', date: 'July 2022', similarity: 80, forecastError: 55, bustStatus: 'Large Error' },
    { eventType: 'Monsoon Low', region: 'Madhya Pradesh', date: 'August 2021', similarity: 74, forecastError: 50, bustStatus: 'Large Error' },
    { eventType: 'Depression', region: 'MP / Chhattisgarh', date: 'September 2020', similarity: 68, forecastError: 42, bustStatus: 'Normal' },
  ],
  Chhattisgarh: [
    { eventType: 'Monsoon Depression', region: 'Chhattisgarh', date: 'August 2023', similarity: 86, forecastError: 58, bustStatus: 'Forecast Bust' },
    { eventType: 'Heavy Rainfall Event', region: 'Bastar Division', date: 'July 2022', similarity: 81, forecastError: 52, bustStatus: 'Large Error' },
    { eventType: 'Monsoon Low', region: 'Chhattisgarh / Odisha', date: 'August 2021', similarity: 75, forecastError: 46, bustStatus: 'Large Error' },
    { eventType: 'Depression', region: 'Chhattisgarh', date: 'September 2020', similarity: 70, forecastError: 40, bustStatus: 'Normal' },
  ],
  Rajasthan: [
    { eventType: 'Monsoon Surge Event', region: 'Eastern Rajasthan', date: 'July 2023', similarity: 82, forecastError: 48, bustStatus: 'Large Error' },
    { eventType: 'Desert Convective Storm', region: 'Rajasthan', date: 'June 2022', similarity: 77, forecastError: 42, bustStatus: 'Normal' },
    { eventType: 'Monsoon Low', region: 'Rajasthan / MP', date: 'August 2021', similarity: 72, forecastError: 36, bustStatus: 'Normal' },
    { eventType: 'Heavy Rainfall Event', region: 'Rajasthan', date: 'August 2020', similarity: 66, forecastError: 30, bustStatus: 'Normal' },
  ],
  Gujarat: [
    { eventType: 'Arabian Sea Cyclone', region: 'Saurashtra Coast', date: 'June 2023', similarity: 88, forecastError: 55, bustStatus: 'Forecast Bust' },
    { eventType: 'Monsoon Surge Event', region: 'Gujarat Coast', date: 'July 2022', similarity: 83, forecastError: 48, bustStatus: 'Large Error' },
    { eventType: 'Heavy Rainfall Event', region: 'South Gujarat', date: 'August 2021', similarity: 77, forecastError: 42, bustStatus: 'Normal' },
    { eventType: 'Monsoon Low', region: 'Gujarat', date: 'September 2020', similarity: 71, forecastError: 36, bustStatus: 'Normal' },
  ],
  Goa: [
    { eventType: 'Monsoon Onset Event', region: 'Goa Coast', date: 'June 2023', similarity: 89, forecastError: 55, bustStatus: 'Forecast Bust' },
    { eventType: 'Heavy Rainfall Event', region: 'Goa', date: 'July 2022', similarity: 84, forecastError: 48, bustStatus: 'Large Error' },
    { eventType: 'Monsoon Low', region: 'Goa / Karnataka', date: 'July 2021', similarity: 78, forecastError: 42, bustStatus: 'Large Error' },
    { eventType: 'Depression', region: 'Goa', date: 'August 2020', similarity: 72, forecastError: 36, bustStatus: 'Normal' },
  ],
  Karnataka: [
    { eventType: 'Western Ghats Rainfall', region: 'Coastal Karnataka', date: 'June 2023', similarity: 87, forecastError: 60, bustStatus: 'Forecast Bust' },
    { eventType: 'Monsoon Depression', region: 'Karnataka', date: 'July 2022', similarity: 82, forecastError: 52, bustStatus: 'Large Error' },
    { eventType: 'Heavy Rainfall Event', region: 'Malnad Region', date: 'August 2021', similarity: 76, forecastError: 46, bustStatus: 'Large Error' },
    { eventType: 'Monsoon Low', region: 'Karnataka', date: 'September 2020', similarity: 70, forecastError: 38, bustStatus: 'Normal' },
  ],
  'Tamil Nadu': [
    { eventType: 'Northeast Monsoon Surge', region: 'Tamil Nadu', date: 'November 2023', similarity: 90, forecastError: 68, bustStatus: 'Forecast Bust' },
    { eventType: 'Cyclonic Storm', region: 'Tamil Nadu Coast', date: 'December 2022', similarity: 85, forecastError: 60, bustStatus: 'Large Error' },
    { eventType: 'Heavy Rainfall Event', region: 'Tamil Nadu', date: 'October 2021', similarity: 79, forecastError: 52, bustStatus: 'Large Error' },
    { eventType: 'Depression', region: 'Tamil Nadu', date: 'November 2020', similarity: 73, forecastError: 44, bustStatus: 'Normal' },
  ],
  'Andhra Pradesh': [
    { eventType: 'Cyclone Landfall', region: 'AP Coast', date: 'October 2023', similarity: 92, forecastError: 72, bustStatus: 'Forecast Bust' },
    { eventType: 'Monsoon Depression', region: 'Andhra Pradesh', date: 'July 2022', similarity: 87, forecastError: 62, bustStatus: 'Large Error' },
    { eventType: 'Heavy Rainfall Event', region: 'Coastal AP', date: 'August 2021', similarity: 81, forecastError: 54, bustStatus: 'Large Error' },
    { eventType: 'Depression', region: 'Andhra Pradesh', date: 'September 2020', similarity: 75, forecastError: 46, bustStatus: 'Normal' },
  ],
  Telangana: [
    { eventType: 'Monsoon Depression', region: 'Telangana', date: 'August 2023', similarity: 85, forecastError: 55, bustStatus: 'Forecast Bust' },
    { eventType: 'Heavy Rainfall Event', region: 'Telangana', date: 'July 2022', similarity: 80, forecastError: 48, bustStatus: 'Large Error' },
    { eventType: 'Monsoon Low', region: 'Telangana / AP', date: 'August 2021', similarity: 74, forecastError: 42, bustStatus: 'Normal' },
    { eventType: 'Depression', region: 'Telangana', date: 'September 2020', similarity: 68, forecastError: 36, bustStatus: 'Normal' },
  ],
  Haryana: [
    { eventType: 'Monsoon Surge Event', region: 'Haryana', date: 'August 2023', similarity: 80, forecastError: 40, bustStatus: 'Large Error' },
    { eventType: 'Heavy Rainfall Event', region: 'Haryana', date: 'July 2022', similarity: 75, forecastError: 35, bustStatus: 'Normal' },
    { eventType: 'Monsoon Low', region: 'Haryana / UP', date: 'August 2021', similarity: 70, forecastError: 30, bustStatus: 'Normal' },
  ],
  Uttarakhand: [
    { eventType: 'Cloudbursts / Flash Flood', region: 'Uttarakhand', date: 'August 2023', similarity: 91, forecastError: 62, bustStatus: 'Forecast Bust' },
    { eventType: 'Heavy Orographic Rainfall', region: 'Kumaon Hills', date: 'July 2022', similarity: 85, forecastError: 54, bustStatus: 'Large Error' },
    { eventType: 'Monsoon Depression', region: 'Uttarakhand', date: 'August 2021', similarity: 79, forecastError: 48, bustStatus: 'Large Error' },
    { eventType: 'Flash Flood', region: 'Uttarakhand', date: 'September 2020', similarity: 72, forecastError: 40, bustStatus: 'Normal' },
  ],
  Punjab: [
    { eventType: 'Monsoon Onset Event', region: 'Punjab', date: 'July 2023', similarity: 82, forecastError: 36, bustStatus: 'Normal' },
    { eventType: 'Heavy Rainfall Event', region: 'Punjab', date: 'August 2022', similarity: 77, forecastError: 30, bustStatus: 'Normal' },
    { eventType: 'Monsoon Surge', region: 'Punjab / Haryana', date: 'August 2021', similarity: 71, forecastError: 26, bustStatus: 'Normal' },
  ],
  Sikkim: [
    { eventType: 'Glacial Lake Outburst Flood', region: 'Sikkim', date: 'October 2023', similarity: 90, forecastError: 58, bustStatus: 'Forecast Bust' },
    { eventType: 'Heavy Orographic Rainfall', region: 'Sikkim', date: 'July 2022', similarity: 84, forecastError: 48, bustStatus: 'Large Error' },
    { eventType: 'Monsoon Surge', region: 'Sikkim / North Bengal', date: 'July 2021', similarity: 78, forecastError: 40, bustStatus: 'Normal' },
  ],
  'Jammu & Kashmir': [
    { eventType: 'Western Disturbance', region: 'J&K Valley', date: 'February 2024', similarity: 86, forecastError: 42, bustStatus: 'Large Error' },
    { eventType: 'Monsoon Low', region: 'Jammu Region', date: 'August 2022', similarity: 80, forecastError: 36, bustStatus: 'Normal' },
    { eventType: 'Flash Flood', region: 'J&K', date: 'July 2021', similarity: 74, forecastError: 30, bustStatus: 'Normal' },
  ],
  'Himachal Pradesh': [
    { eventType: 'Cloudbursts / Landslide', region: 'Himachal Pradesh', date: 'August 2023', similarity: 88, forecastError: 48, bustStatus: 'Large Error' },
    { eventType: 'Heavy Orographic Rainfall', region: 'Kullu-Manali', date: 'July 2022', similarity: 82, forecastError: 40, bustStatus: 'Normal' },
    { eventType: 'Monsoon Surge', region: 'Himachal Pradesh', date: 'August 2021', similarity: 76, forecastError: 34, bustStatus: 'Normal' },
  ],
  Delhi: [
    { eventType: 'Monsoon Onset Delay', region: 'Delhi NCT', date: 'June 2023', similarity: 84, forecastError: 38, bustStatus: 'Large Error' },
    { eventType: 'Urban Flash Flood', region: 'Delhi', date: 'August 2022', similarity: 79, forecastError: 32, bustStatus: 'Normal' },
    { eventType: 'Monsoon Surge Event', region: 'Delhi / NCR', date: 'July 2021', similarity: 73, forecastError: 28, bustStatus: 'Normal' },
  ],
  Ladakh: [
    { eventType: 'Western Disturbance Snowfall', region: 'Ladakh', date: 'January 2024', similarity: 82, forecastError: 18, bustStatus: 'Normal' },
    { eventType: 'Summer Cloudburst', region: 'Leh District', date: 'August 2022', similarity: 76, forecastError: 14, bustStatus: 'Normal' },
    { eventType: 'Flash Flood', region: 'Ladakh', date: 'July 2021', similarity: 70, forecastError: 12, bustStatus: 'Normal' },
  ],
  Manipur: [
    { eventType: 'Monsoon Depression', region: 'Manipur', date: 'June 2023', similarity: 87, forecastError: 55, bustStatus: 'Forecast Bust' },
    { eventType: 'Heavy Rainfall Event', region: 'Manipur Hills', date: 'July 2022', similarity: 82, forecastError: 48, bustStatus: 'Large Error' },
    { eventType: 'Monsoon Low', region: 'Manipur / Nagaland', date: 'August 2021', similarity: 76, forecastError: 42, bustStatus: 'Normal' },
  ],
  Mizoram: [
    { eventType: 'Monsoon Depression', region: 'Mizoram', date: 'June 2023', similarity: 88, forecastError: 58, bustStatus: 'Forecast Bust' },
    { eventType: 'Heavy Rainfall Event', region: 'Aizawl District', date: 'July 2022', similarity: 83, forecastError: 50, bustStatus: 'Large Error' },
    { eventType: 'Monsoon Low', region: 'Mizoram / Tripura', date: 'August 2021', similarity: 77, forecastError: 44, bustStatus: 'Normal' },
  ],
  Tripura: [
    { eventType: 'Monsoon Depression', region: 'Tripura', date: 'June 2023', similarity: 85, forecastError: 52, bustStatus: 'Forecast Bust' },
    { eventType: 'Heavy Rainfall Event', region: 'Tripura', date: 'July 2022', similarity: 80, forecastError: 46, bustStatus: 'Large Error' },
    { eventType: 'Monsoon Low', region: 'Tripura / Bangladesh border', date: 'August 2021', similarity: 74, forecastError: 40, bustStatus: 'Normal' },
  ],
  Nagaland: [
    { eventType: 'Monsoon Depression', region: 'Nagaland', date: 'July 2023', similarity: 83, forecastError: 48, bustStatus: 'Large Error' },
    { eventType: 'Heavy Rainfall Event', region: 'Kohima District', date: 'June 2022', similarity: 78, forecastError: 42, bustStatus: 'Normal' },
    { eventType: 'Monsoon Low', region: 'Nagaland / Assam', date: 'July 2021', similarity: 72, forecastError: 36, bustStatus: 'Normal' },
  ],
  Puducherry: [
    { eventType: 'Northeast Monsoon Surge', region: 'Puducherry', date: 'November 2023', similarity: 88, forecastError: 52, bustStatus: 'Large Error' },
    { eventType: 'Cyclonic Storm', region: 'Tamil Nadu / Puducherry', date: 'December 2022', similarity: 83, forecastError: 46, bustStatus: 'Normal' },
    { eventType: 'Heavy Rainfall Event', region: 'Puducherry', date: 'October 2021', similarity: 77, forecastError: 40, bustStatus: 'Normal' },
  ],
};

export const EXPLANATIONS: Record<string, string> = {
  'Jammu & Kashmir': 'Forecast confidence is high over Jammu & Kashmir due to predominant westerly disturbances in winter and sheltered valley orography in summer. Pir Panjal and Greater Himalayan ranges shield the valley from monsoon surges, keeping mean rainfall forecast errors low (±12mm) across 15 historical analogues.',
  'Odisha': 'Forecast confidence is low over Odisha because the current atmospheric pattern closely resembles historical monsoon depression cases that produced large rainfall errors (avg ±68mm). A developing monsoon trough combined with elevated Bay of Bengal sea-surface temperatures (>29°C) amplifies small model initialisation differences into significant forecast divergence by Day 5+.',
  'Assam': 'Forecast confidence is low over Assam due to complex orographic interaction between the eastern Himalayan foothills and monsoon flow. The steep terrain causes rapid mesoscale changes in precipitation intensity that NWP models cannot resolve at standard grid resolution (~12km), resulting in a consistent mean error of ±55mm over 24 similar past cases.',
  'Bihar': 'Forecast confidence is low over Bihar because of persistent atmospheric instability and a 62% historical bust frequency. The region straddles the Indo-Gangetic Plain–Monsoon transition zone, making rainfall timing and magnitude highly sensitive to small shifts in the monsoon trough position — shifts that 22 historical analogues show NWP models routinely misplace by 1–2 degrees.',
  'Maharashtra': 'Forecast confidence is low over Maharashtra due to the complex interaction between Western Ghats orography and Arabian Sea monsoon flow. Orographic lifting creates highly variable precipitation distributions (±50mm mean error) sensitive to small changes in low-level jet stream positioning. Large forecast revisions are common over the windward slopes of the Sahyadri range.',
  'Kerala': 'Forecast confidence is low over Kerala because monsoon onset and withdrawal phase transitions create extreme ensemble spread. Based on 26 historical analogues, 73% resulted in a bust or large error, with a mean rainfall forecast error of ±58mm. High sea-surface temperatures in the southeastern Arabian Sea increase convective potential beyond NWP model predictions.',
  'Uttar Pradesh': 'Forecast confidence is moderate over Uttar Pradesh, with periodic reductions during active monsoon phases. The large Gangetic Plain exposes the region to variable moisture convergence patterns — 3 of 10 analogues showed large errors due to monsoon trough displacement northward by >3°, reducing precipitation over eastern UP while intensifying it over Bihar.',
  'West Bengal': 'Forecast confidence is low over West Bengal due to the dual influence of Bay of Bengal cyclonic systems and orographic enhancement from the Sub-Himalayan foothills. Historical data across 25 cases shows a 75% bust frequency, with the highest errors during late October when northeast monsoon transitions amplify uncertainty in both timing and intensity.',
  'Jharkhand': 'Forecast confidence is low over Jharkhand due to complex Chota Nagpur Plateau terrain effects. The plateau edge causes mesoscale wind shear that triggers convective rainfall with high spatial variability, leading to a ±45mm mean error across 20 analogues. 70% of cases showed large errors during peak monsoon months.',
  'Meghalaya': 'Forecast confidence is critically low over Meghalaya — the region records some of the world\'s highest rainfall totals and the greatest NWP forecast uncertainty in India. Extreme orographic effects over Cherrapunji and Mawsynram produce rainfall rates that current 3km models still underestimate by ±44mm on average, with a 72% historical bust frequency across 16 cases.',
  'Arunachal Pradesh': 'Forecast confidence is low over Arunachal Pradesh due to the sparsest observation network of any Indian state combined with the highest terrain complexity. With fewer than 12 active AWS stations across 84,000 km², NWP model initialisation errors are large, leading to ±48mm mean forecast errors across 18 historical analogues.',
  'Madhya Pradesh': 'Forecast confidence is low over Madhya Pradesh as the state lies in the core of the monsoon depression track from the Bay of Bengal. Systems traversing Vidarbha into MP rapidly intensify or weaken, creating forecast revision magnitudes of ±44mm across 21 historical cases, with 62% resulting in large errors.',
  'Chhattisgarh': 'Forecast confidence is low over Chhattisgarh, particularly over the Bastar plateau region, where orographic enhancement and dense forest cover alter low-level wind patterns. 60% of 19 historical analogues showed large forecast errors, with the highest bust probabilities during late July–August monsoon depression crossings.',
  'Rajasthan': 'Forecast confidence is moderate over Rajasthan due to the complex desert–monsoon boundary. Rainfall events here are episodic and strongly tied to monsoon surge intensity, making the difference between a dry day and 80mm event dependent on surge timing that models capture with only 45% reliability in this season.',
  'Gujarat': 'Forecast confidence is medium over Gujarat. Arabian Sea cyclonic systems and monsoon surges interact with complex coastal geometry to produce highly variable onshore precipitation. Historical accuracy is moderate (42% bust frequency across 13 cases) with the highest uncertainty during cyclone season (May–June) and monsoon onset.',
  'Karnataka': 'Forecast confidence is medium over Karnataka due to the steep Western Ghats escarpment creating a sharp windward–leeward rainfall gradient. NWP models struggle with sub-grid wind channelling through coastal valleys, producing mean errors of ±35mm across 18 historical analogues, with forecast reliability declining significantly during June–July peak monsoon.',
  'Goa': 'Forecast confidence is low over Goa during the peak southwest monsoon (June–September). Heavy orographic rainfall over the Western Ghats interacts with sea breeze patterns to create localised afternoon convection that is difficult to forecast even 24 hours ahead. The ±38mm mean error reflects consistent NWP underestimation of Ghats-enhanced rainfall.',
  'Tamil Nadu': 'Forecast confidence is low over Tamil Nadu primarily during the northeast monsoon season (October–December). Unlike the rest of India, Tamil Nadu\'s rainfall peaks in the post-monsoon phase, driven by Bay of Bengal disturbances with irregular landfall trajectories. Mean error of ±42mm across 20 cases reflects this inter-annual variability.',
  'Andhra Pradesh': 'Forecast confidence is low over Andhra Pradesh due to its long coastline\'s exposure to Bay of Bengal cyclones and monsoon depressions. The bifurcation of weather systems between the coast and interior creates sharp precipitation gradients, resulting in ±44mm mean errors across 21 historical analogues with 62% large error rate.',
  'Telangana': 'Forecast confidence is low over Telangana as the state sits at the confluence of southwest monsoon northward advance and Bay of Bengal disturbance tracks. The Deccan plateau terrain channels low-pressure systems unpredictably, with ±40mm mean forecast error and 58% bust frequency across 19 historical cases.',
  'Delhi': 'Forecast confidence is medium over Delhi NCT. Urban heat island effects modify boundary-layer dynamics, causing NWP models to systematically underestimate afternoon convective rainfall intensity over densely built areas. The rural–urban moisture gradient and dust aerosol loading further complicate radiative transfer parameterisation.',
  'Ladakh': 'Forecast confidence is high over Ladakh due to its arid high-altitude climate with stable synoptic patterns. The region receives minimal monsoon rainfall and is primarily influenced by westerly disturbances, which have high predictability at 3–7 day ranges. Mean forecast error of ±8mm reflects consistently reliable NWP performance here.',
  'Manipur': 'Forecast confidence is low over Manipur due to its hill terrain and sparse observation network. Cross-border moisture advection from Myanmar creates forecast uncertainty that models cannot fully resolve, leading to ±44mm mean errors. 64% of 14 historical analogues showed large errors during active monsoon phases.',
  'Mizoram': 'Forecast confidence is low over Mizoram — deep river valleys between ridge lines create sub-grid precipitation variability that 12km resolution NWP cannot capture. Bay of Bengal moisture surges interacting with the Lushai Hills terrain produce ±46mm mean errors across 12 historical analogues.',
  'Tripura': 'Forecast confidence is low over Tripura due to its unique geographic setting — surrounded on three sides by Bangladesh. This creates complex boundary moisture heterogeneity and variable monsoon onset dates, with ±40mm mean forecast error and 61% bust frequency observed across 13 historical analogues.',
  'Nagaland': 'Forecast confidence is medium over Nagaland. The Naga Hills create an asymmetric north–south rainfall gradient that is partially captured by NWP models. Mean error of ±38mm and 52% bust frequency reflect moderate predictability, with the highest uncertainty during June–July cyclonic system interactions over the Bay of Bengal.',
  'Puducherry': 'Forecast confidence is medium over Puducherry. The northeast monsoon dominates, which has relatively better predictability than the southwest monsoon. Sea-breeze interactions create afternoon convective uncertainty, while Bay of Bengal SSTs modulate inter-annual variability. Mean error of ±34mm reflects moderate NWP skill for this coastal region.',
  'Sikkim': 'Forecast confidence is high over Sikkim for routine monsoon rain, but drops sharply for extreme events. Glacier interactions and very high rainfall rates on the southern slopes create edge cases where NWP models fail, as evidenced by the 2023 Glacial Lake Outburst event. Mean error of ±16mm is low for normal conditions.',
  'Himachal Pradesh': 'Forecast confidence is high over Himachal Pradesh for most conditions. Stable orographic lift patterns and good model consensus give reliable forecasts (±15mm mean error, 20% bust frequency). Risk rises sharply for cloudburst events over Kullu, Shimla, and Lahaul-Spiti, which are small-scale and difficult to predict beyond 6 hours.',
  'Punjab': 'Forecast confidence is high over Punjab. Monsoon onset timing is well-established and model consensus is strong, giving a 28% bust frequency and ±14mm mean error across 14 analogues. Uncertainty increases slightly near the Monsoon withdrawal phase in September.',
  'Haryana': 'Forecast confidence is medium over Haryana due to its transitional position between the Indo-Gangetic monsoon belt and the Thar Desert. Variable moisture convergence from both the Bay of Bengal and Arabian Sea branches creates forecast uncertainty, with 40% bust frequency and ±22mm mean error across 11 historical cases.',
  'Uttarakhand': 'Forecast confidence is medium over Uttarakhand. The complex Himalayan orography creates intense localised cloudbursts that are essentially unpredictable beyond 3 hours at NWP resolution. 52% of 16 historical analogues showed large errors, particularly during August when monsoon depression tracks intersect Kumaon and Garhwal hills.',
};

const defaultExplanation =
  'Forecast confidence for this region is based on current atmospheric pattern similarity to historical cases. The combination of model ensemble spread, historical forecast error patterns, and atmospheric variability determines the confidence level. Key factors include ensemble divergence, seasonal transition effects, and observational network density.';

const MOUNTAIN_REGIONS = new Set([
  'Jammu & Kashmir',
  'Himachal Pradesh',
  'Uttarakhand',
  'Sikkim',
  'Arunachal Pradesh',
]);

const COASTAL_REGIONS = new Set([
  'Gujarat',
  'Maharashtra',
  'Goa',
  'Karnataka',
  'Kerala',
  'Tamil Nadu',
  'Andhra Pradesh',
  'Odisha',
  'West Bengal',
]);

export function getRegionData(region: string, variable: ForecastVariable = 'rainfall'): RegionalData {
  const base = STATE_DATA[region] || STATE_DATA['Odisha'];

  if (variable === 'rainfall') {
    return { ...base, unit: 'mm' };
  }

  if (variable === 'temperature') {
    let tempVal = 32;
    let tempErr = 2.4;
    if (MOUNTAIN_REGIONS.has(region)) {
      tempVal = 18 + (base.forecastValue % 7);
      tempErr = 1.6 + Number(((base.historicalMeanError % 10) * 0.1).toFixed(1));
    } else if (COASTAL_REGIONS.has(region)) {
      tempVal = 29 + (base.forecastValue % 5);
      tempErr = 1.9 + Number(((base.historicalMeanError % 8) * 0.1).toFixed(1));
    } else {
      tempVal = region === 'Rajasthan' ? 41 : 34 + (base.forecastValue % 8);
      tempErr = 2.4 + Number(((base.historicalMeanError % 12) * 0.1).toFixed(1));
    }

    return {
      ...base,
      forecastValue: tempVal,
      historicalMeanError: Number(tempErr.toFixed(1)),
      unit: '°C',
      keyReasons: [
        'High cloud albedo and radiative balance uncertainty',
        'Microclimate surface boundary layer divergence',
        'Large diurnal temperature range ensemble spread',
        'Surface soil moisture flux and sensible heat variations',
      ],
    };
  }

  if (variable === 'wind') {
    let windVal = 22;
    let windErr = 5.2;
    if (COASTAL_REGIONS.has(region)) {
      windVal = 32 + (base.forecastValue % 18);
      windErr = 5.5 + Number(((base.historicalMeanError % 15) * 0.2).toFixed(1));
    } else if (MOUNTAIN_REGIONS.has(region)) {
      windVal = 24 + (base.forecastValue % 14);
      windErr = 4.8 + Number(((base.historicalMeanError % 12) * 0.2).toFixed(1));
    } else {
      windVal = 14 + (base.forecastValue % 12);
      windErr = 3.2 + Number(((base.historicalMeanError % 10) * 0.15).toFixed(1));
    }

    return {
      ...base,
      forecastValue: windVal,
      historicalMeanError: Number(windErr.toFixed(1)),
      unit: 'km/h',
      keyReasons: [
        'Sub-grid convective gust parameterization limits',
        'Land-sea thermal contrast and breeze boundary shift',
        'Turbulent kinetic energy dissipation variance in NWP',
        'Topographic funneling and surface drag roughness',
      ],
    };
  }

  // Pressure
  const pressVal = 1006 + (base.forecastValue % 8);
  const pressErr = Number((1.6 + (base.historicalMeanError % 15) * 0.1).toFixed(1));

  return {
    ...base,
    forecastValue: pressVal,
    historicalMeanError: pressErr,
    unit: 'hPa',
    keyReasons: [
      'Synoptic pressure trough position oscillation',
      'Cyclonic depression central isobar deepening variance',
      'Semi-diurnal atmospheric solar tide phase shifts',
      'Cross-equatorial pressure gradient anomalies',
    ],
  };
}

export function getAnalogueData(region: string, variable: ForecastVariable = 'rainfall'): HistoricalAnalogue[] {
  const baseAnalogues = ANALOGUES[region] || ANALOGUES['Odisha'] || [];

  if (variable === 'rainfall') {
    return baseAnalogues.map(a => ({ ...a, unit: 'mm' }));
  }

  if (variable === 'temperature') {
    const types = [
      'Severe Heatwave Event',
      'Pre-Monsoon Thermal Spike',
      'Western Disturbance Cold Drop',
      'Diurnal Temperature Anomaly',
      'Summer Continental Heatwave',
    ];
    return baseAnalogues.map((a, i) => ({
      ...a,
      eventType: types[i % types.length],
      forecastError: Number((1.8 + (a.forecastError % 25) * 0.15).toFixed(1)),
      unit: '°C',
    }));
  }

  if (variable === 'wind') {
    const types = [
      'Cyclonic Gale Surge',
      'Pre-Monsoon Squall Line',
      'Coastal Wind Event',
      'Valley Jet Anomaly',
      'Monsoon Boundary Gust',
    ];
    return baseAnalogues.map((a, i) => ({
      ...a,
      eventType: types[i % types.length],
      forecastError: Math.round(7 + (a.forecastError % 30) * 0.4),
      unit: 'km/h',
    }));
  }

  // Pressure
  const types = [
    'Deep Depression Trough',
    'Synoptic Barometric Drop',
    'Coastal Pressure Surge',
    'Monsoon Trough Shift',
    'Low Pressure System Transit',
  ];
  return baseAnalogues.map((a, i) => ({
    ...a,
    eventType: types[i % types.length],
    forecastError: Number((1.4 + (a.forecastError % 20) * 0.12).toFixed(1)),
    unit: 'hPa',
  }));
}

export function getExplanation(region: string, variable: ForecastVariable = 'rainfall'): string {
  if (variable === 'rainfall') {
    return EXPLANATIONS[region] || defaultExplanation;
  }

  if (variable === 'temperature') {
    return `Forecast confidence for surface temperature over ${region} is constrained by local radiation balance uncertainty, surface albedo variation across rural-urban interfaces, and numerical model sensitivity to soil moisture feedback during diurnal heating phases.`;
  }

  if (variable === 'wind') {
    return `Forecast confidence for wind speed over ${region} is influenced by complex boundary-layer friction, shifting mesoscale pressure gradients, and sub-grid parameterization of turbulent gusts and convective downdrafts.`;
  }

  return `Forecast confidence for surface pressure over ${region} is impacted by synoptic barometric trough oscillation, model divergence on low-pressure system deepening rates, and seasonal monsoon trough displacement.`;
}

export function getSummaryStats(variable: ForecastVariable = 'rainfall'): SummaryStats {
  let high = 0, medium = 0, low = 0;
  Object.keys(STATE_DATA).forEach((region) => {
    const d = getRegionData(region, variable);
    if (d.confidence === 'high') high++;
    else if (d.confidence === 'medium') medium++;
    else low++;
  });
  return { regionsAnalyzed: Object.keys(STATE_DATA).length, highConfidence: high, mediumConfidence: medium, lowConfidence: low };
}

export function getConfidenceByDay(variable: ForecastVariable = 'rainfall'): ConfidenceByDay {
  const data: ConfidenceByDay = {};
  const regionKeys = Object.keys(STATE_DATA);
  for (let day = 1; day <= 10; day++) {
    data[day] = {};
    Object.entries(STATE_DATA).forEach(([region, _d]) => {
      const regData = getRegionData(region, variable);
      const baseBust = regData.bustProbability;
      const regionIndex = regionKeys.indexOf(region);

      // Deterministic day-progression: bust probability rises with lead time
      const leadTimeDegradation = (day - 1) * 1.5;
      // Deterministic regional variation using seeded noise instead of Math.random()
      const dayVariation = Math.sin(day * 0.5 + regionIndex * 0.8) * 15;
      const bustProb = Math.min(95, Math.max(5, Math.round(baseBust + dayVariation + leadTimeDegradation)));
      let confidence: Confidence = 'medium';
      if (bustProb < 40) confidence = 'high';
      else if (bustProb > 60) confidence = 'low';

      // Deterministic forecast value variation (seeded, not Math.random)
      const seed = day * 31 + regionIndex * 7;
      const pseudoRand = seededRandom(seed);
      let val: number;
      if (variable === 'pressure') {
        val = Math.round(regData.forecastValue + Math.sin(day + regionIndex) * 2);
      } else if (variable === 'temperature') {
        val = Math.round(regData.forecastValue + Math.sin(day * 0.8 + regionIndex * 0.3) * 3);
      } else {
        val = Math.round(regData.forecastValue * (0.8 + pseudoRand * 0.4));
      }

      data[day][region] = {
        confidence,
        bustProbability: bustProb,
        forecastValue: val,
      };
    });
  }
  return data;
}

export function getConfidence(day: number, region: string, variable: ForecastVariable = 'rainfall'): Confidence {
  const cb = getConfidenceByDay(variable);
  return cb[day]?.[region]?.confidence || 'medium';
}

export function getBustProb(day: number, region: string, variable: ForecastVariable = 'rainfall'): number {
  const cb = getConfidenceByDay(variable);
  return cb[day]?.[region]?.bustProbability || 50;
}

export function getForecastVal(day: number, region: string, variable: ForecastVariable = 'rainfall'): number {
  const cb = getConfidenceByDay(variable);
  return cb[day]?.[region]?.forecastValue || 100;
}
