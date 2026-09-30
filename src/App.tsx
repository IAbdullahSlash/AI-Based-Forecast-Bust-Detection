import { useState, useMemo, useEffect } from 'react';
import {
  Clock, CloudRain, Wind, Thermometer, Gauge, MapPin, Zap, ChevronDown, Layers, Radio, Activity,
  ThermometerIcon, Droplets, WindIcon, GaugeIcon, Satellite, ShieldCheck, ShieldAlert, ShieldQuestion,
  ChevronLeft, ChevronRight, X, History, Moon, Sun,
} from 'lucide-react';
import { ForecastVariable, Confidence, EvaluatedVariable, ReasonItem } from './types';
import { STATE_POSITIONS } from './data/regions';
import {
  DAYS, getRegionData, getAnalogueData, getExplanation, getSummaryStats, getConfidenceByDay, SCENARIO,
} from './analysis/forecastEngine';
import { ActiveSystems, BustHeatmap, ErrorProneAreas, LeadErrorChart, ModelCard } from './components/Insights';
import { NwpIngestionPanel, ObservedClimatologyPanel, RealVerificationPanel } from './components/RealData';
import { IMD_YEAR_LABEL, IMD_YEARS, getRealVerification, monsoonAverages, observedMonthly, observedSummary } from './analysis/forecastEngine';
import IndiaMap from './components/IndiaMap';
import { useWeatherData } from './hooks/useWeatherData';
import { generateGeminiBriefing } from './api/geminiApi';
import { DatasetStatus, fetchDatasetStatus } from './api/datasetApi';
import { CONFIDENCE_COLORS, confidenceColor, setDarkMode } from './theme';

const EVALUATED: ForecastVariable[] = ['rainfall', 'temperature'];

const VARIABLES: { key: ForecastVariable; label: string; icon: React.ReactNode }[] = [
  { key: 'rainfall', label: 'Rainfall', icon: <CloudRain size={14} /> },
  { key: 'temperature', label: 'Temperature', icon: <Thermometer size={14} /> },
  { key: 'wind', label: 'Wind', icon: <Wind size={14} /> },
  { key: 'pressure', label: 'Pressure', icon: <Gauge size={14} /> },
];

const CONFIDENCE_TEXT: Record<Confidence, string> = {
  high: 'text-emerald-600', medium: 'text-amber-600', low: 'text-rose-600',
};

const STATUS_BADGE: Record<string, string> = {
  'Forecast Bust': 'bg-rose-100 text-rose-700',
  'Large Error': 'bg-amber-100 text-amber-700',
  Normal: 'bg-emerald-100 text-emerald-700',
};

const REASON_STYLES: Record<ReasonItem['kind'], { label: string; className: string }> = {
  system: { label: 'System', className: 'bg-indigo-100 text-indigo-700' },
  dynamics: { label: 'Dynamics', className: 'bg-orange-100 text-orange-700' },
  intensity: { label: 'Intensity', className: 'bg-rose-100 text-rose-700' },
  lead: { label: 'Lead time', className: 'bg-slate-200 text-slate-700' },
  analogue: { label: 'Analogues', className: 'bg-sky-100 text-sky-700' },
  model: { label: 'ML model', className: 'bg-violet-100 text-violet-700' },
  history: { label: 'History', className: 'bg-slate-200 text-slate-700' },
};

function getConfidence(day: number, region: string, variable: EvaluatedVariable): Confidence {
  return getConfidenceByDay(variable)[day]?.[region]?.confidence || 'medium';
}

function SectionTitle({ icon, children, aside }: { icon?: React.ReactNode; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">{icon}{children}</h3>
      {aside}
    </div>
  );
}

