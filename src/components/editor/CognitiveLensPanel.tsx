import React from 'react';
import { CognitiveAnalysis } from '../../types';
import { Sparkles, HelpCircle, AlertTriangle, Compass } from 'lucide-react';

interface CognitiveLensPanelProps {
  analysis: CognitiveAnalysis | null;
  onRunAnalysis: () => void;
  isGenerating: boolean;
}

export const CognitiveLensPanel: React.FC<CognitiveLensPanelProps> = ({
  analysis,
  onRunAnalysis,
  isGenerating,
}) => {
  if (!analysis) {
    return (
      <div className="bg-[#FFFFFF] dark:bg-[#1C1A18] border border-[#E2DDD5]/80 dark:border-[#332F2A] p-8 sm:p-12 text-center space-y-6 my-6 rounded-2xl shadow-[0_4px_24px_-4px_rgba(43,42,40,0.04),0_1px_3px_0_rgba(43,42,40,0.02)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]">
        <div className="w-14 h-14 rounded-full bg-[#F7F4EE] dark:bg-[#25221E] border border-[#E2DDD5]/60 dark:border-[#38332D] flex items-center justify-center mx-auto text-[#C4432B] shadow-2xs">
          <Compass className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-2xl font-serif font-light text-[#2B2A28] dark:text-[#F5F2EB]">
            Key Insights &amp; Reflection
          </h3>
          <p className="text-xs text-[#595652] dark:text-[#C2BCB1] leading-relaxed font-serif">
            Distill your journal entry into the main takeaway, emotional tones, helpful reframes, and reflection questions.
          </p>
        </div>
        <button
          onClick={onRunAnalysis}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 bg-[#2B2A28] dark:bg-[#C4432B] text-[#F7F4EE] hover:bg-[#C4432B] hover:dark:bg-[#A8351F] text-xs font-sans uppercase tracking-[0.2em] px-7 py-3.5 transition-all duration-200 disabled:opacity-50 font-semibold rounded-full shadow-sm hover:shadow-md active:scale-[0.99]"
        >
          <Sparkles className="w-4 h-4 text-[#C4432B] dark:text-[#FFFFFF]" />
          <span>Generate Insights →</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#1C1A18] border border-[#E2DDD5]/80 dark:border-[#332F2A] p-6 sm:p-10 shadow-[0_4px_24px_-4px_rgba(43,42,40,0.04),0_1px_3px_0_rgba(43,42,40,0.02)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] space-y-8 my-6 rounded-2xl">
      {/* Dossier Header */}
      <div className="border-b border-[#E2DDD5]/60 dark:border-[#2C2824] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#C4432B] font-bold">
              KEY INSIGHTS
            </span>
            <span className="font-script text-[#C4432B] text-lg font-normal">
              helpful takeaways from your entry...
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-serif font-light text-[#2B2A28] dark:text-[#F5F2EB] mt-1">
            Summary &amp; Insights
          </h3>
        </div>
        <button
          onClick={onRunAnalysis}
          disabled={isGenerating}
          className="self-start sm:self-auto text-[10px] font-sans uppercase tracking-[0.18em] border border-[#E2DDD5] dark:border-[#38332D] hover:border-[#C4432B] px-4 py-2 bg-[#F7F4EE]/70 dark:bg-[#25221E] hover:bg-[#F7F4EE] hover:dark:bg-[#2C2823] transition-colors text-[#595652] dark:text-[#C2BCB1] hover:text-[#2B2A28] hover:dark:text-[#F5F2EB] rounded-full shadow-2xs font-medium"
        >
          Refresh Insights
        </button>
      </div>

      {/* 1. Core Axiom / Main Takeaway */}
      <div className="space-y-3">
        <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#8A8478] dark:text-[#8E877C] font-bold flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-[#C4432B]" />
          MAIN TAKEAWAY
        </span>
        <div className="bg-[#F7F4EE]/80 dark:bg-[#25221E] border-l-3 border-[#C4432B] p-5 rounded-xl border-y border-r border-[#E2DDD5]/50 dark:border-[#38332D]">
          <p className="text-lg font-serif italic text-[#2B2A28] dark:text-[#F5F2EB] leading-relaxed">
            "{analysis.coreAxiom}"
          </p>
        </div>
      </div>

      {/* 2. Emotional Resonance */}
      {analysis.emotionalResonance && analysis.emotionalResonance.length > 0 && (
        <div className="space-y-3 border-t border-[#E2DDD5]/60 dark:border-[#2C2824] pt-6">
          <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#8A8478] dark:text-[#8E877C] font-bold">
            HOW YOU FELT
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {analysis.emotionalResonance.map((emotion, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-[#F7F4EE] dark:bg-[#25221E] border border-[#E2DDD5]/70 dark:border-[#38332D] text-xs font-sans text-[#2B2A28] dark:text-[#DDD8CE] uppercase tracking-wider rounded-full shadow-2xs font-medium"
              >
                {emotion}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3. Cognitive Blindspots & Reframes */}
      {analysis.cognitiveBlindspots && analysis.cognitiveBlindspots.length > 0 && (
        <div className="space-y-3 border-t border-[#E2DDD5]/60 dark:border-[#2C2824] pt-6">
          <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#8A8478] dark:text-[#8E877C] font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-[#C4432B]" />
            NEW WAYS TO LOOK AT THIS
          </span>
          <div className="space-y-3">
            {analysis.cognitiveBlindspots.map((blindspot, idx) => (
              <div key={idx} className="p-4 border border-[#E2DDD5]/70 dark:border-[#38332D] bg-[#F7F4EE]/70 dark:bg-[#25221E] text-sm font-serif text-[#595652] dark:text-[#C2BCB1] leading-relaxed rounded-xl shadow-2xs">
                {blindspot}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Socratic Questions */}
      {analysis.socraticQuestions && analysis.socraticQuestions.length > 0 && (
        <div className="space-y-3 border-t border-[#E2DDD5]/60 dark:border-[#2C2824] pt-6">
          <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#8A8478] dark:text-[#8E877C] font-bold flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#C4432B]" />
            QUESTIONS TO THINK ABOUT
          </span>
          <div className="space-y-3">
            {analysis.socraticQuestions.map((q, idx) => (
              <div key={idx} className="p-4 border-l-3 border-[#2B2A28] dark:border-l-[#C4432B] bg-[#F7F4EE]/70 dark:bg-[#25221E] text-base font-serif italic text-[#2B2A28] dark:text-[#F5F2EB] rounded-xl border-y border-r border-[#E2DDD5]/50 dark:border-[#38332D]">
                "{q}"
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
