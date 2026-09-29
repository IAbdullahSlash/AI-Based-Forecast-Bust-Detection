import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Maximize, Minus, Plus } from 'lucide-react';
import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';
import indiaTopo from '../data/indiaStates.topo.json';
import { getRegionData } from '../analysis/forecastEngine';
import { STATE_POSITIONS } from '../data/regions';
import { EvaluatedVariable } from '../types';
import { BUST_LEGEND, CONFIDENCE_COLORS, CONFIDENCE_LABELS, bustColor, bustTextColor, confidenceColor } from '../theme';

const WIDTH = 560;
const HEIGHT = 640;
const MAX_ZOOM = 6;

/** Map dataset names that differ from the engine's region names. */
const NAME_ALIASES: Record<string, string> = { 'Jammu and Kashmir': 'Jammu & Kashmir' };

const ABBREVIATIONS: Record<string, string> = {
  'Jammu & Kashmir': 'JK', 'Himachal Pradesh': 'HP', Punjab: 'PB', Haryana: 'HR', Uttarakhand: 'UK',
  'Uttar Pradesh': 'UP', Bihar: 'BR', Jharkhand: 'JH', 'West Bengal': 'WB', Sikkim: 'SK',
  'Arunachal Pradesh': 'AR', Assam: 'AS', Meghalaya: 'ML', Odisha: 'OD', Chhattisgarh: 'CG',
  'Madhya Pradesh': 'MP', Rajasthan: 'RJ', Gujarat: 'GJ', Maharashtra: 'MH', Goa: 'GA',
  Karnataka: 'KA', Kerala: 'KL', 'Tamil Nadu': 'TN', 'Andhra Pradesh': 'AP', Telangana: 'TS',
};

const ANALYSED = new Set(STATE_POSITIONS.map((state) => state.name));

type StateFeature = Feature<Geometry, { name: string }>;

// Project the map once at module load; only colours change with day/variable.
const MAP = (() => {
  const topology = indiaTopo as unknown as Topology<{ states: GeometryCollection<{ name: string }> }>;
  const collection = feature(topology, topology.objects.states) as FeatureCollection<Geometry, { name: string }>;
  const projection = geoMercator().fitExtent([[18, 18], [WIDTH - 18, HEIGHT - 18]], collection);
  const path = geoPath(projection);
  const states = (collection.features as StateFeature[]).map((state) => {
    const name = NAME_ALIASES[state.properties.name] ?? state.properties.name;
    const [x, y] = path.centroid(state);
    // Island groups like Lakshadweep are sub-pixel at this scale; mark them with a dot.
    return { name, d: path(state) ?? '', x, y, analysed: ANALYSED.has(name), tiny: path.area(state) < 4 };
  });
  const label = (lng: number, lat: number) => projection([lng, lat]) ?? [0, 0];
  return {
    states,
    seas: [
      { text: 'Arabian Sea', at: label(66.5, 16) },
      { text: 'Bay of Bengal', at: label(88.5, 15.5) },
      { text: 'Indian Ocean', at: label(80.5, 5.5) },
    ],
  };
})();

// Hand-tuned label offsets where the centroid sits awkwardly.
const LABEL_NUDGE: Record<string, [number, number]> = {
  Goa: [-10, 0], Haryana: [-2, 4], 'West Bengal': [4, 8], Sikkim: [0, -6], 'Himachal Pradesh': [0, 2],
};

interface View { k: number; x: number; y: number }

