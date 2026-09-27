import { RegionalData, ForecastVariable, getVariableUnit } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

// Use the public REST endpoint directly — avoids IDE internal proxy interception
const GEMINI_REST_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-3.5-flash'; // Latest free-tier Flash model (Sept 2026)

export interface GeminiExplanationParams {
  region: string;
  variable: ForecastVariable;
  data: RegionalData;
  day: number;
}

/**
 * Builds the meteorological prompt for Gemini.
 */
function buildPrompt(params: GeminiExplanationParams): string {
  const { region, variable, data, day } = params;
  const unit = getVariableUnit(variable);
  const variableLabel = variable.charAt(0).toUpperCase() + variable.slice(1);
  const bustRisk = data.bustProbability >= 65 ? 'HIGH' : data.bustProbability >= 45 ? 'MODERATE' : 'LOW';
  const errorRate = ((data.casesWithLargeError / data.similarCases) * 100).toFixed(0);

  return `You are an expert meteorologist specializing in numerical weather prediction (NWP) verification and forecast bust detection over the Indian subcontinent.

Produce a concise, expert meteorological explanation (2–3 sentences, ~80–110 words) of WHY the forecast confidence is ${data.confidence.toUpperCase()} and what atmospheric factors drive the bust risk.

Regional Forecast Context:
- Region: ${region}, India
- Forecast Variable: ${variableLabel} (${unit})
- Forecast Day: Day ${day} of 10-day outlook
- Forecast Value: ${data.forecastValue}${unit}
- Forecast Confidence: ${data.confidence.toUpperCase()}
- Bust Probability: ${data.bustProbability}% (${bustRisk} risk)
- Historical Mean Error: ±${data.historicalMeanError}${unit}
- Similar Past Cases: ${data.similarCases} analogues
- Large Error Rate: ${errorRate}% of analogues had large errors
- Historical Bust Frequency: ${data.historicalBustFrequency}%
- Key Factors: ${data.keyReasons.join('; ')}

Instructions:
- Write as a professional meteorologist in flowing prose (no bullet points).
- Be specific about physical mechanisms (orographic effects, NWP resolution, ensemble spread, monsoon dynamics).
- Reference the quantitative stats where relevant.
- Do NOT start with "I" or "As a meteorologist".
- Keep the response under 120 words.`;
}

/**
 * Streams a Gemini explanation using the public REST SSE endpoint.
 * Bypasses the @google/generative-ai SDK to avoid IDE proxy interception.
 */
export async function streamGeminiExplanation(
  params: GeminiExplanationParams,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
): Promise<void> {
  if (!API_KEY) {
    onError(new Error('VITE_GEMINI_API_KEY is not set in your .env file.'));
    return;
  }

  const url = `${GEMINI_REST_BASE}/${MODEL}:streamGenerateContent?alt=sse&key=${API_KEY}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: buildPrompt(params) }] }],
    generationConfig: {
      maxOutputTokens: 512,
      temperature: 0.7,
      topP: 0.9,
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      let detail = errText;
      try {
        const parsed = JSON.parse(errText);
        detail = parsed?.error?.message ?? errText;
      } catch {
        // leave as raw text
      }
      onError(new Error(`Gemini API ${response.status}: ${detail}`));
      return;
    }

    if (!response.body) {
      onError(new Error('No response body from Gemini API.'));
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // Keep the last (possibly incomplete) line in buffer
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.slice(5).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const text: string =
            parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          if (text) onChunk(text);
        } catch {
          // skip malformed lines
        }
      }
    }

    onDone();
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}

/**
 * Returns true if the Gemini API key is configured.
 */
export function isGeminiConfigured(): boolean {
  return Boolean(API_KEY && API_KEY.trim().length > 0);
}
