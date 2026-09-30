import type { Confidence } from '../types/index.ts';
import nwp from '../data/nwpForecasts.json' with { type: 'json' };
import imdaa from '../data/imdaaAnalysis.json' with { type: 'json' };
import { observedMonthly, observedRainfall } from '../data/observations.ts';
import { STATE_POSITIONS } from '../data/regions.ts';
import { getRealVerification } from './verification.ts';

// Real case studies: NCMRWF forecasts vs IMD observations, with the weather
// diagnosed from IMDAA reanalysis. Day d of a case is the date run + (d − 1)
// and uses forecast file day(d − 1). Risk flags are transparent rules built
// only from information available at forecast time (forecast rainfall, lead
// time, reanalysis state, terrain); outcomes come from IMD.

export type CaseId = 'jun2015' | 'jul2015';
export type Outcome = 'bust' | 'large' | 'ok' | 'no-forecast' | 'no-data';

export interface CaseDefinition { id: CaseId; label: string; short: string; run: string }

export const CASES: CaseDefinition[] = [
  { id: 'jun2015', label: 'Real case · 1–10 June 2015', short: 'Jun 2015', run: '2015-06-01' },
  { id: 'jul2015', label: 'Real case · 1–10 July 2015', short: 'Jul 2015', run: '2015-07-01' },
];

interface Diagnostics {
  ws850: number | null; ws850Max: number | null; u850: number | null; vort850: number | null;
  vort850Max: number | null; t850: number | null; ws200: number | null; shear: number | null;
}
interface SeaSystem { vortMax: number; lat: number; lon: number; windMax: number }
interface ImdaaFile {
  source: string;
  note: string;
  days: Record<string, { complete: boolean; regions: Record<string, Diagnostics>; seas: Record<string, SeaSystem> }>;
}
interface NwpFile { initializations: Record<string, { days: number[]; regions: Record<string, { mean: number }[]> }> }

const REANALYSIS = imdaa as ImdaaFile;
const FORECASTS = nwp as NwpFile;
export const IMDAA_SOURCE = REANALYSIS.source;

export interface Signal { label: string; detail: string; kind: 'system' | 'flow' | 'heat' | 'shear' }
export interface RiskFlag { label: string; weight: number }

export interface CaseCell {
  region: string;
  day: number;
  date: string;
  leadDay: number;
  forecast: number | null;
  observed: number | null;
  error: number | null;
  outcome: Outcome;
  diagnostics: Diagnostics | null;
  signals: Signal[];
  flags: RiskFlag[];
  riskScore: number;
  risk: Confidence; // 'low' = low confidence (high risk), matching the rest of the dashboard
}

export interface BasinSystem { day: number; date: string; basin: string; label: string; detail: string }

const WEST_COAST = new Set(['Kerala', 'Karnataka', 'Goa', 'Maharashtra', 'Gujarat']);
const BAY_STATES = new Set(['Odisha', 'West Bengal', 'Andhra Pradesh', 'Jharkhand', 'Chhattisgarh', 'Telangana']);
const MONSOON_CORE = new Set([...WEST_COAST, 'Madhya Pradesh', 'Chhattisgarh', 'Odisha', 'Telangana', 'Andhra Pradesh']);
/** Steep terrain where grid-scale models under-resolve orographic rain (a priori, not from verification). */
const OROGRAPHIC = new Set(['Meghalaya', 'Sikkim', 'Arunachal Pradesh', 'Kerala', 'Karnataka', 'Goa', 'Uttarakhand', 'Himachal Pradesh', 'Jammu & Kashmir']);

const addDays = (isoDate: string, days: number) => new Date(Date.parse(isoDate) + days * 86_400_000).toISOString().slice(0, 10);

function basinSystems(date: string, day: number): BasinSystem[] {
  const entry = REANALYSIS.days[date];
  if (!entry?.complete) return [];
  const systems: BasinSystem[] = [];
  const arabian = entry.seas['Arabian Sea'];
  if (arabian && arabian.vortMax >= 12) {
    systems.push({
      day, date, basin: 'Arabian Sea',
      label: arabian.windMax >= 17 ? 'Cyclonic storm over the Arabian Sea' : 'Depression / strong low over the Arabian Sea',
      detail: `850 hPa vorticity ${arabian.vortMax}×10⁻⁵ s⁻¹ near ${arabian.lat}°N ${arabian.lon}°E, winds up to ${arabian.windMax} m/s`,
    });
  }
  const bay = entry.seas['Bay of Bengal'];
  if (bay && bay.vortMax >= 7.5 && bay.windMax >= 12) {
    systems.push({
      day, date, basin: 'Bay of Bengal',
      label: 'Low-level cyclonic circulation over the Bay of Bengal',
      detail: `850 hPa vorticity ${bay.vortMax}×10⁻⁵ s⁻¹ near ${bay.lat}°N ${bay.lon}°E, winds up to ${bay.windMax} m/s`,
    });
  }
  return systems;
}

