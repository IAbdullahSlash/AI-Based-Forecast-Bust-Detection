import { useState, useMemo } from 'react';
import {
  Clock, CloudRain, Wind, Thermometer, Gauge, MapPin,
  RefreshCw, Zap, AlertTriangle, ChevronDown, Sun, Cloud, Layers, Radio, Activity, CheckCircle2,
  ThermometerIcon, Droplets, WindIcon, GaugeIcon, Satellite, CloudDrizzle, TrendingUp,
} from 'lucide-react';
import { ForecastVariable, Confidence } from './types';
import {
  STATE_POSITIONS,
  STATE_DATA,
  getRegionData,
  getAnalogueData,
  getExplanation,
  getSummaryStats,
  getConfidenceByDay,
} from './data/mockData';
import IndiaMap from './components/IndiaMap';
import { useWeatherData } from './hooks/useWeatherData';

const VARIABLES: { key: ForecastVariable; label: string; icon: React.ReactNode }[] = [
  { key: 'rainfall', label: 'Rainfall', icon: <CloudRain size={15} /> },
  { key: 'temperature', label: 'Temperature', icon: <Thermometer size={15} /> },
  { key: 'wind', label: 'Wind', icon: <Wind size={15} /> },
  { key: 'pressure', label: 'Pressure', icon: <Gauge size={15} /> },
];

const DAYS = Array.from({ length: 10 }, (_, i) => i + 1);

function confidenceColor(conf: Confidence): string {
  return conf === 'high' ? '#22c55e' : conf === 'medium' ? '#eab308' : '#ef4444';
}

function confidenceBg(conf: Confidence): string {
  return conf === 'high' ? 'bg-green-100 text-green-800' : conf === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
}

function bustColor(prob: number): string {
  if (prob < 40) return '#3b82f6';
  if (prob < 60) return '#eab308';
  return '#ef4444';
}

