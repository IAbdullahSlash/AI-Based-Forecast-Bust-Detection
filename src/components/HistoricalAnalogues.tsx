import { Clock } from 'lucide-react';
import { ForecastVariable, getVariableUnit } from '../types';
import { getAnalogueData } from '../data/mockData';

interface HistoricalAnaloguesProps {
  region: string;
  variable: ForecastVariable;
}

export default function HistoricalAnalogues({ region, variable }: HistoricalAnaloguesProps) {
  const analogues = getAnalogueData(region, variable);
  const unit = getVariableUnit(variable);

  return (
    <div className="card p-3">
      <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
        <Clock size={15} /> Historical Analogues
      </h3>
      <div className="space-y-2">
        {analogues.slice(0, 5).map((a, i) => (
          <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-lg p-2 text-xs">
            <div className="flex-1">
              <div className="font-medium text-slate-800">{a.eventType}</div>
              <div className="text-slate-500">
                {a.region} · {a.date} · Error: {a.forecastError}
                {a.unit || unit}
              </div>
            </div>
            <div className="text-center flex-shrink-0">
              <div className="font-bold text-slate-800">{a.similarity}%</div>
              <div className="text-[9px] text-slate-500">sim.</div>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                a.bustStatus === 'Forecast Bust'
                  ? 'bg-red-100 text-red-700'
                  : a.bustStatus === 'Large Error'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {a.bustStatus}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
