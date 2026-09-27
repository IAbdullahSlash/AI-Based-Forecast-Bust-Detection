import { useState } from 'react';
import { Layers, ChevronDown, CloudRain, Clock, Activity, MapPin } from 'lucide-react';

export default function DataSources() {
  const [open, setOpen] = useState(false);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Layers size={15} /> Data Sources
        </span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-1.5">
          {[
            { name: 'NWP Forecast (ECMWF/GFS/IMD)', status: 'Active', icon: <CloudRain size={12} /> },
            { name: 'Historical Reanalysis (ERA5)', status: 'Calibrated', icon: <Clock size={12} /> },
            { name: 'Live Observations (Open-Meteo)', status: 'Live Feed', icon: <Activity size={12} /> },
            { name: 'Geographic & Topographic Grid', status: '32 States/UTs', icon: <MapPin size={12} /> },
          ].map((s) => (
            <div
              key={s.name}
              className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-xs"
            >
              <span className="font-medium text-slate-700 flex items-center gap-2">
                {s.icon} {s.name}
              </span>
              <span className="text-slate-500 font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                {s.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
