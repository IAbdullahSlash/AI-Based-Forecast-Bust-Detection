import {
  RegionalData,
  HistoricalAnalogue,
  ForecastVariable,
  SummaryStats,
  CaseStudy,
  EvaluationMetrics,
  BackendHealth
} from '../types';

const BACKEND_BASE_URL = 'http://127.0.0.1:8000';

export async function checkBackendHealth(): Promise<{ isLive: boolean; health?: BackendHealth }> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/health`, {
      signal: AbortSignal.timeout(1500)
    });
    if (res.ok) {
      const data: BackendHealth = await res.json();
      return { isLive: true, health: data };
    }
  } catch {
    // Offline or unreachable
  }
  return { isLive: false };
}

export async function fetchLiveConfidenceMap(
  day: number,
  variable: ForecastVariable
): Promise<{ regions: Record<string, RegionalData>; summary: SummaryStats } | null> {
  try {
    const res = await fetch(
      `${BACKEND_BASE_URL}/api/confidence-map?day=${day}&variable=${variable}`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      regions: data.regions,
      summary: data.summary
    };
  } catch {
    return null;
  }
}

export async function fetchLiveRegionDetail(
  region: string,
  day: number,
  variable: ForecastVariable
): Promise<RegionalData | null> {
  try {
    const res = await fetch(
      `${BACKEND_BASE_URL}/api/regions/${encodeURIComponent(region)}?day=${day}&variable=${variable}`,
      { signal: AbortSignal.timeout(2000) }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchLiveAnalogues(
  region: string,
  day: number,
  variable: ForecastVariable
): Promise<HistoricalAnalogue[] | null> {
  try {
    const res = await fetch(
      `${BACKEND_BASE_URL}/api/analogues?region=${encodeURIComponent(region)}&day=${day}&variable=${variable}`,
      { signal: AbortSignal.timeout(2000) }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchCaseStudies(): Promise<CaseStudy[]> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/case-studies`, {
      signal: AbortSignal.timeout(2500)
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchEvaluationMetrics(): Promise<EvaluationMetrics | null> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/evaluation`, {
      signal: AbortSignal.timeout(2000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
