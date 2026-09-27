import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MapPin, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { STATE_POSITIONS, getRegionData } from '../data/mockData';
import { STATE_BOUNDARIES } from '../data/indiaMapPaths';
import { ForecastVariable, ConfidenceByDay, getVariableUnit } from '../types';
import { confidenceColor, bustColor, getConfidence, getBustProb, getForecastVal } from '../utils/weatherUtils';

function parseVB(vb: string) {
  const p = vb.split(/\s+/).map(Number);
  return { x: p[0], y: p[1], w: p[2], h: p[3] };
}

interface IndiaMapProps {
  day: number;
  variable: ForecastVariable;
  mapMode: 'confidence' | 'bust';
  selectedRegion: string | null;
  onSelectRegion: (r: string | null) => void;
  hoveredRegion: string | null;
  onHoverRegion: (r: string | null) => void;
  cb?: ConfidenceByDay;
}

export default function IndiaMap({
  day,
  variable,
  mapMode,
  selectedRegion,
  onSelectRegion,
  hoveredRegion,
  onHoverRegion,
  cb,
}: IndiaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const DEFAULT_VIEWBOX = '0 0 800 950';
  const [viewBox, setViewBox] = useState(DEFAULT_VIEWBOX);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [viewBoxStart, setViewBoxStart] = useState(DEFAULT_VIEWBOX);
  const [tooltipRegion, setTooltipRegion] = useState<string | null>(null);
  const [tooltipMouse, setTooltipMouse] = useState({ x: 0, y: 0 });

  // Touch tracking for pinch-zoom and pan
  const touchStartRef = useRef<{ dist: number; midX: number; midY: number; vb: string } | null>(null);

  const zoomAtCenter = useCallback((factor: number) => {
    setViewBox((prev) => {
      const { x, y, w, h } = parseVB(prev);
      const newW = w / factor;
      const newH = h / factor;
      return `${x + (w - newW) / 2} ${y + (h - newH) / 2} ${newW} ${newH}`;
    });
  }, []);

  const resetView = useCallback(() => {
    setViewBox(DEFAULT_VIEWBOX);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.15 : 0.87;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;

    setViewBox((prev) => {
      const { x, y, w, h } = parseVB(prev);
      const newW = w / factor;
      const newH = h / factor;
      const newX = x + (w - newW) * mx;
      const newY = y + (h - newH) * my;
      return `${newX} ${newY} ${newW} ${newH}`;
    });
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setViewBoxStart(viewBox);
    },
    [viewBox]
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      const { x, y, w, h } = parseVB(viewBoxStart);
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const scaleX = w / rect.width;
      const scaleY = h / rect.height;
      const newX = x - dx * scaleX;
      const newY = y - dy * scaleY;
      setViewBox(`${newX} ${newY} ${w} ${h}`);
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, dragStart, viewBoxStart]);

  // Touch handlers for mobile pan & pinch-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX, y: touch.clientY });
      setViewBoxStart(viewBox);
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchStartRef.current = {
        dist,
        midX: (t1.clientX + t2.clientX) / 2,
        midY: (t1.clientY + t2.clientY) / 2,
        vb: viewBox,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      const dx = touch.clientX - dragStart.x;
      const dy = touch.clientY - dragStart.y;
      const { x, y, w, h } = parseVB(viewBoxStart);
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scaleX = w / rect.width;
      const scaleY = h / rect.height;
      setViewBox(`${x - dx * scaleX} ${y - dy * scaleY} ${w} ${h}`);
    } else if (e.touches.length === 2 && touchStartRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const factor = dist / touchStartRef.current.dist;
      const { x, y, w, h } = parseVB(touchStartRef.current.vb);
      const newW = w / factor;
      const newH = h / factor;
      setViewBox(`${x + (w - newW) / 2} ${y + (h - newH) / 2} ${newW} ${newH}`);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartRef.current = null;
  };

  const handleRegionHover = useCallback(
    (name: string | null, e?: React.MouseEvent) => {
      onHoverRegion(name);
      if (name && e && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setTooltipMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
      setTooltipRegion(name);
    },
    [onHoverRegion]
  );

  const getRegionInfo = (name: string) => {
    const d = getRegionData(name, variable);
    if (!d) return null;
    return {
      conf: getConfidence(day, name, cb),
      bustProb: getBustProb(day, name, cb),
      forecastVal: getForecastVal(day, name, cb),
      baseData: d,
    };
  };

  const getLabel = (name: string) => {
    const info = getRegionInfo(name);
    if (!info) return '';
    if (mapMode === 'confidence') return info.conf === 'high' ? 'H' : info.conf === 'medium' ? 'M' : 'L';
    return `${info.bustProb}%`;
  };

  return (
    <div className="card p-4 flex-1 relative bg-white">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <MapPin size={16} className="text-blue-500" /> India Forecast Map
          <span className="text-[11px] font-normal text-slate-500">
            ({mapMode === 'confidence' ? 'Forecast Reliability' : 'Bust Probability'})
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold">
            Day {day}
          </span>
          <span className="text-[9px] text-slate-400 hidden sm:inline">Scroll to zoom &bull; Drag to pan</span>
        </div>
      </div>

      {/* Map Control Buttons */}
      <div className="absolute top-12 right-6 z-10 flex flex-col gap-1.5">
        <button
          onClick={() => zoomAtCenter(1.25)}
          className="w-7 h-7 bg-white hover:bg-slate-50 rounded-lg shadow-sm flex items-center justify-center text-slate-700 hover:text-slate-900 border border-slate-200 transition"
          title="Zoom in"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={() => zoomAtCenter(0.8)}
          className="w-7 h-7 bg-white hover:bg-slate-50 rounded-lg shadow-sm flex items-center justify-center text-slate-700 hover:text-slate-900 border border-slate-200 transition"
          title="Zoom out"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={resetView}
          className="w-7 h-7 bg-white hover:bg-slate-50 rounded-lg shadow-sm flex items-center justify-center text-slate-700 hover:text-slate-900 border border-slate-200 transition"
          title="Reset view"
        >
          <Maximize size={14} />
        </button>
      </div>

      {/* SVG Map Container */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl bg-slate-50/50 border border-slate-100"
        style={{ paddingTop: '105%' }}
      >
        <svg
          viewBox={viewBox}
          className="absolute top-0 left-0 w-full h-full cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'none' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseMove={(e) => {
            if (isDragging) return;
            if (tooltipRegion && containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              setTooltipMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            }
          }}
          onMouseLeave={() => {
            if (!isDragging) {
              handleRegionHover(null);
            }
          }}
        >
          {/* Subtle Background Grid Pattern */}
          <defs>
            <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="0.5" strokeOpacity="0.3" />
            </pattern>
          </defs>
          <rect width="800" height="950" fill="url(#mapGrid)" />

          {/* 1. Authentic State Geographic Boundaries */}
          <g className="states-polygons">
            {Object.entries(STATE_BOUNDARIES).map(([name, pathD]) => {
              const info = getRegionInfo(name);
              const isSelected = selectedRegion === name;
              const isHovered = hoveredRegion === name;

              let fillColor = '#f8fafc';
              let strokeColor = '#94a3b8';
              let fillOpacity = 0.5;

              if (info) {
                const baseCol = mapMode === 'confidence' ? confidenceColor(info.conf) : bustColor(info.bustProb);
                strokeColor = isSelected ? '#0f172a' : isHovered ? '#1e293b' : baseCol;
                fillColor = baseCol;
                fillOpacity = isSelected ? 0.45 : isHovered ? 0.35 : 0.18;
              }

              return (
                <path
                  key={name}
                  d={pathD}
                  fill={fillColor}
                  fillOpacity={fillOpacity}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
                  strokeLinejoin="round"
                  className="transition-colors duration-150 cursor-pointer"
                  onMouseEnter={(e) => handleRegionHover(name, e)}
                  onMouseLeave={(e) => handleRegionHover(null, e)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRegion(selectedRegion === name ? null : name);
                  }}
                />
              );
            })}
          </g>

          {/* 2. Interactive Region Indicator Nodes & Labels */}
          <g className="state-markers">
            {STATE_POSITIONS.map((s) => {
              const info = getRegionInfo(s.name);
              if (!info) return null;
              const col = mapMode === 'confidence' ? confidenceColor(info.conf) : bustColor(info.bustProb);
              const isSelected = selectedRegion === s.name;
              const isHovered = hoveredRegion === s.name;
              const r = isSelected ? 16 : isHovered ? 14 : 11;

              return (
                <g
                  key={s.name}
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    handleRegionHover(s.name, e);
                  }}
                  onMouseLeave={(e) => {
                    e.stopPropagation();
                    handleRegionHover(null, e);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRegion(selectedRegion === s.name ? null : s.name);
                  }}
                  className="cursor-pointer"
                >
                  {/* Selection Pulse Ring */}
                  {isSelected && (
                    <circle
                      cx={s.x}
                      cy={s.y}
                      r={r + 8}
                      fill="none"
                      stroke={col}
                      strokeWidth="2.5"
                      strokeDasharray="4 3"
                      className="animate-spin"
                      style={{ transformOrigin: `${s.x}px ${s.y}px`, animationDuration: '8s' }}
                    />
                  )}

                  {/* Marker Node Circle */}
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={r}
                    fill={col}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? 2.5 : 2}
                    className="drop-shadow-sm transition-all"
                  />

                  {/* Marker Text Value (H/M/L or Bust %) */}
                  <text
                    x={s.x}
                    y={s.y + (mapMode === 'confidence' ? 3.5 : 3)}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={mapMode === 'confidence' ? (isSelected ? '11px' : '9px') : isSelected ? '9px' : '8px'}
                    fontWeight="800"
                    fontFamily="monospace"
                    pointerEvents="none"
                  >
                    {getLabel(s.name)}
                  </text>

                  {/* State Name Label Below Marker */}
                  <text
                    x={s.x}
                    y={s.y + r + 10}
                    textAnchor="middle"
                    fill={isSelected ? '#0f172a' : '#334155'}
                    fontSize={isSelected ? '10px' : '8.5px'}
                    fontWeight={isSelected ? '800' : '600'}
                    pointerEvents="none"
                    className="select-none"
                    style={{
                      textShadow: '0 1px 3px rgba(255,255,255,0.9), 0 0 2px rgba(255,255,255,0.8)'
                    }}
                  >
                    {s.name.replace('&', 'and')}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Tooltip */}
        {tooltipRegion && (() => {
          const info = getRegionInfo(tooltipRegion);
          if (!info) return null;
          const unit = getVariableUnit(variable);
          return (
            <div
              className="absolute z-20 pointer-events-none bg-slate-900/95 text-white text-xs rounded-xl p-3 shadow-xl border border-slate-700 backdrop-blur-sm -translate-x-1/2 -translate-y-full mb-3 min-w-[190px]"
              style={{ left: tooltipMouse.x, top: tooltipMouse.y - 12 }}
            >
              <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-slate-700/80">
                <span className="font-bold text-white text-sm">{tooltipRegion}</span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                  style={{
                    backgroundColor:
                      info.conf === 'high' ? '#166534' : info.conf === 'medium' ? '#854d0e' : '#991b1b',
                    color: '#ffffff'
                  }}
                >
                  {info.conf} Confidence
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span>Forecast Value:</span>
                  <span className="font-mono font-bold text-white">
                    {info.forecastVal} {unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Bust Probability:</span>
                  <span
                    className="font-mono font-bold"
                    style={{ color: bustColor(info.bustProb) }}
                  >
                    {info.bustProb}%
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-[10px] pt-1 border-t border-slate-800">
                  <span>Historical MAE:</span>
                  <span className="font-mono">±{info.baseData.historicalMeanError} {unit}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}