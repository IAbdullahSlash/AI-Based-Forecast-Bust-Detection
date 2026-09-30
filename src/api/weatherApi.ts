import { STATE_POSITIONS } from '../data/regions';

const BASE = import.meta.env.VITE_WEATHER_API_URL || 'https://api.open-meteo.com/v1/forecast';

export interface WeatherData {
  temperature: number;
  rainfall: number;
  windSpeed: number;
  pressure: number;
}

async function fetchRegionWeather(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const url = new URL(BASE);
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lng));
    url.searchParams.set('current_weather', 'true');
    url.searchParams.set('daily', 'precipitation_sum,wind_speed_10m_max,pressure_msl_mean');
    url.searchParams.set('timezone', 'Asia/Kolkata');
    url.searchParams.set('forecast_days', '1');

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(res.status === 429 ? 'Rate limited' : `API error ${res.status}`);
    const data = await res.json();
    if (!data.daily) return null;

    return {
      temperature: data.current_weather?.temperature ?? 0,
      rainfall: data.daily.precipitation_sum?.[0] ?? 0,
      windSpeed: data.daily.wind_speed_10m_max?.[0] ?? 0,
      pressure: data.daily.pressure_msl_mean?.[0] ?? 0,
    };
  } catch (err) {
    console.warn('Weather fetch failed:', err);
    return null;
  }
}

export async function fetchAllRegionsWeather(): Promise<Map<string, WeatherData>> {
  const results = new Map<string, WeatherData>();
  const CONCURRENCY = 5;
  for (let i = 0; i < STATE_POSITIONS.length; i += CONCURRENCY) {
    await Promise.all(STATE_POSITIONS.slice(i, i + CONCURRENCY).map(async ({ name, lat, lng }) => {
      const data = await fetchRegionWeather(lat, lng);
      if (data) results.set(name, data);
    }));
  }
  return results;
}
