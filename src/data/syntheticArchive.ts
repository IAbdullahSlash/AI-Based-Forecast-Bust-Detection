import type { EventType, ForecastObservation } from '../types/index.ts';
import { EVENT_PROFILES, REGION_CLIMATOLOGY, STATE_POSITIONS, wetness } from './regions.ts';

// Seeded synthetic archive: one event per region, forecast at Day 1–10. Not IMD observations.

export const HINDCAST_YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
const EVENTS_PER_REGION_YEAR = 3;
const MAX_LEAD = 10;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(random: () => number) {
  const u = Math.max(random(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
}

function pickWeighted<T extends string>(weights: Partial<Record<T, number>>, random: () => number): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

const round1 = (value: number) => Math.round(value * 10) / 10;

function isoDate(year: number, dayOfYear: number) {
  const date = new Date(Date.UTC(year, 0, 1));
  date.setUTCDate(date.getUTCDate() + dayOfYear);
  return date.toISOString().slice(0, 10);
}

function generate(): ForecastObservation[] {
  const random = mulberry32(20240601);
  const records: ForecastObservation[] = [];

  for (const { name: region } of STATE_POSITIONS) {
    const climate = REGION_CLIMATOLOGY[region];
    const wet = wetness(region);
    for (const year of HINDCAST_YEARS) {
      for (let event = 0; event < EVENTS_PER_REGION_YEAR; event += 1) {
        const eventType = pickWeighted<EventType>(climate.events, random);
        const profile = EVENT_PROFILES[eventType];
        const validDay = 135 + Math.floor(random() * 135);
        const strength = 0.6 + random() * 0.8;

        const rainfallObserved = Math.max(0, (climate.rainfall * 0.4 + profile.rain * wet * strength) * Math.exp(gaussian(random) * 0.35));
        const temperatureObserved = climate.temperature + profile.temp * strength + gaussian(random) * 1.1;
        const windSpeed = Math.max(3, climate.windSpeed * 0.5 + profile.wind * strength * 0.8 + gaussian(random) * 3);
        const pressure = climate.pressure + profile.pressure * strength + gaussian(random) * 1.2;
        const tendency = (random() < 0.5 ? -1 : 1) * profile.tendency * strength * (0.6 + random() * 0.8);

        for (let lead = 1; lead <= MAX_LEAD; lead += 1) {
          const growth = 0.35 + profile.leadGrowth * lead;
          const rainSd = (2 + profile.rainErr * rainfallObserved) * growth;
          const rainfallForecast = Math.max(0, rainfallObserved * (1 + profile.rainBias * growth) + gaussian(random) * rainSd);
          const tempSd = profile.tempErr * (0.4 + profile.leadGrowth * lead);
          const tempBias = profile.tempBias * profile.temp * strength * (0.3 + 0.1 * lead);
          const temperatureForecast = temperatureObserved + tempBias + gaussian(random) * tempSd;

          records.push({
            region,
            forecastIssuedAt: isoDate(year, validDay - lead),
            validAt: isoDate(year, validDay),
            leadDays: lead,
            eventType,
            rainfallForecast: round1(rainfallForecast),
            rainfallObserved: round1(rainfallObserved),
            temperatureForecast: round1(temperatureForecast),
            temperatureObserved: round1(temperatureObserved),
            windSpeed: round1(Math.max(2, windSpeed + gaussian(random) * 0.4 * lead)),
            pressure: round1(pressure + gaussian(random) * 0.3 * lead),
            pressureTendency: round1(tendency + gaussian(random) * 0.2 * lead),
          });
        }
      }
    }
  }
  return records;
}

export const SYNTHETIC_FORECAST_OBSERVATIONS: ForecastObservation[] = generate();
