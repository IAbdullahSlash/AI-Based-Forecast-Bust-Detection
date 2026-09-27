import React from 'react';
import { CloudRain, Thermometer, Wind, Gauge, Satellite, RefreshCw, Download } from 'lucide-react';
import { ForecastVariable, ConfidenceByDay } from '../types';
import { exportConfidenceCSV } from '../utils/weatherUtils';

interface ControlBarProps {
  day: number;
  setDay: (day: number) => void;
  variable: ForecastVariable;
  setVariable: (v: ForecastVariable) => void;
  weatherLoading: boolean;
  onRefreshWeather: () => void;
  cb: ConfidenceByDay;
}

const VARIABLES: { key: ForecastVariable; label: string; icon: React.ReactNode }[] = [
  { key: 'rainfall', label: 'Rainfall', icon: <CloudRain size={15} /> },
  { key: 'temperature', label: 'Temperature', icon: <Thermometer size={15} /> },
  { key: 'wind', label: 'Wind', icon: <Wind size={15} /> },
  { key: 'pressure', label: 'Pressure', icon: <Gauge size={15} /> },
];

const DAYS = Array.from({ length: 10 }, (_, i) => i + 1);

export default function ControlBar({
  day,
  setDay,
  variable,
  setVariable,
  weatherLoading,
  onRefreshWeather,
  cb,
}: ControlBarProps) {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-2.5">
      <div className="flex items-center gap-4 flex-wrap justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Variable Selection */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Variable:</span>
            <div className="flex gap-1">
              {VARIABLES.map((v) => (
                <button
                  key={v.key}
                  onClick={() => setVariable(v.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    variable === v.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-6 bg-slate-200 hidden sm:block" />

          {/* Live Weather Action */}
          <button
            onClick={onRefreshWeather}
            disabled={weatherLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-50"
            title="Fetch live observations from Open-Meteo API"
          >
            <Satellite size={13} className={weatherLoading ? 'animate-spin' : ''} />
            {weatherLoading ? 'Fetching...' : 'Live Weather'}
          </button>

          <div className="w-px h-6 bg-slate-200 hidden sm:block" />

          {/* Lead Time Days Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Day:</span>
            <div className="flex gap-0.5">
              {DAYS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDay(d)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                    day === d
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-6 bg-slate-200 hidden sm:block" />

          {/* Refresh Control */}
          <button
            onClick={onRefreshWeather}
            disabled={weatherLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 disabled:opacity-50"
          >
            <RefreshCw size={13} className={weatherLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* CSV Export */}
        <button
          onClick={() => exportConfidenceCSV(day, variable, cb)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
          title="Download Day Intelligence CSV"
        >
          <Download size={13} /> Export CSV
        </button>
      </div>
    </div>
  );
}
