import type { EventType, ForecastFingerprint } from '../types/index.ts';
import { EVENT_PROFILES, REGION_CLIMATOLOGY, STATE_POSITIONS, wetness } from './regions.ts';


export const SCENARIO = {
  issuedAt: '2026-06-10T00:00Z',
  label: 'Synthetic 10-day forecast issued 10 Jun 2026, 00 UTC',
};

interface WeatherSystem {
  name: string;
  type: EventType;
  /** region → [first day, peak day, last day] of influence */
  regions: Record<string, [number, number, number]>;
}

export const WEATHER_SYSTEMS: WeatherSystem[] = [
  {
    name: 'Severe cyclonic storm (Arabian Sea)',
    type: 'Cyclone',
    regions: { Karnataka: [1, 2, 3], Goa: [2, 3, 5], Maharashtra: [2, 4, 6], Gujarat: [3, 6, 8], Rajasthan: [6, 8, 10] },
  },
  {
    name: 'Heat wave over north-west & central India',
    type: 'Heat wave',
    regions: {
      Rajasthan: [1, 2, 5], Haryana: [1, 3, 6], Punjab: [1, 3, 5], 'Uttar Pradesh': [1, 4, 8],
      'Madhya Pradesh': [1, 2, 5], Telangana: [1, 2, 4], Bihar: [1, 2, 4], 'Andhra Pradesh': [1, 1, 3],
    },
  },
  {
    name: 'Western disturbance',
    type: 'Western disturbance',
    regions: { 'Jammu & Kashmir': [2, 4, 6], 'Himachal Pradesh': [3, 5, 7], Uttarakhand: [3, 5, 7], Punjab: [5, 6, 8], Haryana: [6, 7, 8] },
  },
  {
    name: 'Bay of Bengal low → monsoon depression',
    type: 'Monsoon depression',
    regions: {
      'West Bengal': [4, 5, 7], Odisha: [4, 6, 8], Jharkhand: [5, 7, 9], Chhattisgarh: [5, 7, 9],
      Telangana: [6, 7, 9], Bihar: [7, 8, 10], 'Madhya Pradesh': [7, 9, 10],
    },
  },
  {
    name: 'Monsoon onset surge (west coast)',
    type: 'Active monsoon',
    regions: { Kerala: [1, 3, 6], Karnataka: [3, 4, 7], Goa: [5, 6, 8], 'Tamil Nadu': [2, 3, 5] },
  },
  {
    name: 'Monsoon hiatus (break) over peninsula',
    type: 'Break monsoon',
    regions: { Kerala: [7, 9, 10], Karnataka: [8, 10, 10], 'Tamil Nadu': [8, 9, 10] },
  },
  {
    name: 'Possible new Bay low (low model agreement on genesis)',
    type: 'Monsoon depression',
    regions: { 'Andhra Pradesh': [8, 10, 10], Odisha: [9, 10, 10], 'West Bengal': [9, 10, 10] },
  },
  {
    name: 'Monsoon trough establishing over Indo-Gangetic plain',
    type: 'Monsoon trough',
    regions: { 'Uttar Pradesh': [8, 10, 10], Uttarakhand: [8, 10, 10], Haryana: [9, 10, 10], Punjab: [9, 10, 10], 'Himachal Pradesh': [9, 10, 10] },
  },
  {
    name: 'Heavy rainfall spell over north-east',
    type: 'Heavy rainfall',
    regions: { Assam: [1, 2, 5], Meghalaya: [1, 3, 5], 'Arunachal Pradesh': [1, 2, 4], Sikkim: [2, 3, 6], 'West Bengal': [1, 2, 3] },
  },
];

function intensity(window: [number, number, number], day: number) {
  const [start, peak, end] = window;
  if (day < start || day > end) return 0;
  if (day <= peak) return 0.35 + 0.65 * (day - start) / Math.max(peak - start, 1);
  return 1 - 0.65 * (day - peak) / Math.max(end - peak, 1);
}

function rawState(region: string, day: number) {
  const climate = REGION_CLIMATOLOGY[region];
  const index = Math.max(0, STATE_POSITIONS.findIndex((state) => state.name === region));
  const wiggle = Math.sin(index * 1.7 + day * 0.9);
  const state = {
    rainfall: climate.rainfall * (0.6 + 0.3 * wiggle + 0.3),
    temperature: climate.temperature + wiggle * 0.8,
    windSpeed: climate.windSpeed * 0.5 + 8 + wiggle * 2,
    pressure: climate.pressure + Math.cos(index + day * 0.5) * 1.2,
  };

  let dominant: { system: WeatherSystem; strength: number } | null = null;
  for (const system of WEATHER_SYSTEMS) {
    const window = system.regions[region];
    if (!window) continue;
    const strength = intensity(window, day);
    if (!strength) continue;
    const profile = EVENT_PROFILES[system.type];
    state.rainfall += profile.rain * wetness(region) * strength;
    state.temperature += profile.temp * strength;
    state.windSpeed += profile.wind * strength * 0.8;
    state.pressure += profile.pressure * strength;
    if (!dominant || strength > dominant.strength) dominant = { system, strength };
  }
  return { state, dominant };
}

const cache = new Map<string, ForecastFingerprint>();

export function getFingerprint(region: string, day: number): ForecastFingerprint {
  const key = `${region}|${day}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const { state, dominant } = rawState(region, day);
  const previous = rawState(region, day - 1).state;
  const active = dominant && dominant.strength >= 0.3 ? dominant : null;
  const fingerprint: ForecastFingerprint = {
    rainfall: Math.round(Math.max(0, state.rainfall)),
    temperature: Math.round(state.temperature * 10) / 10,
    windSpeed: Math.round(Math.max(2, state.windSpeed)),
    pressure: Math.round(state.pressure * 10) / 10,
    pressureTendency: Math.round((state.pressure - previous.pressure) * 10) / 10,
    eventType: active ? active.system.type : 'Fair weather',
    systemName: active ? active.system.name : null,
    systemIntensity: active ? Math.round(active.strength * 100) / 100 : 0,
  };
  cache.set(key, fingerprint);
  return fingerprint;
}

export function getActiveSystems(day: number) {
  return WEATHER_SYSTEMS
    .map((system) => ({
      name: system.name,
      type: system.type,
      regions: Object.entries(system.regions)
        .filter(([, window]) => intensity(window, day) >= 0.3)
        .map(([region]) => region),
    }))
    .filter((system) => system.regions.length > 0);
}
