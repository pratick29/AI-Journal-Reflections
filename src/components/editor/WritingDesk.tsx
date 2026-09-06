import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Loader2, Mic, MicOff, Maximize2, BookTemplate, Compass, X, Sparkles, MapPin, Image as ImageIcon, Trash2, Lock, Unlock, Radio, GripHorizontal, ScanLine, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ReflectionMode, PhilosophicalPersona, JournalLocation, AudioMemo } from '../../types';
import { InteractiveButton } from '../common/InteractiveButton';
import { InterlocutorSelector } from '../personas/InterlocutorSelector';
import { scanForThoughtDistortions, DistortionMatch } from './thoughtGrammarEngine';
import { AudioMemoPlayer } from './AudioMemoPlayer';

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
  userTurnCount?: number;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  onOpenZenMode?: () => void;
  selectedPersona?: PhilosophicalPersona;
  onSelectPersona?: (persona: PhilosophicalPersona) => void;
  thoughtGrammarEnabled?: boolean;
  location?: JournalLocation | null;
  onOpenLocationPicker?: () => void;
  attachedImage?: { data: string; mimeType: string; name?: string } | null;
  setAttachedImage?: (img: { data: string; mimeType: string; name?: string } | null) => void;
  audioMemo?: AudioMemo | null;
  onSaveAudioMemo?: (memo: AudioMemo | null) => void;
  isEncrypted?: boolean;
  onToggleEncryption?: () => void;
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
  audioMemo,
  onSaveAudioMemo,
  isEncrypted = false,
  onToggleEncryption,
}) => {
  const isDepthLimitReached = activeMode !== 'cognitive_lens' && userTurnCount >= 15;
  const { user } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [dismissedDistortionId, setDismissedDistortionId] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState<boolean>(false);
  const [isScanningHandwriting, setIsScanningHandwriting] = useState(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('mindscribe_composer_minimized') === 'true';
      } catch (e) {
        return false;
      }
    }
    return false;
  });
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notebookInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mindscribe_composer_minimized', isMinimized ? 'true' : 'false');
      } catch (e) {
        // ignore
      }
    }
  }, [isMinimized]);

  // Resizable Journal Entry Box Height with LocalStorage Memory
  const [composerHeight, setComposerHeight] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('mindscribe_composer_height');
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed) && parsed >= 70 && parsed <= 500) return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    return 100;
  });
  const [isResizingComposer, setIsResizingComposer] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mindscribe_composer_height', composerHeight.toString());
      } catch (e) {
        // ignore
      }
    }
  }, [composerHeight]);

  useEffect(() => {
    if (isResizingComposer) {
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingComposer]);

  const handleComposerResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsResizingComposer(true);
    const startY = e.clientY;
    const startHeight = composerHeight;

    const onPointerMove = (moveEvent: PointerEvent) => {
      // Dragging upward increases height, downward decreases height
      const delta = startY - moveEvent.clientY;
      const newHeight = Math.max(70, Math.min(500, startHeight + delta));
      setComposerHeight(newHeight);
    };

    const onPointerUp = () => {
      setIsResizingComposer(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Audio Voice Memo recording & Concurrent Speech-to-Text streaming state
  const [isRecordingMemo, setIsRecordingMemo] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const recordingSecondsRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const memoRecognitionRef = useRef<ISpeechRecognition | null>(null);
  const promptInputRef = useRef(promptInput);
  useEffect(() => {
    promptInputRef.current = promptInput;
  }, [promptInput]);

  // Audio recording handlers with Real-Time Streaming Speech-to-Text
  const startRecordingMemo = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Audio recording is not supported in this browser environment.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          if (base64Data && onSaveAudioMemo) {
            onSaveAudioMemo({
              id: `memo_${Date.now()}`,
              audioData: base64Data,
              durationSeconds: recordingSecondsRef.current || 1,
              mimeType,
              createdAt: new Date().toISOString(),
            });
          }
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio stream tracks
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      };

      // Concurrent Real-Time Speech-to-Text Recognition
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        try {
          const recognition = new SpeechRecognitionClass();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let finalBatch = '';
            let currentInterim = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcriptPiece = event.results[i][0]?.transcript || '';
              if (event.results[i].isFinal) {
                finalBatch += transcriptPiece + ' ';
              } else {
                currentInterim += transcriptPiece;
              }
            }

            if (finalBatch) {
              const currentPrompt = promptInputRef.current;
              const updated = currentPrompt.trim()
                ? `${currentPrompt.trim()} ${finalBatch.trim()}`
                : finalBatch.trim();
              setPromptInput(updated);
            }
            setInterimTranscript(currentInterim);
          };

          recognition.onerror = (err: any) => {
            console.warn('[Real-Time Voice STT] Speech recognition warning:', err?.error || err);
          };

          recognition.onend = () => {
            // Keep interim cleared on stop
            setInterimTranscript('');
          };

          memoRecognitionRef.current = recognition;
          recognition.start();
        } catch (sttErr) {
          console.warn('[Real-Time Voice STT] Could not start concurrent speech recognition:', sttErr);
        }
      }

      recorder.start(250);
      setIsRecordingMemo(true);
      setRecordingSeconds(0);
      setInterimTranscript('');
      recordingSecondsRef.current = 0;

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          const next = prev + 1;
          recordingSecondsRef.current = next;
          if (next >= 300) { // Limit to 5 mins
            stopRecordingMemo();
          }
          return next;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Error starting voice memo recording:', err);
      alert('Unable to access microphone. Please check your browser microphone permissions.');
    }
  };

  const stopRecordingMemo = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (memoRecognitionRef.current) {
      try {
        memoRecognitionRef.current.stop();
      } catch {
        // ignore
      }
      memoRecognitionRef.current = null;
    }
    setInterimTranscript('');

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingMemo(false);
  };

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const formatAudioTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

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
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalBatch = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            finalBatch += piece + ' ';
          } else {
            currentInterim += piece;
          }
        }
        if (finalBatch) {
          const currentPrompt = promptInputRef.current;
          const updated = currentPrompt.trim()
            ? `${currentPrompt.trim()} ${finalBatch.trim()}`
            : finalBatch.trim();
          setPromptInput(updated);
        }
        setInterimTranscript(currentInterim);
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

  const handleNotebookScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, WebP) of your physical notebook page.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('Image size exceeds 15MB limit. Please upload a smaller photo.');
      return;
    }

    setIsScanningHandwriting(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const base64Data = ev.target?.result as string;
        const idToken = user ? await user.getIdToken() : '';

        const response = await fetch('/api/transcribe-handwriting', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with status ${response.status}`);
        }

        const result = await response.json();
        if (result.transcription) {
          setPromptInput(promptInput.trim() ? `${promptInput}\n\n${result.transcription}` : result.transcription);
        } else {
          alert('No legible handwriting could be transcribed from the image. Please try a clearer, well-lit photo.');
        }
      } catch (err: any) {
        console.error('Handwriting transcription failed:', err);
        alert(err.message || 'Error processing handwritten journal page.');
      } finally {
        setIsScanningHandwriting(false);
        if (notebookInputRef.current) {
          notebookInputRef.current.value = '';
        }
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
      className={`bg-[#FFFFFF] dark:bg-[#1C1A18] border border-[#E2DDD5]/90 dark:border-[#332F2A] ${
        isMinimized ? 'p-3 sm:p-3.5 shadow-xs' : 'p-4 sm:p-5 pt-2 sm:pt-2.5 shadow-[0_4px_24px_-4px_rgba(43,42,40,0.06),0_1px_3px_0_rgba(43,42,40,0.03)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]'
      } rounded-2xl relative transition-all duration-200 focus-within:border-[#C4432B]/50 focus-within:shadow-[0_8px_32px_-4px_rgba(196,67,43,0.08),0_1px_3px_0_rgba(43,42,40,0.03)]`}
    >
      {/* Top Drag-to-Resize Handle for Journal Entry Box (Only when expanded) */}
      {!isMinimized && (
        <div
          role="separator"
          aria-orientation="horizontal"
          title="Drag up or down to resize journal entry box (double-click to reset)"
          onPointerDown={handleComposerResizeStart}
          onDoubleClick={() => setComposerHeight(100)}
          className="w-full flex items-center justify-center py-1.5 -mt-1 cursor-row-resize group select-none transition-colors"
        >
          <div
            className={`h-1 rounded-full transition-all group-hover:w-16 group-hover:bg-[#C4432B] ${
              isResizingComposer
                ? 'w-20 bg-[#C4432B]'
                : 'w-10 bg-[#E2DDD5] dark:bg-[#38332D]'
            }`}
          />
        </div>
      )}

      {/* Top Header: Understated Status & Controls */}
      <div className={`flex items-center justify-between ${isMinimized ? '' : 'border-b border-[#E2DDD5]/50 dark:border-[#332F2A] pb-2.5'} text-[10px] font-sans gap-2`}>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#C4432B] shadow-xs shrink-0" />
          <span className="uppercase tracking-[0.2em] font-semibold text-[#2B2A28] dark:text-[#F5F2EB] shrink-0">
            Journal Entry
          </span>
          <span className="tracking-widest text-[#8A8478] dark:text-[#8E877C] bg-[#F7F4EE] dark:bg-[#25221E] px-2 py-0.5 rounded-full font-mono text-[9px] border border-[#E2DDD5]/50 dark:border-[#38332D] shrink-0">
            {userTurnCount}/15
          </span>
          {wordCount > 0 && (
            <span className="text-[#8A8478] dark:text-[#8E877C] tracking-normal font-mono text-[9px] border-l border-[#E2DDD5]/60 dark:border-[#38332D] pl-2 hidden sm:inline truncate">
              {wordCount} {wordCount === 1 ? 'word' : 'words'} · ~{readingTimeMinutes}m read
            </span>
          )}
          {draftRestored && !isMinimized && (
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-mono text-[8px]">
              Draft restored
            </span>
          )}
          {selectedMoodObj && !isMinimized && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#C4432B]/10 dark:bg-[#C4432B]/20 text-[#C4432B] dark:text-[#FF8A73] border border-[#C4432B]/20 dark:border-[#C4432B]/40 rounded-full">
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
          {onOpenLocationPicker && !isMinimized && (
            location ? (
              <button
                type="button"
                onClick={onOpenLocationPicker}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F7F4EE] dark:bg-[#25221E] hover:bg-[#EFECE6] hover:dark:bg-[#2D2823] border border-[#E2DDD5] dark:border-[#38332D] text-[#595652] dark:text-[#C2BCB1] hover:text-[#2B2A28] hover:dark:text-[#F5F2EB] rounded-full transition-colors"
                title={`Location: ${location.name}${location.weather ? ` (${location.weather.tempC}°C, ${location.weather.condition})` : ''}`}
              >
                <MapPin className="w-2.5 h-2.5 text-[#C4432B]" />
                <span className="font-serif italic truncate max-w-[120px]">{location.name}</span>
                {location.weather && (
                  <span className="font-sans text-[8px] text-[#8A8478] dark:text-[#8E877C] border-l border-[#E2DDD5] dark:border-[#38332D] pl-1 ml-0.5">
                    {location.weather.icon} {location.weather.tempC}°C
                  </span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenLocationPicker}
                className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider text-[#8A8478] dark:text-[#8E877C] hover:text-[#C4432B] transition-colors border border-transparent hover:border-[#E2DDD5] dark:hover:border-[#38332D] px-2 py-0.5 rounded-full"
                title="Add location to this entry"
              >
                <MapPin className="w-2.5 h-2.5 text-[#8A8478] dark:text-[#8E877C]" />
                <span>Add Location</span>
              </button>
            )
          )}
          {isMinimized && promptInput.trim() && (
            <span className="text-[#8A8478] dark:text-[#8E877C] font-serif italic truncate max-w-[200px] sm:max-w-[340px] text-xs">
              "{promptInput.trim()}"
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isListening ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#C4432B] font-medium animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#C4432B]" />
              Listening...
            </span>
          ) : (
            !isMinimized && (
              <span className="font-script text-[#C4432B] text-base font-normal hidden xs:inline">
                take your time...
              </span>
            )
          )}

          {/* Minimize / Expand Toggle Button */}
          <button
            type="button"
            onClick={() => {
              const next = !isMinimized;
              setIsMinimized(next);
              if (!next) {
                setTimeout(() => textareaRef.current?.focus(), 50);
              }
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#E2DDD5] dark:border-[#38332D] bg-[#F7F4EE]/90 dark:bg-[#25221E] hover:bg-[#EFECE6] hover:dark:bg-[#2C2823] hover:border-[#C4432B] text-[#595652] dark:text-[#C2BCB1] hover:text-[#2B2A28] hover:dark:text-[#F5F2EB] transition-all text-[9px] uppercase tracking-wider shadow-2xs font-medium cursor-pointer"
            title={isMinimized ? 'Expand writing desk to write' : 'Minimize writing desk to view response'}
          >
            {isMinimized ? (
              <>
                <ChevronUp className="w-3 h-3 text-[#C4432B]" />
                <span>Expand Desk</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 text-[#8A8478] dark:text-[#8E877C]" />
                <span>Minimize</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Manuscript Input Form (Collapsible) */}
      {!isMinimized && (
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
          style={{ height: `${composerHeight}px` }}
          className="w-full bg-transparent text-base font-serif text-[#2B2A28] dark:text-[#F5F2EB] placeholder-[#8A8478]/60 dark:placeholder-[#7A746B] focus:outline-none resize-y min-h-[70px] max-h-[500px] leading-relaxed px-1"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              handleFormSubmit(e);
            }
          }}
        />

        {/* Real-time Handwriting Scanner Banner */}
        {isScanningHandwriting && (
          <div className="bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-200 animate-pulse font-sans">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Transcribing handwriting from physical notebook via Google Gemini Vision...</span>
          </div>
        )}

        {/* Attached Photo Preview */}
        {attachedImage && (
          <div className="relative inline-flex items-center gap-2 p-2 pr-3 bg-[#F7F4EE] dark:bg-[#25221E] border border-[#E2DDD5] dark:border-[#38332D] rounded-xl shadow-xs">
            <img
              src={attachedImage.data}
              alt="Attached photo"
              className="w-12 h-12 object-cover rounded-lg border border-[#E2DDD5] dark:border-[#38332D]"
            />
            <div className="text-[10px] font-sans">
              <span className="font-bold text-[#C4432B] uppercase tracking-wider block">Attached Photo</span>
              <span className="text-[#8A8478] dark:text-[#8E877C] truncate max-w-[150px] block">{attachedImage.name || 'Photo attached'}</span>
            </div>
            {setAttachedImage && (
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="p-1 hover:bg-[#EFECE6] hover:dark:bg-[#2D2823] text-[#8A8478] dark:text-[#8E877C] hover:text-[#C4432B] rounded-full ml-1 transition-colors"
                title="Remove photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Real-time Thought Grammar Hint Banner */}
        {activeDistortion && (
          <div className="bg-[#FFFDF9] dark:bg-[#22201C] border border-[#E2DDD5] dark:border-[#38332D] border-l-3 border-l-[#C4432B] px-3.5 py-2 rounded-xl flex items-center justify-between text-[11px] font-serif text-[#595652] dark:text-[#C8C2B5] shadow-xs animate-in fade-in duration-150">
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
              className="text-[#8A8478] dark:text-[#8E877C] hover:text-[#2B2A28] dark:hover:text-[#F5F2EB] text-[9px] font-sans uppercase tracking-wider ml-2 shrink-0 p-1 rounded-full hover:bg-[#F4F0E8] dark:hover:bg-[#2A2621]"
              title="Dismiss hint"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Live Standalone Speech-to-Text Dictation Bar with Interim Streaming Preview */}
        {isListening && !isRecordingMemo && (
          <div className="bg-[#C4432B]/10 dark:bg-[#C4432B]/20 border border-[#C4432B]/30 p-3 rounded-xl space-y-1.5 text-xs text-[#C4432B] dark:text-[#FF8A73]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C4432B] animate-ping shrink-0" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">Real-Time Voice Dictation</span>
                <div className="flex items-center gap-0.5 ml-2 h-3">
                  <span className="w-1 bg-[#C4432B] rounded-full animate-[bounce_0.8s_infinite] h-2" />
                  <span className="w-1 bg-[#C4432B] rounded-full animate-[bounce_0.6s_infinite] h-3" />
                  <span className="w-1 bg-[#C4432B] rounded-full animate-[bounce_0.9s_infinite] h-2.5" />
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleDictation}
                className="px-2.5 py-0.5 bg-[#C4432B] text-white rounded-md text-[10px] font-sans uppercase tracking-wider transition-colors cursor-pointer"
              >
                Stop
              </button>
            </div>
            <div className="pt-0.5 text-[11px] font-serif italic text-[#4A4640] dark:text-[#E6E0D5] leading-relaxed">
              {interimTranscript ? `"${interimTranscript}..."` : 'Listening... Speak naturally to stream words into your manuscript.'}
            </div>
          </div>
        )}

        {/* Live Audio Voice Memo Recording Bar with Real-Time Waveform & Interim Transcription */}
        {isRecordingMemo && (
          <div className="bg-red-500/10 dark:bg-red-950/30 border border-red-500/30 dark:border-red-800/40 p-3.5 rounded-xl space-y-2 text-xs text-red-700 dark:text-red-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
                <span className="font-semibold uppercase tracking-wider text-[10px] text-red-600 dark:text-red-400">Recording Voice Memo:</span>
                <span className="font-bold">{formatAudioTime(recordingSeconds)}</span>

                {/* Animated Equalizer Waveform Bars */}
                <div className="flex items-center gap-0.5 ml-2 h-3.5">
                  <span className="w-1 bg-red-500 dark:bg-red-400 rounded-full animate-[bounce_0.8s_infinite] h-2" />
                  <span className="w-1 bg-red-600 dark:bg-red-400 rounded-full animate-[bounce_0.6s_infinite] h-3.5" />
                  <span className="w-1 bg-red-500 dark:bg-red-400 rounded-full animate-[bounce_0.9s_infinite] h-2.5" />
                  <span className="w-1 bg-red-600 dark:bg-red-400 rounded-full animate-[bounce_0.7s_infinite] h-3" />
                  <span className="w-1 bg-red-500 dark:bg-red-400 rounded-full animate-[bounce_1.0s_infinite] h-1.5" />
                </div>
              </div>
              <button
                type="button"
                onClick={stopRecordingMemo}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                Stop &amp; Save Memo
              </button>
            </div>

            {/* Live Streaming Interim Transcript */}
            <div className="pt-1 border-t border-red-500/20 dark:border-red-900/40 text-[11px] font-serif flex items-start gap-1.5">
              <span className="font-sans text-[9px] uppercase tracking-wider font-bold text-red-600 dark:text-red-400 shrink-0 mt-0.5">
                Live Speech:
              </span>
              <span className="italic text-[#4A4640] dark:text-[#E6E0D5] leading-relaxed">
                {interimTranscript ? `"${interimTranscript}..."` : 'Streaming transcription directly into manuscript as you speak...'}
              </span>
            </div>
          </div>
        )}

        {/* Existing Audio Voice Memo Preview */}
        {audioMemo && !isRecordingMemo && (
          <div className="pt-1">
            <AudioMemoPlayer
              audioMemo={audioMemo}
              onDelete={() => onSaveAudioMemo && onSaveAudioMemo(null)}
            />
          </div>
        )}

        {/* Consolidated Bottom Toolbar: Balanced Left & Right */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-[#E2DDD5]/50 dark:border-[#332F2A] text-[10px] font-sans">
          {/* Left Side: Thought Framework (Mode, Guide, Mood, Prompts) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Mode Selector */}
            <select
              value={activeMode}
              onChange={(e) => setActiveMode(e.target.value as ReflectionMode)}
              className="px-2.5 py-1.5 bg-[#F7F4EE]/80 dark:bg-[#25221E] border border-[#E2DDD5] dark:border-[#38332D] hover:border-[#C4432B]/40 text-[#2B2A28] dark:text-[#DDD8CE] uppercase tracking-wider text-[10px] rounded-full focus:outline-none focus:border-[#C4432B] cursor-pointer transition-colors shadow-2xs"
            >
              <option value="reflection" className="dark:bg-[#1C1A18] dark:text-[#F5F2EB]">Reflect</option>
              <option value="summary" className="dark:bg-[#1C1A18] dark:text-[#F5F2EB]">Summarize</option>
              <option value="brainstorm" className="dark:bg-[#1C1A18] dark:text-[#F5F2EB]">Brainstorm</option>
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
                    : 'bg-[#F7F4EE]/80 dark:bg-[#25221E] text-[#595652] dark:text-[#DDD8CE] border-[#E2DDD5] dark:border-[#38332D] hover:border-[#C4432B] hover:text-[#2B2A28] hover:dark:text-[#FFFFFF]'
                }`}
                title="Select Mood"
              >
                <Compass className="w-3 h-3" />
                <span>{selectedMoodObj ? selectedMoodObj.label : 'Mood'}</span>
                <span className="text-[8px] opacity-60">▾</span>
              </button>

              {showMoodMenu && (
                <div className="absolute left-0 bottom-full mb-2 z-40 w-48 bg-[#FFFFFF] dark:bg-[#1C1A18] border border-[#E2DDD5] dark:border-[#332F2A] shadow-xl p-1.5 rounded-xl space-y-0.5 animate-in fade-in duration-100">
                  <span className="text-[9px] font-sans uppercase tracking-widest text-[#8A8478] dark:text-[#8E877C] px-2.5 py-1.5 block font-bold border-b border-[#E2DDD5]/50 dark:border-[#332F2A] mb-1">
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
                        selectedMood === m.id
                          ? 'bg-[#C4432B]/10 dark:bg-[#C4432B]/20 text-[#C4432B] dark:text-[#FF8A73] font-semibold'
                          : 'hover:bg-[#F7F4EE] hover:dark:bg-[#26231F] text-[#2B2A28] dark:text-[#DDD8CE]'
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
                className="px-2.5 py-1.5 border border-[#E2DDD5] dark:border-[#38332D] bg-[#F7F4EE]/80 dark:bg-[#25221E] text-[#595652] dark:text-[#DDD8CE] hover:border-[#C4432B] hover:text-[#2B2A28] hover:dark:text-[#FFFFFF] transition-all rounded-full flex items-center gap-1.5 uppercase tracking-wider text-[10px] shadow-2xs"
                title="Writing Prompts & Guides"
              >
                <BookTemplate className="w-3 h-3 text-[#C4432B]" />
                <span>Prompts</span>
                <span className="text-[8px] opacity-60">▾</span>
              </button>

              {showTemplates && (
                <div className="absolute left-0 bottom-full mb-2 z-40 w-60 bg-[#FFFFFF] dark:bg-[#1C1A18] border border-[#E2DDD5] dark:border-[#332F2A] shadow-xl p-1.5 rounded-xl space-y-0.5 animate-in fade-in duration-100">
                  <span className="text-[9px] font-sans uppercase tracking-widest text-[#8A8478] dark:text-[#8E877C] px-2.5 py-1.5 block font-bold border-b border-[#E2DDD5]/50 dark:border-[#332F2A] mb-1">
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
                      className="w-full text-left text-xs font-serif p-2 hover:bg-[#F7F4EE] hover:dark:bg-[#26231F] text-[#2B2A28] dark:text-[#DDD8CE] transition-colors rounded-lg border-l-2 border-l-transparent hover:border-l-[#C4432B]"
                    >
                      {tmpl.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Media, Privacy, Shortcuts & Submit */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap ml-auto">
            {/* Scan Handwritten Notebook Button */}
            <input
              type="file"
              ref={notebookInputRef}
              onChange={handleNotebookScan}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => notebookInputRef.current?.click()}
              disabled={isGenerating || isScanningHandwriting || isDepthLimitReached}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-full border transition-all flex items-center gap-1.5 uppercase tracking-wider text-[10px] shadow-2xs cursor-pointer ${
                isScanningHandwriting
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500 font-medium animate-pulse'
                  : 'bg-[#F7F4EE]/80 dark:bg-[#25221E] text-[#595652] dark:text-[#DDD8CE] border-[#E2DDD5] dark:border-[#38332D] hover:border-[#C4432B] hover:text-[#2B2A28] hover:dark:text-[#FFFFFF]'
              }`}
              title="Scan handwritten notes from a physical notebook"
            >
              {isScanningHandwriting ? (
                <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
              ) : (
                <ScanLine className="w-3 h-3 text-[#C4432B]" />
              )}
              <span className="hidden sm:inline">{isScanningHandwriting ? 'Scanning…' : 'Scan Notes'}</span>
            </button>

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
                  : 'bg-[#F7F4EE]/80 dark:bg-[#25221E] text-[#595652] dark:text-[#DDD8CE] border-[#E2DDD5] dark:border-[#38332D] hover:border-[#C4432B] hover:text-[#2B2A28] hover:dark:text-[#FFFFFF]'
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
                  : 'bg-[#F7F4EE]/80 dark:bg-[#25221E] text-[#595652] dark:text-[#DDD8CE] border-[#E2DDD5] dark:border-[#38332D] hover:border-[#C4432B] hover:text-[#2B2A28] hover:dark:text-[#FFFFFF]'
              }`}
            >
              {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              <span className="hidden sm:inline">{isListening ? 'Stop' : 'Voice'}</span>
            </button>

            {/* Audio Voice Memo Recording Button */}
            <button
              type="button"
              onClick={isRecordingMemo ? stopRecordingMemo : startRecordingMemo}
              disabled={isGenerating || isDepthLimitReached}
              title={isRecordingMemo ? 'Stop audio memo recording' : 'Record voice memo alongside reflection'}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-full border transition-all flex items-center gap-1.5 uppercase tracking-wider text-[10px] shadow-2xs cursor-pointer ${
                isRecordingMemo
                  ? 'bg-red-600 text-white border-red-600 font-medium animate-pulse'
                  : audioMemo
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/50 font-medium'
                  : 'bg-[#F7F4EE]/80 dark:bg-[#25221E] text-[#595652] dark:text-[#DDD8CE] border-[#E2DDD5] dark:border-[#38332D] hover:border-[#C4432B] hover:text-[#2B2A28] hover:dark:text-[#FFFFFF]'
              }`}
            >
              <Radio className="w-3 h-3 text-[#C4432B]" />
              <span className="hidden sm:inline">{isRecordingMemo ? 'Stop Memo' : audioMemo ? 'Memo Added' : 'Memo'}</span>
            </button>

            {/* E2EE Lock Toggle Button */}
            {onToggleEncryption && (
              <button
                type="button"
                onClick={onToggleEncryption}
                title={isEncrypted ? 'Reflection is protected with Zero-Knowledge E2EE' : 'Enable End-to-End Encryption for this entry'}
                className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-full border transition-all flex items-center gap-1.5 uppercase tracking-wider text-[10px] shadow-2xs cursor-pointer ${
                  isEncrypted
                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/60 font-medium'
                    : 'bg-[#F7F4EE]/80 dark:bg-[#25221E] text-[#595652] dark:text-[#DDD8CE] border-[#E2DDD5] dark:border-[#38332D] hover:border-amber-600 hover:text-amber-700 hover:dark:text-amber-300'
                }`}
              >
                {isEncrypted ? <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" /> : <Unlock className="w-3 h-3 opacity-60" />}
                <span className="hidden sm:inline">{isEncrypted ? 'Encrypted' : 'Lock'}</span>
              </button>
            )}

            {/* Zen Mode Button */}
            {onOpenZenMode && (
              <button
                type="button"
                onClick={onOpenZenMode}
                className="px-2.5 py-1.5 border border-[#E2DDD5] dark:border-[#38332D] bg-[#F7F4EE]/80 dark:bg-[#25221E] text-[#595652] dark:text-[#DDD8CE] hover:border-[#C4432B] hover:text-[#2B2A28] hover:dark:text-[#FFFFFF] transition-all rounded-full flex items-center gap-1.5 uppercase tracking-wider text-[10px] shadow-2xs"
                title="Distraction-Free Zen Mode"
              >
                <Maximize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Zen</span>
              </button>
            )}

            {/* Shortcut Hint */}
            <span className="hidden xl:inline tracking-wider text-[#8A8478] dark:text-[#8E877C] text-[9px] ml-1">
              <kbd className="px-1.5 py-0.5 border border-[#E2DDD5] dark:border-[#38332D] bg-[#F7F4EE] dark:bg-[#25221E] font-mono rounded-md shadow-2xs">⌘ + Enter</kbd>
            </span>

            {/* Submit Action Button */}
            <InteractiveButton
              id="submit-inquiry-btn"
              type="submit"
              disabled={isGenerating || !promptInput.trim() || isDepthLimitReached}
              className="px-5 py-2.5 font-semibold active:scale-[0.98] rounded-full text-[10px] uppercase tracking-[0.2em] shadow-sm hover:shadow-md transition-all ml-1"
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
      )}
    </div>
  );
};