function SummaryCards({ day, variable }: { day: number; variable: EvaluatedVariable }) {
  const stats = useMemo(() => getSummaryStats(day, variable), [day, variable]);
  const cards = [
    { label: 'Regions analysed', value: stats.regionsAnalyzed, sub: `Day ${day} forecast`, icon: <MapPin size={18} />, tint: 'bg-sky-50 text-sky-600', bar: null },
    { label: 'High confidence', value: stats.highConfidence, sub: 'Bust probability < 20%', icon: <ShieldCheck size={18} />, tint: 'bg-emerald-50 text-emerald-600', bar: CONFIDENCE_COLORS.high },
    { label: 'Medium confidence', value: stats.mediumConfidence, sub: '20–40%', icon: <ShieldQuestion size={18} />, tint: 'bg-amber-50 text-amber-600', bar: CONFIDENCE_COLORS.medium },
    { label: 'Low confidence', value: stats.lowConfidence, sub: 'Bust probability ≥ 40%', icon: <ShieldAlert size={18} />, tint: 'bg-rose-50 text-rose-600', bar: CONFIDENCE_COLORS.low },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="card p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500">{card.label}</div>
              <div className="text-3xl font-semibold text-slate-900 mt-1 tabular-nums">{card.value}</div>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.tint}`}>{card.icon}</div>
          </div>
          {card.bar ? (
            <div className="mt-3">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(card.value / stats.regionsAnalyzed) * 100}%`, backgroundColor: card.bar }} />
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5">{card.sub}</div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 mt-3 pt-1.5">{card.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}

/** Day 1–10 strip: each day shows the share of regions at each confidence level. */
function ForecastTimeline({ day, setDay, variable }: { day: number; setDay: (d: number) => void; variable: EvaluatedVariable }) {
  return (
    <div className="card p-4">
      <SectionTitle
        icon={<Clock size={15} className="text-slate-400" />}
        aside={<span className="text-[11px] text-slate-500">Share of regions by confidence · click a day</span>}
      >
        Confidence by lead time
      </SectionTitle>
      <div className="overflow-x-auto -mx-1 px-1"><div className="grid grid-cols-10 gap-1.5 min-w-[640px]">
        {DAYS.map((d) => {
          const stats = getSummaryStats(d, variable);
          const total = stats.regionsAnalyzed;
          const selected = d === day;
          return (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`group rounded-lg p-1.5 text-left transition-all ${selected ? 'bg-slate-900 shadow-md' : 'hover:bg-slate-100'}`}
            >
              <div className={`text-[11px] font-semibold mb-1.5 ${selected ? 'text-white' : 'text-slate-600'}`}>Day {d}</div>
              <div className="flex h-8 rounded overflow-hidden">
                {(['high', 'medium', 'low'] as const).map((level) => {
                  const count = level === 'high' ? stats.highConfidence : level === 'medium' ? stats.mediumConfidence : stats.lowConfidence;
                  return count ? (
                    <div key={level} style={{ width: `${(count / total) * 100}%`, backgroundColor: CONFIDENCE_COLORS[level] }} className="transition-all duration-500" />
                  ) : null;
                })}
              </div>
              <div className={`text-[10px] mt-1 ${selected ? 'text-slate-300' : 'text-slate-500'}`}>
                {stats.lowConfidence ? <span className={selected ? 'text-rose-300' : 'text-rose-600'}>{stats.lowConfidence} low</span> : 'none low'}
              </div>
            </button>
          );
        })}
      </div></div>
    </div>
  );
}

