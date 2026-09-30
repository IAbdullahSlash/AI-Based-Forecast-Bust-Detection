import { useMemo, useState } from 'react';
import { BrainCircuit, CheckCircle2, CloudRain, Database, Scale, Thermometer } from 'lucide-react';
import { getRealModel, getRealTempModel } from '../analysis/realModel';
import { getTempVerification } from '../analysis/tempVerification';
import nwpForecasts from '../data/nwpForecasts.json';
import { STATE_POSITIONS } from '../data/regions';
import {
  IMD_NOTE, IMD_SOURCE, IMD_YEAR_LABEL, IMD_YEARS, getRealVerification, monsoonAverages, observedMonthly, observedSummary,
} from '../analysis/forecastEngine';
import { observedRainfall } from '../data/observations';
import { confidenceColor } from '../theme';

type NwpInit = { variable: string; days: number[]; indiaMax: number[]; regions: Record<string, { mean: number; max: number }[]> };
const NWP = nwpForecasts as { source: string; note: string; initializations: Record<string, NwpInit> };
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const YEAR_RANGE = IMD_YEAR_LABEL;

function rainCellColor(mm: number) {
  // IMD 24 h categories: light < 15.6, moderate < 64.5, heavy and above.
  if (mm >= 64.5) return { background: '#dc2626', color: '#fff' };
  if (mm >= 15.6) return { background: '#3b82f6', color: '#fff' };
  if (mm >= 2.5) return { background: 'var(--rain-light-bg)', color: 'var(--rain-light-fg)' };
  return { background: 'var(--rain-none-bg)', color: 'var(--rain-none-fg)' };
}

/** Diverging colour for forecast − observed: rose = under-forecast, sky = over-forecast. */
function errorCellColor(error: number, threshold: number) {
  const strength = Math.min(1, Math.abs(error) / (threshold * 1.5));
  if (strength < 0.08) return { background: 'var(--rain-none-bg)', color: 'var(--rain-none-fg)' };
  const rgb = error < 0 ? '244, 63, 94' : '14, 165, 233';
  return { background: `rgba(${rgb}, ${0.15 + strength * 0.75})`, color: strength > 0.55 ? '#fff' : 'inherit' };
}

function climatologyColor(mm: number) {
  const t = Math.min(1, Math.sqrt(mm / 30));
  return { background: `rgba(37, 99, 235, ${0.06 + t * 0.85})`, color: t > 0.55 ? '#fff' : 'inherit' };
}

const addDays = (isoDate: string, days: number) => new Date(Date.parse(isoDate) + days * 86_400_000).toISOString().slice(0, 10);

type NwpMode = 'forecast' | 'observed' | 'error';

