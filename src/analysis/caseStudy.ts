import type { Confidence } from '../types/index.ts';
import imdaa from '../data/imdaaAnalysis.json' with { type: 'json' };
import { observedRainfall } from '../data/observations.ts';
import { STATE_POSITIONS } from '../data/regions.ts';
import { getRealVerification, type RealPair } from './verification.ts';
import { OROGRAPHIC, REAL_FEATURES, auc, getRealModel } from './realModel.ts';

// Real case studies: each NCMRWF S2S run (dataset/s2s) verified against IMD.
// Day d of a case is the date run + (d − 1) and uses forecast file day(d − 1).
// Predicted risk comes only from forecast-time information: the real bust model
// (probabilities from a model that never saw this run) and transparent rule
// flags. IMDAA reanalysis, where available, explains what the weather actually did.

export type CaseId = string;
export type Outcome = 'bust' | 'large' | 'ok' | 'no-forecast' | 'no-data';

export interface CaseDefinition { id: CaseId; label: string; short: string; run: string }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const CASES: CaseDefinition[] = getRealVerification().forecastInits.map((run) => {
  const month = Number(run.slice(5, 7)) - 1;
  const start = Number(run.slice(8, 10));
  return {
    id: run,
    label: `Real case · ${start}–${start + 9} ${MONTH_NAMES[month]} ${run.slice(0, 4)}`,
    short: `${MONTHS[month]} ${run.slice(0, 4)}`,
    run,
  };
});

interface Diagnostics {
  ws850: number | null; ws850Max: number | null; u850: number | null; vort850: number | null;
  vort850Max: number | null; t850: number | null; ws200: number | null; shear: number | null;
}
interface SeaSystem { vortMax: number; lat: number; lon: number; windMax: number }
interface ImdaaFile {
  source: string;
  days: Record<string, { complete: boolean; regions: Record<string, Diagnostics>; seas: Record<string, SeaSystem> }>;
}

const REANALYSIS = imdaa as ImdaaFile;
export const IMDAA_SOURCE = REANALYSIS.source;

export interface Signal { label: string; detail: string; kind: 'system' | 'flow' | 'heat' | 'shear' | 'forecast' }
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
  mslp: number | null;
  mslpAnomaly: number | null;
  pressureTendency: number | null;
  /** Out-of-fold probability from the real bust model (0–100), null without a forecast. */
  probability: number | null;
  drivers: { feature: string; contribution: number }[];
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

const addDays = (isoDate: string, days: number) => new Date(Date.parse(isoDate) + days * 86_400_000).toISOString().slice(0, 10);

/** Risk tier from the model probability; the real base bust rate is about 10%. */
export function riskFromProbability(probability: number): Confidence {
  if (probability >= 30) return 'low';
  if (probability >= 15) return 'medium';
  return 'high';
}

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

/** What the weather actually did (IMDAA reanalysis) — explanation, not a predictor. */
function observedSignals(region: string, d: Diagnostics | null, basins: BasinSystem[], month: number): Signal[] {
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
    if ((d.t850 ?? 0) >= 27) signals.push({ kind: 'heat', label: 'Very hot lower atmosphere', detail: `850 hPa temperature ${d.t850} °C` });
    if ((d.shear ?? 0) >= 28) signals.push({ kind: 'shear', label: 'Strong vertical wind shear', detail: `850–200 hPa shear ${d.shear} m/s` });
  }
  for (const basin of basins) {
    if ((basin.basin === 'Arabian Sea' && WEST_COAST.has(region)) || (basin.basin === 'Bay of Bengal' && BAY_STATES.has(region))) {
      signals.push({ kind: 'system', label: basin.label, detail: `${basin.detail}; it reorganises moisture supply to this coast` });
    }
  }
  return signals;
}

/** Transparent rule flags from forecast-time information only. */
function forecastFlags(region: string, day: number, pair: RealPair | undefined): RiskFlag[] {
  if (!pair) return [];
  const flags: RiskFlag[] = [];
  if (pair.mslpAnomaly !== null && pair.mslpAnomaly <= -3) flags.push({ label: `Forecast deep low (${pair.mslpAnomaly} hPa vs model normal)`, weight: 2 });
  if (pair.pressureTendency !== null && Math.abs(pair.pressureTendency) >= 2) flags.push({ label: `Rapid pressure change (${pair.pressureTendency > 0 ? '+' : ''}${pair.pressureTendency} hPa/day)`, weight: 1 });
  if (OROGRAPHIC.has(region)) {
    const heavy = pair.forecast >= 10;
    flags.push({ label: heavy ? 'Heavy rain forecast over steep terrain' : 'Steep terrain (orographic rain)', weight: heavy ? 2 : 1 });
  }
  if (pair.observedP95 !== null && pair.forecast >= pair.observedP95) flags.push({ label: `Forecast ≥ observed P95 (${pair.observedP95} mm)`, weight: 1 });
  if (day >= 4) flags.push({ label: `Lead day ${day}`, weight: 1 });
  return flags;
}

