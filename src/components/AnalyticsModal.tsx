import React from 'react';
import { X, BarChart2, Heart, Award, Sparkles, BookOpen, Clock } from 'lucide-react';
import { Interaction } from '../types';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  interactions: Interaction[];
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  interactions,
}) => {
  if (!isOpen) return null;

  const totalInteractions = interactions.length;
  const totalTurns = interactions.reduce(
    (acc, curr) => acc + (curr.messages ? curr.messages.length : 0),
    0
  );

  // Category counts
  const categoryCounts: Record<string, number> = {};
  interactions.forEach((i) => {
    const cat = i.category || 'reflection';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  // Emotional Resonance Tag Frequencies
  const emotionalTagCounts: Record<string, number> = {};
  const coreAxiomsList: string[] = [];

  interactions.forEach((i) => {
    if (i.cognitiveAnalysis) {
      if (Array.isArray(i.cognitiveAnalysis.emotionalResonance)) {
        i.cognitiveAnalysis.emotionalResonance.forEach((tag) => {
          if (tag) {
            emotionalTagCounts[tag] = (emotionalTagCounts[tag] || 0) + 1;
          }
        });
      }
      const axioms = i.cognitiveAnalysis.coreAxioms || (i.cognitiveAnalysis.coreAxiom ? [i.cognitiveAnalysis.coreAxiom] : []);
      axioms.forEach((ax) => {
        if (ax && !coreAxiomsList.includes(ax)) {
          coreAxiomsList.push(ax);
        }
      });
    }
  });

  const sortedEmotionalTags = Object.entries(emotionalTagCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B2A28]/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#FFFDF9] border border-[#E2DDD5] border-t-4 border-t-[#C4432B] max-w-2xl w-full p-6 sm:p-8 shadow-xl space-y-6 rounded-xs my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C4432B]/10 text-[#C4432B] rounded-xs">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-sans uppercase tracking-[0.22em] font-bold text-[#C4432B]">
                Cognitive Analytics
              </span>
              <h2 className="text-xl sm:text-2xl font-serif text-[#2B2A28] font-light">
                Emotional Nuance & Synthesis
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8A8478] hover:text-[#2B2A28] hover:bg-[#EFECE6] transition-colors rounded-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-[#F7F4EE] border border-[#E2DDD5] p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-sans uppercase tracking-wider text-[#8A8478]">
              <BookOpen className="w-3.5 h-3.5 text-[#C4432B]" />
              <span>Inquiries</span>
            </div>
            <p className="text-2xl font-serif font-semibold text-[#2B2A28]">{totalInteractions}</p>
          </div>

          <div className="bg-[#F7F4EE] border border-[#E2DDD5] p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-sans uppercase tracking-wider text-[#8A8478]">
              <Clock className="w-3.5 h-3.5 text-[#C4432B]" />
              <span>Total Turns</span>
            </div>
            <p className="text-2xl font-serif font-semibold text-[#2B2A28]">{totalTurns}</p>
          </div>

          <div className="bg-[#F7F4EE] border border-[#E2DDD5] p-3.5 space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-[10px] font-sans uppercase tracking-wider text-[#8A8478]">
              <Sparkles className="w-3.5 h-3.5 text-[#C4432B]" />
              <span>Synthesized Axioms</span>
            </div>
            <p className="text-2xl font-serif font-semibold text-[#2B2A28]">{coreAxiomsList.length}</p>
          </div>
        </div>

        {/* Emotional Frequencies section */}
        <div className="space-y-3 border-t border-[#E2DDD5] pt-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#C4432B]" />
            <h3 className="text-sm font-sans uppercase tracking-widest font-semibold text-[#2B2A28]">
              Emotional Nuance & Resonance Tags
            </h3>
          </div>

          {sortedEmotionalTags.length === 0 ? (
            <p className="text-xs text-[#8A8478] italic font-serif">
              No emotional tags synthesized yet. Use the Cognitive Lens on an inquiry to generate emotional analytics.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {sortedEmotionalTags.map(([tag, count]) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F4EE] border border-[#E2DDD5] text-xs font-serif text-[#2B2A28]"
                >
                  <span>{tag}</span>
                  <span className="bg-[#C4432B] text-[#F7F4EE] text-[9px] font-sans px-1.5 py-0.5 rounded-xs font-bold">
                    {count}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Core Axioms Highlight */}
        {coreAxiomsList.length > 0 && (
          <div className="space-y-3 border-t border-[#E2DDD5] pt-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#C4432B]" />
              <h3 className="text-sm font-sans uppercase tracking-widest font-semibold text-[#2B2A28]">
                Distilled Core Axioms
              </h3>
            </div>
            <ul className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {coreAxiomsList.slice(0, 5).map((axiom, idx) => (
                <li key={idx} className="text-xs font-serif italic text-[#595652] bg-[#F7F4EE] p-2.5 border-l-2 border-l-[#C4432B]">
                  "{axiom}"
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Close button */}
        <div className="border-t border-[#E2DDD5] pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#2B2A28] text-[#F7F4EE] text-xs font-sans uppercase tracking-widest font-semibold hover:bg-[#C4432B] transition-colors rounded-xs"
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
};
