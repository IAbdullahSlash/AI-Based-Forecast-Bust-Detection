import { useEffect } from 'react';
import { X, Zap } from 'lucide-react';
import { ForecastVariable, getVariableUnit } from '../types';
import { getRegionData, getAnalogueData, getExplanation } from '../data/mockData';
import TrendChart from './TrendChart';
import ConfidenceGauge from './ConfidenceGauge';
import { bustBg, bustColor } from '../utils/weatherUtils';

interface RegionDetailPanelProps {
  region: string;
  day: number;
  variable: ForecastVariable;
  onClose: () => void;
}

export default function RegionDetailPanel({ region, day, variable, onClose }: RegionDetailPanelProps) {
  const data = getRegionData(region, variable);
  const analogues = getAnalogueData(region, variable);
  const explanation = getExplanation(region, variable);
  const unit = getVariableUnit(variable);

  // Keyboard shortcut: Escape key closes the detail panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="card p-4 w-80 flex-shrink-0 border-l-2 border-blue-200 overflow-y-auto"
      style={{ maxHeight: 'calc(100vh - 280px)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">{region}</h3>
          <div className="text-[11px] text-slate-500">
            Day {day} · {variable.charAt(0).toUpperCase() + variable.slice(1)}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Close (Esc)"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500">Bust Probability</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bustBg(data.bustProbability)}`}>
            {data.bustProbability}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${data.bustProbability}%`,
              backgroundColor: bustColor(data.bustProbability),
            }}
          />
        </div>
      </div>

      {/* 10-day bust probability sparkline */}
      <TrendChart region={region} variable={variable} currentDay={day} />

      <div className="grid grid-cols-2 gap-2 mb-4 mt-4">
        <div className="bg-slate-50 rounded-lg p-2">
          <div className="text-[10px] text-slate-500 uppercase">Forecast</div>
          <div className="text-lg font-bold text-slate-900">
            {data.forecastValue} <span className="text-xs font-normal text-slate-500">{unit}</span>
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <div className="text-[10px] text-slate-500 uppercase">Confidence</div>
          <div
            className={`text-lg font-bold ${
              data.confidence === 'high'
                ? 'text-green-600'
                : data.confidence === 'medium'
                ? 'text-yellow-600'
                : 'text-red-600'
            }`}
          >
            {data.confidence.toUpperCase()}
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <div className="text-[10px] text-slate-500 uppercase">Mean Error</div>
          <div className="text-lg font-bold text-slate-900">
            {data.historicalMeanError} <span className="text-xs font-normal text-slate-500">{unit}</span>
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <div className="text-[10px] text-slate-500 uppercase">Bust Freq</div>
          <div className="text-lg font-bold text-slate-900">{data.historicalBustFrequency}%</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700">Similar Cases</span>
          <span className="text-[11px] text-slate-500">
            {data.similarCases} total · {data.casesWithLargeError} large error
          </span>
        </div>
        <ConfidenceGauge
          value={data.historicalBustFrequency}
          label="Historical Bust Frequency"
          color={bustColor(data.historicalBustFrequency)}
        />
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
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    a.bustStatus === 'Forecast Bust'
                      ? 'bg-red-100 text-red-700'
                      : a.bustStatus === 'Large Error'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {a.bustStatus}
                </span>
              </div>
              <div className="text-slate-500">
                {a.region} · {a.date}
              </div>
              <div className="flex justify-between text-slate-500 mt-0.5">
                <span>Similarity: {a.similarity}%</span>
                <span>
                  Error: {a.forecastError}
                  {a.unit || unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
        <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5 mb-1">
          <Zap size={12} /> AI Synoptic Explanation
        </h4>
        <p className="text-[11px] text-blue-800 leading-relaxed">{explanation}</p>
      </div>
    </div>
  );
}
