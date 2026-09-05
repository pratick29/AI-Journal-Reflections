import React, { useState, useEffect, useRef } from 'react';
import { Minimize2, Volume2, VolumeX, Feather, Type } from 'lucide-react';

interface ZenModeProps {
  isOpen: boolean;
  onClose: () => void;
  promptInput: string;
  setPromptInput: (value: string) => void;
  onSubmitInquiry: (e: React.FormEvent) => void;
  isGenerating: boolean;
}

export const ZenMode: React.FC<ZenModeProps> = ({
  isOpen,
  onClose,
  promptInput,
  setPromptInput,
  onSubmitInquiry,
  isGenerating,
}) => {
  const [controlsVisible, setControlsVisible] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Typewriter audio click synthesis via Web Audio API
  const playTypewriterKeySound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300 + Math.random() * 200, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.04);
    } catch {
      // AudioContext fallback
    }
  };

  // Mouse activity auto-hide controls after 3 seconds
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseMove = () => {
      setControlsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isOpen]);

  // Keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const wordCount = promptInput.trim() ? promptInput.trim().split(/\s+/).length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const fontSizeClasses = {
    sm: 'text-lg leading-relaxed max-w-xl',
    md: 'text-xl leading-relaxed max-w-2xl',
    lg: 'text-2xl leading-loose max-w-3xl',
    xl: 'text-3xl leading-loose max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F7F4EE] text-[#2B2A28] font-serif flex flex-col justify-between p-6 sm:p-12 overflow-hidden paper-texture">
      {/* Top Controls Bar (Fades out when typing) */}
      <div
        className={`flex items-center justify-between transition-opacity duration-500 border-b border-[#E2DDD5] pb-4 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <Feather className="w-5 h-5 text-[#C4432B]" />
          <span className="text-[10px] font-sans uppercase tracking-[0.25em] font-bold text-[#C4432B]">
            Zen Writing Studio
          </span>
          <span className="text-[10px] font-sans uppercase tracking-widest text-[#8A8478] hidden sm:inline">
            Press Esc to return
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`p-2 border rounded-xs transition-colors text-xs font-sans uppercase tracking-wider flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-[#C4432B] text-[#F7F4EE] border-[#C4432B]'
                : 'bg-[#FFFDF9] text-[#595652] border-[#E2DDD5] hover:border-[#C4432B]'
            }`}
            title="Toggle Typewriter Sound Effects"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Typewriter On' : 'Typewriter Muted'}</span>
          </button>

          {/* Font Size Selector */}
          <div className="flex items-center border border-[#E2DDD5] bg-[#FFFDF9] p-0.5 rounded-xs">
            {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`px-2.5 py-1 text-[10px] font-sans uppercase transition-colors ${
                  fontSize === size ? 'bg-[#2B2A28] text-[#F7F4EE] font-bold' : 'text-[#595652] hover:text-[#2B2A28]'
                }`}
              >
                {size.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Close Zen Mode */}
          <button
            onClick={onClose}
            className="p-2 border border-[#E2DDD5] hover:border-[#C4432B] bg-[#FFFDF9] text-[#2B2A28] transition-colors rounded-xs"
            title="Exit Zen Mode"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Manuscript Textarea */}
      <div className="flex-1 flex items-center justify-center my-6">
        <textarea
          autoFocus
          value={promptInput}
          onChange={(e) => {
            setPromptInput(e.target.value);
            playTypewriterKeySound();
          }}
          placeholder="Begin writing into the quiet..."
          className={`w-full h-full bg-transparent border-none focus:outline-none resize-none font-serif text-[#2B2A28] placeholder-[#8A8478]/50 mx-auto ${fontSizeClasses[fontSize]}`}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              onSubmitInquiry(e);
              onClose();
            }
          }}
        />
      </div>

      {/* Bottom Footer Metrics (Fades out when typing) */}
      <div
        className={`flex items-center justify-between border-t border-[#E2DDD5] pt-4 text-[10px] font-sans uppercase tracking-[0.2em] text-[#8A8478] transition-opacity duration-500 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <span>
          {wordCount} {wordCount === 1 ? 'word' : 'words'} · ~{readingTimeMinutes} min read
        </span>
        <button
          onClick={(e) => {
            onSubmitInquiry(e);
            onClose();
          }}
          disabled={isGenerating || !promptInput.trim()}
          className="px-6 py-2.5 bg-[#2B2A28] text-[#F7F4EE] hover:bg-[#C4432B] disabled:opacity-40 font-semibold transition-all rounded-xs"
        >
          Submit Inquiry (⌘ + Enter) →
        </button>
      </div>
    </div>
  );
};