function bustBg(prob: number): string {
  if (prob < 40) return 'bg-blue-100 text-blue-800';
  if (prob < 60) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

function mapColor(mode: string, conf: Confidence, prob: number): string {
  if (mode === 'confidence') return confidenceColor(conf);
  return bustColor(prob);
}

function getConfidence(day: number, region: string): Confidence {
  const cb = getConfidenceByDay();
  return cb[day]?.[region]?.confidence || 'medium';
}

function getBustProb(day: number, region: string): number {
  const cb = getConfidenceByDay();
  return cb[day]?.[region]?.bustProbability || 50;
}

function getForecastVal(day: number, region: string): number {
  const cb = getConfidenceByDay();
  return cb[day]?.[region]?.forecastValue || 100;
}

function SummaryCards({ day, variable }: { day: number; variable: ForecastVariable }) {
  const stats = useMemo(() => getSummaryStats(), []);
  const summary = useMemo(() => {
    let h = 0, m = 0, l = 0;
    STATE_POSITIONS.forEach((s) => {
      const c = getConfidence(day, s.name);
      if (c === 'high') h++; else if (c === 'medium') m++; else l++;
    });
    return { total: STATE_POSITIONS.length, high: h, med: m, low: l };
  }, [day]);

  return (
    <div className="grid grid-cols-4 gap-3">
      {[
        { label: 'Regions Analyzed', value: summary.total, sub: 'across India', icon: <MapPin size={18} />, color: 'text-slate-600', bg: 'bg-slate-100' },
        { label: 'High Confidence', value: summary.high, sub: `${Math.round(summary.high / summary.total * 100)}%`, icon: <CheckCircle2 size={18} />, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Medium Confidence', value: summary.med, sub: `${Math.round(summary.med / summary.total * 100)}%`, icon: <Activity size={18} />, color: 'text-yellow-600', bg: 'bg-yellow-100' },
        { label: 'Low Confidence', value: summary.low, sub: `${Math.round(summary.low / summary.total * 100)}%`, icon: <AlertTriangle size={18} />, color: 'text-red-600', bg: 'bg-red-100' },
      ].map((c) => (
        <div key={c.label} className="card p-3 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>{c.icon}</div>
          <div>
            <div className="text-2xl font-bold text-slate-900 leading-none">{c.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{c.label}</div>
            <div className={`text-xs font-medium ${c.color}`}>{c.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ForecastTimeline({ day, setDay }: { day: number; setDay: (d: number) => void }) {
  return (
    <div className="card p-3">
      <div className="flex items-center gap-2 mb-2">
        <Clock size={15} className="text-slate-500" />
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Forecast Timeline</span>
      </div>
      <div className="flex items-center gap-1">
        {DAYS.map((d) => {
          let h = 0, m = 0, l = 0;
          STATE_POSITIONS.forEach((s) => {
            const c = getConfidence(d, s.name);
            if (c === 'high') h++; else if (c === 'medium') m++; else l++;
          });
          const conf = l > m && l > h ? 'low' : h > m ? 'high' : 'medium';
          const col = confidenceColor(conf);
          return (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`flex-1 flex flex-col items-center py-1.5 rounded-lg text-xs font-medium transition-all ${day === d ? 'ring-2 ring-blue-500 ring-offset-1 bg-blue-50' : 'hover:bg-slate-50'}`}
            >
              <span className="text-[10px] text-slate-500 mb-1">Day {d}</span>
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: col }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MapLegend({ mapMode }: { mapMode: string }) {
  if (mapMode === 'confidence') {
    return (
      <div className="flex items-center gap-4 text-xs">
        <span className="font-medium text-slate-600">Confidence:</span>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500" /> <span className="text-slate-600">High</span></div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500" /> <span className="text-slate-600">Medium</span></div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500" /> <span className="text-slate-600">Low</span></div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-4 text-xs">
      <span className="font-medium text-slate-600">Bust Probability:</span>
      <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500" /> <span className="text-slate-600">Low</span></div>
      <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500" /> <span className="text-slate-600">Medium</span></div>
      <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500" /> <span className="text-slate-600">High</span></div>
    </div>
  );
}

function ConfidenceGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const angle = (value / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const x = 50 + 40 * Math.cos(rad - Math.PI / 2);
  const y = 50 + 40 * Math.sin(rad - Math.PI / 2);
  const largeArc = angle > 180 ? 1 : 0;

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="60" viewBox="0 0 100 60">
        <path d="M10,55 A40,40 0 0,1 90,55" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
        <path d="M10,55 A40,40 0 0,1 90,55" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${value * 0.8} 80`} />
        <circle cx={x} cy={y} r="4" fill={color} />
      </svg>
      <div className="text-center mt-1">
        <div className="text-xl font-bold" style={{ color }}>{value}%</div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

function RegionDetailPanel({ region, day, variable, onClose }: { region: string; day: number; variable: ForecastVariable; onClose: () => void }) {
  const data = getRegionData(region);
  const analogues = getAnalogueData(region);
  const explanation = getExplanation(region);

  return (
    <div className="card p-4 w-80 flex-shrink-0 border-l-2 border-blue-200 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">{region}</h3>
          <div className="text-[11px] text-slate-500">Day {day} · {variable.charAt(0).toUpperCase() + variable.slice(1)}</div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500">Bust Probability</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bustBg(data.bustProbability)}`}>{data.bustProbability}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${data.bustProbability}%`, backgroundColor: bustColor(data.bustProbability) }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-slate-50 rounded-lg p-2">
          <div className="text-[10px] text-slate-500 uppercase">Forecast</div>
          <div className="text-lg font-bold text-slate-900">{data.forecastValue} <span className="text-xs font-normal text-slate-500">mm</span></div>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <div className="text-[10px] text-slate-500 uppercase">Confidence</div>
          <div className={`text-lg font-bold ${data.confidence === 'high' ? 'text-green-600' : data.confidence === 'medium' ? 'text-yellow-600' : 'text-red-600'}`}>{data.confidence.toUpperCase()}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <div className="text-[10px] text-slate-500 uppercase">Mean Error</div>
          <div className="text-lg font-bold text-slate-900">{data.historicalMeanError} <span className="text-xs font-normal text-slate-500">mm</span></div>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <div className="text-[10px] text-slate-500 uppercase">Bust Freq</div>
          <div className="text-lg font-bold text-slate-900">{data.historicalBustFrequency}%</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700">Similar Cases</span>
          <span className="text-[11px] text-slate-500">{data.similarCases} total · {data.casesWithLargeError} large error</span>
        </div>
        <ConfidenceGauge value={data.historicalBustFrequency} label="Historical Bust Frequency" color={bustColor(data.historicalBustFrequency)} />
      </div>

      <div className="mb-4">
        <h4 className="text-xs font-semibold text-slate-700 mb-2">Key Reasons</h4>
        <ul className="space-y-1">
          {data.keyReasons.map((r, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
              <span className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
              {r}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-4">
        <h4 className="text-xs font-semibold text-slate-700 mb-2">Historical Analogues</h4>
        <div className="space-y-2">
          {analogues.slice(0, 5).map((a, i) => (
            <div key={i} className="bg-slate-50 rounded-lg p-2 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-slate-800">{a.eventType}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${a.bustStatus === 'Forecast Bust' ? 'bg-red-100 text-red-700' : a.bustStatus === 'Large Error' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                  {a.bustStatus}
                </span>
              </div>
              <div className="text-slate-500">{a.region} · {a.date}</div>
              <div className="flex justify-between text-slate-500 mt-0.5">
                <span>Similarity: {a.similarity}%</span>
                <span>Error: {a.forecastError}mm</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
        <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5 mb-1"><Zap size={12} /> AI Explanation</h4>
        <p className="text-[11px] text-blue-800 leading-relaxed">{explanation}</p>
      </div>
    </div>
  );
}

function HistoricalAnalogues({ region }: { region: string }) {
  const analogues = getAnalogueData(region);
  return (
    <div className="card p-3">
      <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2"><Clock size={15} /> Historical Analogues</h3>
      <div className="space-y-2">
        {analogues.slice(0, 5).map((a, i) => (
          <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-lg p-2 text-xs">
            <div className="flex-1">
              <div className="font-medium text-slate-800">{a.eventType}</div>
              <div className="text-slate-500">{a.region} · {a.date}</div>
            </div>
            <div className="text-center flex-shrink-0">
              <div className="font-bold text-slate-800">{a.similarity}%</div>
              <div className="text-[9px] text-slate-500">sim.</div>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${a.bustStatus === 'Forecast Bust' ? 'bg-red-100 text-red-700' : a.bustStatus === 'Large Error' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
              {a.bustStatus}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIExplanation({ region }: { region: string }) {
  const explanation = getExplanation(region);
  return (
    <div className="card p-3 border-blue-100">
      <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2"><Zap size={15} className="text-blue-500" /> Why is forecast confidence low?</h3>
      <p className="text-xs text-slate-600 leading-relaxed mb-2">{explanation}</p>
      <div className="flex flex-wrap gap-1">
        {['High historical error', 'Large forecast revision', 'High ensemble spread', 'Strong moisture availability', 'Rapidly evolving weather system'].map((tag) => (
          <span key={tag} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-medium">{tag}</span>
        ))}
      </div>
    </div>
  );
}

function DataSources() {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
        <span className="flex items-center gap-2"><Layers size={15} /> Data Sources</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-1.5">
          {[
            { name: 'NWP Forecast', status: 'Mock', icon: <CloudRain size={12} /> },
            { name: 'Historical Forecasts', status: 'Mock', icon: <Clock size={12} /> },
            { name: 'Weather Observations', status: 'Mock', icon: <Activity size={12} /> },
            { name: 'Geographic Data', status: 'Mock', icon: <MapPin size={12} /> },
          ].map((s) => (
            <div key={s.name} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-xs">
              <span className="font-medium text-slate-700 flex items-center gap-2">{s.icon} {s.name}</span>
              <span className="text-slate-400 text-[10px]">{s.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SystemStatus() {
  const items = [
    { name: 'Forecast analysis', status: 'Ready' },
    { name: 'Historical analogue engine', status: 'Ready' },
    { name: 'Confidence engine', status: 'Ready' },
    { name: 'AI explanation', status: 'Ready' },
  ];
  return (
    <div className="card p-3">
      <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2"><Radio size={12} /> System Status</h3>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <span className="text-slate-600">{item.name}</span>
            <span className="flex items-center gap-1 text-green-600 font-medium"><span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> {item.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [day, setDay] = useState(5);
  const [variable, setVariable] = useState<ForecastVariable>('rainfall');
  const [mapMode, setMapMode] = useState<'confidence' | 'bust'>('confidence');
  const [selectedRegion, setSelectedRegion] = useState<string | null>('Odisha');
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const { weatherData, loading: weatherLoading, error: weatherError, refetch: refetchWeather, lastFetchTime } = useWeatherData();

  const selectedData = selectedRegion ? getRegionData(selectedRegion) : null;
  const summary = getSummaryStats();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <CloudRain size={22} className="text-blue-400" /> AI Forecast Bust Detection
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Forecast Confidence & Uncertainty Intelligence</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded-full border border-blue-500/30 flex items-center gap-1"><Radio size={8} /> Demo Mode</span>
            <Clock size={14} className="text-slate-400" />
            <span className="text-xs text-slate-400">2024-07-15</span>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Variable:</span>
            <div className="flex gap-1">
              {VARIABLES.map((v) => (
                <button
                  key={v.key}
                  onClick={() => setVariable(v.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${variable === v.key ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <button
            onClick={() => refetchWeather()}
            disabled={weatherLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-50"
          >
            <Satellite size={13} className={weatherLoading ? 'animate-spin' : ''} />
            {weatherLoading ? 'Fetching...' : 'Live Weather'}
          </button>
          <div className="w-px h-6 bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Day:</span>
            <div className="flex gap-0.5">
              {DAYS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDay(d)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${day === d ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-600 transition-all">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 space-y-3 overflow-auto">
        <SummaryCards day={day} variable={variable} />
        <ForecastTimeline day={day} setDay={setDay} />

        <div className="flex gap-4" style={{ minHeight: '420px' }}>
          {/* Map */}
          <div className="flex-1 space-y-3">
            <IndiaMap
              day={day} variable={variable} mapMode={mapMode}
              selectedRegion={selectedRegion} onSelectRegion={setSelectedRegion}
              hoveredRegion={hoveredRegion} onHoverRegion={setHoveredRegion}
            />
            <div className="flex items-center justify-between">
              <MapLegend mapMode={mapMode} />
              <div className="flex gap-1">
                <button
                  onClick={() => setMapMode('confidence')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${mapMode === 'confidence' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  Forecast Confidence
                </button>
                <button
                  onClick={() => setMapMode('bust')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${mapMode === 'bust' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  Bust Probability
                </button>
              </div>
            </div>
          </div>

          {/* Detail Panel */}
          {selectedRegion && selectedData && (
            <RegionDetailPanel region={selectedRegion} day={day} variable={variable} onClose={() => setSelectedRegion(null)} />
          )}
          {!selectedRegion && (
            <div className="w-80 card flex items-center justify-center text-center">
              <div>
                <MapPin size={40} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-medium">Select a region on the map</p>
                <p className="text-xs text-slate-400 mt-1">to view regional details</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-3 gap-3">
          <AIExplanation region={selectedRegion || 'Odisha'} />
          <HistoricalAnalogues region={selectedRegion || 'Odisha'} />
          <DataSources />
        </div>
        <SystemStatus />

        {/* Live Weather Panel */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Satellite size={16} className="text-emerald-500" /> Live Weather
              {lastFetchTime && (
                <span className="text-[10px] text-slate-400 font-normal">
                  · Updated {lastFetchTime.toLocaleTimeString()}
                </span>
              )}
            </h3>
            {weatherError && (
              <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full">{weatherError}</span>
            )}
          </div>
          {weatherData.size === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <Satellite size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Click "Live Weather" to fetch real-time conditions across India</p>
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-2">
              {Array.from(weatherData.entries()).slice(0, 18).map(([region, data]) => {
                const col = mapColor(mapMode, getConfidence(day, region), getBustProb(day, region));
                return (
                  <div key={region} className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 hover:border-slate-300 transition-all">
                    <div className="text-[10px] font-semibold text-slate-700 mb-1.5">{region}</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <ThermometerIcon size={9} /> {Math.round(data.temperature)}°C
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Droplets size={9} /> {Math.round(data.rainfall)}mm
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <WindIcon size={9} /> {Math.round(data.windSpeed)}km/h
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <GaugeIcon size={9} /> {Math.round(data.pressure)}hPa
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col }} />
                      <span className="text-[9px] text-slate-400">{getConfidence(day, region).toUpperCase()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
