import { Zap, Sparkles } from 'lucide-react';
import { ForecastVariable } from '../types';
import { getExplanation, getRegionData } from '../data/mockData';

interface AIExplanationProps {
  region: string;
  variable: ForecastVariable;
}

export default function AIExplanation({ region, variable }: AIExplanationProps) {
  const explanation = getExplanation(region, variable);
  const data = getRegionData(region, variable);

  const dynamicTags = [
    data.bustProbability > 60 ? 'High historical error' : 'Moderate spread',
    data.confidence === 'low' ? 'High ensemble divergence' : 'Model convergence',
    data.historicalMeanError > 30 ? 'Strong atmospheric gradient' : 'Consistent baseline',
    'Rapid synoptic evolution',
  ];

  return (
    <div className="card p-3 border-blue-100 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Zap size={15} className="text-blue-500" /> Why is forecast confidence {data.confidence}?
          </h3>
          <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
            <Sparkles size={10} /> AI Synthesis
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed mb-3">{explanation}</p>
      </div>

      <div className="flex flex-wrap gap-1 mt-1">
        {dynamicTags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/50 rounded-full text-[10px] font-medium"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
