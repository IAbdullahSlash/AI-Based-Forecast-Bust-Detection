import { Confidence, ForecastVariable, ConfidenceByDay, getVariableUnit } from '../types';
import { STATE_POSITIONS } from '../data/mockData';

export function confidenceColor(conf: Confidence): string {
  return conf === 'high' ? '#22c55e' : conf === 'medium' ? '#eab308' : '#ef4444';
}

export function confidenceBg(conf: Confidence): string {
  return conf === 'high'
    ? 'bg-green-100 text-green-800'
    : conf === 'medium'
    ? 'bg-yellow-100 text-yellow-800'
    : 'bg-red-100 text-red-800';
}

export function bustColor(prob: number): string {
  if (prob < 40) return '#3b82f6';
  if (prob < 60) return '#eab308';
  return '#ef4444';
}

export function bustBg(prob: number): string {
  if (prob < 40) return 'bg-blue-100 text-blue-800';
  if (prob < 60) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

export function mapColor(mode: string, conf: Confidence, prob: number): string {
  if (mode === 'confidence') return confidenceColor(conf);
  return bustColor(prob);
}

export function getConfidence(day: number, region: string, cb?: ConfidenceByDay): Confidence {
  return cb?.[day]?.[region]?.confidence || 'medium';
}

export function getBustProb(day: number, region: string, cb?: ConfidenceByDay): number {
  return cb?.[day]?.[region]?.bustProbability || 50;
}

export function getForecastVal(day: number, region: string, cb?: ConfidenceByDay): number {
  return cb?.[day]?.[region]?.forecastValue || 100;
}

/**
 * Exports current day confidence & bust intelligence as a CSV file download
 */
export function exportConfidenceCSV(day: number, variable: ForecastVariable, cb: ConfidenceByDay): void {
  const unit = getVariableUnit(variable);
  const rows = [
    ['State/UT', 'Day', 'Variable', 'Forecast Value', 'Unit', 'Confidence', 'Bust Probability (%)'],
  ];

  STATE_POSITIONS.forEach((s) => {
    const conf = getConfidence(day, s.name, cb);
    const prob = getBustProb(day, s.name, cb);
    const val = getForecastVal(day, s.name, cb);
    rows.push([`"${s.name}"`, `${day}`, `"${variable}"`, `${val}`, `"${unit}"`, `"${conf}"`, `${prob}`]);
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `forecast_bust_${variable}_day${day}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
