import { useState } from 'react';
import { AlertTriangle, BrainCircuit, CloudLightning, Database, Grid3x3, TrendingUp } from 'lucide-react';
import nwpForecasts from '../data/nwpForecasts.json';
import type { EvaluatedVariable } from '../types';
import { STATE_POSITIONS } from '../data/regions';
import {
  DAYS, UNITS, getActiveSystems, getConfidenceByDay, getErrorProneRegions, getLeadErrorCurve, getModelMetrics,
} from '../analysis/forecastEngine';

export function bustCellColor(probability: number) {
  if (probability >= 40) return '#ef4444';
  if (probability >= 20) return '#eab308';
  if (probability >= 10) return '#86efac';
  return '#dcfce7';
}

/** Region × lead-time matrix of bust probability. */
export function BustHeatmap({ variable, day, region, onSelect }: {
  variable: EvaluatedVariable; day: number; region: string | null;
  onSelect: (region: string, day: number) => void;
}) {
  const byDay = getConfidenceByDay(variable);
  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Grid3x3 size={15} /> Bust probability by region &amp; lead time</h3>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          {[['<10%', 5], ['10–20%', 15], ['20–40%', 30], ['≥40%', 50]].map(([label, value]) => (
            <span key={label} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: bustCellColor(value as number) }} />{label}
            </span>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] border-separate" style={{ borderSpacing: 2 }}>
          <thead>
            <tr>
              <th className="text-left font-medium text-slate-500 pr-2">Region</th>
              {DAYS.map((d) => (
                <th key={d} className={`font-medium w-10 ${d === day ? 'text-blue-600' : 'text-slate-500'}`}>D{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STATE_POSITIONS.map((state) => (
              <tr key={state.name}>
                <td className={`pr-2 whitespace-nowrap ${state.name === region ? 'font-bold text-blue-700' : 'text-slate-600'}`}>{state.name}</td>
                {DAYS.map((d) => {
                  const cell = byDay[d][state.name];
                  const selected = state.name === region && d === day;
                  return (
                    <td key={d} className="p-0">
                      <button
                        onClick={() => onSelect(state.name, d)}
                        title={`${state.name} · Day ${d}: ${cell.bustProbability}% bust probability (${cell.confidence} confidence)`}
                        className={`w-full h-5 rounded-sm font-semibold transition-transform hover:scale-110 ${selected ? 'ring-2 ring-blue-600' : ''}`}
                        style={{ backgroundColor: bustCellColor(cell.bustProbability), color: cell.bustProbability >= 40 ? '#fff' : '#334155' }}
                      >
                        {cell.bustProbability}
                      </button>
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

export function ErrorProneAreas({ variable, onSelect }: { variable: EvaluatedVariable; onSelect: (region: string, day: number) => void }) {
  const regions = getErrorProneRegions(variable);
  return (
    <div className="card p-3">
      <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2"><AlertTriangle size={15} className="text-red-500" /> Error-prone areas</h3>
      <p className="text-[10px] text-slate-500 mb-2">Regions with ≥ 40% bust probability on at least one forecast day</p>
      {regions.length === 0 ? (
        <p className="text-xs text-slate-500">No region crosses the low-confidence threshold in this forecast.</p>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {regions.map((item) => (
            <button
              key={item.region}
              onClick={() => onSelect(item.region, item.peakDay)}
              className="w-full text-left bg-red-50 hover:bg-red-100 rounded-lg px-2.5 py-2 text-xs transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">{item.region}</span>
                <span className="text-red-700 font-bold">{item.peakProbability}% · D{item.peakDay}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{item.driver}</div>
              <div className="text-[10px] text-red-600 mt-0.5">Low confidence: Day {item.lowConfidenceDays.join(', ')}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ActiveSystems({ day }: { day: number }) {
  const systems = getActiveSystems(day);
  return (
    <div className="card p-3">
      <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2"><CloudLightning size={15} className="text-indigo-500" /> Forecast weather systems · Day {day}</h3>
      {systems.length === 0 ? (
        <p className="text-xs text-slate-500">No organised systems forecast.</p>
      ) : (
        <div className="space-y-1.5">
          {systems.map((system) => (
            <div key={system.name} className="bg-indigo-50 rounded-lg px-2.5 py-1.5 text-xs">
              <div className="font-semibold text-indigo-900">{system.name}</div>
              <div className="text-[10px] text-indigo-700">{system.regions.join(', ')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ModelCard({ variable }: { variable: EvaluatedVariable }) {
  const metrics = getModelMetrics(variable);
  const skill = Math.round((1 - metrics.brier / metrics.climatologyBrier) * 100);
  return (
    <div className="card p-3">
      <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2"><BrainCircuit size={15} className="text-purple-500" /> Bust model verification</h3>
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        {[
          { label: 'ROC AUC', value: metrics.auc.toFixed(2) },
          { label: 'Brier skill', value: `${skill}%` },
          { label: 'Accuracy', value: `${metrics.accuracy}%` },
          { label: 'Base bust rate', value: `${metrics.baseRate}%` },
        ].map((item) => (
          <div key={item.label} className="bg-purple-50 rounded-lg px-2 py-1.5">
            <div className="text-[10px] text-purple-700">{item.label}</div>
            <div className="text-sm font-bold text-purple-950">{item.value}</div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-500 leading-relaxed">
        Logistic regression on forecast-time predictors (intensity, anomalies, pressure tendency, lead time, weather regime),
        trained on {metrics.trainSize.toLocaleString()} hindcast pairs and verified on {metrics.testSize} held-out {metrics.testYear} cases.
        Blended 60/40 with a k-nearest-neighbour analogue estimate.
      </p>
    </div>
  );
}

type NwpInit = { variable: string; days: number[]; indiaMax: number[]; regions: Record<string, { mean: number; max: number }[]> };
const NWP = nwpForecasts as { source: string; note: string; initializations: Record<string, NwpInit> };

function rainCellColor(mm: number) {
  // IMD 24 h categories: light < 15.6, moderate < 64.5, heavy and above.
  if (mm >= 64.5) return { background: '#dc2626', color: '#fff' };
  if (mm >= 15.6) return { background: '#60a5fa', color: '#fff' };
  if (mm >= 2.5) return { background: '#dbeafe', color: '#1e3a8a' };
  return { background: '#f8fafc', color: '#94a3b8' };
}

/** Real NCMRWF Unified Model hindcast rainfall read from dataset/*.nc. */
export function NwpIngestionPanel() {
  const inits = Object.keys(NWP.initializations);
  const [init, setInit] = useState(inits[0]);
  const entry = NWP.initializations[init];
  if (!entry) return null;
  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Database size={15} className="text-emerald-600" /> Real NWP ingestion · NCMRWF UM hindcast rainfall</h3>
        <div className="flex gap-1">
          {inits.map((key) => (
            <button key={key} onClick={() => setInit(key)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${key === init ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              IC {key}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-slate-500 mb-2">{NWP.note} Source: {NWP.source.trim()}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] border-separate" style={{ borderSpacing: 2 }}>
          <thead>
            <tr>
              <th className="text-left font-medium text-slate-500 pr-2">Region (mm/24 h)</th>
              {entry.days.map((d) => <th key={d} className="font-medium text-slate-500 w-12">day{String(d).padStart(2, '0')}</th>)}
            </tr>
          </thead>
          <tbody>
            {STATE_POSITIONS.map((state) => (
              <tr key={state.name}>
                <td className="pr-2 whitespace-nowrap text-slate-600">{state.name}</td>
                {(entry.regions[state.name] ?? []).map((value, i) => (
                  <td key={i} className="text-center rounded-sm font-semibold h-5" style={rainCellColor(value.mean)}
                    title={`${state.name}, day${String(entry.days[i]).padStart(2, '0')}: mean ${value.mean} mm, max ${value.max} mm`}>
                    {value.mean}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="pr-2 text-slate-500 italic">India grid max</td>
              {entry.indiaMax.map((value, i) => <td key={i} className="text-center text-slate-500 italic">{value}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-slate-500 mt-2">
        Next step: pair these forecasts with IMD gridded observations for the same valid dates. Each pair becomes one row of the hindcast archive that the bust model trains on.
      </p>
    </div>
  );
}

export function LeadErrorChart({ region, variable, day }: { region: string; variable: EvaluatedVariable; day: number }) {
  const curve = getLeadErrorCurve(region, variable);
  const maxMae = Math.max(...curve.map((point) => point.mae), 1);
  const width = 260;
  const height = 70;
  const x = (lead: number) => 14 + ((lead - 1) / 9) * (width - 24);
  const y = (mae: number) => height - 12 - (mae / maxMae) * (height - 22);
  const path = curve.map((point, i) => `${i ? 'L' : 'M'}${x(point.leadDays)},${y(point.mae)}`).join(' ');
  const current = curve[day - 1];
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1"><TrendingUp size={12} /> Historical error vs lead time</span>
        <span className="text-[10px] text-slate-500">MAE, {UNITS[variable]}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <path d={path} fill="none" stroke="#3b82f6" strokeWidth={2} />
        {curve.map((point) => (
          <circle key={point.leadDays} cx={x(point.leadDays)} cy={y(point.mae)} r={point.leadDays === day ? 4 : 2}
            fill={point.leadDays === day ? '#ef4444' : '#3b82f6'} />
        ))}
        {curve.map((point) => (
          <text key={`t${point.leadDays}`} x={x(point.leadDays)} y={height - 1} fontSize={7} textAnchor="middle" fill="#64748b">{point.leadDays}</text>
        ))}
        <text x={x(day)} y={y(current.mae) - 6} fontSize={8} textAnchor="middle" fill="#ef4444" fontWeight={700}>{current.mae}</text>
      </svg>
    </div>
  );
}
