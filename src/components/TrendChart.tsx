import { ForecastVariable } from '../types';
import { STATE_POSITIONS } from '../data/mockData';
import { useConfidenceData } from '../hooks/useConfidenceData';

interface TrendChartProps {
  region: string;
  variable: ForecastVariable;
  currentDay: number;
}

const DAYS = Array.from({ length: 10 }, (_, i) => i + 1);

/**
 * TrendChart — pure-SVG sparkline showing bust probability trend across the
 * 10-day forecast window for a given region. No chart library needed.
 */
export default function TrendChart({ region, variable, currentDay }: TrendChartProps) {
  const confidenceData = useConfidenceData(variable);

  const points = DAYS.map((d) => ({
    day: d,
    bust: confidenceData[d]?.[region]?.bustProbability ?? 50,
    conf: confidenceData[d]?.[region]?.confidence ?? 'medium',
  }));

  const W = 220;
  const H = 60;
  const PAD = 8;
  const chartW = W - PAD * 2;
  const chartH = H - PAD * 2;

  // Map bust probability (0-100) to SVG y coordinate (inverted — 0 at top)
  const toY = (bust: number) => PAD + chartH - (bust / 100) * chartH;
  const toX = (day: number) => PAD + ((day - 1) / 9) * chartW;

  const polyline = points.map((p) => `${toX(p.day)},${toY(p.bust)}`).join(' ');

  // Fill area under curve
  const areaPath = [
    `M ${toX(1)} ${toY(points[0].bust)}`,
    ...points.map((p) => `L ${toX(p.day)} ${toY(p.bust)}`),
    `L ${toX(10)} ${H - PAD}`,
    `L ${toX(1)} ${H - PAD}`,
    'Z',
  ].join(' ');

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Bust Probability Trend (10-day)
        </span>
        <span className="text-[10px] text-slate-400">Day 1 → Day 10</span>
      </div>

      <div className="relative bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="w-full">
          {/* Threshold lines */}
          <line x1={PAD} y1={toY(60)} x2={W - PAD} y2={toY(60)}
            stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2 2" opacity={0.4} />
          <line x1={PAD} y1={toY(40)} x2={W - PAD} y2={toY(40)}
            stroke="#22c55e" strokeWidth="0.5" strokeDasharray="2 2" opacity={0.4} />

          {/* Area fill */}
          <path d={areaPath} fill="url(#trendGrad)" opacity={0.18} />

          {/* Line */}
          <polyline
            points={polyline}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Gradient */}
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Day dots */}
          {points.map((p) => {
            const isActive = p.day === currentDay;
            const dotColor = p.bust < 40 ? '#22c55e' : p.bust < 60 ? '#eab308' : '#ef4444';
            return (
              <circle
                key={p.day}
                cx={toX(p.day)}
                cy={toY(p.bust)}
                r={isActive ? 4 : 2.5}
                fill={isActive ? dotColor : '#fff'}
                stroke={dotColor}
                strokeWidth={isActive ? 2 : 1.5}
              />
            );
          })}

          {/* Current day label */}
          {(() => {
            const cur = points[currentDay - 1];
            if (!cur) return null;
            const cx = toX(cur.day);
            const cy = toY(cur.bust);
            const labelY = cy < PAD + 14 ? cy + 14 : cy - 6;
            return (
              <text x={cx} y={labelY} textAnchor="middle" fontSize={7}
                fill="#1e40af" fontWeight="700">
                {cur.bust}%
              </text>
            );
          })()}
        </svg>

        {/* Axis labels */}
        <div className="flex justify-between px-2 pb-1 text-[8px] text-slate-400">
          <span>Day 1</span>
          <span>Day 5</span>
          <span>Day 10</span>
        </div>
      </div>
    </div>
  );
}
