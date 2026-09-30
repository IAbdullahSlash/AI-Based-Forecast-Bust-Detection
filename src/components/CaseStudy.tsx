import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, CloudLightning, Crosshair, MapPin, Target, Wind, X } from 'lucide-react';
import {
  CASES, IMDAA_SOURCE, getCaseBasinSystems, getCaseCells, getCaseDay, getCaseEvaluation, reanalysisAvailable, reanalysisCovers,
  type CaseCell, type CaseId, type Outcome,
} from '../analysis/caseStudy';
import { getRealVerification } from '../analysis/verification';
import { CONFIDENCE_COLORS, confidenceColor } from '../theme';
import IndiaMap, { type CustomMapView } from './IndiaMap';

const OUTCOME_STYLE: Record<Outcome, { label: string; color: string; badge: string }> = {
  bust: { label: 'Forecast bust', color: '#e11d48', badge: 'bg-rose-100 text-rose-700' },
  large: { label: 'Large error', color: '#f59e0b', badge: 'bg-amber-100 text-amber-700' },
  ok: { label: 'Within tolerance', color: '#10b981', badge: 'bg-emerald-100 text-emerald-700' },
  'no-forecast': { label: 'No forecast', color: 'var(--map-unanalysed)', badge: 'bg-slate-100 text-slate-600' },
  'no-data': { label: 'No observation', color: 'var(--map-unanalysed)', badge: 'bg-slate-100 text-slate-600' },
};

const RISK_LABEL = { low: 'High risk', medium: 'Elevated risk', high: 'Low risk' } as const;

function errorFill(error: number | null, threshold: number) {
  if (error === null) return 'var(--map-unanalysed)';
  const strength = Math.min(1, Math.abs(error) / (threshold * 1.5));
  const rgb = error < 0 ? '225, 29, 72' : '2, 132, 199';
  return `rgba(${rgb}, ${0.12 + strength * 0.85})`;
}

function rainFill(mm: number | null) {
  if (mm === null) return 'var(--map-unanalysed)';
  const t = Math.min(1, Math.sqrt(mm / 60));
  return `rgba(37, 99, 235, ${0.1 + t * 0.88})`;
}

type Mode = 'outcome' | 'risk' | 'error' | 'observed';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <><span>{label}</span><span className="text-right text-white font-medium">{value}</span></>;
}

