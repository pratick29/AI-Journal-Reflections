import React from 'react';
import { Compass, Lightbulb, AlertTriangle } from 'lucide-react';

interface EmptyStatePromptsProps {
  onSelectPrompt: (promptText: string) => void;
}

export const EmptyStatePrompts: React.FC<EmptyStatePromptsProps> = ({ onSelectPrompt }) => {
  const prompts = [
    {
      category: 'PROFESSIONAL CROSSROADS',
      icon: Compass,
      question: 'What direction am I avoiding, and why?',
      detail: 'Explore hidden friction between current commitments and your genuine long-term ambition.',
    },
    {
      category: 'RECURRING FRICTION',
      icon: AlertTriangle,
      question: 'What keeps bothering me that I have learned to tolerate?',
      detail: 'Identify subtle compromises and emotional drains hiding in daily routine.',
    },
    {
      category: 'UNSPOKEN PRIORITY',
      icon: Lightbulb,
      question: 'What does my calendar reveal that my words don’t?',
      detail: 'Examine where attention actually flows versus where you claim your priorities lie.',
    },
  ];

  return (
    <div className="py-3 space-y-4">
      <div className="text-center max-w-lg mx-auto space-y-1">
        <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#C4432B] font-bold">
          EDITORIAL PROMPTS
        </span>
        <h3 className="text-2xl sm:text-3xl font-serif font-light text-[#2B2A28]">
          Inquiries for Honest Contemplation
          <span className="font-script text-[#C4432B] text-xl block mt-0.5 font-normal">
            select a theme to begin writing...
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {prompts.map((p, idx) => {
          const Icon = p.icon;
          return (
            <div
              key={idx}
              onClick={() => onSelectPrompt(p.question)}
              className="group cursor-pointer bg-[#FFFDF9] border border-[#E2DDD5] border-t-2 border-t-transparent hover:border-t-[#C4432B] hover:border-[#C4432B] p-4.5 transition-all duration-200 space-y-2.5 flex flex-col justify-between shadow-2xs rounded-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-1.5">
                  <span className="text-[9px] font-sans uppercase tracking-[0.2em] text-[#C4432B] font-bold">
                    {p.category}
                  </span>
                  <Icon className="w-3.5 h-3.5 text-[#C4432B]" />
                </div>
                <h4 className="text-sm font-serif italic text-[#2B2A28] group-hover:text-[#C4432B] transition-colors leading-snug">
                  "{p.question}"
                </h4>
                <p className="text-xs font-serif text-[#595652] leading-relaxed">
                  {p.detail}
                </p>
              </div>

              <div className="pt-1.5 text-right">
                <span className="text-[9px] font-sans uppercase tracking-widest text-[#8A8478] group-hover:text-[#C4432B] transition-colors font-medium">
                  Begin Entry →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
