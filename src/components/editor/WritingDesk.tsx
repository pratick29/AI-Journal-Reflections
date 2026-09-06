import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Loader2, Mic, MicOff, Maximize2, BookTemplate, Compass, X, Sparkles, MapPin, Image as ImageIcon, Trash2 } from 'lucide-react';
import { ReflectionMode, PhilosophicalPersona, JournalLocation } from '../../types';
import { InteractiveButton } from '../common/InteractiveButton';
import { InterlocutorSelector } from '../personas/InterlocutorSelector';
import { scanForThoughtDistortions, DistortionMatch } from './thoughtGrammarEngine';

const MOODS = [
  { id: 'equanimity', label: 'Calm & Peaceful', icon: '🌿' },
  { id: 'creative', label: 'Inspired & Energetic', icon: '⚡' },
  { id: 'friction', label: 'Stressed or Anxious', icon: '🌪️' },
  { id: 'curiosity', label: 'Curious & Exploring', icon: '🔍' },
  { id: 'melancholy', label: 'Low or Sad', icon: '🌙' },
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
  selectedPersona?: PhilosophicalPersona;
  onSelectPersona?: (persona: PhilosophicalPersona) => void;
  thoughtGrammarEnabled?: boolean;
  location?: JournalLocation | null;
  onOpenLocationPicker?: () => void;
  attachedImage?: { data: string; mimeType: string; name?: string } | null;
  setAttachedImage?: (img: { data: string; mimeType: string; name?: string } | null) => void;
}

