import React from 'react';
import { Compass, Lightbulb, Heart } from 'lucide-react';

interface EmptyStatePromptsProps {
  onSelectPrompt: (promptText: string) => void;
}

export const EmptyStatePrompts: React.FC<EmptyStatePromptsProps> = ({ onSelectPrompt }) => {
  const prompts = [
    {
      category: "TODAY'S THOUGHTS",
      icon: Compass,
      question: 'What is occupying the most space in your mind right now?',
      detail: 'Untangle current thoughts, decisions, or worries without any judgment or pressure.',
    },
    {
      category: 'GRATITUDE & WINS',
      icon: Heart,
      question: 'What is one small thing that brought you comfort or joy today?',
      detail: 'Take a quiet moment to appreciate a person, a brief interaction, or a simple victory.',
    },
    {
      category: "TOMORROW'S FOCUS",
      icon: Lightbulb,
      question: 'What is the single most important intention for tomorrow?',
      detail: 'Choose one calm focus or mindset you want to carry into the day ahead.',
    },
  ];

  return (
    <div className="py-3 space-y-4">
      <div className="text-center max-w-lg mx-auto space-y-1">
        <span className="text-[10px] font-sans uppercase tracking-[0.22em] text-[#C4432B] font-bold">
          NEED AN IDEA?
        </span>
        <h3 className="text-2xl sm:text-3xl font-serif font-light text-[#2B2A28]">
          What's on your mind today?
          <span className="font-script text-[#C4432B] text-xl block mt-0.5 font-normal">
            pick a prompt or simply start typing below...
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
              className="group cursor-pointer bg-[#FFFFFF] border border-[#E2DDD5]/80 hover:border-[#C4432B]/60 p-5 transition-all duration-200 space-y-3 flex flex-col justify-between shadow-[0_4px_20px_-2px_rgba(43,42,40,0.03),0_1px_3px_0_rgba(43,42,40,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(196,67,43,0.09)] hover:-translate-y-0.5 rounded-2xl"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#E2DDD5]/50 pb-2">
                  <span className="text-[9px] font-sans uppercase tracking-[0.2em] text-[#C4432B] font-semibold">
                    {p.category}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-[#F7F4EE] flex items-center justify-center group-hover:bg-[#C4432B]/10 transition-colors">
                    <Icon className="w-3.5 h-3.5 text-[#C4432B]" />
                  </div>
                </div>
                <h4 className="text-sm font-serif italic text-[#2B2A28] group-hover:text-[#C4432B] transition-colors leading-snug">
                  "{p.question}"
                </h4>
                <p className="text-xs font-serif text-[#595652] leading-relaxed">
                  {p.detail}
                </p>
              </div>

              <div className="pt-2 text-right">
                <span className="text-[9px] font-sans uppercase tracking-widest text-[#8A8478] group-hover:text-[#C4432B] transition-colors font-medium inline-flex items-center gap-1">
                  <span>Start Writing</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
