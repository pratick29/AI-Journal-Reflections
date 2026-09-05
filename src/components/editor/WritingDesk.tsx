import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Mic, MicOff, Maximize2, BookTemplate, Compass, X } from 'lucide-react';
import { ReflectionMode } from '../../types';
import { InteractiveButton } from '../common/InteractiveButton';

const MOODS = [
  { id: 'equanimity', label: 'Equanimity', icon: '🌿' },
  { id: 'creative', label: 'Creative Fire', icon: '⚡' },
  { id: 'friction', label: 'Inner Friction', icon: '🌪️' },
  { id: 'curiosity', label: 'Deep Curiosity', icon: '🔍' },
  { id: 'melancholy', label: 'Melancholy', icon: '🌙' },
];

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

interface WritingDeskProps {
  promptInput: string;
  setPromptInput: (value: string) => void;
  activeMode: ReflectionMode;
  setActiveMode: (mode: ReflectionMode) => void;
  isGenerating: boolean;
  onSubmitInquiry: (e: React.FormEvent) => void;
  userTurnCount: number;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  onOpenZenMode?: () => void;
}

const TEMPLATES = [
  {
    name: 'Stoic Evening Audit',
    content: `1. What went well today and brought clarity?\n\n2. What caused internal friction or anxiety?\n\n3. How can I reframe today's main challenge with equanimity?`,
  },
  {
    name: 'Hegelian Dialectic',
    content: `• THESIS: My initial belief or assumption is...\n\n• ANTITHESIS: The strongest counter-argument or opposing view is...\n\n• SYNTHESIS: The deeper reconciliation between both perspectives is...`,
  },
  {
    name: 'Cognitive Reframe',
    content: `• AUTOMATIC THOUGHT: What am I telling myself right now?\n\n• DISTORTION: Am I catastrophizing, black-and-white thinking, or assuming?\n\n• GROUNDED REALITY: What is an objective, balanced statement of truth?`,
  },
  {
    name: '5 Whys Root Cause',
    content: `1. What problem or emotion am I experiencing?\n2. Why is this occurring?\n3. Why does that matter to me?\n4. Why is that important?\n5. At the root, what core value or fear does this touch?`,
  },
  {
    name: 'Gratitude & Posture',
    content: `• OBSERVATION 1: A subtle detail I noticed today...\n\n• OBSERVATION 2: Something I am quietly grateful for...\n\n• GUIDING POSTURE: My single core intention for tomorrow...`,
  },
];