export function NwpIngestionPanel() {
  const inits = Object.keys(NWP.initializations);
  const [init, setInit] = useState(inits[0]);
  const [mode, setMode] = useState<NwpMode>('error');
  const threshold = getRealVerification().bustThreshold;
  const entry = NWP.initializations[init];
  if (!entry) return null;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Database size={15} className="text-emerald-600" /> NCMRWF forecast vs IMD observed rainfall
        </h3>
        <div className="flex gap-2 flex-wrap">
          <div className="flex p-0.5 bg-slate-100 rounded-lg">
            {(['forecast', 'observed', 'error'] as const).map((key) => (
              <button key={key} onClick={() => setMode(key)}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium capitalize ${mode === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                {key}
              </button>
            ))}
          </div>
          <div className="flex p-0.5 bg-slate-100 rounded-lg">
            {inits.map((key) => (
              <button key={key} onClick={() => setInit(key)}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium ${key === init ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                Run {key}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-slate-500 mb-2">
        {mode === 'error'
          ? `Forecast − observed (mm/24 h). Rose = under-forecast, blue = over-forecast; outlined cells are busts (|error| ≥ ${threshold} mm).`
          : mode === 'observed' ? 'IMD gridded observation for each valid date (state mean, mm/24 h).' : 'NCMRWF Unified Model forecast (state mean, mm/24 h).'}
        {' '}State means use the same boundary masks for both datasets.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-[10px] border-separate table-fixed" style={{ borderSpacing: 2 }}>
          <thead>
            <tr>
              <th className="text-left font-medium text-slate-500 pr-2 w-32">Region</th>
              {entry.days.map((d) => (
                <th key={d} className="font-medium text-slate-500">
                  D{d}<div className="font-normal text-[9px] text-slate-400">{addDays(init, d).slice(5)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STATE_POSITIONS.map((state) => (
              <tr key={state.name}>
                <td className="pr-2 whitespace-nowrap text-slate-600 truncate">{state.name}</td>
                {(entry.regions[state.name] ?? []).map((value, i) => {
                  const validDate = addDays(init, entry.days[i]);
                  const observed = observedRainfall(state.name, validDate);
                  const error = observed === null ? null : Math.round((value.mean - observed) * 10) / 10;
                  const shown = mode === 'forecast' ? value.mean : mode === 'observed' ? observed : error;
                  const style = shown === null ? { background: 'var(--rain-none-bg)', color: 'var(--rain-none-fg)' }
                    : mode === 'error' ? errorCellColor(shown, threshold) : rainCellColor(shown);
                  const bust = error !== null && Math.abs(error) >= threshold;
                  return (
                    <td key={i}
                      className={`text-center rounded font-semibold h-6 tabular-nums ${mode === 'error' && bust ? 'ring-2 ring-inset ring-rose-600' : ''}`}
                      style={style}
                      title={`${state.name}, ${validDate}: forecast ${value.mean} mm, observed ${observed ?? 'n/a'} mm${error !== null ? `, error ${error > 0 ? '+' : ''}${error} mm` : ''}`}>
                      {shown === null ? '–' : mode === 'error' && shown > 0 ? `+${shown}` : shown}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RealVerificationPanel({ onSelectRegion }: { onSelectRegion: (region: string) => void }) {
  const verification = getRealVerification();
  if (!verification.overall) {
    return (
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Real forecast verification</h3>
        <p className="text-xs text-slate-500">
          No overlapping dates: forecasts cover {verification.forecastInits.join(', ')}; IMD observations cover {verification.observationYears.join(', ')}.
          Add the IMD file for the forecast year to dataset/IMD and run <code>npm run extract:imd</code>.
        </p>
      </div>
    );
  }
  const maxMae = Math.max(...verification.byLead.map((lead) => lead.mae), 1);
  const { overall } = verification;
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Scale size={15} className="text-emerald-600" /> Real verification · NCMRWF vs IMD
        </h3>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium flex items-center gap-1">
          <CheckCircle2 size={11} /> Real data · {verification.pairs.length} pairs
        </span>
      </div>
      <p className="text-[11px] text-slate-500 mb-3">
        NCMRWF S2S runs of {verification.forecastInits.join(', ')} (Days 1–11) against IMD gridded rainfall on the same state and date.
        {verification.forecastInits.length} runs is still a small sample, so treat per-lead numbers as indicative.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {[
          { label: 'MAE', value: `${overall.mae} mm` },
          { label: 'Bias', value: `${overall.bias > 0 ? '+' : ''}${overall.bias} mm` },
          { label: 'Correlation', value: overall.correlation.toFixed(2) },
          { label: 'Bust if |error| ≥', value: `${verification.bustThreshold} mm` },
        ].map((item) => (
          <div key={item.label} className="bg-slate-50 rounded-lg px-2.5 py-2">
            <div className="text-[10px] font-medium text-slate-500">{item.label}</div>
            <div className="text-base font-semibold text-slate-900 tabular-nums">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold text-slate-800 mb-2">Error by lead day</h4>
          <div className="space-y-1.5">
            {verification.byLead.map((lead) => (
              <div key={lead.leadDay} className="flex items-center gap-2 text-[11px]">
                <span className="w-7 text-slate-500 font-medium">D{lead.leadDay}</span>
                <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
                  <div className="h-full rounded bg-sky-500 transition-all" style={{ width: `${(lead.mae / maxMae) * 100}%` }} />
                </div>
                <span className="w-28 text-right tabular-nums text-slate-700 whitespace-nowrap">{lead.mae} mm · {lead.bustRate}% bust</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            Day 0 shows a dry bias ({verification.byLead[0]?.bias} mm), consistent with model spin-up. Error and bust rate grow toward Day 10.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-slate-800 mb-2">Most error-prone states (real)</h4>
          <div className="space-y-1">
            {verification.byRegion.slice(0, 6).map((region) => (
              <button key={region.region} onClick={() => onSelectRegion(region.region)}
                className="w-full flex items-center gap-2 text-[11px] rounded-md px-2 py-1 hover:bg-slate-50 text-left">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: confidenceColor(region.confidence) }} />
                <span className="flex-1 font-medium text-slate-800">{region.region}</span>
                <span className="tabular-nums text-slate-600">MAE {region.mae}</span>
                <span className={`tabular-nums w-20 text-right ${region.bias < 0 ? 'text-rose-600' : 'text-sky-600'}`}>
                  {region.bias < 0 ? 'under' : 'over'} {Math.abs(region.bias)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <h4 className="text-xs font-semibold text-slate-800 mt-4 mb-2">Largest real forecast busts</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-slate-500 text-left">
              <th className="font-medium py-1">State</th><th className="font-medium">Valid date</th><th className="font-medium">Lead</th>
              <th className="font-medium text-right">Forecast</th><th className="font-medium text-right">Observed</th><th className="font-medium text-right">Error</th>
            </tr>
          </thead>
          <tbody>
            {verification.worstCases.map((pair) => (
              <tr key={`${pair.region}-${pair.initDate}-${pair.leadDay}`} className="border-t border-slate-100">
                <td className="py-1 font-medium text-slate-800">{pair.region}</td>
                <td className="text-slate-600">{pair.validDate}</td>
                <td className="text-slate-600">D{pair.leadDay}</td>
                <td className="text-right tabular-nums text-slate-700">{pair.forecast}</td>
                <td className="text-right tabular-nums text-slate-700">{pair.observed}</td>
                <td className={`text-right tabular-nums font-semibold ${pair.error < 0 ? 'text-rose-600' : 'text-sky-600'}`}>{pair.error > 0 ? '+' : ''}{pair.error}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ObservedClimatologyPanel({ region, onSelectRegion }: { region: string | null; onSelectRegion: (region: string) => void }) {
  const rows = useMemo(() => STATE_POSITIONS.map((state) => ({
    name: state.name,
    monthly: Array.from({ length: 12 }, (_, i) => observedMonthly(state.name, i + 1)?.mean ?? 0),
    monsoon: monsoonAverages(state.name),
    record: observedSummary(state.name)?.maxCellRain,
  })), []);
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <CloudRain size={15} className="text-blue-600" /> Observed rainfall climatology · IMD {YEAR_RANGE}
        </h3>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium flex items-center gap-1">
          <CheckCircle2 size={11} /> Real data · {IMD_YEARS.length} years
        </span>
      </div>
      <p className="text-[11px] text-slate-500 mb-2">{IMD_SOURCE}. Monthly mean state rainfall (mm/day). {IMD_NOTE}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-[10px] border-separate table-fixed" style={{ borderSpacing: 2 }}>
          <thead>
            <tr className="text-slate-500">
              <th className="text-left font-medium pr-2 w-32">Region</th>
              {MONTHS.map((month, i) => <th key={i} className="font-medium">{month}</th>)}
              <th className="font-medium w-16">JJAS mm</th>
              <th className="font-medium w-14" title="Days per monsoon with ≥10% of the state getting ≥64.5 mm">Heavy d</th>
              <th className="font-medium w-24 text-right">Record cell</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} onClick={() => onSelectRegion(row.name)} className="cursor-pointer">
                <td className={`pr-2 whitespace-nowrap truncate ${row.name === region ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{row.name}</td>
                {row.monthly.map((mm, i) => (
                  <td key={i} className="text-center rounded h-5 tabular-nums" style={climatologyColor(mm)}>{mm >= 10 ? Math.round(mm) : mm}</td>
                ))}
                <td className="text-center tabular-nums text-slate-700">{row.monsoon?.total}</td>
                <td className="text-center tabular-nums text-slate-700">{row.monsoon?.widespreadHeavyDays}</td>
                <td className="text-right tabular-nums text-slate-600" title={row.record?.date}>{row.record?.mm} <span className="text-slate-400">{row.record?.date.slice(0, 7)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RealModelCard({ variable = 'rainfall' }: { variable?: 'rainfall' | 'temperature' }) {
  const model = variable === 'temperature' ? getRealTempModel() : getRealModel();
  const perRunMean = Math.round((model.byRun.reduce((sum, run) => sum + run.auc, 0) / model.byRun.length) * 100) / 100;
  const skill = Math.round((1 - model.brier / model.climatologyBrier) * 100);
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><BrainCircuit size={15} className="text-violet-500" /> Real bust model · {variable === 'temperature' ? 'Temperature' : 'Rainfall'}</h3>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium flex items-center gap-1">
          <CheckCircle2 size={11} /> Trained on real data
        </span>
      </div>
      <p className="text-[11px] text-slate-500 mb-3">
        Logistic regression on {model.pairs.toLocaleString()} NCMRWF S2S vs IMD pairs ({model.busts} busts). Each run is scored by a model trained on the
        other {model.runs.length - 1} runs only (leave-one-run-out), so these are out-of-sample numbers.
      </p>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'ROC AUC (held-out)', value: model.auc.toFixed(2) },
          { label: 'Brier skill', value: `${skill}%` },
          { label: `${model.baselineLabel} (AUC)`, value: model.baselineAuc.toFixed(2) },
        ].map((item) => (
          <div key={item.label} className="bg-violet-50 rounded-lg px-2 py-1.5">
            <div className="text-[10px] text-violet-700">{item.label}</div>
            <div className="text-sm font-semibold text-violet-950">{item.value}</div>
          </div>
        ))}
      </div>
      <h4 className="text-xs font-semibold text-slate-800 mb-1.5">Learned drivers</h4>
      <div className="space-y-1 mb-3">
        {model.drivers.map((driver) => (
          <div key={driver.feature} className="flex items-center gap-2 text-[11px]">
            <span className="flex-1 text-slate-600">{driver.feature}</span>
            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${driver.weight >= 0 ? 'bg-violet-500' : 'bg-slate-400'}`} style={{ width: `${Math.min(100, Math.abs(driver.weight) * 120)}%` }} />
            </div>
            <span className="w-10 text-right tabular-nums text-slate-700">{driver.weight > 0 ? '+' : ''}{driver.weight}</span>
          </div>
        ))}
      </div>
      <div className="text-[11px] text-slate-500 space-y-1">
        <p>Held-out AUC by run: {model.byRun.map((run) => `${run.run.slice(5, 7)}/${run.run.slice(0, 4)} ${run.auc.toFixed(2)}`).join(' · ')}.</p>
        {variable === 'temperature' ? (
          <p>
            Honest caveat: within each run the model ranks busts well (mean held-out AUC {perRunMean.toFixed(2)}), but pooled across runs it drops to {model.auc.toFixed(2)}
            because June's corrected forecasts are systematically too cold (the correction was learned from monsoon months).
            The single predictor "{model.baselineLabel.toLowerCase()}" scores {model.baselineAuc.toFixed(2)}. More runs per month are needed.
          </p>
        ) : (
          <p>
            Honest caveat: with only {model.runs.length} runs, forecast rainfall amount alone ranks busts about as well ({model.baselineAuc.toFixed(2)}).
            The pressure, terrain and lead-time predictors make the probabilities calibrated and explainable; more runs are needed to show they add ranking skill.
          </p>
        )}
      </div>
    </div>
  );
}

export function TempVerificationPanel({ onSelectRegion }: { onSelectRegion: (region: string) => void }) {
  const verification = getTempVerification();
  if (!verification.overall) return null;
  const { overall } = verification;
  const maxMae = Math.max(...verification.byLead.map((lead) => lead.mae), 1);
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Thermometer size={15} className="text-orange-500" /> Real verification · Temperature (NCMRWF vs IMD)
        </h3>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium flex items-center gap-1">
          <CheckCircle2 size={11} /> Real data · {verification.pairs.length} pairs
        </span>
      </div>
      <p className="text-[11px] text-slate-500 mb-3">
        S2S has no 2 m temperature, so the 925 hPa forecast is corrected to surface Tmax with MOS (Tmax ≈ a_state + {verification.slope}·T925),
        fitted on the other runs only, then compared with IMD 1° gridded Tmax.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {[
          { label: 'MAE after MOS', value: `${overall.mae} °C` },
          { label: 'Raw 925 hPa MAE', value: `${overall.rawMae} °C` },
          { label: 'Bias', value: `${overall.bias > 0 ? '+' : ''}${overall.bias} °C` },
          { label: 'Bust if |error| ≥', value: `${verification.bustThreshold} °C` },
        ].map((item) => (
          <div key={item.label} className="bg-slate-50 rounded-lg px-2.5 py-2">
            <div className="text-[10px] font-medium text-slate-500">{item.label}</div>
            <div className="text-base font-semibold text-slate-900 tabular-nums">{item.value}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold text-slate-800 mb-2">Error by lead day</h4>
          <div className="space-y-1.5">
            {verification.byLead.map((lead) => (
              <div key={lead.leadDay} className="flex items-center gap-2 text-[11px]">
                <span className="w-7 text-slate-500 font-medium">D{lead.leadDay}</span>
                <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
                  <div className="h-full rounded bg-orange-500 transition-all" style={{ width: `${(lead.mae / maxMae) * 100}%` }} />
                </div>
                <span className="w-28 text-right tabular-nums text-slate-700 whitespace-nowrap">{lead.mae} °C · {lead.bustRate}% bust</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-slate-800 mb-2">Most error-prone states (real)</h4>
          <div className="space-y-1">
            {verification.byRegion.slice(0, 6).map((region) => (
              <button key={region.region} onClick={() => onSelectRegion(region.region)}
                className="w-full flex items-center gap-2 text-[11px] rounded-md px-2 py-1 hover:bg-slate-50 text-left">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: confidenceColor(region.confidence) }} />
                <span className="flex-1 font-medium text-slate-800">{region.region}</span>
                <span className="tabular-nums text-slate-600">MAE {region.mae}</span>
                <span className="tabular-nums w-16 text-right text-slate-600">{region.busts} busts</span>
              </button>
            ))}
          </div>
          <h4 className="text-xs font-semibold text-slate-800 mt-3 mb-1">Largest busts</h4>
          <div className="space-y-0.5 text-[11px]">
            {verification.worstCases.slice(0, 4).map((pair) => (
              <div key={`${pair.region}-${pair.initDate}-${pair.leadDay}`} className="flex justify-between text-slate-600">
                <span>{pair.region} · {pair.validDate} · D{pair.leadDay}</span>
                <span className="tabular-nums">{pair.forecast} vs {pair.observed} °C <b className={pair.error > 0 ? 'text-rose-600' : 'text-sky-600'}>{pair.error > 0 ? '+' : ''}{pair.error}</b></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
