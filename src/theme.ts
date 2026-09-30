import type { Confidence } from './types';

/** Single risk palette shared by the map, heatmap, badges and charts. */
export const CONFIDENCE_COLORS: Record<Confidence, string> = {
  high: '#10b981',
  medium: '#f59e0b',
  low: '#e11d48',
};

export const CONFIDENCE_LABELS: Record<Confidence, string> = { high: 'High', medium: 'Medium', low: 'Low' };

export function confidenceColor(confidence: Confidence) {
  return CONFIDENCE_COLORS[confidence];
}

let darkMode = false;

/** Set once per render by App so colour helpers match the active theme. */
export function setDarkMode(enabled: boolean) {
  darkMode = enabled;
}

// Sequential scale for bust probability (0% → 70%+). The dark variant starts
// from deep teal so low values recede instead of glowing on a dark page.
const DARK_BUST_STOPS: [number, [number, number, number]][] = [
  [0, [19, 44, 42]],
  [10, [20, 83, 60]],
  [20, [133, 99, 20]],
  [35, [194, 92, 32]],
  [50, [225, 29, 72]],
  [70, [251, 113, 133]],
];

const LIGHT_BUST_STOPS: [number, [number, number, number]][] = [
  [0, [236, 253, 245]],
  [10, [187, 247, 208]],
  [20, [253, 230, 138]],
  [35, [251, 146, 60]],
  [50, [225, 29, 72]],
  [70, [136, 19, 55]],
];

export function bustColor(probability: number) {
  const BUST_STOPS = darkMode ? DARK_BUST_STOPS : LIGHT_BUST_STOPS;
  const p = Math.max(0, Math.min(70, probability));
  for (let i = 1; i < BUST_STOPS.length; i += 1) {
    const [upper, to] = BUST_STOPS[i];
    const [lower, from] = BUST_STOPS[i - 1];
    if (p <= upper) {
      const t = (p - lower) / (upper - lower);
      const channel = (k: number) => Math.round(from[k] + (to[k] - from[k]) * t);
      return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
    }
  }
  const last = BUST_STOPS[BUST_STOPS.length - 1][1];
  return `rgb(${last[0]}, ${last[1]}, ${last[2]})`;
}

export function bustTextColor(probability: number) {
  if (darkMode) return '#f1f5f9';
  return probability >= 40 ? '#ffffff' : '#1e293b';
}

export const BUST_LEGEND = [0, 10, 20, 35, 50, 70];