function ProbabilityRing({ value, color }: { value: number; color: string }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" className="flex-shrink-0">
      <circle cx="44" cy="44" r={radius} fill="none" style={{ stroke: 'var(--chart-track)' }} strokeWidth="9" />
      <circle
        cx="44" cy="44" r={radius} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${(value / 100) * circumference} ${circumference}`}
        transform="rotate(-90 44 44)" style={{ transition: 'stroke-dasharray 500ms ease, stroke 300ms ease' }}
      />
      <text x="44" y="47" textAnchor="middle" fontSize="19" fontWeight="700" style={{ fill: 'var(--chart-ink)' }}>{value}%</text>
      <text x="44" y="61" textAnchor="middle" fontSize="8" style={{ fill: 'var(--chart-muted)' }}>bust risk</text>
    </svg>
  );
}

function RegionDetailPanel({ region, day, variable, onClose }: { region: string; day: number; variable: EvaluatedVariable; onClose: () => void }) {
  const data = getRegionData(region, day, variable);
  const analogues = getAnalogueData(region, day, variable);

  return (
    <div className="card flex flex-col overflow-hidden lg:max-h-[calc(100vh-150px)] lg:sticky lg:top-[88px]">
      <div className="px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500">Day {day} · {variable === 'rainfall' ? 'Rainfall' : 'Temperature'}</div>
            <h3 className="text-lg font-semibold text-slate-900 leading-tight">{region}</h3>
          </div>
          <button onClick={onClose} aria-label="Close region details" className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <ProbabilityRing value={data.bustProbability} color={confidenceColor(data.confidence)} />
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-semibold ${CONFIDENCE_TEXT[data.confidence]}`}>{data.confidence.toUpperCase()} confidence</div>
            {data.fingerprint.systemName && (
              <div className="text-xs text-indigo-700 bg-indigo-50 rounded-md px-2 py-1 mt-1.5 leading-snug">{data.fingerprint.systemName}</div>
            )}
            <div className="grid grid-cols-2 gap-x-3 text-[11px] text-slate-500 mt-2">
              <span>ML model <b className="text-slate-800">{data.mlProbability}%</b></span>
              <span>Analogues <b className="text-slate-800">{data.analogueProbability}%</b></span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto px-4 py-3 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Forecast', value: data.forecastValue, unit: data.unit },
            { label: `MAE · D${day}`, value: data.historicalMeanError, unit: data.unit },
            { label: 'Bust if error ≥', value: data.bustThreshold, unit: data.unit },
          ].map((item) => (
            <div key={item.label} className="bg-slate-50 rounded-lg px-2.5 py-2">
              <div className="text-[10px] font-medium text-slate-500">{item.label}</div>
              <div className="text-base font-semibold text-slate-900 tabular-nums">{item.value}<span className="text-[11px] font-normal text-slate-500 ml-0.5">{item.unit}</span></div>
            </div>
          ))}
        </div>

        <LeadErrorChart region={region} variable={variable} day={day} />

        <ObservedFacts region={region} />

        <div>
          <h4 className="text-xs font-semibold text-slate-800 mb-2">Why confidence is {data.confidence}</h4>
          <ul className="space-y-2">
            {data.reasons.map((reason, i) => (
              <li key={i} className="text-xs text-slate-600 leading-relaxed flex gap-2">
                <span className={`h-fit flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold ${REASON_STYLES[reason.kind].className}`}>{REASON_STYLES[reason.kind].label}</span>
                <span>{reason.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-800">Closest historical analogues</h4>
            <span className="text-[10px] text-slate-500">Bust rate at D{day}: {data.historicalBustFrequency}%</span>
          </div>
          <div className="space-y-1.5">
            {analogues.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-100 px-2.5 py-2 text-xs">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800 truncate">{a.eventType}</div>
                  <div className="text-[10px] text-slate-500">{a.region} · {a.date} · D{a.leadDays} · error {a.forecastError} {data.unit}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-semibold text-slate-700 tabular-nums">{a.similarity}%</div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${STATUS_BADGE[a.bustStatus]}`}>{a.bustStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Real IMD facts for the selected state, shown in the detail panel. */
function ObservedFacts({ region }: { region: string }) {
  const june = observedMonthly(region, 6);
  const monsoon = monsoonAverages(region);
  const record = observedSummary(region)?.maxCellRain;
  const real = getRealVerification().byRegion.find((item) => item.region === region);
  if (!june || !monsoon) return null;
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
      <div className="text-[11px] font-semibold text-emerald-700 mb-1.5">Observed · IMD {IMD_YEAR_LABEL} (real data)</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-600">
        <span>June mean <b className="text-slate-800">{june.mean} mm/day</b></span>
        <span>June P99 <b className="text-slate-800">{june.p99} mm</b></span>
        <span>Monsoon total <b className="text-slate-800">{monsoon.total} mm</b></span>
        <span>Heavy-rain days <b className="text-slate-800">{monsoon.widespreadHeavyDays}/season</b></span>
        {record && <span className="col-span-2">Record cell <b className="text-slate-800">{record.mm} mm</b> on {record.date}</span>}
        {real && (
          <span className="col-span-2">NCMRWF 2015 check: MAE <b className="text-slate-800">{real.mae} mm</b>, {real.bias < 0 ? 'under' : 'over'}-forecast {Math.abs(real.bias)} mm, {real.busts} bust{real.busts === 1 ? '' : 's'} in {real.pairs}</span>
        )}
      </div>
    </div>
  );
}

function HistoricalAnalogues({ region, day, variable }: { region: string; day: number; variable: EvaluatedVariable }) {
  const analogues = getAnalogueData(region, day, variable);
  return (
    <div className="card p-4">
      <SectionTitle icon={<History size={15} className="text-sky-500" />} aside={<span className="text-[11px] text-slate-500">{region} · D{day}</span>}>
        Historical analogues
      </SectionTitle>
      <div className="space-y-1.5">
        {analogues.slice(0, 5).map((a, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg bg-slate-50 px-2.5 py-2 text-xs">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-slate-800">{a.eventType}</div>
              <div className="text-[10px] text-slate-500">{a.region} · {a.date} · D{a.leadDays}</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-slate-800 tabular-nums">{a.similarity}%</div>
              <div className="text-[9px] text-slate-500">similar</div>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${STATUS_BADGE[a.bustStatus]}`}>{a.bustStatus}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIExplanation({ region, day, variable }: { region: string; day: number; variable: EvaluatedVariable }) {
  const fallbackExplanation = getExplanation(region, day, variable);
  const [briefing, setBriefing] = useState<{ key: string; text: string } | null>(null);
  const [briefingError, setBriefingError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const key = `${region}-${day}-${variable}`;
  const visibleBriefing = briefing?.key === key ? briefing.text : null;

  const generateBriefing = async () => {
    setIsGenerating(true);
    setBriefingError(null);
    try {
      const result = getRegionData(region, day, variable);
      const analogues = getAnalogueData(region, day, variable);
      const text = await generateGeminiBriefing({ region, day, result, analogues });
      setBriefing({ key, text });
    } catch (error) {
      setBriefingError(error instanceof Error ? error.message : 'Unable to generate a Gemini briefing.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="card p-4 bg-gradient-to-br from-white to-sky-50/60">
      <SectionTitle
        icon={<Zap size={15} className="text-sky-500" />}
        aside={(
          <button
            onClick={generateBriefing}
            disabled={isGenerating}
            className="px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-medium hover:bg-slate-700 disabled:opacity-60 transition-colors"
          >
            {isGenerating ? 'Generating…' : visibleBriefing ? 'Regenerate' : 'Generate with Gemini'}
          </button>
        )}
      >
        Analyst briefing
      </SectionTitle>
      <p className="text-xs text-slate-600 leading-relaxed mb-3">{visibleBriefing || fallbackExplanation}</p>
      {briefingError && <p className="text-[11px] text-rose-600 mb-2">{briefingError}</p>}
      <div className="flex flex-wrap gap-1">
        {['Hindcast pairs', 'P90 bust threshold', 'Logistic model', 'k-NN analogues', 'Rule-based reasons'].map((tag) => (
          <span key={tag} className="px-2 py-0.5 bg-white border border-sky-100 text-sky-700 rounded-full text-[10px] font-medium">{tag}</span>
        ))}
      </div>
    </div>
  );
}

function DataSources() {
  const [open, setOpen] = useState(true);
  const [dataset, setDataset] = useState<DatasetStatus | null>(null);

  useEffect(() => {
    fetchDatasetStatus().then(setDataset).catch(() => setDataset(null));
  }, []);

  const forecastStatus = dataset?.available ? `${dataset.fileCount} NetCDF files` : 'Server offline or no files';
  const coverageStatus = dataset?.available
    ? `${dataset.initializations.length} initializations, day${String(dataset.forecastDays[0]).padStart(2, '0')}–${String(dataset.forecastDays[dataset.forecastDays.length - 1]).padStart(2, '0')}`
    : 'Pending';
  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors">
        <span className="flex items-center gap-2"><Layers size={15} className="text-slate-400" /> Data sources</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-1.5">
          {[
            { name: 'NCMRWF NWP rainfall files (real)', status: forecastStatus },
            { name: 'IMD gridded rainfall (real)', status: `0.25° daily · ${IMD_YEARS.join(', ')}` },
            { name: 'Real forecast/observation pairs', status: `${getRealVerification().pairs.length} (NCMRWF vs IMD)` },
            { name: 'Forecast coverage', status: coverageStatus },
            { name: 'Hindcast archive (synthetic)', status: '6,000 pairs · 2016–2023' },
            { name: 'Current forecast scenario', status: 'Synthetic · 10 Jun 2026' },
          ].map((source) => (
            <div key={source.name} className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg px-3 py-2 text-xs">
              <span className="font-medium text-slate-700">{source.name}</span>
              <span className="text-slate-500 text-[11px] text-right">{source.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SystemStatus() {
  const items = [
    'Forecast / observation alignment',
    'k-NN analogue engine',
    'Logistic bust model (trained in-app)',
    'Rule-based meteorological explainer',
    'JSON API (/api/confidence, /api/region, …)',
  ];
  return (
    <div className="card p-4">
      <SectionTitle icon={<Radio size={14} className="text-slate-400" />}>System status</SectionTitle>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-center justify-between text-xs">
            <span className="text-slate-600">{item}</span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Ready</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveWeather({ day, variable }: { day: number; variable: EvaluatedVariable }) {
  const { weatherData, loading, error, refetch, lastFetchTime } = useWeatherData();
  return (
    <div className="card p-4">
      <SectionTitle
        icon={<Satellite size={15} className="text-emerald-500" />}
        aside={(
          <div className="flex items-center gap-2">
            {error && <span className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full">{error}</span>}
            {lastFetchTime && <span className="text-[10px] text-slate-400">Updated {lastFetchTime.toLocaleTimeString()}</span>}
            <button
              onClick={() => refetch()}
              disabled={loading}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-50"
            >
              <Satellite size={12} className={loading ? 'animate-spin' : ''} /> {loading ? 'Fetching…' : weatherData.size ? 'Refresh' : 'Fetch live weather'}
            </button>
          </div>
        )}
      >
        Live observations (Open-Meteo, display only)
      </SectionTitle>
      {weatherData.size === 0 ? (
        <p className="text-xs text-slate-500 py-3 text-center">Fetch current conditions across India. These do not feed the bust calculation.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {Array.from(weatherData.entries()).slice(0, 18).map(([region, data]) => {
            const confidence = getConfidence(day, region, variable);
            return (
              <div key={region} className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <div className="text-[11px] font-semibold text-slate-700 mb-1.5 flex items-center justify-between gap-1">
                  <span className="truncate">{region}</span>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: confidenceColor(confidence) }} />
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><ThermometerIcon size={9} /> {Math.round(data.temperature)}°C</span>
                  <span className="flex items-center gap-1"><Droplets size={9} /> {Math.round(data.rainfall)}mm</span>
                  <span className="flex items-center gap-1"><WindIcon size={9} /> {Math.round(data.windSpeed)}km/h</span>
                  <span className="flex items-center gap-1"><GaugeIcon size={9} /> {Math.round(data.pressure)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function initialTheme(): 'light' | 'dark' {
  // index.html sets the class before first paint (saved choice, else system preference).
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme);
  setDarkMode(theme === 'dark');
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    try { localStorage.setItem('theme', next); } catch { /* storage unavailable */ }
    setTheme(next);
  };
  const [day, setDay] = useState(5);
  const [variable, setVariable] = useState<EvaluatedVariable>('rainfall');
  const [mapMode, setMapMode] = useState<'confidence' | 'bust'>('confidence');
  const [selectedRegion, setSelectedRegion] = useState<string | null>('Odisha');
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const focusRegion = (region: string, focusDay: number) => {
    setSelectedRegion(region);
    setDay(focusDay);
  };

  return (
    <div className="min-h-screen bg-slate-100/70">
      <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 text-white">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center">
              <CloudRain size={20} className="text-sky-300" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Forecast Bust Detection</h1>
              <p className="text-xs text-slate-400">AI-based forecast confidence and uncertainty for medium-range NWP · India</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1.5">
              <Clock size={12} /> {SCENARIO.label}
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-300/30 text-amber-200 flex items-center gap-1.5">
              <Activity size={12} /> Demo data
            </span>

          </div>
        </div>
      </header>

      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-6 py-2.5 flex items-center gap-x-6 gap-y-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Variable</span>
            <div className="flex p-0.5 bg-slate-100 rounded-lg">
              {VARIABLES.map((v) => {
                const enabled = EVALUATED.includes(v.key);
                return (
                  <button
                    key={v.key}
                    onClick={() => enabled && setVariable(v.key as EvaluatedVariable)}
                    disabled={!enabled}
                    title={enabled ? `${v.label} bust detection from paired hindcast records` : 'Pending matching historical datasets'}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${variable === v.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800 disabled:text-slate-300 disabled:cursor-not-allowed'}`}
                  >
                    {v.icon} {v.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Lead time</span>
            <button onClick={() => setDay(Math.max(1, day - 1))} aria-label="Previous day" className="p-1 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30" disabled={day === 1}><ChevronLeft size={15} /></button>
            <div className="flex p-0.5 bg-slate-100 rounded-lg">
              {DAYS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDay(d)}
                  className={`w-8 py-1 rounded-md text-xs font-semibold transition-all ${day === d ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}
                >
                  D{d}
                </button>
              ))}
            </div>
            <button onClick={() => setDay(Math.min(10, day + 1))} aria-label="Next day" className="p-1 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30" disabled={day === 10}><ChevronRight size={15} /></button>
          </div>
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 text-xs font-medium transition-colors"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-4">
        <SummaryCards day={day} variable={variable} />
        <ForecastTimeline day={day} setDay={setDay} variable={variable} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-7 xl:col-span-8">
            <IndiaMap
              day={day} variable={variable} mapMode={mapMode} onMapModeChange={setMapMode}
              selectedRegion={selectedRegion} onSelectRegion={setSelectedRegion}
              hoveredRegion={hoveredRegion} onHoverRegion={setHoveredRegion}
            />
          </div>
          <div className="lg:col-span-5 xl:col-span-4">
            {selectedRegion ? (
              <RegionDetailPanel region={selectedRegion} day={day} variable={variable} onClose={() => setSelectedRegion(null)} />
            ) : (
              <div className="card flex items-center justify-center text-center py-24">
                <div>
                  <MapPin size={36} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-600 font-medium">Select a state on the map</p>
                  <p className="text-xs text-slate-400 mt-1">to see its bust risk and the reasons behind it</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-8">
            <BustHeatmap variable={variable} day={day} region={selectedRegion} onSelect={focusRegion} />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <ErrorProneAreas variable={variable} onSelect={focusRegion} />
            <ActiveSystems day={day} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <AIExplanation region={selectedRegion || 'Odisha'} day={day} variable={variable} />
          <HistoricalAnalogues region={selectedRegion || 'Odisha'} day={day} variable={variable} />
          <ModelCard variable={variable} />
        </div>

        <div className="pt-4">
          <h2 className="text-base font-semibold text-slate-900">Real observations &amp; verification</h2>
          <p className="text-xs text-slate-500">NCMRWF Unified Model forecasts checked against IMD gridded rainfall. Everything in this section is real data.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-7"><RealVerificationPanel onSelectRegion={setSelectedRegion} /></div>
          <div className="lg:col-span-5"><NwpIngestionPanel /></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-8"><ObservedClimatologyPanel region={selectedRegion} onSelectRegion={setSelectedRegion} /></div>
          <div className="lg:col-span-4 space-y-4">
            <DataSources />
            <SystemStatus />
          </div>
        </div>

        <LiveWeather day={day} variable={variable} />

        <footer className="text-center text-[11px] text-slate-400 py-4">
          Prototype · probabilities come from a transparent engine (logistic model + k-NN analogues); the LLM only writes the briefing.
        </footer>
      </main>
    </div>
  );
}
