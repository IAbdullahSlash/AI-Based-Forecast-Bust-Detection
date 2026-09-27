import { useMemo } from 'react';
import { MapPin, CheckCircle2, Activity, AlertTriangle } from 'lucide-react';
import { ForecastVariable, ConfidenceByDay } from '../types';
import { STATE_POSITIONS } from '../data/mockData';
import { getConfidence } from '../utils/weatherUtils';

interface SummaryCardsProps {
  day: number;
  variable: ForecastVariable;
  cb: ConfidenceByDay;
}

export default function SummaryCards({ day, cb }: SummaryCardsProps) {
  const summary = useMemo(() => {
    let h = 0, m = 0, l = 0;
    STATE_POSITIONS.forEach((s) => {
      const c = getConfidence(day, s.name, cb);
      if (c === 'high') h++;
      else if (c === 'medium') m++;
      else l++;
    });
    return { total: STATE_POSITIONS.length, high: h, med: m, low: l };
  }, [day, cb]);

  const cards = [
    {
      label: 'Regions Analyzed',
      value: summary.total,
      sub: 'across India',
      icon: <MapPin size={18} />,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
    },
    {
      label: 'High Confidence',
      value: summary.high,
      sub: `${Math.round((summary.high / summary.total) * 100)}%`,
      icon: <CheckCircle2 size={18} />,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'Medium Confidence',
      value: summary.med,
      sub: `${Math.round((summary.med / summary.total) * 100)}%`,
      icon: <Activity size={18} />,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
    {
      label: 'Low Confidence',
      value: summary.low,
      sub: `${Math.round((summary.low / summary.total) * 100)}%`,
      icon: <AlertTriangle size={18} />,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="card p-3 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
            {c.icon}
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 leading-none">{c.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{c.label}</div>
            <div className={`text-xs font-medium ${c.color}`}>{c.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
