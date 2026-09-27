interface MapLegendProps {
  mapMode: 'confidence' | 'bust';
}

export default function MapLegend({ mapMode }: MapLegendProps) {
  if (mapMode === 'confidence') {
    return (
      <div className="flex items-center gap-4 text-xs">
        <span className="font-medium text-slate-600">Confidence:</span>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-slate-600">High (&lt;40% bust)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-slate-600">Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-slate-600">Low (&gt;60% bust)</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-xs">
      <span className="font-medium text-slate-600">Bust Probability:</span>
      <div className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full bg-blue-500" />
        <span className="text-slate-600">Low (&lt;40%)</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full bg-yellow-500" />
        <span className="text-slate-600">Moderate (40-60%)</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full bg-red-500" />
        <span className="text-slate-600">High Risk (&gt;60%)</span>
      </div>
    </div>
  );
}
