import imd from './imdObservations.json' with { type: 'json' };
import tmax from './imdTmax.json' with { type: 'json' };


export interface MonthlyRainfall { mean: number; p95: number; p99: number }

export interface ObservedSummary {
  gridCells: number;
  monthly: MonthlyRainfall[];
  monsoonTotal: Record<string, number>;
  widespreadHeavyDays: Record<string, number>;
  extremeCellDays: Record<string, number>;
  maxCellRain: { mm: number; date: string };
}

interface ImdFile {
  source: string;
  note: string;
  years: Record<string, { start: string; days: number; regions: Record<string, number[]> }>;
  summary: Record<string, ObservedSummary>;
}

const DATA = imd as ImdFile;

export const IMD_SOURCE = DATA.source;
export const IMD_NOTE = DATA.note;
export const IMD_YEARS = Object.keys(DATA.years).sort();

/** Compact label for the covered years, e.g. "2015, 2022–2024". */
export const IMD_YEAR_LABEL = IMD_YEARS.reduce<number[][]>((runs, year) => {
  const value = Number(year);
  const last = runs[runs.length - 1];
  if (last && value === last[last.length - 1] + 1) last.push(value);
  else runs.push([value]);
  return runs;
}, []).map((run) => (run.length > 1 ? `${run[0]}–${run[run.length - 1]}` : String(run[0]))).join(', ');

const DAY_MS = 86_400_000;

/** Observed state-mean rainfall (mm) on an ISO date, or null if not covered. */
export function observedRainfall(region: string, isoDate: string): number | null {
  const year = DATA.years[isoDate.slice(0, 4)];
  const series = year?.regions[region];
  if (!series) return null;
  const index = Math.round((Date.parse(isoDate) - Date.parse(year.start)) / DAY_MS);
  const value = series[index];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function observedSummary(region: string): ObservedSummary | null {
  return DATA.summary[region] ?? null;
}

/** Month is 1–12. */
export function observedMonthly(region: string, month: number): MonthlyRainfall | null {
  return DATA.summary[region]?.monthly[month - 1] ?? null;
}

const average = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);

export function monsoonAverages(region: string) {
  const summary = DATA.summary[region];
  if (!summary) return null;
  return {
    total: Math.round(average(Object.values(summary.monsoonTotal))),
    widespreadHeavyDays: Math.round(average(Object.values(summary.widespreadHeavyDays)) * 10) / 10,
    extremeCellDays: Math.round(average(Object.values(summary.extremeCellDays)) * 10) / 10,
  };
}



interface TmaxFile {
  source: string;
  note: string;
  years: Record<string, { start: string; days: number; regions: Record<string, (number | null)[]> }>;
  summary: Record<string, { gridCells: number; monthly: { mean: number | null; p95: number | null }[]; hotDays: Record<string, number> }>;
}

const TMAX = tmax as TmaxFile;

export const TMAX_YEARS = Object.keys(TMAX.years).sort();

/** Observed state-mean maximum temperature (°C) on an ISO date, or null. */
export function observedTmax(region: string, isoDate: string): number | null {
  const year = TMAX.years[isoDate.slice(0, 4)];
  const series = year?.regions[region];
  if (!series) return null;
  const value = series[Math.round((Date.parse(isoDate) - Date.parse(year.start)) / DAY_MS)];
  return typeof value === 'number' ? value : null;
}

/** Month is 1–12. */
export function observedTmaxMonthly(region: string, month: number) {
  const entry = TMAX.summary[region]?.monthly[month - 1];
  return entry && entry.mean !== null && entry.p95 !== null ? { mean: entry.mean, p95: entry.p95 } : null;
}

export function hotDayAverage(region: string) {
  const values = Object.values(TMAX.summary[region]?.hotDays ?? {});
  return values.length ? Math.round(average(values)) : null;
}
