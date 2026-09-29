const BASE = import.meta.env.VITE_WEATHER_API_URL || 'https://api.open-meteo.com/v1/forecast';

export const REGION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Jammu & Kashmir': { lat: 33.8, lng: 74.8 },
  'Himachal Pradesh': { lat: 31.1, lng: 77.2 },
  'Punjab': { lat: 30.7, lng: 75.8 },
  'Haryana': { lat: 29.4, lng: 76.5 },
  'Uttarakhand': { lat: 30.3, lng: 78.0 },
  'Uttar Pradesh': { lat: 26.8, lng: 80.9 },
  'Bihar': { lat: 25.1, lng: 85.3 },
  'Jharkhand': { lat: 23.6, lng: 85.3 },
  'West Bengal': { lat: 22.9, lng: 87.8 },
  'Sikkim': { lat: 27.5, lng: 88.5 },
  'Arunachal Pradesh': { lat: 27.1, lng: 93.6 },
  'Assam': { lat: 26.1, lng: 92.9 },
  'Meghalaya': { lat: 25.5, lng: 91.9 },
  'Odisha': { lat: 20.5, lng: 85.8 },
  'Chhattisgarh': { lat: 21.3, lng: 81.8 },
  'Madhya Pradesh': { lat: 22.7, lng: 78.8 },
  'Rajasthan': { lat: 26.9, lng: 73.9 },
  'Gujarat': { lat: 22.3, lng: 70.8 },
  'Maharashtra': { lat: 19.8, lng: 75.7 },
  'Goa': { lat: 15.3, lng: 74.1 },
  'Karnataka': { lat: 15.3, lng: 75.7 },
  'Kerala': { lat: 10.0, lng: 76.3 },
  'Tamil Nadu': { lat: 11.1, lng: 78.2 },
  'Andhra Pradesh': { lat: 15.9, lng: 79.8 },
  'Telangana': { lat: 17.4, lng: 78.5 },
};

export interface WeatherData {
  region: string;
  lat: number;
  lng: number;
  temperature: number;
  maxTemp: number;
  minTemp: number;
  rainfall: number;
  windSpeed: number;
  pressure: number;
  humidity: number;
  forecastDays: number;
  lastUpdated: string;
}

export interface WeatherError {
  region: string;
  error: string;
}

export async function fetchRegionWeather(region: string): Promise<WeatherData | null> {
  const coords = REGION_COORDINATES[region];
  if (!coords) return null;

  try {
    const url = new URL(BASE);
    url.searchParams.set('latitude', String(coords.lat));
    url.searchParams.set('longitude', String(coords.lng));
    url.searchParams.set('current_weather', 'true');
    url.searchParams.set(
      'daily',
      'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,pressure_msl_mean,relative_humidity_2m_mean'
    );
    url.searchParams.set('timezone', 'Asia/Kolkata');
    url.searchParams.set('forecast_days', '16');
    url.searchParams.set('temperature_unit', 'celsius');
    url.searchParams.set('wind_speed_unit', 'kmh');
    url.searchParams.set('precipitation_unit', 'mm');
    url.searchParams.set('pressure_unit', 'hPa');

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      if (res.status === 429) throw new Error('Rate limited');
      throw new Error(`API error ${res.status}`);
    }
    const data = await res.json();
    if (!data.daily) return null;

    const daily = data.daily;
    const current = data.current_weather;
    const n = daily.time.length;

    return {
      region,
      lat: coords.lat,
      lng: coords.lng,
      temperature: current?.temperature ?? 0,
      maxTemp: daily.temperature_2m_max?.[0] ?? 0,
      minTemp: daily.temperature_2m_min?.[0] ?? 0,
      rainfall: daily.precipitation_sum?.[0] ?? 0,
      windSpeed: daily.wind_speed_10m_max?.[0] ?? 0,
      pressure: daily.pressure_msl_mean?.[0] ?? 0,
      humidity: daily.relative_humidity_2m_mean?.[0] ?? 0,
      forecastDays: n,
      lastUpdated: data.current_units?.time ?? new Date().toISOString(),
    };
  } catch (err) {
    console.warn(`Weather fetch failed for ${region}:`, err);
    return null;
  }
}

export async function fetchAllRegionsWeather(
  regions: string[],
  onProgress?: (region: string, data: WeatherData | null) => void
): Promise<Map<string, WeatherData>> {
  const results = new Map<string, WeatherData>();
  const CONCURRENCY = 5;

  for (let i = 0; i < regions.length; i += CONCURRENCY) {
    const batch = regions.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (region) => {
        const data = await fetchRegionWeather(region);
        if (data) results.set(region, data);
        onProgress?.(region, data);
      })
    );
  }

  return results;
}