export const WritingDesk: React.FC<WritingDeskProps> = ({
  promptInput,
  setPromptInput,
  activeMode,
  setActiveMode,
  isGenerating,
  onSubmitInquiry,
  userTurnCount,
  textareaRef,
  onOpenZenMode,
}) => {
  const isDepthLimitReached = activeMode !== 'cognitive_lens' && userTurnCount >= 15;
  const [isListening, setIsListening] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // cleanup
        }
      }
    };
  }, []);

  const handleToggleDictation = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      alert('Voice dictation is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + ' ';
          }
        }
        if (transcript) {
          setPromptInput(promptInput ? `${promptInput} ${transcript.trim()}` : transcript.trim());
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.error('Failed to start dictation:', err);
      setIsListening(false);
    }
  };

  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMood && promptInput.trim() && !promptInput.includes('[Headspace:')) {
      const moodObj = MOODS.find((m) => m.id === selectedMood);
      const contextualInput = `[Headspace: ${moodObj ? `${moodObj.icon} ${moodObj.label}` : selectedMood}]\n${promptInput}`;
      setPromptInput(contextualInput);
      // Submit with updated text
      setTimeout(() => {
        onSubmitInquiry(e);
      }, 20);
      return;
    }
    onSubmitInquiry(e);
  };

  const [showMoodMenu, setShowMoodMenu] = useState(false);
  const moodMenuRef = useRef<HTMLDivElement>(null);
  const templateMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (moodMenuRef.current && !moodMenuRef.current.contains(e.target as Node)) {
        setShowMoodMenu(false);
      }
      if (templateMenuRef.current && !templateMenuRef.current.contains(e.target as Node)) {
        setShowTemplates(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedMoodObj = MOODS.find((m) => m.id === selectedMood);

  return (
    <div id="writing-desk" className="bg-[#FFFDF9] border border-[#E2DDD5] border-t-2 border-t-[#C4432B] p-4 sm:p-5 shadow-xs space-y-2.5 rounded-xs relative">
      {/* Top Header: Understated Status */}
      <div className="flex items-center justify-between border-b border-[#E2DDD5]/60 pb-2 text-[10px] font-sans">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C4432B]" />
          <span className="uppercase tracking-[0.22em] font-bold text-[#2B2A28]">
            Manuscript Desk
          </span>
          <span className="tracking-widest text-[#8A8478]">
            ({userTurnCount}/15 Inquiries)
          </span>
          {selectedMoodObj && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#C4432B]/10 text-[#C4432B] border border-[#C4432B]/20 rounded-xs">
              <span>{selectedMoodObj.icon}</span>
              <span>{selectedMoodObj.label}</span>
              <button
                type="button"
                onClick={() => setSelectedMood(null)}
                className="hover:opacity-70 ml-0.5"
                title="Clear mood"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
        </div>

        <div>
          {isListening ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#C4432B] font-medium animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#C4432B]" />
              Listening to dictation...
            </span>
          ) : (
            <span className="font-script text-[#C4432B] text-base font-normal hidden xs:inline">
              for honest thoughts...
            </span>
          )}
        </div>
      </div>

      {/* Main Manuscript Input Form */}
      <form onSubmit={handleFormSubmit} className="space-y-2.5">
        <textarea
          id="manuscript-input"
          ref={textareaRef}
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          disabled={isGenerating || isDepthLimitReached}
          placeholder={
            isDepthLimitReached
              ? 'Dialogue depth limit of 15 inquiries reached. Please distill your reflection using Cognitive Lens or start a new inquiry.'
              : selectedMoodObj
              ? `Reflecting through ${selectedMoodObj.label}...`
              : 'Begin writing into the quiet...'
          }
          rows={3}
          className="w-full bg-transparent text-base font-serif text-[#2B2A28] placeholder-[#8A8478]/60 focus:outline-none resize-none leading-relaxed"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              handleFormSubmit(e);
            }
          }}
        />

        {/* Consolidated Bottom Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2DDD5]/60 text-[10px] font-sans">
          {/* Left Instrument Controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Mode Selector */}
            <select
              value={activeMode}
              onChange={(e) => setActiveMode(e.target.value as ReflectionMode)}
              className="px-2 py-1 bg-[#EFECE6]/60 border border-[#E2DDD5] text-[#2B2A28] uppercase tracking-wider text-[10px] rounded-xs focus:outline-none focus:border-[#C4432B] cursor-pointer"
            >
              <option value="reflection">Reflect</option>
              <option value="summary">Summarize</option>
              <option value="brainstorm">Brainstorm</option>
            </select>

            {/* Headspace Selector Dropdown */}
            <div className="relative" ref={moodMenuRef}>
              <button
                type="button"
                onClick={() => setShowMoodMenu((prev) => !prev)}
                className={`px-2 py-1 border rounded-xs transition-colors flex items-center gap-1 uppercase tracking-wider text-[10px] ${
                  selectedMood
                    ? 'bg-[#C4432B] text-[#F7F4EE] border-[#C4432B]'
                    : 'bg-[#EFECE6]/60 text-[#595652] border-[#E2DDD5] hover:border-[#C4432B]'
                }`}
                title="Select Emotional Headspace"
              >
                <Compass className="w-3 h-3" />
                <span>{selectedMoodObj ? selectedMoodObj.label : 'Headspace'}</span>
                <span className="text-[8px] opacity-60">▾</span>
              </button>

              {showMoodMenu && (
                <div className="absolute left-0 bottom-full mb-1.5 z-40 w-44 bg-[#FFFDF9] border border-[#E2DDD5] shadow-xl p-1.5 rounded-xs space-y-0.5">
                  <span className="text-[9px] font-sans uppercase tracking-widest text-[#8A8478] px-2 py-1 block font-bold border-b border-[#E2DDD5]/60 mb-1">
                    Select Headspace
                  </span>
                  {MOODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedMood(selectedMood === m.id ? null : m.id);
                        setShowMoodMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 text-xs font-serif flex items-center justify-between rounded-xs transition-colors ${
                        selectedMood === m.id ? 'bg-[#C4432B]/10 text-[#C4432B] font-semibold' : 'hover:bg-[#F7F4EE] text-[#2B2A28]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{m.icon}</span>
                        <span>{m.label}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Templates Selector */}
            <div className="relative" ref={templateMenuRef}>
              <button
                type="button"
                onClick={() => setShowTemplates((prev) => !prev)}
                className="px-2 py-1 border border-[#E2DDD5] bg-[#EFECE6]/60 text-[#595652] hover:border-[#C4432B] transition-all rounded-xs flex items-center gap-1 uppercase tracking-wider text-[10px]"
                title="Select Socratic Reflection Template"
              >
                <BookTemplate className="w-3 h-3 text-[#C4432B]" />
                <span>Templates</span>
                <span className="text-[8px] opacity-60">▾</span>
              </button>

              {showTemplates && (
                <div className="absolute left-0 bottom-full mb-1.5 z-40 w-56 bg-[#FFFDF9] border border-[#E2DDD5] shadow-xl p-1.5 rounded-xs space-y-0.5">
                  <span className="text-[9px] font-sans uppercase tracking-widest text-[#8A8478] px-2 py-1 block font-bold border-b border-[#E2DDD5]/60 mb-1">
                    Socratic Templates
                  </span>
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.name}
                      type="button"
                      onClick={() => {
                        setPromptInput(tmpl.content);
                        setShowTemplates(false);
                        setTimeout(() => textareaRef?.current?.focus(), 50);
                      }}
                      className="w-full text-left text-xs font-serif p-1.5 hover:bg-[#F7F4EE] text-[#2B2A28] transition-colors rounded-xs border-l-2 border-l-transparent hover:border-l-[#C4432B]"
                    >
                      {tmpl.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dictation Button */}
            <button
              type="button"
              onClick={handleToggleDictation}
              disabled={isGenerating || isDepthLimitReached}
              title={isListening ? 'Stop audio dictation' : 'Start audio dictation'}
              className={`p-1.5 rounded-xs border transition-colors flex items-center gap-1 uppercase tracking-wider text-[10px] ${
                isListening
                  ? 'bg-[#C4432B] text-[#F7F4EE] border-[#C4432B]'
                  : 'bg-[#EFECE6]/60 text-[#595652] border-[#E2DDD5] hover:border-[#C4432B]'
              }`}
            >
              {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              <span className="hidden sm:inline">{isListening ? 'Stop' : 'Dictate'}</span>
            </button>

            {/* Zen Mode Button */}
            {onOpenZenMode && (
              <button
                type="button"
                onClick={onOpenZenMode}
                className="px-2 py-1 border border-[#E2DDD5] bg-[#EFECE6]/60 text-[#595652] hover:border-[#C4432B] transition-all rounded-xs flex items-center gap-1 uppercase tracking-wider text-[10px]"
                title="Enter Distraction-Free Zen Studio"
              >
                <Maximize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Zen</span>
              </button>
            )}
          </div>

          {/* Right: Submit Button & Hint */}
          <div className="flex items-center gap-3 ml-auto">
            <span className="hidden md:inline tracking-wider text-[#8A8478] text-[9px]">
              <kbd className="px-1 py-0.5 border border-[#E2DDD5] bg-[#EFECE6] font-mono">⌘ + Enter</kbd>
            </span>

            <InteractiveButton
              id="submit-inquiry-btn"
              type="submit"
              disabled={isGenerating || !promptInput.trim() || isDepthLimitReached}
              className="px-5 py-2 font-semibold active:scale-[0.99] rounded-sm text-[10px] uppercase tracking-[0.18em]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-[#F7F4EE]" />
                  <span>Reflecting…</span>
                </>
              ) : (
                <>
                  <span>Reflect →</span>
                </>
              )}
            </InteractiveButton>
          </div>
        </div>
      </form>
    </div>
  );
};


