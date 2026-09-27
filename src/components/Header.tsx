import React, { useMemo } from 'react';
import { CloudRain, Radio, Clock } from 'lucide-react';

export default function Header() {
  const liveDate = useMemo(() => new Date().toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
  }), []);

  return (
    <header className="bg-slate-900 text-white px-6 py-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <CloudRain size={22} className="text-blue-400" /> AI Forecast Bust Detection
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Forecast Confidence & Uncertainty Intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded-full border border-blue-500/30 flex items-center gap-1">
            <Radio size={8} /> Demo Mode
          </span>
          <Clock size={14} className="text-slate-400" />
          <span className="text-xs text-slate-400">{liveDate}</span>
        </div>
      </div>
    </header>
  );
}