export default function IndiaMap({
  day, variable, mapMode, onMapModeChange, selectedRegion, onSelectRegion, hoveredRegion, onHoverRegion,
}: {
  day: number; variable: EvaluatedVariable; mapMode: 'confidence' | 'bust';
  onMapModeChange: (mode: 'confidence' | 'bust') => void;
  selectedRegion: string | null; onSelectRegion: (r: string | null) => void;
  hoveredRegion: string | null; onHoverRegion: (r: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>({ k: 1, x: 0, y: 0 });
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const drag = useRef<{ startX: number; startY: number; view: View; moved: boolean } | null>(null);

  const info = useMemo(() => {
    const result: Record<string, ReturnType<typeof getRegionData>> = {};
    for (const state of STATE_POSITIONS) result[state.name] = getRegionData(state.name, day, variable);
    return result;
  }, [day, variable]);

  const fillFor = (name: string) => {
    const data = info[name];
    if (!data) return '#cbd5e1';
    return mapMode === 'confidence' ? confidenceColor(data.confidence) : bustColor(data.bustProbability);
  };
  const labelColor = (name: string) => {
    const data = info[name];
    if (!data) return '#64748b';
    return mapMode === 'confidence' ? '#ffffff' : bustTextColor(data.bustProbability);
  };

  /** Converts a client point to SVG user units. */
  const toSvg = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0, scale: 1 };
    const scale = Math.max(WIDTH / rect.width, HEIGHT / rect.height);
    const offsetX = (rect.width * scale - WIDTH) / 2;
    const offsetY = (rect.height * scale - HEIGHT) / 2;
    return { x: (clientX - rect.left) * scale - offsetX, y: (clientY - rect.top) * scale - offsetY, scale };
  }, []);

  const zoomAround = useCallback((factor: number, cx = WIDTH / 2, cy = HEIGHT / 2) => {
    setView((current) => {
      const k = Math.min(MAX_ZOOM, Math.max(1, current.k * factor));
      if (k === 1) return { k: 1, x: 0, y: 0 };
      const ratio = k / current.k;
      return { k, x: cx - (cx - current.x) * ratio, y: cy - (cy - current.y) * ratio };
    });
  }, []);

  // React's onWheel is passive, so preventDefault needs a native listener.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    // Zoom only with Ctrl/⌘ held so plain scrolling still moves the page.
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const point = toSvg(event.clientX, event.clientY);
      zoomAround(event.deltaY > 0 ? 0.85 : 1.18, point.x, point.y);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [toSvg, zoomAround]);

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    drag.current = { startX: event.clientX, startY: event.clientY, view, moved: false };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) setPointer({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    const current = drag.current;
    if (!current || view.k === 1) return;
    const { scale } = toSvg(event.clientX, event.clientY);
    const dx = (event.clientX - current.startX) * scale;
    const dy = (event.clientY - current.startY) * scale;
    if (Math.abs(dx) + Math.abs(dy) > 4) current.moved = true;
    if (current.moved) setView({ ...current.view, x: current.view.x + dx, y: current.view.y + dy });
  };

  const onPointerUp = () => {
    setTimeout(() => { drag.current = null; }, 0);
  };

  const onStateClick = (name: string) => {
    if (drag.current?.moved) return;
    onSelectRegion(selectedRegion === name ? null : name);
  };

  // Draw the hovered and selected states last so their outlines sit on top.
  const ordered = [...MAP.states].sort((a, b) => {
    const rank = (name: string) => (name === selectedRegion ? 2 : name === hoveredRegion ? 1 : 0);
    return rank(a.name) - rank(b.name);
  });

  const tooltip = hoveredRegion ? info[hoveredRegion] : null;
  const containerWidth = containerRef.current?.clientWidth ?? 600;
  const flipTooltip = pointer.x > containerWidth - 240;

  return (
    <div className="card p-4 flex-1 relative overflow-hidden">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">India forecast map</h2>
          <p className="text-[11px] text-slate-500">
            Day {day} · {variable === 'rainfall' ? 'Rainfall' : 'Temperature'} · {mapMode === 'confidence' ? 'forecast confidence' : 'bust probability'}
          </p>
        </div>
        <div className="flex p-0.5 bg-slate-100 rounded-lg">
          {(['confidence', 'bust'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onMapModeChange(mode)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${mapMode === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {mode === 'confidence' ? 'Confidence' : 'Bust probability'}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden border border-sky-100"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, #f0f9ff 0%, #e0f2fe 60%, #dbeafe 100%)' }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className={`w-full h-auto block select-none ${view.k > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
          style={{ touchAction: 'none', maxHeight: 620 }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => { onPointerUp(); onHoverRegion(null); }}
          role="img"
          aria-label={`Map of India coloured by ${mapMode === 'confidence' ? 'forecast confidence' : 'bust probability'} for Day ${day}`}
        >
          <defs>
            <pattern id="ocean-dots" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="#bae6fd" />
            </pattern>
          </defs>
          <rect width={WIDTH} height={HEIGHT} fill="url(#ocean-dots)" opacity={0.7} />

          <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
            {MAP.seas.map((sea) => (
              <text key={sea.text} x={sea.at[0]} y={sea.at[1]} textAnchor="middle" fontSize={11} fontStyle="italic"
                fill="#7dd3fc" letterSpacing={2} pointerEvents="none">
                {sea.text.toUpperCase()}
              </text>
            ))}

            {/* Offset copy as a shadow; SVG filters here broke page painting in Chromium. */}
            <g transform="translate(1.5 3)" fill="#0f172a" opacity={0.1} pointerEvents="none">
              {MAP.states.map((state) => <path key={`shadow-${state.name}`} d={state.d} />)}
            </g>

            <g>
              {ordered.map((state) => {
                const isSelected = state.name === selectedRegion;
                const isHovered = state.name === hoveredRegion;
                return (
                  <path
                    key={state.name}
                    d={state.d}
                    fill={fillFor(state.name)}
                    stroke={isSelected ? '#0f172a' : '#ffffff'}
                    strokeWidth={(isSelected ? 2.2 : isHovered ? 1.6 : 0.7) / view.k}
                    strokeLinejoin="round"
                    style={{
                      transition: 'fill 350ms ease, filter 150ms ease',
                      filter: isHovered && state.analysed ? 'brightness(1.08) saturate(1.1)' : undefined,
                      cursor: state.analysed ? 'pointer' : 'default',
                    }}
                    onPointerEnter={() => onHoverRegion(state.analysed ? state.name : null)}
                    onClick={() => state.analysed && onStateClick(state.name)}
                  />
                );
              })}
            </g>

            {MAP.states.filter((state) => state.tiny).map((state) => (
              <circle key={`dot-${state.name}`} cx={state.x} cy={state.y} r={2 / view.k} fill="#94a3b8" stroke="#fff" strokeWidth={0.5 / view.k} pointerEvents="none" />
            ))}

            {MAP.states.filter((state) => state.analysed).map((state) => {
              const [nx, ny] = LABEL_NUDGE[state.name] ?? [0, 0];
              const small = state.name === 'Goa' || state.name === 'Sikkim';
              return (
                <text
                  key={`label-${state.name}`}
                  x={state.x + nx}
                  y={state.y + ny + 3}
                  textAnchor="middle"
                  fontSize={(small ? 6.5 : 9) / Math.sqrt(view.k)}
                  fontWeight={700}
                  fill={small ? '#334155' : labelColor(state.name)}
                  pointerEvents="none"
                  style={{ transition: 'fill 350ms ease' }}
                >
                  {ABBREVIATIONS[state.name]}
                </text>
              );
            })}
          </g>
        </svg>

        <div className="absolute top-3 right-3 flex flex-col rounded-lg bg-white/90 backdrop-blur shadow-sm border border-slate-200 overflow-hidden">
          {[
            { icon: <Plus size={14} />, label: 'Zoom in', action: () => zoomAround(1.4) },
            { icon: <Minus size={14} />, label: 'Zoom out', action: () => zoomAround(1 / 1.4) },
            { icon: <Maximize size={13} />, label: 'Reset view', action: () => setView({ k: 1, x: 0, y: 0 }) },
          ].map((control) => (
            <button key={control.label} onClick={control.action} title={control.label} aria-label={control.label}
              className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border-b last:border-b-0 border-slate-200">
              {control.icon}
            </button>
          ))}
        </div>

        <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 backdrop-blur shadow-sm border border-slate-200 px-3 py-2">
          {mapMode === 'confidence' ? (
            <div className="flex items-center gap-3 text-[11px] text-slate-600">
              {(['high', 'medium', 'low'] as const).map((level) => (
                <span key={level} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CONFIDENCE_COLORS[level] }} />
                  {CONFIDENCE_LABELS[level]}
                </span>
              ))}
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-300" /> Not analysed
              </span>
            </div>
          ) : (
            <div className="text-[10px] text-slate-500">
              <div className="w-44 h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${BUST_LEGEND.map((p) => bustColor(p)).join(', ')})` }} />
              <div className="flex justify-between mt-1"><span>0%</span><span>35%</span><span>70%+</span></div>
            </div>
          )}
        </div>

        <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 hidden md:block">Ctrl + scroll to zoom · drag to pan</div>

        {tooltip && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{ left: pointer.x, top: pointer.y, transform: `translate(${flipTooltip ? 'calc(-100% - 14px)' : '14px'}, -50%)` }}
          >
            <div className="bg-slate-900/95 text-white rounded-xl px-3.5 py-3 shadow-2xl w-56 border border-slate-700/60">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">{tooltip.region}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: confidenceColor(tooltip.confidence) }}>
                  {tooltip.confidence.toUpperCase()}
                </span>
              </div>
              {tooltip.fingerprint.systemName && (
                <div className="text-[10px] text-sky-300 mb-1.5 leading-snug">{tooltip.fingerprint.systemName}</div>
              )}
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-300">
                <span>Forecast</span><span className="text-right text-white font-medium">{tooltip.forecastValue} {tooltip.unit}</span>
                <span>Bust probability</span><span className="text-right text-white font-medium">{tooltip.bustProbability}%</span>
                <span>MAE at Day {day}</span><span className="text-right text-white font-medium">{tooltip.historicalMeanError} {tooltip.unit}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1.5">Click for details</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
