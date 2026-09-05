import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Check } from 'lucide-react';
import { PhilosophicalPersona, PersonaDefinition } from '../../types';

export const PERSONAS: PersonaDefinition[] = [
  {
    id: 'default',
    name: 'The Scribe',
    title: 'Literary Journal Companion',
    era: 'Perennial',
    avatar: '📜',
    mantra: 'Patient, attentive reflection without judgment.',
    description: 'A compassionate, non-judgmental mirror helping you process emotion and distill realizations.',
  },
  {
    id: 'marcus_aurelius',
    name: 'Marcus Aurelius',
    title: 'Stoic Emperor of Rome',
    era: '121 – 180 CE',
    avatar: '🏛️',
    mantra: 'The impediment to action advances action. What stands in the way becomes the way.',
    description: 'Brings sober Stoic equanimity, radical acceptance of externals, and unwavering devotion to character and virtue.',
  },
  {
    id: 'carl_jung',
    name: 'Carl Gustav Jung',
    title: 'Depth Psychologist',
    era: '1875 – 1961',
    avatar: '🕯️',
    mantra: 'Until you make the unconscious conscious, it will direct your life and you will call it fate.',
    description: 'Uncovers hidden shadow aspects, examines psychic tensions between persona and self, and guides individuation.',
  },
  {
    id: 'socrates',
    name: 'Socrates',
    title: 'Father of Dialectic',
    era: '470 – 399 BCE',
    avatar: '🏺',
    mantra: 'The unexamined life is not worth living.',
    description: 'Probes unexamined premises, dismantles false certainties, and guides you to fruitful aporia through playful questioning.',
  },
  {
    id: 'simone_de_beauvoir',
    name: 'Simone de Beauvoir',
    title: 'Existentialist Philosopher',
    era: '1908 – 1986',
    avatar: '✒️',
    mantra: 'One is not born, but rather becomes, oneself through free action.',
    description: 'Sharp clarity on personal agency, dismantling bad faith, and choosing courageous responsibility in the face of ambiguity.',
  },
  {
    id: 'alan_watts',
    name: 'Alan Watts',
    title: 'Philosopher of Zen & Tao',
    era: '1915 – 1973',
    avatar: '🌊',
    mantra: 'Muddy water is best cleared by leaving it alone.',
    description: 'Playful levity, dissolving false dualisms, and reminding you that life is a dance to be experienced, not an ordeal to conquer.',
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
        className={`px-2 py-1 rounded-xs border transition-all flex items-center gap-1.5 text-[10px] font-sans uppercase tracking-wider ${
          selectedPersona !== 'default'
            ? 'bg-[#C4432B]/10 text-[#C4432B] border-[#C4432B]/40 font-semibold'
            : 'bg-[#EFECE6]/60 text-[#595652] border-[#E2DDD5] hover:border-[#C4432B]'
        }`}
        title="Consult The Lyceum: Select a Philosophical Interlocutor"
      >
        <span className="text-xs">{currentPersona.avatar}</span>
        <span className="truncate max-w-[110px] sm:max-w-none">{currentPersona.name}</span>
        <span className="text-[8px] opacity-60">▾</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-1.5 z-50 w-72 sm:w-80 bg-[#FFFDF9] border border-[#E2DDD5] shadow-2xl p-2 rounded-xs space-y-1">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#E2DDD5]/70 px-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#C4432B]" />
              <span className="text-[9px] font-sans uppercase tracking-[0.2em] font-bold text-[#2B2A28]">
                The Lyceum: Interlocutor
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#8A8478] hover:text-[#2B2A28]"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1 pr-0.5">
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
                  className={`w-full text-left p-2 rounded-xs border transition-colors flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-[#C4432B]/10 border-[#C4432B]/40 text-[#2B2A28]'
                      : 'border-transparent hover:border-[#E2DDD5] hover:bg-[#F7F4EE] text-[#595652]'
                  }`}
                >
                  <span className="text-lg p-1 bg-[#F4F0E8] border border-[#E2DDD5] rounded-xs shrink-0">
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
