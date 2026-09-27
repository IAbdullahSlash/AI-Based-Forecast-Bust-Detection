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
        className={`rounded-xl border transition-all duration-300 shadow-sm overflow-hidden ${
          hasAlerts
            ? 'bg-gradient-to-r from-red-950/40 via-red-900/20 to-slate-900 border-red-500/40'
            : 'bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border-emerald-500/30'
        }`}
      >
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Alert Status */}
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg flex items-center justify-center ${
                hasAlerts ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {hasAlerts ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Operational Early Warning
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    hasAlerts
                      ? 'bg-red-500/30 text-red-300 border border-red-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  Day {day} Horizon
                </span>
              </div>
              <p className="text-sm font-medium text-slate-100">
                {hasAlerts ? (
                  <>
                    <span className="font-bold text-red-400">{highRiskRegions.length} Regions</span> breach{' '}
                    <span className="font-mono text-amber-300">{threshold}%</span> forecast bust threshold
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition"
              title="Configure Alert Threshold"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Threshold: {threshold}%</span>
            </button>

            {hasAlerts && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-950/60 hover:bg-red-900/60 text-red-300 rounded-lg border border-red-800/40 transition"
              >
                <span>{isExpanded ? 'Hide' : 'Inspect'} ({highRiskRegions.length})</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Threshold Slider Dropdown */}
        {showConfig && (
          <div className="px-4 py-3 bg-slate-900/90 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-slate-200">Bust Probability Alert Trigger:</span>
            </div>
            <div className="flex items-center gap-3 flex-1 max-w-xs">
              <input
                type="range"
                min="40"
                max="85"
                step="5"
                value={threshold}
                onChange={(e) => onThresholdChange(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <span className="font-mono font-bold text-amber-400 min-w-[3rem]">{threshold}%</span>
            </div>
            <span className="text-slate-400 text-[11px]">
              Regions with bust probability &ge; {threshold}% will trigger warnings and operational map highlights.
            </span>
          </div>
        )}

        {/* Expandable High Risk Regions List */}
        {isExpanded && hasAlerts && (
          <div className="px-4 py-3 bg-red-950/30 border-t border-red-900/40">
            <div className="text-xs font-semibold text-red-300 mb-2 uppercase tracking-wide">
              Critical Warning States (Click to Inspect):
            </div>
            <div className="flex flex-wrap gap-2">
              {highRiskRegions.map((r) => (
                <button
                  key={r.region}
                  onClick={() => onSelectRegion(r.region)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-red-500/40 hover:border-red-400 rounded-lg transition text-left group"
                >
                  <span className="text-xs font-medium text-slate-200 group-hover:text-white">
                    {r.region}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/50">
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
