import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchAllRegionsWeather, fetchRegionWeather, WeatherData, REGION_COORDINATES,
} from '../api/weatherApi';

interface UseWeatherDataReturn {
  weatherData: Map<string, WeatherData>;
  loading: boolean;
  error: string | null;
  refetch: (region?: string) => void;
  lastFetchTime: Date | null;
}

export function useWeatherData(region?: string): UseWeatherDataReturn {
  const [weatherData, setWeatherData] = useState<Map<string, WeatherData>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetch = useCallback(async (targetRegion?: string) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      let results: Map<string, WeatherData>;

      if (targetRegion) {
        const data = await fetchRegionWeather(targetRegion);
        results = new Map();
        if (data) results.set(targetRegion, data);
      } else {
        const allRegions = Object.keys(REGION_COORDINATES);
        results = await fetchAllRegionsWeather(allRegions);
      }

      setWeatherData(results);
      setLastFetchTime(new Date());
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to fetch weather data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(region);
    return () => abortRef.current?.abort();
  }, [fetch, region]);

  return { weatherData, loading, error, refetch: fetch, lastFetchTime };
}

export function useRegionWeather(region: string | null): WeatherData | null {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!region || !REGION_COORDINATES[region]) return;

    let cancelled = false;
    setLoading(true);

    fetchRegionWeather(region).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [region]);

  return data;
}
