import { Radio } from 'lucide-react';

export default function SystemStatus() {
  const items = [
    { name: 'Ensemble bust detection engine', status: 'Operational' },
    { name: 'Historical analogue similarity search', status: 'Operational' },
    { name: 'Deterministic confidence degradation model', status: 'Calibrated' },
    { name: 'Synoptic explanation generator', status: 'Active' },
  ];

  return (
    <div className="card p-3">
      <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
        <Radio size={12} className="text-emerald-500 animate-pulse" /> System & Model Status
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {items.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between text-xs bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100"
          >
            <span className="text-slate-600 truncate mr-2">{item.name}</span>
            <span className="flex items-center gap-1 text-green-600 font-medium text-[11px] flex-shrink-0">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
