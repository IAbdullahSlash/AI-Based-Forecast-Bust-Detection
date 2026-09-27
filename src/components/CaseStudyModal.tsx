import React, { useState } from 'react';
import {
  X,
  Award,
  Clock,
  CheckCircle,
  AlertOctagon,
  ArrowRight,
  Database,
  BarChart3,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CaseStudy, EvaluationMetrics } from '../types';

interface CaseStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseStudies: CaseStudy[];
  evaluationMetrics: EvaluationMetrics | null;
}

export const CaseStudyModal: React.FC<CaseStudyModalProps> = ({
  isOpen,
  onClose,
  caseStudies,
  evaluationMetrics,
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(
    caseStudies[0]?.id || 'odisha-july-2023'
  );
  const [activeStep, setActiveStep] = useState<number>(1);

  if (!isOpen) return null;

  const currentCase =
    caseStudies.find((c) => c.id === selectedCaseId) || caseStudies[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  SIH Hackathon Demo Walkthrough
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Historical Validation Mode
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                NWP Forecast Bust Detection Case Studies
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Case Study Switcher Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-3 gap-2 overflow-x-auto">
          {caseStudies.map((cs) => (
            <button
              key={cs.id}
              onClick={() => {
                setSelectedCaseId(cs.id);
                setActiveStep(1);
              }}
              className={`pb-3 px-4 text-xs font-semibold rounded-t-lg transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
                selectedCaseId === cs.id
                  ? 'border-blue-500 text-blue-400 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{cs.title}</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                Day {cs.leadTimeDays} Horizon
              </span>
            </button>
          ))}
        </div>

        {currentCase && (
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Case Overview Banner */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-wrap md:flex-nowrap gap-4 justify-between items-center">
              <div>
                <span className="text-xs font-mono text-blue-400 font-medium">{currentCase.date}</span>
                <h3 className="text-base font-bold text-white mt-0.5">{currentCase.subtitle}</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  {currentCase.geminiMeteorologicalContext}
                </p>
              </div>
              <div className="flex gap-3">
                <div className="text-center px-3 py-2 bg-slate-900 rounded-lg border border-slate-700">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">NWP Forecast</div>
                  <div className="text-base font-mono font-bold text-amber-300">
                    {currentCase.nwpForecastValue} mm
                  </div>
                </div>
                <div className="text-center px-3 py-2 bg-slate-900 rounded-lg border border-slate-700">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">IMD Actual</div>
                  <div className="text-base font-mono font-bold text-red-400">
                    {currentCase.observedValue} mm
                  </div>
                </div>
                <div className="text-center px-3 py-2 bg-red-950/40 rounded-lg border border-red-500/40">
                  <div className="text-[10px] text-red-400 uppercase font-semibold">Bust Error</div>
                  <div className="text-base font-mono font-bold text-red-300">
                    +{currentCase.actualError} mm
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Timeline Progression */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Chronological Detection Walkthrough
                </h4>
                <span className="text-[11px] text-slate-400">
                  Step {activeStep} of {currentCase.timelineSteps.length}
                </span>
              </div>

              {/* Step Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                {currentCase.timelineSteps.map((step) => (
                  <button
                    key={step.stepIndex}
                    onClick={() => setActiveStep(step.stepIndex)}
                    className={`p-2.5 rounded-lg text-left border transition ${
                      activeStep === step.stepIndex
                        ? 'bg-blue-950/50 border-blue-500/60 text-white'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[10px] font-mono text-blue-400 font-semibold">Step {step.stepIndex}</div>
                    <div className="text-xs font-bold truncate mt-0.5">{step.title}</div>
                  </button>
                ))}
              </div>

              {/* Active Step Card */}
              {(() => {
                const step = currentCase.timelineSteps.find((s) => s.stepIndex === activeStep) || currentCase.timelineSteps[0];
                return (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-blue-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
                        {step.timestamp}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{step.title}</span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed">{step.description}</p>
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800/80">
                      {Object.entries(step.data).map(([k, v]) => (
                        <div key={k} className="px-2.5 py-1 bg-slate-900 rounded border border-slate-800 text-xs">
                          <span className="text-slate-400 capitalize">{k.replace(/_/g, ' ')}: </span>
                          <span className="font-mono font-bold text-slate-200">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Retrieved Historical Analogues for this Case */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Retrieved Historical Analogues Triggering Warning
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {currentCase.topAnalogues.map((analogue, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-purple-400 font-mono font-bold">
                          {analogue.similarity}% Match
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/50 font-semibold">
                          {analogue.bustStatus}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white">{analogue.eventType}</div>
                      <div className="text-[11px] text-slate-400">{analogue.region} &bull; {analogue.date}</div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex justify-between items-center text-xs">
                      <span className="text-slate-400">Past Error:</span>
                      <span className="font-mono font-bold text-amber-300">±{analogue.forecastError} mm</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quantitative Hackathon Benchmark Scorecard */}
            {evaluationMetrics && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      Overall Model Verification Scorecard (N=120 Historical Extreme Events)
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">P90 Calibrated</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Precision</div>
                    <div className="text-lg font-mono font-bold text-emerald-400">
                      {evaluationMetrics.precision}%
                    </div>
                    <div className="text-[10px] text-slate-500">Correct bust alarms</div>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Recall</div>
                    <div className="text-lg font-mono font-bold text-blue-400">
                      {evaluationMetrics.recall}%
                    </div>
                    <div className="text-[10px] text-slate-500">Bust events captured</div>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Brier Score</div>
                    <div className="text-lg font-mono font-bold text-purple-400">
                      {evaluationMetrics.brierScore}
                    </div>
                    <div className="text-[10px] text-slate-500">Probabilistic calibration</div>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Lead Time Gain</div>
                    <div className="text-lg font-mono font-bold text-amber-400">
                      +{evaluationMetrics.detectionLeadTimeDays} Days
                    </div>
                    <div className="text-[10px] text-slate-500">Advance warning lead</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Smart India Hackathon (SIH) Hybrid Architecture Demo</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition"
          >
            Close Walkthrough
          </button>
        </div>
      </div>
    </div>
  );
};
