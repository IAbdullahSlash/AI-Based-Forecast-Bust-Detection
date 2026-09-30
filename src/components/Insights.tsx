import { AlertTriangle, BrainCircuit, CloudLightning, Grid3x3, TrendingUp } from 'lucide-react';
import { BUST_LEGEND, bustColor, bustTextColor } from '../theme';
import type { EvaluatedVariable } from '../types';
import { STATE_POSITIONS } from '../data/regions';
import {
  DAYS, UNITS, getActiveSystems, getConfidenceByDay, getErrorProneRegions, getLeadErrorCurve, getModelMetrics,
} from '../analysis/forecastEngine';


/** Region × lead-time matrix of bust probability. */
export function BustHeatmap({ variable, day, region, onSelect }: {
  variable: EvaluatedVariable; day: number; region: string | null;
  onSelect: (region: string, day: number) => void;
}) {
  const byDay = getConfidenceByDay(variable);
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Grid3x3 size={15} /> Bust probability by region &amp; lead time</h3>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span>0%</span>
          <span className="w-28 h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${BUST_LEGEND.map((p) => bustColor(p)).join(', ')})` }} />
          <span>70%+</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-[10px] border-separate table-fixed" style={{ borderSpacing: 2 }}>
          <thead>
            <tr>
              <th className="text-left font-medium text-slate-500 pr-2 w-32">Region</th>
              {DAYS.map((d) => (
                <th key={d} className={`font-medium ${d === day ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>D{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STATE_POSITIONS.map((state) => (
              <tr key={state.name}>
                <td className={`pr-2 whitespace-nowrap ${state.name === region ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{state.name}</td>
                {DAYS.map((d) => {
                  const cell = byDay[d][state.name];
                  const selected = state.name === region && d === day;
                  return (
                    <td key={d} className="p-0">
                      <button
                        onClick={() => onSelect(state.name, d)}
                        title={`${state.name} · Day ${d}: ${cell.bustProbability}% bust probability (${cell.confidence} confidence)`}
                        className={`w-full h-6 rounded font-semibold tabular-nums transition-transform hover:scale-110 hover:shadow ${selected ? 'ring-2 ring-slate-900 ring-offset-1' : ''}`}
                        style={{ backgroundColor: bustColor(cell.bustProbability), color: bustTextColor(cell.bustProbability) }}
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
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2"><AlertTriangle size={15} className="text-rose-500" /> Error-prone areas</h3>
      <p className="text-[10px] text-slate-500 mb-2">Regions with ≥ 40% bust probability on at least one forecast day</p>
      {regions.length === 0 ? (
        <p className="text-xs text-slate-500">No region crosses the low-confidence threshold in this forecast.</p>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {regions.map((item) => (
            <button
              key={item.region}
              onClick={() => onSelect(item.region, item.peakDay)}
              className="w-full text-left border border-rose-100 bg-rose-50/60 hover:bg-rose-50 hover:border-rose-200 rounded-lg px-3 py-2 text-xs transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">{item.region}</span>
                <span className="text-rose-700 font-semibold tabular-nums">{item.peakProbability}% · D{item.peakDay}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{item.driver}</div>
              <div className="text-[10px] text-rose-600 mt-0.5">Low confidence: Day {item.lowConfidenceDays.join(', ')}</div>
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
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2"><CloudLightning size={15} className="text-indigo-500" /> Forecast weather systems · Day {day}</h3>
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
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2"><BrainCircuit size={15} className="text-purple-500" /> Bust model verification</h3>
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
          <text key={`t${point.leadDays}`} x={x(point.leadDays)} y={height - 1} fontSize={7} textAnchor="middle" style={{ fill: 'var(--chart-muted)' }}>{point.leadDays}</text>
        ))}
        <text x={x(day)} y={y(current.mae) - 6} fontSize={8} textAnchor="middle" fill="#ef4444" fontWeight={700}>{current.mae}</text>
      </svg>
    </div>
  );
}
