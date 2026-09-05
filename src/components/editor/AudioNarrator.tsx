import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';

interface AudioNarratorProps {
  textToRead: string;
}

export const AudioNarrator: React.FC<AudioNarratorProps> = ({ textToRead }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isSupported) return null;

  // Strip markdown tags and clean up text for speech
  const cleanSpokenText = (raw: string) => {
    return raw
      .replace(/#+\s*/g, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/<[^>]*>/g, '')
      .trim();
  };

  const handleTogglePlay = () => {
    if (!window.speechSynthesis) return;

    if (isPlaying) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
      return;
    }

    window.speechSynthesis.cancel();

    const spokenText = cleanSpokenText(textToRead);
    if (!spokenText) return;

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = 0.92; // Slightly measured, contemplative pacing
    utterance.pitch = 0.96; // Warm, grounded pitch

    // Choose the best voice available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Serena'))) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5 bg-[#F4F0E8]/90 border border-[#E2DDD5] px-2 py-0.5 rounded-xs text-[10px] font-sans">
      <button
        type="button"
        onClick={handleTogglePlay}
        className="flex items-center gap-1 text-[#595652] hover:text-[#C4432B] transition-colors"
        title={isPlaying ? (isPaused ? 'Resume spoken narration' : 'Pause spoken narration') : 'Listen to spoken reflection'}
      >
        {isPlaying ? (
          isPaused ? (
            <Play className="w-3 h-3 text-[#C4432B]" />
          ) : (
            <Pause className="w-3 h-3 text-[#C4432B]" />
          )
        ) : (
          <Volume2 className="w-3 h-3 text-[#8A8478]" />
        )}
        <span className="uppercase tracking-wider">
          {isPlaying ? (isPaused ? 'Resume' : 'Narrating') : 'Listen'}
        </span>
      </button>

      {isPlaying && (
        <div className="flex items-center gap-1 pl-1 border-l border-[#E2DDD5]">
          <span className="flex items-end gap-0.5 h-2.5">
            <span className={`w-0.5 bg-[#C4432B] rounded-full animate-pulse ${isPaused ? 'h-1' : 'h-2.5'}`} />
            <span className={`w-0.5 bg-[#C4432B] rounded-full animate-pulse delay-75 ${isPaused ? 'h-1' : 'h-1.5'}`} />
            <span className={`w-0.5 bg-[#C4432B] rounded-full animate-pulse delay-150 ${isPaused ? 'h-1' : 'h-2'}`} />
          </span>
          <button
            type="button"
            onClick={handleStop}
            className="text-[#8A8478] hover:text-[#C4432B] ml-0.5"
            title="Stop narration"
          >
            <VolumeX className="w-2.5 h-2.5" />
          </button>
        </div>
      )}
    </div>
  );
};
