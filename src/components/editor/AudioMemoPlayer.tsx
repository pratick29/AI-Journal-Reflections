import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Trash2, Volume2, RotateCcw } from 'lucide-react';
import { AudioMemo } from '../../types';

interface AudioMemoPlayerProps {
  audioMemo: AudioMemo;
  onDelete?: () => void;
  readOnly?: boolean;
}

export const AudioMemoPlayer: React.FC<AudioMemoPlayerProps> = ({
  audioMemo,
  onDelete,
  readOnly = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(audioMemo.durationSeconds || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error('Audio playback error:', err);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true));
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-stone-100/90 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/70 rounded-xl shadow-xs transition-all">
      <audio ref={audioRef} src={audioMemo.audioData} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
        title={isPlaying ? 'Pause voice memo' : 'Play voice memo'}
        aria-label={isPlaying ? 'Pause voice memo' : 'Play voice memo'}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
      </button>

      {/* Restart */}
      <button
        type="button"
        onClick={handleRestart}
        className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-700/60 transition-colors cursor-pointer"
        title="Replay from beginning"
        aria-label="Replay from beginning"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      {/* Scrubber & Waveform visual */}
      <div className="flex-1 flex flex-col justify-center min-w-[120px]">
        <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 dark:text-stone-400 mb-1">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Voice Memo</span>
          </span>
          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>

        <div className="relative w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden flex items-center">
          <div
            className="absolute left-0 top-0 bottom-0 bg-amber-600 dark:bg-amber-500 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Seek audio memo"
          />
        </div>
      </div>

      {/* Optional Delete Button */}
      {!readOnly && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 text-stone-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer ml-1"
          title="Remove voice memo"
          aria-label="Remove voice memo"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
