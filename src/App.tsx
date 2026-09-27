import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { ForecastVariable } from './types';
import { STATE_POSITIONS } from './data/mockData';
import { useWeatherData } from './hooks/useWeatherData';
import { useConfidenceData } from './hooks/useConfidenceData';
import Header from './components/Header';
import ControlBar from './components/ControlBar';
import SummaryCards from './components/SummaryCards';
import ForecastTimeline from './components/ForecastTimeline';
import IndiaMap from './components/IndiaMap';
import MapLegend from './components/MapLegend';
import RegionDetailPanel from './components/RegionDetailPanel';
import AIExplanation from './components/AIExplanation';
import HistoricalAnalogues from './components/HistoricalAnalogues';
import DataSources from './components/DataSources';
import SystemStatus from './components/SystemStatus';
import LiveWeatherPanel from './components/LiveWeatherPanel';

export default function App() {
  const [day, setDay] = useState(5);
  const [variable, setVariable] = useState<ForecastVariable>('rainfall');
  const [mapMode, setMapMode] = useState<'confidence' | 'bust'>('confidence');
  const [selectedRegion, setSelectedRegion] = useState<string | null>('Odisha');
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const {
    weatherData,
    loading: weatherLoading,
    error: weatherError,
    refetch: refetchWeather,
    lastFetchTime,
  } = useWeatherData();

  // Single memoized confidence dataset — avoids re-computing on every render
  const cb = useConfidenceData(variable);

  // Global Keyboard shortcuts: Arrow keys for days & cycling regions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowRight') {
        setDay((d) => (d < 10 ? d + 1 : 1));
      } else if (e.key === 'ArrowLeft') {
        setDay((d) => (d > 1 ? d - 1 : 10));
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const stateNames = STATE_POSITIONS.map((s) => s.name);
        const currentIndex = selectedRegion ? stateNames.indexOf(selectedRegion) : -1;
        if (e.key === 'ArrowDown') {
          const nextIndex = (currentIndex + 1) % stateNames.length;
          setSelectedRegion(stateNames[nextIndex]);
        } else {
          const prevIndex = (currentIndex - 1 + stateNames.length) % stateNames.length;
          setSelectedRegion(stateNames[prevIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRegion]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <Header />

      {/* Control Bar */}
      <ControlBar
        day={day}
        setDay={setDay}
        variable={variable}
        setVariable={setVariable}
        weatherLoading={weatherLoading}
        onRefreshWeather={() => refetchWeather()}
        cb={cb}
      />

      {/* Main Dashboard Body */}
      <main className="flex-1 p-4 space-y-3 overflow-auto">
        {/* Nationwide Summary Metrics */}
        <SummaryCards day={day} variable={variable} cb={cb} />

        {/* 10-day Timeline */}
        <ForecastTimeline day={day} setDay={setDay} variable={variable} cb={cb} />

        {/* Core Interactive Section: Map + Detail Panel */}
        <div className="flex flex-col lg:flex-row gap-4" style={{ minHeight: '420px' }}>
          <div className="flex-1 space-y-3 flex flex-col">
            <IndiaMap
              day={day}
              variable={variable}
              mapMode={mapMode}
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
              hoveredRegion={hoveredRegion}
              onHoverRegion={setHoveredRegion}
              cb={cb}
            />

            {/* Map Mode Toggle & Legend Bar */}
            <div className="flex items-center justify-between flex-wrap gap-2 px-1">
              <MapLegend mapMode={mapMode} />
              <div className="flex gap-1">
                <button
                  onClick={() => setMapMode('confidence')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    mapMode === 'confidence'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Forecast Confidence
                </button>
                <button
                  onClick={() => setMapMode('bust')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    mapMode === 'bust'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Bust Probability
                </button>
              </div>
            </div>
          </div>

          {/* Regional Detail Side Panel */}
          {selectedRegion ? (
            <RegionDetailPanel
              region={selectedRegion}
              day={day}
              variable={variable}
              onClose={() => setSelectedRegion(null)}
            />
          ) : (
            <div className="w-80 card flex items-center justify-center text-center p-6 border border-dashed border-slate-200">
              <div>
                <MapPin size={38} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-600 font-semibold">Select a region on the map</p>
                <p className="text-xs text-slate-400 mt-1">
                  or use ↑/↓ arrow keys to inspect regional bust intelligence
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Synoptic Intelligence & Verification Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <AIExplanation region={selectedRegion || 'Odisha'} variable={variable} day={day} />
          <HistoricalAnalogues region={selectedRegion || 'Odisha'} variable={variable} />
          <DataSources />
        </div>

        {/* System & Model Health */}
        <SystemStatus />

        {/* Live Weather Observations Feed */}
        <LiveWeatherPanel
          weatherData={weatherData}
          weatherLoading={weatherLoading}
          weatherError={weatherError}
          lastFetchTime={lastFetchTime}
          day={day}
          mapMode={mapMode}
          cb={cb}
          onRefreshWeather={() => refetchWeather()}
        />
      </main>
    </div>
  );
}
