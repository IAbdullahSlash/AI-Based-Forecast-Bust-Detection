import { HistoricalAnalogue, RegionalData } from '../types';

export interface GeminiBriefingEvidence {
  region: string;
  day: number;
  result: RegionalData;
  analogues: HistoricalAnalogue[];
}

export async function generateGeminiBriefing(evidence: GeminiBriefingEvidence): Promise<string> {
  const response = await fetch('/api/gemini/explanation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ evidence }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Gemini could not generate a briefing.');
  if (typeof payload.explanation !== 'string' || !payload.explanation.trim()) {
    throw new Error('Gemini returned an empty briefing.');
  }
  return payload.explanation.trim();
}

export interface CaseBriefingRequest {
  caseId: string;
  day: number;
  region: string;
  variable: 'rainfall' | 'temperature';
}

/** The server rebuilds the evidence from its own case-study engine; only identifiers are sent. */
export async function generateCaseBriefing(request: CaseBriefingRequest): Promise<string> {
  const response = await fetch('/api/gemini/case-briefing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Gemini could not generate a briefing.');
  if (typeof payload.explanation !== 'string' || !payload.explanation.trim()) {
    throw new Error('Gemini returned an empty briefing.');
  }
  return payload.explanation.trim();
}
