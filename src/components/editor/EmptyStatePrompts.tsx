import React from 'react';
import { Compass, Lightbulb, Heart } from 'lucide-react';

interface EmptyStatePromptsProps {
  onSelectPrompt: (promptText: string) => void;
}

export const EmptyStatePrompts: React.FC<EmptyStatePromptsProps> = ({ onSelectPrompt }) => {
  const prompts = [
    {
      category: 'UNPACKING TODAY',
      icon: Compass,
      question: 'What is occupying the most space in your mind right now?',
      detail: 'Untangle current thoughts, decisions, or worries without any judgment or pressure.',
    },
    {
      category: 'GRATITUDE & SMALL WINS',
      icon: Heart,
      question: 'What is one small thing that brought you comfort or joy today?',
      detail: 'Take a quiet moment to appreciate a person, a brief interaction, or a simple victory.',
    },
    {
      category: 'LOOKING FORWARD',
      icon: Lightbulb,
      question: 'What is the single most important intention for tomorrow?',
      detail: 'Choose one calm focus or mindset you want to carry into the day ahead.',
    },
  ];

  return (
    <div className="py-3 space-y-4">
      <div className="text-center max-w-lg mx-auto space-y-1">
        <span className="text-[10px] font-sans uppercase tracking-[0.22em] text-[#C4432B] font-bold">
          WRITING INSPIRATION
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
                  Start Writing →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