const TEMPLATES = [
  {
    name: 'Evening Reflection',
    content: `1. What went well today?\n\n2. What was stressful or challenging?\n\n3. What is one positive thing I learned from today?`,
  },
  {
    name: 'Two Sides of an Issue',
    content: `• MY VIEW: My current thoughts on this are...\n\n• THE OTHER SIDE: What someone else might see or an alternative view is...\n\n• BALANCED VIEW: Bringing both together, the fairest way to look at this is...`,
  },
  {
    name: 'Question Negative Thoughts',
    content: `• WHAT I'M TELLING MYSELF: What negative thought popped into my head?\n\n• REALITY CHECK: Is this 100% true? What proof do I have against it?\n\n• CALMER THOUGHT: What is a kinder, more realistic way to view this?`,
  },
  {
    name: 'Find the Root Cause',
    content: `1. What is bothering me right now?\n2. Why does this make me feel this way?\n3. Why is that important to me?\n4. What am I really worried about at the root?`,
  },
  {
    name: 'Gratitude & Tomorrow',
    content: `• GRATITUDE 1: One small thing I appreciated today...\n\n• GRATITUDE 2: A person or moment I am thankful for...\n\n• TOMORROW'S FOCUS: The single most important thing I want to do tomorrow...`,
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
  selectedPersona = 'default',
  onSelectPersona,
  thoughtGrammarEnabled = true,
  location,
  onOpenLocationPicker,
  attachedImage,
  setAttachedImage,
}) => {
  const isDepthLimitReached = activeMode !== 'cognitive_lens' && userTurnCount >= 15;
  const [isListening, setIsListening] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [dismissedDistortionId, setDismissedDistortionId] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState<boolean>(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore saved draft on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('journal_desk_draft');
      if (savedDraft && !promptInput.trim()) {
        setPromptInput(savedDraft);
        setDraftRestored(true);
        setTimeout(() => setDraftRestored(false), 3000);
      }
    } catch {
      // ignore
    }
  }, []);

  // Debounced auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (promptInput.trim()) {
          localStorage.setItem('journal_desk_draft', promptInput);
        } else {
          localStorage.removeItem('journal_desk_draft');
        }
      } catch {
        // ignore
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [promptInput]);

  const wordCount = promptInput.trim() ? promptInput.trim().split(/\s+/).length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));

  const distortions = useMemo(() => {
    if (!thoughtGrammarEnabled || !promptInput || isGenerating) return [];
    return scanForThoughtDistortions(promptInput);
  }, [promptInput, thoughtGrammarEnabled, isGenerating]);

  const activeDistortion = distortions.find((d) => d.id !== dismissedDistortionId);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image exceeds 5MB limit. Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl && setAttachedImage) {
        setAttachedImage({
          data: dataUrl,
          mimeType: file.type,
          name: file.name,
        });
      }
    };
    reader.readAsDataURL(file);
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
        try {
          localStorage.removeItem('journal_desk_draft');
        } catch {}
        onSubmitInquiry(e);
      }, 20);
      return;
    }
    try {
      localStorage.removeItem('journal_desk_draft');
    } catch {}
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
    <div
      id="writing-desk"
      className="bg-[#FFFFFF] border border-[#E2DDD5]/90 p-4 sm:p-5 shadow-[0_4px_24px_-4px_rgba(43,42,40,0.06),0_1px_3px_0_rgba(43,42,40,0.03)] space-y-3 rounded-2xl relative transition-all duration-200 focus-within:border-[#C4432B]/50 focus-within:shadow-[0_8px_32px_-4px_rgba(196,67,43,0.08),0_1px_3px_0_rgba(43,42,40,0.03)]"
    >
      {/* Top Header: Understated Status */}
      <div className="flex items-center justify-between border-b border-[#E2DDD5]/50 pb-2.5 text-[10px] font-sans">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-2 h-2 rounded-full bg-[#C4432B] shadow-xs" />
          <span className="uppercase tracking-[0.2em] font-semibold text-[#2B2A28]">
            Journal Entry
          </span>
          <span className="tracking-widest text-[#8A8478] bg-[#F7F4EE] px-2 py-0.5 rounded-full font-mono text-[9px] border border-[#E2DDD5]/50">
            {userTurnCount}/15
          </span>
          {wordCount > 0 && (
            <span className="text-[#8A8478] tracking-normal font-mono text-[9px] border-l border-[#E2DDD5]/60 pl-2">
              {wordCount} {wordCount === 1 ? 'word' : 'words'} · ~{readingTimeMinutes}m read
            </span>
          )}
          {draftRestored && (
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-mono text-[8px]">
              Draft restored
            </span>
          )}
          {selectedMoodObj && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#C4432B]/10 text-[#C4432B] border border-[#C4432B]/20 rounded-full">
              <span>{selectedMoodObj.icon}</span>
              <span className="font-medium">{selectedMoodObj.label}</span>
              <button
                type="button"
                onClick={() => setSelectedMood(null)}
                className="hover:opacity-70 ml-0.5 p-0.5"
                title="Clear mood"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
          {onOpenLocationPicker && (
            location ? (
              <button
                type="button"
                onClick={onOpenLocationPicker}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F7F4EE] hover:bg-[#EFECE6] border border-[#E2DDD5] text-[#595652] hover:text-[#2B2A28] rounded-full transition-colors"
                title={`Location: ${location.name}${location.weather ? ` (${location.weather.tempC}°C, ${location.weather.condition})` : ''}`}
              >
                <MapPin className="w-2.5 h-2.5 text-[#C4432B]" />
                <span className="font-serif italic truncate max-w-[120px]">{location.name}</span>
                {location.weather && (
                  <span className="font-sans text-[8px] text-[#8A8478] border-l border-[#E2DDD5] pl-1 ml-0.5">
                    {location.weather.icon} {location.weather.tempC}°C
                  </span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenLocationPicker}
                className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider text-[#8A8478] hover:text-[#C4432B] transition-colors border border-transparent hover:border-[#E2DDD5] px-2 py-0.5 rounded-full"
                title="Add location to this entry"
              >
                <MapPin className="w-2.5 h-2.5 text-[#8A8478]" />
                <span>Add Location</span>
              </button>
            )
          )}
        </div>

        <div>
          {isListening ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#C4432B] font-medium animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#C4432B]" />
              Listening...
            </span>
          ) : (
            <span className="font-script text-[#C4432B] text-base font-normal hidden xs:inline">
              take your time...
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
              ? 'Limit of 15 messages reached for this entry. Check your Key Insights or start a new entry.'
              : selectedMoodObj
              ? `Writing while feeling ${selectedMoodObj.label.toLowerCase()}...`
              : "What's on your mind? Write freely here..."
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

        {/* Attached Photo Preview */}
        {attachedImage && (
          <div className="relative inline-flex items-center gap-2 p-2 pr-3 bg-[#F7F4EE] border border-[#E2DDD5] rounded-xl shadow-xs">
            <img
              src={attachedImage.data}
              alt="Attached photo"
              className="w-12 h-12 object-cover rounded-lg border border-[#E2DDD5]"
            />
            <div className="text-[10px] font-sans">
              <span className="font-bold text-[#C4432B] uppercase tracking-wider block">Attached Photo</span>
              <span className="text-[#8A8478] truncate max-w-[150px] block">{attachedImage.name || 'Photo attached'}</span>
            </div>
            {setAttachedImage && (
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="p-1 hover:bg-[#EFECE6] text-[#8A8478] hover:text-[#C4432B] rounded-full ml-1 transition-colors"
                title="Remove photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Real-time Thought Grammar Hint Banner */}
        {activeDistortion && (
          <div className="bg-[#FFFDF9] border border-[#E2DDD5] border-l-3 border-l-[#C4432B] px-3.5 py-2 rounded-xl flex items-center justify-between text-[11px] font-serif text-[#595652] shadow-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs">💡</span>
              <span className="font-sans text-[9px] uppercase tracking-wider font-bold text-[#C4432B]">
                {activeDistortion.distortionName}:
              </span>
              <span className="italic">
                "{activeDistortion.reframeQuestion}"
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDismissedDistortionId(activeDistortion.id)}
              className="text-[#8A8478] hover:text-[#2B2A28] text-[9px] font-sans uppercase tracking-wider ml-2 shrink-0 p-1 rounded-full hover:bg-[#F4F0E8]"
              title="Dismiss hint"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Consolidated Bottom Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#E2DDD5]/50 text-[10px] font-sans">
          {/* Left Instrument Controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Mode Selector */}
            <select
              value={activeMode}
              onChange={(e) => setActiveMode(e.target.value as ReflectionMode)}
              className="px-2.5 py-1.5 bg-[#F7F4EE]/80 border border-[#E2DDD5] hover:border-[#C4432B]/40 text-[#2B2A28] uppercase tracking-wider text-[10px] rounded-full focus:outline-none focus:border-[#C4432B] cursor-pointer transition-colors shadow-2xs"
            >
              <option value="reflection">Reflect</option>
              <option value="summary">Summarize</option>
              <option value="brainstorm">Brainstorm</option>
            </select>

            {/* AI Guide Selector */}
            {onSelectPersona && (
              <InterlocutorSelector
                selectedPersona={selectedPersona}
                onSelectPersona={onSelectPersona}
              />
            )}

            {/* Mood Selector Dropdown */}
            <div className="relative" ref={moodMenuRef}>
              <button
                type="button"
                onClick={() => setShowMoodMenu((prev) => !prev)}
                className={`px-2.5 py-1.5 border rounded-full transition-all flex items-center gap-1.5 uppercase tracking-wider text-[10px] shadow-2xs ${
                  selectedMood
                    ? 'bg-[#C4432B] text-[#F7F4EE] border-[#C4432B] font-medium'
                    : 'bg-[#F7F4EE]/80 text-[#595652] border-[#E2DDD5] hover:border-[#C4432B] hover:text-[#2B2A28]'
                }`}
                title="Select Mood"
              >
                <Compass className="w-3 h-3" />
                <span>{selectedMoodObj ? selectedMoodObj.label : 'Mood'}</span>
                <span className="text-[8px] opacity-60">▾</span>
              </button>

              {showMoodMenu && (
                <div className="absolute left-0 bottom-full mb-2 z-40 w-48 bg-[#FFFFFF] border border-[#E2DDD5] shadow-xl p-1.5 rounded-xl space-y-0.5 animate-in fade-in duration-100">
                  <span className="text-[9px] font-sans uppercase tracking-widest text-[#8A8478] px-2.5 py-1.5 block font-bold border-b border-[#E2DDD5]/50 mb-1">
                    How are you feeling?
                  </span>
                  {MOODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedMood(selectedMood === m.id ? null : m.id);
                        setShowMoodMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 text-xs font-serif flex items-center justify-between rounded-lg transition-colors ${
                        selectedMood === m.id ? 'bg-[#C4432B]/10 text-[#C4432B] font-semibold' : 'hover:bg-[#F7F4EE] text-[#2B2A28]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{m.icon}</span>
                        <span>{m.label}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Prompts Selector */}
            <div className="relative" ref={templateMenuRef}>
              <button
                type="button"
                onClick={() => setShowTemplates((prev) => !prev)}
                className="px-2.5 py-1.5 border border-[#E2DDD5] bg-[#F7F4EE]/80 text-[#595652] hover:border-[#C4432B] hover:text-[#2B2A28] transition-all rounded-full flex items-center gap-1.5 uppercase tracking-wider text-[10px] shadow-2xs"
                title="Writing Prompts & Guides"
              >
                <BookTemplate className="w-3 h-3 text-[#C4432B]" />
                <span>Prompts</span>
                <span className="text-[8px] opacity-60">▾</span>
              </button>

              {showTemplates && (
                <div className="absolute left-0 bottom-full mb-2 z-40 w-60 bg-[#FFFFFF] border border-[#E2DDD5] shadow-xl p-1.5 rounded-xl space-y-0.5 animate-in fade-in duration-100">
                  <span className="text-[9px] font-sans uppercase tracking-widest text-[#8A8478] px-2.5 py-1.5 block font-bold border-b border-[#E2DDD5]/50 mb-1">
                    Starter Prompts
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
                      className="w-full text-left text-xs font-serif p-2 hover:bg-[#F7F4EE] text-[#2B2A28] transition-colors rounded-lg border-l-2 border-l-transparent hover:border-l-[#C4432B]"
                    >
                      {tmpl.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Photo / Visual Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating || isDepthLimitReached}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-full border transition-all flex items-center gap-1.5 uppercase tracking-wider text-[10px] shadow-2xs ${
                attachedImage
                  ? 'bg-[#C4432B]/15 text-[#C4432B] border-[#C4432B] font-medium'
                  : 'bg-[#F7F4EE]/80 text-[#595652] border-[#E2DDD5] hover:border-[#C4432B] hover:text-[#2B2A28]'
              }`}
              title="Attach a photo to your entry"
            >
              <ImageIcon className="w-3 h-3 text-[#C4432B]" />
              <span className="hidden sm:inline">{attachedImage ? 'Photo Added' : 'Photo'}</span>
            </button>

            {/* Dictation Button */}
            <button
              type="button"
              onClick={handleToggleDictation}
              disabled={isGenerating || isDepthLimitReached}
              title={isListening ? 'Stop voice recording' : 'Voice dictation'}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-full border transition-all flex items-center gap-1.5 uppercase tracking-wider text-[10px] shadow-2xs ${
                isListening
                  ? 'bg-[#C4432B] text-[#F7F4EE] border-[#C4432B] font-medium animate-pulse'
                  : 'bg-[#F7F4EE]/80 text-[#595652] border-[#E2DDD5] hover:border-[#C4432B] hover:text-[#2B2A28]'
              }`}
            >
              {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              <span className="hidden sm:inline">{isListening ? 'Stop' : 'Voice'}</span>
            </button>

            {/* Zen Mode Button */}
            {onOpenZenMode && (
              <button
                type="button"
                onClick={onOpenZenMode}
                className="px-2.5 py-1.5 border border-[#E2DDD5] bg-[#F7F4EE]/80 text-[#595652] hover:border-[#C4432B] hover:text-[#2B2A28] transition-all rounded-full flex items-center gap-1.5 uppercase tracking-wider text-[10px] shadow-2xs"
                title="Distraction-Free Zen Mode"
              >
                <Maximize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Zen</span>
              </button>
            )}
          </div>

          {/* Right: Submit Button & Hint */}
          <div className="flex items-center gap-3 ml-auto">
            <span className="hidden md:inline tracking-wider text-[#8A8478] text-[9px]">
              <kbd className="px-1.5 py-0.5 border border-[#E2DDD5] bg-[#F7F4EE] font-mono rounded-md shadow-2xs">⌘ + Enter</kbd>
            </span>

            <InteractiveButton
              id="submit-inquiry-btn"
              type="submit"
              disabled={isGenerating || !promptInput.trim() || isDepthLimitReached}
              className="px-5 py-2.5 font-semibold active:scale-[0.98] rounded-full text-[10px] uppercase tracking-[0.2em] shadow-sm hover:shadow-md transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-[#F7F4EE]" />
                  <span>Thinking…</span>
                </>
              ) : (
                <>
                  <span>Send Entry →</span>
                </>
              )}
            </InteractiveButton>
          </div>
        </div>
      </form>
    </div>
  );
};


