interface ConfidenceGaugeProps {
  value: number;
  label: string;
  color: string;
}

export default function ConfidenceGauge({ value, label, color }: ConfidenceGaugeProps) {
  const angle = (value / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const x = 50 + 40 * Math.cos(rad - Math.PI / 2);
  const y = 50 + 40 * Math.sin(rad - Math.PI / 2);

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="60" viewBox="0 0 100 60">
        <path
          d="M10,55 A40,40 0 0,1 90,55"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M10,55 A40,40 0 0,1 90,55"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${value * 0.8} 80`}
        />
        <circle cx={x} cy={y} r="4" fill={color} />
      </svg>
      <div className="text-center mt-1">
        <div className="text-xl font-bold" style={{ color }}>
          {value}%
        </div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}
