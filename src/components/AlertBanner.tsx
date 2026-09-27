import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Bell, Settings2, CheckCircle2 } from 'lucide-react';
import { RegionalData } from '../types';

interface AlertBannerProps {
  day: number;
  variable: string;
  regionsData: Record<string, RegionalData>;
  threshold: number;
  onThresholdChange: (newThreshold: number) => void;
  onSelectRegion: (region: string) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  day,
  regionsData,
  threshold,
  onThresholdChange,
  onSelectRegion,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Identify high-risk regions exceeding threshold
  const highRiskRegions = Object.values(regionsData)
    .filter((r) => r.bustProbability >= threshold)
    .sort((a, b) => b.bustProbability - a.bustProbability);

  const hasAlerts = highRiskRegions.length > 0;

  return (
    <div className="mb-4">
      <div
        className={`rounded-xl border shadow-sm transition-all duration-300 overflow-hidden bg-white ${
          hasAlerts
            ? 'border-l-4 border-l-rose-500 border-y-rose-200 border-r-rose-200 bg-gradient-to-r from-rose-50/70 via-white to-white'
            : 'border-l-4 border-l-emerald-500 border-y-slate-200 border-r-slate-200 bg-gradient-to-r from-emerald-50/60 via-white to-white'
        }`}
      >
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Alert Status & Headline */}
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl flex items-center justify-center border shadow-xs ${
                hasAlerts
                  ? 'bg-rose-100 border-rose-300 text-rose-600 animate-pulse'
                  : 'bg-emerald-100 border-emerald-300 text-emerald-700'
              }`}
            >
              {hasAlerts ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    hasAlerts ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  Operational Early Warning
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    hasAlerts
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  Day {day} Horizon
                </span>
              </div>
              <p className="text-sm font-medium text-slate-800">
                {hasAlerts ? (
                  <>
                    <span className="font-extrabold text-rose-600">{highRiskRegions.length} Regions</span>{' '}
                    breach{' '}
                    <span className="font-mono font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-300 text-xs">
                      {threshold}%
                    </span>{' '}
                    forecast bust threshold
                  </>
                ) : (
                  <>All regions within acceptable NWP stability limits (below {threshold}% bust risk)</>
                )}
              </p>
            </div>
          </div>

          {/* Right: Actions & Config */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg border border-slate-300 shadow-xs transition"
              title="Configure Alert Threshold"
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Threshold: {threshold}%</span>
            </button>

            {hasAlerts && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition"
              >
                <span>{isExpanded ? 'Hide' : 'Inspect'} ({highRiskRegions.length})</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Threshold Slider Dropdown */}
        {showConfig && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-slate-800">Bust Probability Alert Trigger:</span>
            </div>
            <div className="flex items-center gap-3 flex-1 max-w-xs">
              <input
                type="range"
                min="40"
                max="85"
                step="5"
                value={threshold}
                onChange={(e) => onThresholdChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-rose-600"
              />
              <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 min-w-[3rem] text-center">
                {threshold}%
              </span>
            </div>
            <span className="text-slate-500 text-[11px]">
              Regions with bust probability &ge; {threshold}% will trigger warnings and operational map highlights.
            </span>
          </div>
        )}

        {/* Expandable High Risk Regions List */}
        {isExpanded && hasAlerts && (
          <div className="px-4 py-3 bg-rose-50/70 border-t border-rose-200">
            <div className="text-[11px] font-bold text-rose-800 mb-2 uppercase tracking-wide">
              Critical Warning States (Click to Inspect on Map):
            </div>
            <div className="flex flex-wrap gap-2">
              {highRiskRegions.map((r) => (
                <button
                  key={r.region}
                  onClick={() => onSelectRegion(r.region)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-rose-100/60 border border-rose-300 hover:border-rose-400 rounded-lg shadow-2xs transition text-left group"
                >
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-950">
                    {r.region}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300">
                    {r.bustProbability}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
