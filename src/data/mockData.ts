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
  for (let day = 1; day <= 10; day++) {
    data[day] = {};
    Object.entries(STATE_DATA).forEach(([region, d]) => {
      const regData = getRegionData(region, variable);
      const baseBust = regData.bustProbability;
      const dayVariation = Math.sin(day * 0.5 + Object.keys(STATE_DATA).indexOf(region)) * 15;
      const bustProb = Math.min(95, Math.max(5, Math.round(baseBust + dayVariation)));
      let confidence: Confidence = 'medium';
      if (bustProb < 40) confidence = 'high';
      else if (bustProb > 60) confidence = 'low';

      let val = Math.round(regData.forecastValue * (0.8 + Math.random() * 0.4));
      if (variable === 'pressure') {
        val = Math.round(regData.forecastValue + Math.sin(day + Object.keys(STATE_DATA).indexOf(region)) * 2);
      } else if (variable === 'temperature') {
        val = Math.round(regData.forecastValue + Math.sin(day * 0.8) * 3);
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