const cache = new Map<CaseId, CaseCell[]>();

export function getCaseCells(id: CaseId): CaseCell[] {
  const cached = cache.get(id);
  if (cached) return cached;
  const definition = CASES.find((c) => c.id === id)!;
  const month = Number(definition.run.slice(5, 7));
  const verification = getRealVerification();
  const model = getRealModel();
  const pairs = new Map(verification.pairs
    .filter((pair) => pair.initDate === definition.run)
    .map((pair) => [`${pair.region}|${pair.leadDay}`, pair]));
  const threshold = verification.bustThreshold;
  const cells: CaseCell[] = [];
  for (let day = 1; day <= 10; day += 1) {
    const date = addDays(definition.run, day - 1);
    const leadDay = day - 1;
    const basins = basinSystems(date, day);
    const reanalysisDay = REANALYSIS.days[date];
    for (const { name } of STATE_POSITIONS) {
      const pair = pairs.get(`${name}|${leadDay}`);
      const observed = pair?.observed ?? observedRainfall(name, date);
      const forecast = pair?.forecast ?? null;
      const error = pair ? pair.error : null;
      const outcome: Outcome = error === null ? (forecast === null ? 'no-forecast' : 'no-data')
        : Math.abs(error) >= threshold ? 'bust' : Math.abs(error) >= threshold * 0.6 ? 'large' : 'ok';
      const prediction = pair ? model.outOfFold.get(pair) : undefined;
      const probability = prediction ? Math.round(prediction.probability * 100) : null;
      const diagnostics = reanalysisDay?.complete ? reanalysisDay.regions[name] ?? null : null;
      const flags = forecastFlags(name, day, pair);
      const signals: Signal[] = [];
      if (pair?.mslpAnomaly !== null && pair?.mslpAnomaly !== undefined && pair.mslpAnomaly <= -3) {
        signals.push({ kind: 'forecast', label: 'Forecast low-pressure area', detail: `Forecast sea-level pressure ${pair.mslp} hPa, ${Math.abs(pair.mslpAnomaly)} hPa below the model normal` });
      }
      signals.push(...observedSignals(name, diagnostics, basins, month));
      cells.push({
        region: name, day, date, leadDay, forecast, observed, error, outcome,
        mslp: pair?.mslp ?? null, mslpAnomaly: pair?.mslpAnomaly ?? null, pressureTendency: pair?.pressureTendency ?? null,
        probability,
        drivers: prediction
          ? prediction.contributions.map((contribution, i) => ({ feature: REAL_FEATURES[i], contribution: Math.round(contribution * 100) / 100 }))
            .filter((driver) => driver.contribution >= 0.15).sort((a, b) => b.contribution - a.contribution).slice(0, 3)
          : [],
        diagnostics, signals, flags,
        riskScore: flags.reduce((sum, flag) => sum + flag.weight, 0),
        risk: probability === null ? 'high' : riskFromProbability(probability),
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

export function reanalysisCovers(id: CaseId) {
  const definition = CASES.find((c) => c.id === id)!;
  return Array.from({ length: 10 }, (_, i) => addDays(definition.run, i)).some((date) => date in REANALYSIS.days);
}

/** How well the predicted risk anticipated the real busts in this case. */
export function getCaseEvaluation(id: CaseId) {
  const verified = getCaseCells(id).filter((cell) => cell.error !== null);
  const labels = verified.map((cell) => (cell.outcome === 'bust' ? 1 : 0));
  const busts = verified.filter((cell) => cell.outcome === 'bust');
  const flagged = verified.filter((cell) => cell.risk !== 'high');
  const caught = busts.filter((cell) => cell.risk !== 'high');
  const falseAlarms = flagged.filter((cell) => cell.outcome !== 'bust');
  const rate = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
  const byRisk = (['low', 'medium', 'high'] as Confidence[]).map((risk) => {
    const group = verified.filter((cell) => cell.risk === risk);
    const groupBusts = group.filter((cell) => cell.outcome === 'bust').length;
    return { risk, cells: group.length, busts: groupBusts, bustRate: rate(groupBusts, group.length) };
  });
  return {
    verified: verified.length,
    busts: busts.length,
    caught: caught.length,
    hitRate: rate(caught.length, busts.length),
    falseAlarmRatio: rate(falseAlarms.length, flagged.length),
    baseRate: rate(busts.length, verified.length),
    modelAuc: Math.round(auc(verified.map((cell) => cell.probability ?? 0), labels) * 100) / 100,
    rulesAuc: Math.round(auc(verified.map((cell) => cell.riskScore), labels) * 100) / 100,
    byRisk,
  };
}
