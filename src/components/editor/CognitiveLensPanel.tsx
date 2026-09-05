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
      <div className="bg-[#FFFDF9] border border-[#E2DDD5] border-t-2 border-t-[#C4432B] p-8 sm:p-12 text-center space-y-6 my-6 rounded-xs">
        <div className="w-12 h-12 rounded-full border border-[#E2DDD5] bg-[#EFECE6] flex items-center justify-center mx-auto text-[#C4432B]">
          <Compass className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-2xl font-serif font-light text-[#2B2A28]">
            Key Insights &amp; Reflection
          </h3>
          <p className="text-xs text-[#595652] leading-relaxed font-serif">
            Distill your journal entry into the main takeaway, emotional tones, helpful reframes, and reflection questions.
          </p>
        </div>
        <button
          onClick={onRunAnalysis}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 bg-[#2B2A28] text-[#F7F4EE] hover:bg-[#C4432B] text-xs font-sans uppercase tracking-[0.2em] px-6 py-3 transition-all duration-200 disabled:opacity-50 font-semibold rounded-sm"
        >
          <Sparkles className="w-4 h-4 text-[#C4432B]" />
          <span>Generate Insights →</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFDF9] border border-[#E2DDD5] border-t-2 border-t-[#C4432B] p-6 sm:p-10 shadow-xs space-y-8 my-6 rounded-xs">
      {/* Dossier Header */}
      <div className="border-b border-[#E2DDD5] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#C4432B] font-bold">
              KEY INSIGHTS
            </span>
            <span className="font-script text-[#C4432B] text-lg font-normal">
              synthesized reflections...
            </span>
          </div>
          <h3 className="text-3xl font-serif font-light text-[#2B2A28] mt-1">
            Clarity &amp; Insights
          </h3>
        </div>
        <button
          onClick={onRunAnalysis}
          disabled={isGenerating}
          className="self-start sm:self-auto text-[10px] font-sans uppercase tracking-[0.18em] border border-[#E2DDD5] hover:border-[#C4432B] px-3.5 py-2 bg-[#EFECE6]/60 hover:bg-[#EFECE6] transition-colors text-[#595652] rounded-xs"
        >
          Update Insights
        </button>
      </div>

      {/* 1. Core Axiom / Main Takeaway */}
      <div className="space-y-3">
        <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#8A8478] font-bold flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-[#C4432B]" />
          MAIN TAKEAWAY
        </span>
        <div className="bg-[#EFECE6]/60 border-l-2 border-[#C4432B] p-5">
          <p className="text-lg font-serif italic text-[#2B2A28] leading-relaxed">
            "{analysis.coreAxiom}"
          </p>
        </div>
      </div>

      {/* 2. Emotional Resonance */}
      {analysis.emotionalResonance && analysis.emotionalResonance.length > 0 && (
        <div className="space-y-3 border-t border-[#E2DDD5] pt-6">
          <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#8A8478] font-bold">
            EMOTIONAL TONE
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {analysis.emotionalResonance.map((emotion, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-[#EFECE6] border border-[#E2DDD5] text-xs font-sans text-[#2B2A28] uppercase tracking-wider rounded-xs"
              >
                {emotion}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3. Cognitive Blindspots & Reframes */}
      {analysis.cognitiveBlindspots && analysis.cognitiveBlindspots.length > 0 && (
        <div className="space-y-3 border-t border-[#E2DDD5] pt-6">
          <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#8A8478] font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-[#C4432B]" />
            PERSPECTIVES &amp; REFRAMES
          </span>
          <div className="space-y-3">
            {analysis.cognitiveBlindspots.map((blindspot, idx) => (
              <div key={idx} className="p-4 border border-[#E2DDD5] bg-[#F7F4EE] text-sm font-serif text-[#595652] leading-relaxed rounded-xs">
                {blindspot}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Socratic Questions */}
      {analysis.socraticQuestions && analysis.socraticQuestions.length > 0 && (
        <div className="space-y-3 border-t border-[#E2DDD5] pt-6">
          <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#8A8478] font-bold flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#C4432B]" />
            QUESTIONS FOR REFLECTION
          </span>
          <div className="space-y-3">
            {analysis.socraticQuestions.map((q, idx) => (
              <div key={idx} className="p-4 border-l-2 border-[#2B2A28] bg-[#EFECE6]/40 text-base font-serif italic text-[#2B2A28]">
                "{q}"
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
