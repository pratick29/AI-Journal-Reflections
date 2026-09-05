import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, CloudRain, Flame, BookOpen, X, Sliders } from 'lucide-react';

interface SoundscapePlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

type SoundTrack = 'none' | 'rain' | 'hearth' | 'library';

export const SoundscapePlayer: React.FC<SoundscapePlayerProps> = ({ isOpen, onClose }) => {
  const [activeTrack, setActiveTrack] = useState<SoundTrack>('none');
  const [volume, setVolume] = useState<number>(0.35);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const noiseSourceRef = useRef<AudioNode | null>(null);
  const crackleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or resume AudioContext
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtxClass();
      gainNodeRef.current = audioCtxRef.current.createGain();
      gainNodeRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
      gainNodeRef.current.connect(audioCtxRef.current.destination);
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Stop active synthesis
  const stopCurrentSound = () => {
    if (crackleTimerRef.current) {
      clearInterval(crackleTimerRef.current);
      crackleTimerRef.current = null;
    }
    if (noiseSourceRef.current) {
      try {
        (noiseSourceRef.current as any).stop?.();
        noiseSourceRef.current.disconnect();
      } catch {
        // cleanup
      }
      noiseSourceRef.current = null;
    }
  };

  // Generate Pink/Brown Noise Buffer for Rain
  const startRainSound = (ctx: AudioContext, masterGain: GainNode) => {
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise integration
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Lowpass filter for muffled windowpane effect
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, ctx.currentTime);

    noise.connect(filter);
    filter.connect(masterGain);
    noise.start();
    noiseSourceRef.current = noise;
  };

  // Generate Hearth Ember Crackle
  const startHearthSound = (ctx: AudioContext, masterGain: GainNode) => {
    // Low rumble base
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(55, ctx.currentTime);

    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.08, ctx.currentTime);
    osc.connect(rumbleGain);
    rumbleGain.connect(masterGain);
    osc.start();
    noiseSourceRef.current = osc;

    // Intermittent crackle clicks
    crackleTimerRef.current = setInterval(() => {
      if (Math.random() > 0.4) {
        try {
          const clickOsc = ctx.createOscillator();
          const clickGain = ctx.createGain();
          clickOsc.type = 'square';
          clickOsc.frequency.setValueAtTime(800 + Math.random() * 1200, ctx.currentTime);
          clickGain.gain.setValueAtTime(0.04 * Math.random(), ctx.currentTime);
          clickGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
          clickOsc.connect(clickGain);
          clickGain.connect(masterGain);
          clickOsc.start();
          clickOsc.stop(ctx.currentTime + 0.03);
        } catch {
          // ignore
        }
      }
    }, 180);
  };

  // Generate Quiet Library Room Tone
  const startLibrarySound = (ctx: AudioContext, masterGain: GainNode) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(80, ctx.currentTime);
    osc2.frequency.setValueAtTime(84, ctx.currentTime); // 4Hz binaural beat for deep calm

    const libGain = ctx.createGain();
    libGain.gain.setValueAtTime(0.05, ctx.currentTime);

    osc1.connect(libGain);
    osc2.connect(libGain);
    libGain.connect(masterGain);

    osc1.start();
    osc2.start();
    noiseSourceRef.current = osc1;
  };

  // Switch sound track
  const handleSelectTrack = (track: SoundTrack) => {
    stopCurrentSound();

    if (track === 'none') {
      setActiveTrack('none');
      return;
    }

    const ctx = getAudioContext();
    if (!gainNodeRef.current) return;

    if (track === 'rain') {
      startRainSound(ctx, gainNodeRef.current);
    } else if (track === 'hearth') {
      startHearthSound(ctx, gainNodeRef.current);
    } else if (track === 'library') {
      startLibrarySound(ctx, gainNodeRef.current);
    }

    setActiveTrack(track);
  };

  // Volume change
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCurrentSound();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B2A28]/60 backdrop-blur-xs p-4">
      <div className="bg-[#FFFDF9] border border-[#E2DDD5] border-t-4 border-t-[#C4432B] max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 rounded-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#C4432B]/10 text-[#C4432B] rounded-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-sans uppercase tracking-[0.22em] font-bold text-[#C4432B]">
                Acoustic Studio
              </span>
              <h2 className="text-xl font-serif text-[#2B2A28] font-light">
                Literary Ambient Soundscapes
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8A8478] hover:text-[#2B2A28] hover:bg-[#EFECE6] transition-colors rounded-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Track Selector Buttons */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-sans uppercase tracking-widest text-[#8A8478] font-bold">
            Select Atmosphere:
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handleSelectTrack(activeTrack === 'rain' ? 'none' : 'rain')}
              className={`p-3.5 border rounded-xs text-left transition-all flex items-center gap-3 ${
                activeTrack === 'rain'
                  ? 'bg-[#2B2A28] text-[#F7F4EE] border-[#2B2A28] shadow-sm'
                  : 'bg-[#F7F4EE] text-[#2B2A28] border-[#E2DDD5] hover:border-[#C4432B]'
              }`}
            >
              <CloudRain className={`w-5 h-5 ${activeTrack === 'rain' ? 'text-[#C4432B]' : 'text-[#8A8478]'}`} />
              <div>
                <p className="text-xs font-sans uppercase tracking-wider font-semibold">Rain on Glass</p>
                <p className="text-[10px] opacity-70 font-serif">Gentle rain acoustics</p>
              </div>
            </button>

            <button
              onClick={() => handleSelectTrack(activeTrack === 'hearth' ? 'none' : 'hearth')}
              className={`p-3.5 border rounded-xs text-left transition-all flex items-center gap-3 ${
                activeTrack === 'hearth'
                  ? 'bg-[#2B2A28] text-[#F7F4EE] border-[#2B2A28] shadow-sm'
                  : 'bg-[#F7F4EE] text-[#2B2A28] border-[#E2DDD5] hover:border-[#C4432B]'
              }`}
            >
              <Flame className={`w-5 h-5 ${activeTrack === 'hearth' ? 'text-[#C4432B]' : 'text-[#8A8478]'}`} />
              <div>
                <p className="text-xs font-sans uppercase tracking-wider font-semibold">Hearth Embers</p>
                <p className="text-[10px] opacity-70 font-serif">Warm fireplace crackle</p>
              </div>
            </button>

            <button
              onClick={() => handleSelectTrack(activeTrack === 'library' ? 'none' : 'library')}
              className={`p-3.5 border rounded-xs text-left transition-all flex items-center gap-3 ${
                activeTrack === 'library'
                  ? 'bg-[#2B2A28] text-[#F7F4EE] border-[#2B2A28] shadow-sm'
                  : 'bg-[#F7F4EE] text-[#2B2A28] border-[#E2DDD5] hover:border-[#C4432B]'
              }`}
            >
              <BookOpen className={`w-5 h-5 ${activeTrack === 'library' ? 'text-[#C4432B]' : 'text-[#8A8478]'}`} />
              <div>
                <p className="text-xs font-sans uppercase tracking-wider font-semibold">Quiet Library</p>
                <p className="text-[10px] opacity-70 font-serif">Deep meditative hum</p>
              </div>
            </button>

            <button
              onClick={() => handleSelectTrack('none')}
              className={`p-3.5 border rounded-xs text-left transition-all flex items-center gap-3 ${
                activeTrack === 'none'
                  ? 'bg-[#2B2A28] text-[#F7F4EE] border-[#2B2A28]'
                  : 'bg-[#F7F4EE] text-[#2B2A28] border-[#E2DDD5] hover:border-[#C4432B]'
              }`}
            >
              <VolumeX className="w-5 h-5 text-[#8A8478]" />
              <div>
                <p className="text-xs font-sans uppercase tracking-wider font-semibold">Mute Audio</p>
                <p className="text-[10px] opacity-70 font-serif">Silent reflection</p>
              </div>
            </button>
          </div>
        </div>

        {/* Volume Slider Control */}
        {activeTrack !== 'none' && (
          <div className="space-y-2 border-t border-[#E2DDD5] pt-4">
            <div className="flex items-center justify-between text-[10px] font-sans uppercase tracking-wider text-[#8A8478]">
              <span>Soundscape Volume</span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-[#C4432B] cursor-pointer"
            />
          </div>
        )}

        {/* Close Button */}
        <div className="border-t border-[#E2DDD5] pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#2B2A28] text-[#F7F4EE] text-xs font-sans uppercase tracking-widest font-semibold hover:bg-[#C4432B] transition-colors rounded-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