export function CaseStudyView({ caseId, day, setDay, selectedRegion, onSelectRegion }: {
  caseId: CaseId; day: number; setDay: (day: number) => void;
  selectedRegion: string | null; onSelectRegion: (region: string | null) => void;
}) {
  const [mode, setMode] = useState<Mode>('outcome');
  const [hovered, setHovered] = useState<string | null>(null);
  const definition = CASES.find((c) => c.id === caseId)!;
  const threshold = getRealVerification().bustThreshold;
  const cells = useMemo(() => getCaseDay(caseId, day), [caseId, day]);
  const byRegion = useMemo(() => Object.fromEntries(cells.map((cell) => [cell.region, cell])), [cells]);
  const date = cells[0]?.date ?? '';
  const hasForecast = cells.some((cell) => cell.forecast !== null);
  const evaluation = useMemo(() => getCaseEvaluation(caseId), [caseId]);
  const basins = useMemo(() => getCaseBasinSystems(caseId), [caseId]);
  const hasReanalysis = reanalysisCovers(caseId);

  const custom: CustomMapView = {
    title: 'Real outcome map',
    subtitle: `${date} · Day ${day} (forecast file day${String(day - 1).padStart(2, '0')}) · ${hasForecast ? 'NCMRWF S2S forecast vs IMD observed' : 'no forecast for this lead'}`,
    modes: [
      { key: 'outcome', label: 'Outcome' },
      { key: 'risk', label: 'Predicted risk' },
      { key: 'error', label: 'Error' },
      { key: 'observed', label: 'Observed' },
    ],
    mode,
    onModeChange: (next) => setMode(next as Mode),
    cell: (region) => {
      const cell = byRegion[region];
      if (!cell) return null;
      const fill = mode === 'outcome' ? OUTCOME_STYLE[cell.outcome].color
        : mode === 'risk' ? confidenceColor(cell.risk)
        : mode === 'error' ? errorFill(cell.error, threshold) : rainFill(cell.observed);
      return {
        fill,
        textColor: mode === 'observed' && (cell.observed ?? 0) < 8 ? '#1e3a8a' : '#ffffff',
        tooltip: (
          <>
            <div className="flex items-center justify-between mb-1 gap-2">
              <span className="font-semibold text-sm">{region}</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: OUTCOME_STYLE[cell.outcome].color }}>
                {OUTCOME_STYLE[cell.outcome].label}
              </span>
            </div>
            {cell.signals[0] && <div className="text-[10px] text-sky-300 mb-1.5 leading-snug">{cell.signals[0].label}</div>}
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-300">
              <Row label="Forecast" value={cell.forecast === null ? '—' : `${cell.forecast} mm`} />
              <Row label="Observed" value={cell.observed === null ? '—' : `${cell.observed} mm`} />
              <Row label="Error" value={cell.error === null ? '—' : `${cell.error > 0 ? '+' : ''}${cell.error} mm`} />
              <Row label="Bust probability" value={cell.probability === null ? '—' : `${cell.probability}% · ${RISK_LABEL[cell.risk]}`} />
            </div>
          </>
        ),
      };
    },
    legend: mode === 'outcome' ? (
      <div className="flex items-center gap-3 text-[11px] text-slate-600 flex-wrap">
        {(['bust', 'large', 'ok'] as const).map((key) => (
          <span key={key} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: OUTCOME_STYLE[key].color }} />{OUTCOME_STYLE[key].label}</span>
        ))}
        <span className="flex items-center gap-1.5 text-slate-400"><span className="w-2.5 h-2.5 rounded-sm bg-slate-300" /> No forecast</span>
      </div>
    ) : mode === 'risk' ? (
      <div className="flex items-center gap-3 text-[11px] text-slate-600">
        {(['low', 'medium', 'high'] as const).map((key) => (
          <span key={key} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CONFIDENCE_COLORS[key] }} />{RISK_LABEL[key]}</span>
        ))}
      </div>
    ) : mode === 'error' ? (
      <div className="text-[10px] text-slate-500">
        <div className="w-44 h-2 rounded-full" style={{ background: 'linear-gradient(90deg, rgb(225,29,72), rgba(148,163,184,0.2), rgb(2,132,199))' }} />
        <div className="flex justify-between mt-1"><span>Under-forecast</span><span>Over</span></div>
      </div>
    ) : (
      <div className="text-[10px] text-slate-500">
        <div className="w-44 h-2 rounded-full" style={{ background: 'linear-gradient(90deg, rgba(37,99,235,0.1), rgb(37,99,235))' }} />
        <div className="flex justify-between mt-1"><span>0 mm</span><span>60+ mm</span></div>
      </div>
    ),
  };

  const busts = cells.filter((cell) => cell.outcome === 'bust');
  const highRisk = cells.filter((cell) => cell.risk === 'low');
  const verified = cells.filter((cell) => cell.error !== null);
  const mae = verified.length ? Math.round((verified.reduce((sum, cell) => sum + Math.abs(cell.error ?? 0), 0) / verified.length) * 10) / 10 : null;
  const selected = selectedRegion ? byRegion[selectedRegion] : null;

  return (
    <div className="space-y-4">
      <div className="card p-4 border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-white">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">Real data case study</div>
            <h2 className="text-lg font-semibold text-slate-900">{definition.label}</h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              NCMRWF S2S Unified Model forecast issued {definition.run} 00 UTC (rainfall, sea-level pressure, 10 m wind), checked
              against IMD gridded rainfall for all ten days. Day <i>n</i> = {definition.run} + (n − 1). Predicted risk comes from a bust
              model trained on the other runs only, so it never saw this case.
              {hasReanalysis ? ' IMDAA reanalysis shows what the weather actually did.' : ' IMDAA reanalysis was not downloaded for this month.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['NCMRWF S2S forecasts', 'IMD observations', ...(hasReanalysis ? ['IMDAA reanalysis'] : [])].map((label) => (
              <span key={label} className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 size={11} /> {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: `Real busts · Day ${day}`, value: hasForecast ? busts.length : '—', sub: hasForecast ? `|error| ≥ ${threshold} mm` : 'No forecast at this lead', icon: <AlertTriangle size={18} />, tint: 'bg-rose-50 text-rose-600' },
          { label: 'Predicted high risk', value: highRisk.length, sub: 'Bust probability ≥ 30%, before outcome', icon: <Crosshair size={18} />, tint: 'bg-amber-50 text-amber-600' },
          { label: `Mean abs. error · Day ${day}`, value: mae === null ? '—' : `${mae}`, sub: 'mm, state means', icon: <Target size={18} />, tint: 'bg-sky-50 text-sky-600' },
          { label: 'Busts anticipated (case)', value: `${evaluation.caught}/${evaluation.busts}`, sub: `${evaluation.hitRate}% flagged elevated or high risk`, icon: <CheckCircle2 size={18} />, tint: 'bg-emerald-50 text-emerald-600' },
        ].map((card) => (
          <div key={card.label} className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500">{card.label}</div>
                <div className="text-3xl font-semibold text-slate-900 mt-1 tabular-nums">{card.value}</div>
              </div>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.tint}`}>{card.icon}</div>
            </div>
            <div className="text-[11px] text-slate-500 mt-3">{card.sub}</div>
          </div>
        ))}
      </div>

      <CaseTimeline caseId={caseId} day={day} setDay={setDay} showReanalysis={hasReanalysis} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-7 xl:col-span-8">
          <IndiaMap
            day={day} variable="rainfall" mapMode="confidence" onMapModeChange={() => {}}
            selectedRegion={selectedRegion} onSelectRegion={onSelectRegion}
            hoveredRegion={hovered} onHoverRegion={setHovered} custom={custom}
          />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          {selected ? (
            <CaseRegionPanel cell={selected} caseId={caseId} threshold={threshold} hasReanalysis={hasReanalysis} onClose={() => onSelectRegion(null)} />
          ) : (
            <div className="card flex items-center justify-center text-center py-24">
              <div>
                <MapPin size={36} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-600 font-medium">Select a state on the map</p>
                <p className="text-xs text-slate-400 mt-1">to compare forecast, observation and the diagnosed weather</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-1"><CloudLightning size={15} className="text-indigo-500" /> Weather systems diagnosed from IMDAA</h3>
          <p className="text-[11px] text-slate-500 mb-3">{IMDAA_SOURCE}. Strongest 850 hPa cyclonic circulation per basin each day.</p>
          {!hasReanalysis ? <p className="text-xs text-slate-500">IMDAA reanalysis was not downloaded for this month, so observed weather systems are not shown. Forecast lows appear in each state's details.</p>
            : basins.length === 0 ? <p className="text-xs text-slate-500">No organised basin-scale system diagnosed.</p> : (
            <div className="space-y-1.5">
              {basins.map((system) => (
                <button key={`${system.day}-${system.basin}`} onClick={() => setDay(system.day)}
                  className={`w-full text-left rounded-lg px-3 py-2 text-xs transition-colors ${system.day === day ? 'bg-indigo-100' : 'bg-indigo-50 hover:bg-indigo-100'}`}>
                  <div className="font-semibold text-indigo-900">Day {system.day} · {system.date} · {system.label}</div>
                  <div className="text-[11px] text-indigo-700">{system.detail}</div>
                </button>
              ))}
            </div>
          )}
          {caseId === '2015-06-01' && basins.length > 0 && (
            <p className="text-[11px] text-slate-500 mt-2">This is Cyclone Ashobaa (7–12 June 2015), which pulled moisture away from India's west coast during the monsoon onset.</p>
          )}
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-1"><Crosshair size={15} className="text-emerald-600" /> Did the predicted risk anticipate the busts?</h3>
          <p className="text-[11px] text-slate-500 mb-3">
            Predicted risk is the real bust model's probability for this run, from a model trained on the other runs only
            (≥ 30% high, 15–30% elevated). Scored against real outcomes for all {evaluation.verified} state-days.
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 text-left"><th className="font-medium py-1">Predicted risk</th><th className="font-medium text-right">State-days</th><th className="font-medium text-right">Real busts</th><th className="font-medium text-right">Bust rate</th></tr>
            </thead>
            <tbody>
              {evaluation.byRisk.map((row) => (
                <tr key={row.risk} className="border-t border-slate-100">
                  <td className="py-1.5"><span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: CONFIDENCE_COLORS[row.risk] }} />{RISK_LABEL[row.risk]}</span></td>
                  <td className="text-right tabular-nums text-slate-700">{row.cells}</td>
                  <td className="text-right tabular-nums text-slate-700">{row.busts}</td>
                  <td className="text-right tabular-nums font-semibold text-slate-900">{row.bustRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
            {[
              { label: 'Busts flagged', value: `${evaluation.hitRate}%` },
              { label: 'False alarms', value: `${evaluation.falseAlarmRatio}%` },
              { label: 'Model AUC', value: evaluation.modelAuc.toFixed(2) },
              { label: 'Rule-flag AUC', value: evaluation.rulesAuc.toFixed(2) },
              { label: 'Base bust rate', value: `${evaluation.baseRate}%` },
            ].map((item) => (
              <div key={item.label} className="bg-slate-50 rounded-lg px-2.5 py-2">
                <div className="text-[10px] font-medium text-slate-500">{item.label}</div>
                <div className="text-base font-semibold text-slate-900 tabular-nums">{item.value}</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">One 10-day case is a small sample; treat these numbers as indicative. The synthetic demo model is not used here.</p>
        </div>
      </div>
    </div>
  );
}

function CaseTimeline({ caseId, day, setDay, showReanalysis }: { caseId: CaseId; day: number; setDay: (day: number) => void; showReanalysis: boolean }) {
  const cells = getCaseCells(caseId);
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Real outcomes by day</h3>
        <span className="text-[11px] text-slate-500">Share of states by outcome · click a day</span>
      </div>
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="grid grid-cols-10 gap-1.5 min-w-[640px]">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((d) => {
            const dayCells = cells.filter((cell) => cell.day === d);
            const date = dayCells[0]?.date ?? '';
            const counts = { bust: 0, large: 0, ok: 0 };
            dayCells.forEach((cell) => { if (cell.outcome in counts) counts[cell.outcome as keyof typeof counts] += 1; });
            const total = counts.bust + counts.large + counts.ok;
            const selected = d === day;
            return (
              <button key={d} onClick={() => setDay(d)}
                className={`rounded-lg p-1.5 text-left transition-all ${selected ? 'bg-slate-900 shadow-md' : 'hover:bg-slate-100'}`}>
                <div className={`text-[11px] font-semibold ${selected ? 'text-white' : 'text-slate-600'}`}>Day {d}</div>
                <div className={`text-[9px] mb-1 ${selected ? 'text-slate-300' : 'text-slate-400'}`}>{date.slice(5)}</div>
                <div className="flex h-8 rounded overflow-hidden bg-slate-200">
                  {total > 0 && (['ok', 'large', 'bust'] as const).map((key) => counts[key] ? (
                    <div key={key} style={{ width: `${(counts[key] / total) * 100}%`, backgroundColor: OUTCOME_STYLE[key].color }} />
                  ) : null)}
                </div>
                <div className={`text-[10px] mt-1 ${selected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {total ? (counts.bust ? <span className={selected ? 'text-rose-300' : 'text-rose-600'}>{counts.bust} bust{counts.bust > 1 ? 's' : ''}</span> : 'no busts') : 'no forecast'}
                  {showReanalysis && !reanalysisAvailable(date) && <span className="block text-[9px] opacity-70">no reanalysis</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CaseRegionPanel({ cell, caseId, threshold, hasReanalysis, onClose }: { cell: CaseCell; caseId: CaseId; threshold: number; hasReanalysis: boolean; onClose: () => void }) {
  const series = getCaseCells(caseId).filter((item) => item.region === cell.region);
  const max = Math.max(1, ...series.map((item) => Math.max(item.forecast ?? 0, item.observed ?? 0)));
  const d = cell.diagnostics;
  const verdict = cell.outcome === 'bust'
    ? (cell.risk !== 'high' ? { text: 'Bust anticipated: elevated risk was predicted beforehand', tone: 'text-emerald-700 bg-emerald-50' } : { text: 'Missed bust: predicted risk was low', tone: 'text-rose-700 bg-rose-50' })
    : cell.outcome === 'no-forecast' ? { text: 'No forecast at this lead time', tone: 'text-slate-600 bg-slate-100' }
    : cell.risk === 'low' ? { text: 'False alarm: flagged, but the forecast held', tone: 'text-amber-700 bg-amber-50' }
    : { text: 'Forecast held, as expected', tone: 'text-emerald-700 bg-emerald-50' };
  return (
    <div className="card flex flex-col overflow-hidden lg:max-h-[calc(100vh-150px)] lg:sticky lg:top-[88px]">
      <div className="px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500">Day {cell.day} · {cell.date}</div>
            <h3 className="text-lg font-semibold text-slate-900 leading-tight">{cell.region}</h3>
          </div>
          <button onClick={onClose} aria-label="Close region details" className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"><X size={16} /></button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${OUTCOME_STYLE[cell.outcome].badge}`}>{OUTCOME_STYLE[cell.outcome].label}</span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded text-white" style={{ backgroundColor: confidenceColor(cell.risk) }}>
            {cell.probability === null ? 'No prediction' : `${cell.probability}% bust probability · ${RISK_LABEL[cell.risk]}`}
          </span>
        </div>
        <div className={`text-xs font-medium rounded-md px-2 py-1.5 mt-2 ${verdict.tone}`}>{verdict.text}</div>
      </div>

      <div className="overflow-y-auto px-4 py-3 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Forecast', value: cell.forecast, unit: 'mm' },
            { label: 'Observed', value: cell.observed, unit: 'mm' },
            { label: 'Error', value: cell.error === null ? null : `${cell.error > 0 ? '+' : ''}${cell.error}`, unit: 'mm' },
          ].map((item) => (
            <div key={item.label} className="bg-slate-50 rounded-lg px-2.5 py-2">
              <div className="text-[10px] font-medium text-slate-500">{item.label}</div>
              <div className="text-base font-semibold text-slate-900 tabular-nums">{item.value ?? '—'}{item.value !== null && <span className="text-[11px] font-normal text-slate-500 ml-0.5">{item.unit}</span>}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-xs font-semibold text-slate-800">Forecast vs observed, Days 1–10</h4>
            <span className="flex items-center gap-2 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-sky-500" />Forecast</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-400" />Observed</span>
            </span>
          </div>
          <div className="flex items-end gap-1 h-24">
            {series.map((item) => (
              <div key={item.day} className={`flex-1 flex flex-col items-center gap-0.5 ${item.day === cell.day ? 'opacity-100' : 'opacity-75'}`}>
                <div className="w-full flex items-end gap-px h-20">
                  <div className="flex-1 rounded-t bg-sky-500" style={{ height: `${((item.forecast ?? 0) / max) * 100}%` }} title={`Forecast ${item.forecast ?? '—'} mm`} />
                  <div className="flex-1 rounded-t bg-slate-400" style={{ height: `${((item.observed ?? 0) / max) * 100}%` }} title={`Observed ${item.observed ?? '—'} mm`} />
                </div>
                <span className={`text-[9px] ${item.day === cell.day ? 'font-bold text-slate-900' : 'text-slate-500'} ${item.outcome === 'bust' ? 'text-rose-600' : ''}`}>D{item.day}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Bust threshold ±{threshold} mm. Days without a blue bar have no forecast.</p>
        </div>

        {cell.drivers.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-800 mb-1.5">Model drivers (raising the probability)</h4>
            <ul className="space-y-1">
              {cell.drivers.map((driver) => (
                <li key={driver.feature} className="flex items-center justify-between text-xs text-slate-600">
                  <span>{driver.feature}</span><span className="text-[10px] font-semibold text-violet-600">+{driver.contribution}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {cell.mslp !== null && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-600">
            <span>Forecast MSLP <b className="text-slate-800">{cell.mslp} hPa</b></span>
            <span>vs model normal <b className="text-slate-800">{cell.mslpAnomaly !== null && cell.mslpAnomaly > 0 ? '+' : ''}{cell.mslpAnomaly} hPa</b></span>
            <span className="col-span-2">Pressure change <b className="text-slate-800">{cell.pressureTendency ?? '—'} hPa/day</b></span>
          </div>
        )}

        <div>
          <h4 className="text-xs font-semibold text-slate-800 mb-1.5">Rule flags (known at forecast time)</h4>
          {cell.flags.length === 0 ? <p className="text-xs text-slate-500">None raised.</p> : (
            <ul className="space-y-1">
              {cell.flags.map((flag) => (
                <li key={flag.label} className="flex items-center justify-between text-xs text-slate-600">
                  <span>{flag.label}</span><span className="text-[10px] font-semibold text-slate-500">+{flag.weight}</span>
                </li>
              ))}
              <li className="flex items-center justify-between text-xs font-semibold text-slate-800 border-t border-slate-100 pt-1">
                <span>Rule score</span><span>{cell.riskScore} points</span>
              </li>
            </ul>
          )}
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5"><Wind size={12} /> What the weather actually did (IMDAA)</h4>
          {!hasReanalysis ? <p className="text-xs text-slate-500">IMDAA reanalysis not downloaded for this month.</p> : !d ? <p className="text-xs text-slate-500">Reanalysis incomplete for this date.</p> : (
            <>
              {cell.signals.length > 0 && (
                <ul className="space-y-1.5 mb-2">
                  {cell.signals.map((signal) => (
                    <li key={signal.label} className="text-xs text-slate-600 leading-snug">
                      <span className="font-semibold text-indigo-700">{signal.label}.</span> {signal.detail}.
                    </li>
                  ))}
                </ul>
              )}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-600">
                <span>850 hPa wind <b className="text-slate-800">{d.ws850 ?? '—'} m/s</b></span>
                <span>Westerly part <b className="text-slate-800">{d.u850 ?? '—'} m/s</b></span>
                <span>850 hPa vorticity <b className="text-slate-800">{d.vort850 ?? '—'}</b></span>
                <span>850 hPa temp <b className="text-slate-800">{d.t850 ?? '—'} °C</b></span>
                <span>200 hPa wind <b className="text-slate-800">{d.ws200 ?? '—'} m/s</b></span>
                <span>Shear 850–200 <b className="text-slate-800">{d.shear ?? '—'} m/s</b></span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

