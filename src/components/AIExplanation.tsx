import { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Sparkles, RefreshCw, AlertTriangle, KeyRound } from 'lucide-react';
import { ForecastVariable } from '../types';
import { getExplanation, getRegionData } from '../data/mockData';
import { streamGeminiExplanation, isGeminiConfigured } from '../api/geminiApi';

interface AIExplanationProps {
  region: string;
  variable: ForecastVariable;
  day?: number;
}

type ExplanationState = 'idle' | 'loading' | 'streaming' | 'done' | 'error' | 'unconfigured';

export default function AIExplanation({ region, variable, day = 5 }: AIExplanationProps) {
  const data = getRegionData(region, variable);
  const fallbackExplanation = getExplanation(region, variable);

  const [state, setState] = useState<ExplanationState>('idle');
  const [streamedText, setStreamedText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef(false);

  const dynamicTags = [
    data.bustProbability > 60 ? 'High historical error' : 'Moderate spread',
    data.confidence === 'low' ? 'High ensemble divergence' : 'Model convergence',
    data.historicalMeanError > 30 ? 'Strong atmospheric gradient' : 'Consistent baseline',
    'Rapid synoptic evolution',
  ];

  const fetchExplanation = useCallback(async () => {
    if (!isGeminiConfigured()) {
      setState('unconfigured');
      return;
    }

    abortRef.current = false;
    setState('loading');
    setStreamedText('');
    setErrorMsg('');

    // Small delay so the loading state renders before the async work starts
    await new Promise((r) => setTimeout(r, 80));

    if (abortRef.current) return;
    setState('streaming');

    await streamGeminiExplanation(
      { region, variable, data, day },
      (chunk) => {
        if (!abortRef.current) {
          setStreamedText((prev) => prev + chunk);
        }
      },
      () => {
        if (!abortRef.current) setState('done');
      },
      (err) => {
        if (!abortRef.current) {
          setErrorMsg(err.message);
          setState('error');
        }
      },
    );
  }, [region, variable, day, data]);

  // Auto-fetch when region / variable / day changes if Gemini is configured
  useEffect(() => {
    abortRef.current = true; // cancel any in-flight stream for the previous region
    if (isGeminiConfigured()) {
      fetchExplanation();
    } else {
      setState('unconfigured');
    }
  }, [region, variable, day]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true;
    };
  }, []);

  const isLoading = state === 'loading' || state === 'streaming';
  const displayText =
    state === 'streaming' || state === 'done'
      ? streamedText
      : state === 'unconfigured' || state === 'idle' || state === 'error'
        ? fallbackExplanation
        : '';

  return (
    <div className="card p-3 border-blue-100 flex flex-col justify-between min-h-[160px]">
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Zap size={15} className="text-blue-500" />
            Why is forecast confidence {data.confidence}?
          </h3>

          <div className="flex items-center gap-1.5">
            {/* Status badge */}
            {state === 'unconfigured' ? (
              <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <KeyRound size={9} /> Template Mode
              </span>
            ) : isLoading ? (
              <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full animate-pulse">
                <Sparkles size={10} /> Gemini AI…
              </span>
            ) : state === 'error' ? (
              <span className="flex items-center gap-1 text-[10px] text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                <AlertTriangle size={9} /> Error — Template fallback
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                <Sparkles size={10} /> Gemini AI
              </span>
            )}

            {/* Regenerate button */}
            {!isLoading && isGeminiConfigured() && (
              <button
                onClick={fetchExplanation}
                title="Regenerate AI explanation"
                className="p-1 rounded-md text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
              >
                <RefreshCw size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Explanation text */}
        <div className="relative">
          {state === 'loading' ? (
            <div className="space-y-1.5 animate-pulse">
              <div className="h-2.5 bg-slate-200 rounded w-full" />
              <div className="h-2.5 bg-slate-200 rounded w-[90%]" />
              <div className="h-2.5 bg-slate-200 rounded w-[80%]" />
              <div className="h-2.5 bg-slate-200 rounded w-[70%]" />
            </div>
          ) : (
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              {displayText}
              {state === 'streaming' && (
                <span className="inline-block w-0.5 h-3 bg-blue-500 ml-0.5 animate-pulse align-middle" />
              )}
            </p>
          )}

          {/* Error detail */}
          {state === 'error' && errorMsg && (
            <p className="text-[10px] text-red-500 mb-2 italic">
              API error: {errorMsg.slice(0, 120)}
            </p>
          )}

          {/* Unconfigured prompt */}
          {state === 'unconfigured' && (
            <div className="mt-1 mb-2 flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
              <KeyRound size={10} className="shrink-0" />
              <span>
                Add <code className="font-mono bg-amber-100 px-1 rounded">VITE_GEMINI_API_KEY</code>{' '}
                to your <code className="font-mono bg-amber-100 px-1 rounded">.env</code> file to
                enable live AI explanations.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mt-1">
        {dynamicTags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/50 rounded-full text-[10px] font-medium"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
