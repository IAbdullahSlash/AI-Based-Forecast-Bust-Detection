import { Satellite, ThermometerIcon, Droplets, WindIcon, GaugeIcon } from 'lucide-react';
import { ConfidenceByDay, WeatherData } from '../types';
import { mapColor, getConfidence, getBustProb } from '../utils/weatherUtils';

interface LiveWeatherPanelProps {
  weatherData: Map<string, WeatherData>;
  weatherLoading: boolean;
  weatherError: string | null;
  lastFetchTime: Date | null;
  day: number;
  mapMode: 'confidence' | 'bust';
  cb: ConfidenceByDay;
  onRefreshWeather: () => void;
}

export default function LiveWeatherPanel({
  weatherData,
  weatherLoading,
  weatherError,
  lastFetchTime,
  day,
  mapMode,
  cb,
  onRefreshWeather,
}: LiveWeatherPanelProps) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Satellite size={16} className="text-emerald-500" /> Live Weather Observations
          {lastFetchTime && (
            <span className="text-[10px] text-slate-400 font-normal">
              · Updated {lastFetchTime.toLocaleTimeString()}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {weatherError && (
            <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
              {weatherError}
            </span>
          )}
          <button
            onClick={onRefreshWeather}
            disabled={weatherLoading}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
          >
            {weatherLoading ? 'Updating...' : 'Refresh Feed'}
          </button>
        </div>
      </div>

      {weatherData.size === 0 ? (
        <div className="text-center py-6 text-slate-400">
          <Satellite size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-xs">Click "Live Weather" in the top bar to fetch real-time conditions across India</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {Array.from(weatherData.entries()).slice(0, 18).map(([region, data]) => {
            const conf = getConfidence(day, region, cb);
            const prob = getBustProb(day, region, cb);
            const col = mapColor(mapMode, conf, prob);

            return (
              <div
                key={region}
                className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 hover:border-slate-300 transition-all hover:shadow-sm"
              >
                <div className="text-[11px] font-bold text-slate-800 mb-1.5 truncate" title={region}>
                  {region}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-slate-600">
                    <ThermometerIcon size={10} className="text-amber-500" /> {Math.round(data.temperature)}°C
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-600">
                    <Droplets size={10} className="text-blue-500" /> {Math.round(data.rainfall)} mm
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-600">
                    <WindIcon size={10} className="text-teal-500" /> {Math.round(data.windSpeed)} km/h
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-600">
                    <GaugeIcon size={10} className="text-purple-500" /> {Math.round(data.pressure)} hPa
                  </div>
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[9px] text-slate-400 font-mono">Day {day}</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col }} />
                    <span className="text-[9px] font-semibold text-slate-700">
                      {mapMode === 'confidence' ? conf.toUpperCase() : `${prob}%`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
