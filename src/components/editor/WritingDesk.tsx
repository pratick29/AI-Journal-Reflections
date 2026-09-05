import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Mic, MicOff, Maximize2, BookTemplate } from 'lucide-react';
import { ReflectionMode } from '../../types';

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

  return (
    <div id="writing-desk" className="bg-[#FFFDF9] border border-[#E2DDD5] border-t-2 border-t-[#C4432B] p-4.5 sm:p-6 shadow-xs space-y-3.5 rounded-xs relative">
      {/* Writing Desk Label & Mode Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#E2DDD5] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#C4432B]" />
          <span className="text-[10px] font-sans uppercase tracking-[0.22em] font-bold text-[#2B2A28]">
            Writing Desk
          </span>
          <span className="text-[10px] font-sans uppercase tracking-widest text-[#8A8478]">
            ({userTurnCount}/15 Inquiries)
          </span>
          {isListening ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#C4432B] font-sans font-medium animate-pulse ml-2">
              <span className="w-2 h-2 rounded-full bg-[#C4432B]" />
              Listening to dictation...
            </span>
          ) : (
            <span className="font-script text-[#C4432B] text-base font-normal ml-2 hidden xs:inline">
              it's about expression...
            </span>
          )}
        </div>

        {/* Mode Selector & Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Templates Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTemplates((prev) => !prev)}
              className="px-2.5 py-1 text-[10px] font-sans uppercase tracking-[0.15em] border border-[#E2DDD5] bg-[#EFECE6]/60 text-[#595652] hover:border-[#C4432B] transition-all rounded-xs flex items-center gap-1"
              title="Select Socratic Reflection Template"
            >
              <BookTemplate className="w-3 h-3 text-[#C4432B]" />
              <span>Templates</span>
            </button>

            {showTemplates && (
              <div className="absolute right-0 top-full mt-1.5 z-40 w-64 bg-[#FFFDF9] border border-[#E2DDD5] shadow-lg p-2 rounded-xs space-y-1">
                <span className="text-[9px] font-sans uppercase tracking-widest text-[#8A8478] px-2 py-1 block font-bold">
                  Socratic Reflection Templates
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
                    className="w-full text-left text-xs font-serif p-2 hover:bg-[#F7F4EE] text-[#2B2A28] transition-colors rounded-xs border-l-2 border-l-transparent hover:border-l-[#C4432B]"
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Zen Mode Button */}
          {onOpenZenMode && (
            <button
              type="button"
              onClick={onOpenZenMode}
              className="px-2.5 py-1 text-[10px] font-sans uppercase tracking-[0.15em] border border-[#E2DDD5] bg-[#EFECE6]/60 text-[#595652] hover:border-[#C4432B] transition-all rounded-xs flex items-center gap-1"
              title="Enter Distraction-Free Zen Writing Studio"
            >
              <Maximize2 className="w-3 h-3 text-[#2B2A28]" />
              <span>Zen Studio</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveMode('reflection')}
            className={`px-3 py-1 text-[10px] font-sans uppercase tracking-[0.15em] border transition-all rounded-xs ${
              activeMode === 'reflection'
                ? 'bg-[#2B2A28] text-[#F7F4EE] border-[#2B2A28] font-semibold'
                : 'bg-[#EFECE6]/60 text-[#595652] border-[#E2DDD5] hover:border-[#C4432B]'
            }`}
          >
            Reflect
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('summary')}
            className={`px-3 py-1 text-[10px] font-sans uppercase tracking-[0.15em] border transition-all rounded-xs ${
              activeMode === 'summary'
                ? 'bg-[#2B2A28] text-[#F7F4EE] border-[#2B2A28] font-semibold'
                : 'bg-[#EFECE6]/60 text-[#595652] border-[#E2DDD5] hover:border-[#C4432B]'
            }`}
          >
            Summarize
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('brainstorm')}
            className={`px-3 py-1 text-[10px] font-sans uppercase tracking-[0.15em] border transition-all rounded-xs ${
              activeMode === 'brainstorm'
                ? 'bg-[#2B2A28] text-[#F7F4EE] border-[#2B2A28] font-semibold'
                : 'bg-[#EFECE6]/60 text-[#595652] border-[#E2DDD5] hover:border-[#C4432B]'
            }`}
          >
            Brainstorm
          </button>
        </div>
      </div>

      {/* Main Manuscript Input Form */}
      <form onSubmit={onSubmitInquiry} className="space-y-3">
        <textarea
          id="manuscript-input"
          ref={textareaRef}
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          disabled={isGenerating || isDepthLimitReached}
          placeholder={
            isDepthLimitReached
              ? 'Dialogue depth limit of 15 inquiries reached. Please distill your reflection using Cognitive Lens or start a new inquiry.'
              : 'Begin with what has been occupying your mind...'
          }
          rows={3}
          className="w-full bg-transparent text-base font-serif text-[#2B2A28] placeholder-[#8A8478] focus:outline-none resize-none leading-relaxed"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              onSubmitInquiry(e);
            }
          }}
        />

        {/* Action Controls & Footer */}
        <div className="flex items-center justify-between pt-2.5 border-t border-[#E2DDD5] text-[10px] font-sans text-[#8A8478]">
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline tracking-wider">
              Press <kbd className="px-1.5 py-0.5 border border-[#E2DDD5] bg-[#EFECE6] font-mono">⌘ + Enter</kbd> to submit
            </span>
            <button
              type="button"
              onClick={handleToggleDictation}
              disabled={isGenerating || isDepthLimitReached}
              title={isListening ? 'Stop audio dictation' : 'Start audio dictation'}
              className={`p-1.5 rounded-xs border transition-colors flex items-center gap-1 text-[10px] uppercase tracking-wider font-sans ${
                isListening
                  ? 'bg-[#C4432B] text-[#F7F4EE] border-[#C4432B]'
                  : 'bg-[#EFECE6]/60 text-[#595652] border-[#E2DDD5] hover:border-[#C4432B]'
              }`}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span className="hidden xs:inline">{isListening ? 'Stop Dictating' : 'Dictate'}</span>
            </button>
          </div>

          <button
            id="submit-inquiry-btn"
            type="submit"
            disabled={isGenerating || !promptInput.trim() || isDepthLimitReached}
            className="inline-flex items-center gap-2 bg-[#2B2A28] text-[#F7F4EE] hover:bg-[#C4432B] disabled:opacity-40 text-[10px] uppercase tracking-[0.2em] px-6 py-2.5 transition-all duration-200 font-semibold active:scale-[0.99] ml-auto rounded-sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F7F4EE]" />
                <span>Reflecting…</span>
              </>
            ) : (
              <>
                <span>Reflect →</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};


