import { useCallback, useState } from 'react';
import { fetchAllRegionsWeather, type WeatherData } from '../api/weatherApi';

export function useWeatherData() {
  const [weatherData, setWeatherData] = useState<Map<string, WeatherData>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setWeatherData(await fetchAllRegionsWeather());
      setLastFetchTime(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  }, []);

  return { weatherData, loading, error, refetch, lastFetchTime };
}
