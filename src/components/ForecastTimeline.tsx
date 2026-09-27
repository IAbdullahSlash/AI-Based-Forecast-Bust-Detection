import { Clock } from 'lucide-react';
import { Confidence, ConfidenceByDay, ForecastVariable } from '../types';
import { STATE_POSITIONS } from '../data/mockData';
import { confidenceColor, getConfidence } from '../utils/weatherUtils';

interface ForecastTimelineProps {
  day: number;
  setDay: (day: number) => void;
  variable: ForecastVariable;
  cb: ConfidenceByDay;
}

const DAYS = Array.from({ length: 10 }, (_, i) => i + 1);

export default function ForecastTimeline({ day, setDay, cb }: ForecastTimelineProps) {
  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-slate-500" />
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            10-Day Forecast Timeline
          </span>
        </div>
        <span className="text-[10px] text-slate-400">Select day to inspect lead-time uncertainty</span>
      </div>
      <div className="flex items-center gap-1">
        {DAYS.map((d) => {
          let h = 0,
            m = 0,
            l = 0;
          STATE_POSITIONS.forEach((s) => {
            const c = getConfidence(d, s.name, cb);
            if (c === 'high') h++;
            else if (c === 'medium') m++;
            else l++;
          });
          const conf: Confidence = l > m && l > h ? 'low' : h > m ? 'high' : 'medium';
          const col = confidenceColor(conf);
          const isSelected = day === d;

          return (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`flex-1 flex flex-col items-center py-1.5 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? 'ring-2 ring-blue-500 ring-offset-1 bg-blue-50 shadow-sm'
                  : 'hover:bg-slate-50'
              }`}
            >
              <span className={`text-[10px] mb-1 ${isSelected ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
                Day {d}
              </span>
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: col }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
