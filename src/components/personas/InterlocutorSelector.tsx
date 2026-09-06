import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Check } from 'lucide-react';
import { PhilosophicalPersona, PersonaDefinition } from '../../types';

export const PERSONAS: PersonaDefinition[] = [
  {
    id: 'default',
    name: 'The Scribe',
    title: 'Friendly Journal Companion',
    era: 'Present Day',
    avatar: '📜',
    mantra: 'A safe space to write without being judged.',
    description: 'A warm, helpful guide who listens to your feelings and helps you organize your thoughts.',
  },
  {
    id: 'marcus_aurelius',
    name: 'Marcus Aurelius',
    title: 'Stoic Guide for Calm & Focus',
    era: '121 – 180 CE',
    avatar: '🏛️',
    mantra: 'Focus on what you can control. Let go of the rest.',
    description: 'Helps you stay calm under pressure, stop worrying about things outside your control, and build inner strength.',
  },
  {
    id: 'carl_jung',
    name: 'Carl Gustav Jung',
    title: 'Self-Understanding Guide',
    era: '1875 – 1961',
    avatar: '🕯️',
    mantra: 'Understand what is beneath the surface to find peace.',
    description: 'Helps you uncover why you feel stuck or stressed, and learn more about your true self.',
  },
  {
    id: 'socrates',
    name: 'Socrates',
    title: 'Curious Questioner',
    era: '470 – 399 BCE',
    avatar: '🏺',
    mantra: 'Asking honest questions leads to clear thinking.',
    description: 'Asks gentle, thoughtful questions to help you see things from a new angle and test your assumptions.',
  },
  {
    id: 'simone_de_beauvoir',
    name: 'Simone de Beauvoir',
    title: 'Courage & Action Guide',
    era: '1908 – 1986',
    avatar: '✒️',
    mantra: 'You define who you are through the choices you make.',
    description: 'Encourages you to make bold choices, stop holding yourself back, and take full ownership of your life.',
  },
  {
    id: 'alan_watts',
    name: 'Alan Watts',
    title: 'Mindfulness & Letting Go',
    era: '1915 – 1973',
    avatar: '🌊',
    mantra: 'Relax and take a breath. Life is meant to be lived, not fought.',
    description: 'Helps you stop overthinking, ease your worries, and enjoy the present moment.',
  },
];

interface InterlocutorSelectorProps {
  selectedPersona: PhilosophicalPersona;
  onSelectPersona: (persona: PhilosophicalPersona) => void;
}

export const InterlocutorSelector: React.FC<InterlocutorSelectorProps> = ({
  selectedPersona,
  onSelectPersona,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const currentPersona = PERSONAS.find((p) => p.id === selectedPersona) || PERSONAS[0];

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`px-2.5 py-1.5 rounded-full border transition-all flex items-center gap-1.5 text-[10px] font-sans uppercase tracking-wider shadow-2xs ${
          selectedPersona !== 'default'
            ? 'bg-[#C4432B]/10 text-[#C4432B] border-[#C4432B]/40 font-semibold'
            : 'bg-[#F7F4EE]/80 text-[#595652] border-[#E2DDD5] hover:border-[#C4432B] hover:text-[#2B2A28]'
        }`}
        title="Select a Writing Guide or Reflection Mentor"
      >
        <span className="text-xs">{currentPersona.avatar}</span>
        <span className="truncate max-w-[110px] sm:max-w-none">
          {currentPersona.id === 'default' ? 'Guide: Scribe' : `Guide: ${currentPersona.name.split(' ')[0]}`}
        </span>
        <span className="text-[8px] opacity-60">▾</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-72 sm:w-80 bg-[#FFFFFF] border border-[#E2DDD5] shadow-2xl p-2.5 rounded-2xl space-y-1.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2DDD5]/60 px-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C4432B]" />
              <span className="text-[9px] font-sans uppercase tracking-[0.2em] font-bold text-[#2B2A28]">
                Choose Writing Guide
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#8A8478] hover:text-[#2B2A28] p-1 rounded-full hover:bg-[#F4F0E8]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-0.5">
            {PERSONAS.map((persona) => {
              const isSelected = selectedPersona === persona.id;
              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => {
                    onSelectPersona(persona.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-[#C4432B]/10 border-[#C4432B]/40 text-[#2B2A28] shadow-xs'
                      : 'border-transparent hover:border-[#E2DDD5] hover:bg-[#F7F4EE] text-[#595652]'
                  }`}
                >
                  <span className="text-lg p-1.5 bg-[#F4F0E8] border border-[#E2DDD5]/60 rounded-lg shrink-0">
                    {persona.avatar}
                  </span>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-medium text-xs text-[#2B2A28]">
                        {persona.name}
                      </span>
                      <span className="text-[8px] font-mono text-[#8A8478]">
                        {persona.era}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#C4432B] font-serif italic line-clamp-1">
                      "{persona.mantra}"
                    </p>
                    <p className="text-[10px] text-[#6E6A64] font-sans leading-tight line-clamp-2">
                      {persona.description}
                    </p>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#C4432B] shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