function signalsFor(region: string, d: Diagnostics | null, basins: BasinSystem[], month: number): Signal[] {
  const signals: Signal[] = [];
  if (d) {
    if ((d.vort850Max ?? 0) >= 12 && (d.ws850Max ?? 0) >= 10) {
      signals.push({ kind: 'system', label: 'Cyclonic circulation over the state', detail: `850 hPa vorticity up to ${d.vort850Max}×10⁻⁵ s⁻¹ with ${d.ws850Max} m/s winds` });
    }
    if ((d.u850 ?? 0) >= 9) {
      signals.push({ kind: 'flow', label: 'Strong monsoon westerlies', detail: `850 hPa westerly wind ${d.u850} m/s` });
    } else if (month === 6 && MONSOON_CORE.has(region) && d.u850 !== null && d.u850 <= 2) {
      signals.push({ kind: 'flow', label: 'Weak / delayed monsoon flow', detail: `850 hPa westerly wind only ${d.u850} m/s` });
    }
    if ((d.t850 ?? 0) >= 27) {
      signals.push({ kind: 'heat', label: 'Very hot lower atmosphere', detail: `850 hPa temperature ${d.t850} °C` });
    }
    if ((d.shear ?? 0) >= 28) {
      signals.push({ kind: 'shear', label: 'Strong vertical wind shear', detail: `850–200 hPa shear ${d.shear} m/s` });
    }
  }
  for (const basin of basins) {
    if ((basin.basin === 'Arabian Sea' && WEST_COAST.has(region)) || (basin.basin === 'Bay of Bengal' && BAY_STATES.has(region))) {
      signals.push({ kind: 'system', label: basin.label, detail: `${basin.detail}; it reorganises moisture supply to this coast` });
    }
  }
  return signals;
}

function flagsFor(region: string, day: number, forecast: number | null, signals: Signal[], d: Diagnostics | null, month: number): RiskFlag[] {
  const flags: RiskFlag[] = [];
  if (signals.some((s) => s.kind === 'system')) flags.push({ label: 'Organised cyclonic system nearby', weight: 2 });
  if (OROGRAPHIC.has(region)) {
    const strongFlow = (d?.ws850 ?? 0) >= 8;
    flags.push({ label: strongFlow ? 'Strong moist flow onto steep terrain' : 'Steep terrain (orographic rain)', weight: strongFlow ? 2 : 1 });
  }
  const climate = observedMonthly(region, month);
  if (forecast !== null && climate && forecast >= climate.p95) flags.push({ label: `Forecast ≥ observed P95 (${climate.p95} mm)`, weight: 1 });
  if (signals.some((s) => s.label.startsWith('Weak'))) flags.push({ label: 'Monsoon onset / weak flow phase', weight: 1 });
  if (day >= 4) flags.push({ label: `Lead day ${day}`, weight: 1 });
  return flags;
}

const cache = new Map<CaseId, CaseCell[]>();

export function getCaseCells(id: CaseId): CaseCell[] {
  const cached = cache.get(id);
  if (cached) return cached;
  const definition = CASES.find((c) => c.id === id)!;
  const run = FORECASTS.initializations[definition.run];
  const month = Number(definition.run.slice(5, 7));
  const threshold = getRealVerification().bustThreshold;
  const cells: CaseCell[] = [];
  for (let day = 1; day <= 10; day += 1) {
    const date = addDays(definition.run, day - 1);
    const leadDay = day - 1;
    const basins = basinSystems(date, day);
    const reanalysisDay = REANALYSIS.days[date];
    for (const { name } of STATE_POSITIONS) {
      const index = run?.days.indexOf(leadDay) ?? -1;
      const forecast = index >= 0 ? run.regions[name]?.[index]?.mean ?? null : null;
      const observed = observedRainfall(name, date);
      const error = forecast !== null && observed !== null ? Math.round((forecast - observed) * 10) / 10 : null;
      const outcome: Outcome = error === null ? (forecast === null ? 'no-forecast' : 'no-data')
        : Math.abs(error) >= threshold ? 'bust' : Math.abs(error) >= threshold * 0.6 ? 'large' : 'ok';
      const diagnostics = reanalysisDay?.complete ? reanalysisDay.regions[name] ?? null : null;
      const signals = signalsFor(name, diagnostics, basins, month);
      const flags = flagsFor(name, day, forecast, signals, diagnostics, month);
      const riskScore = flags.reduce((sum, flag) => sum + flag.weight, 0);
      cells.push({
        region: name, day, date, leadDay, forecast, observed, error, outcome, diagnostics, signals, flags, riskScore,
        risk: riskScore >= 3 ? 'low' : riskScore >= 2 ? 'medium' : 'high',
      });
    }
  }
  cache.set(id, cells);
  return cells;
}

export function getCaseDay(id: CaseId, day: number) {
  return getCaseCells(id).filter((cell) => cell.day === day);
}

export function getCaseBasinSystems(id: CaseId): BasinSystem[] {
  const definition = CASES.find((c) => c.id === id)!;
  return Array.from({ length: 10 }, (_, i) => basinSystems(addDays(definition.run, i), i + 1)).flat();
}

export function reanalysisAvailable(date: string) {
  return Boolean(REANALYSIS.days[date]?.complete);
}

/** How well the rule-based risk level anticipated the real busts (days with forecasts only). */
export function getCaseEvaluation(id: CaseId) {
  const verified = getCaseCells(id).filter((cell) => cell.outcome !== 'no-forecast' && cell.outcome !== 'no-data');
  const busts = verified.filter((cell) => cell.outcome === 'bust');
  const flagged = verified.filter((cell) => cell.risk !== 'high');
  const caught = busts.filter((cell) => cell.risk !== 'high');
  const falseAlarms = flagged.filter((cell) => cell.outcome !== 'bust');
  const rate = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
  const byRisk = (['low', 'medium', 'high'] as Confidence[]).map((risk) => {
    const group = verified.filter((cell) => cell.risk === risk);
    return { risk, cells: group.length, busts: group.filter((cell) => cell.outcome === 'bust').length, bustRate: rate(group.filter((cell) => cell.outcome === 'bust').length, group.length) };
  });
  return {
    verified: verified.length,
    busts: busts.length,
    caught: caught.length,
    hitRate: rate(caught.length, busts.length),
    falseAlarmRatio: rate(falseAlarms.length, flagged.length),
    baseRate: rate(busts.length, verified.length),
    byRisk,
  };
}
