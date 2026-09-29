import { useState, useRef, useCallback, useEffect } from 'react';
import { MapPin, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import {
  STATE_POSITIONS,
} from '../data/mockData';
import { getRegionData } from '../analysis/forecastEngine';
import { EvaluatedVariable, Confidence } from '../types';

function confidenceColor(conf: Confidence): string {
  return conf === 'high' ? '#22c55e' : conf === 'medium' ? '#eab308' : '#ef4444';
}
function bustColor(prob: number): string {
  if (prob < 40) return '#3b82f6';
  if (prob < 60) return '#eab308';
  return '#ef4444';
}

const INDIA_SHAPE = `
  M 425 155
  C 445 135, 475 118, 505 108
  C 535 98, 565 92, 595 88
  C 625 85, 655 86, 680 90
  C 705 95, 725 102, 742 112
  C 758 122, 768 135, 772 150
  C 776 165, 775 180, 768 195
  C 761 210, 750 222, 735 232
  C 720 242, 702 250, 682 258
  C 662 266, 644 274, 628 284
  C 614 294, 602 306, 592 318
  C 582 330, 575 342, 570 355
  C 566 368, 565 380, 566 392
  C 568 404, 572 415, 578 425
  C 584 435, 592 444, 600 452
  C 608 460, 618 468, 628 475
  C 638 482, 648 488, 658 494
  C 668 500, 678 506, 688 512
  C 698 518, 706 524, 712 530
  C 718 536, 722 542, 724 548
  C 726 554, 724 560, 720 566
  C 716 572, 710 578, 702 584
  C 694 590, 684 596, 672 602
  C 660 608, 648 614, 636 620
  C 624 626, 612 632, 600 638
  C 588 644, 576 650, 566 656
  C 556 662, 546 668, 538 674
  C 530 680, 524 686, 520 692
  C 516 698, 514 704, 514 710
  C 514 716, 518 722, 524 728
  C 530 734, 538 740, 548 745
  C 558 750, 568 754, 578 758
  C 588 762, 598 764, 608 766
  C 618 768, 628 768, 638 766
  C 648 764, 656 760, 664 754
  C 672 748, 678 740, 682 732
  C 686 724, 688 716, 688 708
  C 688 700, 684 692, 678 684
  C 672 676, 664 668, 654 660
  C 644 652, 634 644, 624 636
  C 614 628, 604 620, 594 612
  C 584 604, 574 596, 564 588
  C 554 580, 544 572, 536 564
  C 528 556, 522 548, 516 540
  C 510 532, 506 524, 502 516
  C 498 508, 496 500, 494 492
  C 492 484, 490 476, 488 468
  C 486 460, 484 452, 482 444
  C 480 436, 478 428, 476 420
  C 474 412, 472 404, 470 396
  C 468 388, 466 380, 464 372
  C 462 364, 460 356, 458 348
  C 456 340, 454 332, 452 324
  C 450 316, 448 308, 446 300
  C 444 292, 442 284, 440 276
  C 438 268, 436 260, 434 252
  C 432 244, 430 236, 428 228
  C 426 220, 424 212, 422 204
  C 420 196, 418 188, 416 180
  C 414 172, 412 164, 410 156
  C 412 148, 418 140, 425 155
  Z
`;

function parseVB(vb: string) {
  const p = vb.split(/\s+/).map(Number);
  return { x: p[0], y: p[1], w: p[2], h: p[3] };
}

export default function IndiaMap({
  day, variable, mapMode, selectedRegion, onSelectRegion, hoveredRegion, onHoverRegion,
}: {
  day: number; variable: EvaluatedVariable; mapMode: 'confidence' | 'bust';
  selectedRegion: string | null; onSelectRegion: (r: string | null) => void;
  hoveredRegion: string | null; onHoverRegion: (r: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [viewBox, setViewBox] = useState('0 0 900 1000');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [viewBoxStart, setViewBoxStart] = useState('0 0 900 1000');
  const [tooltipRegion, setTooltipRegion] = useState<string | null>(null);
  const [tooltipMouse, setTooltipMouse] = useState({ x: 0, y: 0 });

  const zoomAtCenter = useCallback((factor: number) => {
    setViewBox(prev => {
      const { x, y, w, h } = parseVB(prev);
      const newW = w / factor;
      const newH = h / factor;
      return `${x + (w - newW) / 2} ${y + (h - newH) / 2} ${newW} ${newH}`;
    });
  }, []);

  const resetView = useCallback(() => {
    setViewBox('0 0 900 1000');
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.15 : 0.87;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;

    setViewBox(prev => {
      const { x, y, w, h } = parseVB(prev);
      const newW = w / factor;
      const newH = h / factor;
      const newX = x + (w - newW) * mx;
      const newY = y + (h - newH) * my;
      return `${newX} ${newY} ${newW} ${newH}`;
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setViewBoxStart(viewBox);
  }, [viewBox]);

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

  const handleRegionHover = useCallback((name: string | null, e?: React.MouseEvent) => {
    onHoverRegion(name);
    if (name && e && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    setTooltipRegion(name);
  }, [onHoverRegion]);

  const getRegionInfo = (name: string) => {
    const d = getRegionData(name, day, variable);
    return {
      conf: d.confidence,
      bustProb: d.bustProbability,
      forecastVal: d.forecastValue,
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
    <div className="card p-4 flex-1 relative">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <MapPin size={16} /> India Forecast Map
          <span className="text-[11px] font-normal text-slate-400">({mapMode === 'confidence' ? 'Forecast Confidence' : 'Bust Probability'})</span>
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Day {day}</span>
          <span className="text-[9px] text-slate-400">Scroll to zoom · Drag to pan</span>
        </div>
      </div>

      <div className="absolute top-8 right-4 z-10 flex flex-col gap-1">
        <button
          onClick={() => zoomAtCenter(1.3)}
          className="w-7 h-7 bg-white/90 hover:bg-white rounded-md shadow-md flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all border border-slate-200"
          title="Zoom in"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={() => zoomAtCenter(0.77)}
          className="w-7 h-7 bg-white/90 hover:bg-white rounded-md shadow-md flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all border border-slate-200"
          title="Zoom out"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={resetView}
          className="w-7 h-7 bg-white/90 hover:bg-white rounded-md shadow-md flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all border border-slate-200"
          title="Reset view"
        >
          <Maximize size={14} />
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg"
        style={{ paddingTop: '111%' }}
      >
        <svg
          viewBox={viewBox}
          className="absolute top-0 left-0 w-full h-full cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'none' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
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
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="shadow">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="rgba(0,0,0,0.15)" />
            </filter>
            <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f1f5f9" /><stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <radialGradient id="stateGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(59,130,246,0.15)" /><stop offset="100%" stopColor="rgba(59,130,246,0)" />
            </radialGradient>
          </defs>

          <path
            d={INDIA_SHAPE}
            fill="url(#landGrad)"
            stroke="#94a3b8"
            strokeWidth="1.5"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))' }}
          />

          <path
            d={INDIA_SHAPE}
            fill="url(#stateGlow)"
            style={{ pointerEvents: 'none' }}
          />

          {STATE_POSITIONS.map((s) => {
            const info = getRegionInfo(s.name);
            if (!info) return null;
            const col = mapMode === 'confidence' ? confidenceColor(info.conf) : bustColor(info.bustProb);
            const isSelected = selectedRegion === s.name;
            const isHovered = hoveredRegion === s.name;
            const isInside = isSelected || isHovered;
            const r = isSelected ? 18 : isHovered ? 15 : 12;

            return (
              <g
                key={s.name}
                onMouseEnter={(e) => { e.stopPropagation(); handleRegionHover(s.name, e); }}
                onMouseLeave={(e) => { e.stopPropagation(); handleRegionHover(null, e); }}
                onClick={(e) => { e.stopPropagation(); onSelectRegion(selectedRegion === s.name ? null : s.name); }}
                style={{ cursor: 'pointer' }}
              >
                {isHovered && (
                  <circle cx={s.x} cy={s.y} r={26} fill={col} opacity={0.08} style={{ pointerEvents: 'none' }}>
                    <animate attributeName="r" values="24;30;24" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.08;0.15;0.08" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {isSelected && (
                  <>
                    <circle cx={s.x} cy={s.y} r={24} fill={col} opacity={0.1} style={{ pointerEvents: 'none' }} />
                    <circle cx={s.x} cy={s.y} r={24} fill="none" stroke={col} strokeWidth="2" strokeDasharray="3 2" opacity={0.6} style={{ pointerEvents: 'none' }} />
                  </>
                )}

                <circle
                  cx={s.x} cy={s.y} r={r}
                  fill={col}
                  stroke="white" strokeWidth="2"
                  style={{
                    filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />

                <circle
                  cx={s.x} cy={s.y} r={r * 0.4}
                  fill="white" opacity={0.4}
                  style={{ pointerEvents: 'none' }}
                />

                <text
                  x={s.x} y={s.y + 4}
                  textAnchor="middle" fill="white" fontSize={7} fontWeight="bold"
                  pointerEvents="none"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                >
                  {getLabel(s.name)}
                </text>

                <text
                  x={s.x} y={s.y + r + 12}
                  textAnchor="middle" fill="#475569" fontSize={7} fontWeight="600"
                  pointerEvents="none"
                  style={{ transition: 'all 0.2s ease' }}
                >
                  {s.name.length > 12 ? s.name.split(' ')[0] : s.name}
                </text>
              </g>
            );
          })}
        </svg>

        {tooltipRegion && (() => {
          const info = getRegionInfo(tooltipRegion);
          if (!info) return null;
          const col = mapMode === 'confidence' ? confidenceColor(info.conf) : bustColor(info.bustProb);
          const container = containerRef.current;
          if (!container) return null;
          const rect = container.getBoundingClientRect();
          const pctX = (tooltipMouse.x / rect.width) * 100;
          const pctY = (tooltipMouse.y / rect.height) * 100;

          return (
            <div
              className="absolute z-20 pointer-events-none"
              style={{
                left: `${pctX}%`,
                top: `${pctY}%`,
                transform: 'translate(-50%, -120%)',
              }}
            >
              <div className="bg-slate-900 text-white text-xs rounded-xl px-4 py-3 shadow-2xl whitespace-nowrap border border-slate-700/50" style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
                <div className="font-bold text-sm flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col }} />
                  {tooltipRegion}
                </div>
                {info.baseData.fingerprint.systemName && (
                  <div className="text-[10px] text-indigo-300 mb-1">{info.baseData.fingerprint.systemName}</div>
                )}
                <div className="text-slate-300 text-[11px] space-y-0.5">
                  <div className="flex justify-between gap-6"><span>Forecast</span><span className="font-medium">{info.forecastVal} {info.baseData.unit}</span></div>
                  <div className="flex justify-between gap-6"><span>Bust Prob</span><span className="font-medium">{info.bustProb}%</span></div>
                  <div className="flex justify-between gap-6"><span>Confidence</span><span className="font-medium" style={{ color: confidenceColor(info.conf) }}>{info.conf.toUpperCase()}</span></div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
