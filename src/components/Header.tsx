import React, { useMemo } from 'react';
import { CloudRain, Radio, Clock, Server } from 'lucide-react';

interface HeaderProps {
  isBackendLive?: boolean;
}

export default function Header({ isBackendLive = false }: HeaderProps) {
  const liveDate = useMemo(
    () =>
      new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    []
  );

  return (
    <header className="bg-slate-900 text-white px-6 py-3 border-b border-slate-800">
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Title and subtitle */}
        <div>
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <CloudRain size={22} className="text-blue-400" /> AI Forecast Bust Detection
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Forecast Confidence & Uncertainty Intelligence
          </p>
        </div>

        {/* Action Buttons & Badges */}
        <div className="flex items-center flex-wrap gap-2.5">
          <span className="text-[10px] px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded-full border border-blue-500/30 flex items-center gap-1">
            <Radio size={8} /> Demo Mode
          </span>

          {/* Backend Status Badge */}
          <div
            className={`text-[11px] px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
              isBackendLive
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title={
              isBackendLive
                ? 'FastAPI algorithmic backend is active on http://127.0.0.1:8000'
                : 'Backend offline: using client-side deterministic fallback'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <Server className="w-3 h-3 opacity-75" />
            <span className="font-medium">
              {isBackendLive ? 'FastAPI Active (P90 Engine)' : 'Local Engine'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 pl-2 border-l border-slate-800">
            <Clock size={13} className="text-slate-400" />
            <span>{liveDate}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
