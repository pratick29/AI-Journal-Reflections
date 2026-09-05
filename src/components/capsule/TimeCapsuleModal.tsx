import React, { useState, useEffect } from 'react';
import { X, Lock, Unlock, Clock, Sparkles, Send, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { TimeCapsule, Interaction } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface TimeCapsuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  recentInteractions: Interaction[];
}

export const TimeCapsuleModal: React.FC<TimeCapsuleModalProps> = ({
  isOpen,
  onClose,
  recentInteractions,
}) => {
  const { user } = useAuth();
  const [capsules, setCapsules] = useState<TimeCapsule[]>([]);
  const [activeTab, setActiveTab] = useState<'vault' | 'compose'>('vault');

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [durationDays, setDurationDays] = useState<number>(30);
  const [selectedCapsule, setSelectedCapsule] = useState<TimeCapsule | null>(null);

  // Temporal synthesis state
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisResult, setSynthesisResult] = useState<string | null>(null);

  const storageKey = user?.uid ? `time_capsules_${user.uid}` : 'time_capsules_guest';

  // Load capsules
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setCapsules(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Failed to load capsules:', e);
    }
  }, [isOpen, storageKey]);

  const saveCapsules = (updated: TimeCapsule[]) => {
    setCapsules(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save capsules:', e);
    }
  };

  const handleCreateCapsule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const now = new Date();
    const unlockDate = new Date();
    unlockDate.setDate(now.getDate() + durationDays);

    const newCapsule: TimeCapsule = {
      id: `capsule_${Date.now()}`,
      userId: user?.uid || 'guest',
      title: title.trim(),
      content: content.trim(),
      sealedAt: now.toISOString(),
      unlocksAt: unlockDate.toISOString(),
      isSealed: true,
    };

    saveCapsules([newCapsule, ...capsules]);
    setTitle('');
    setContent('');
    setActiveTab('vault');
  };

  const handleRunTemporalSynthesis = async (capsule: TimeCapsule) => {
    setIsSynthesizing(true);
    setSynthesisResult(null);

    try {
      // Gather recent context
      const recentThemes = recentInteractions
        .slice(0, 5)
        .map((i) => `Title: ${i.title} (${i.createdAt})\nSummary: ${i.summary || i.messages[0]?.content.slice(0, 200)}`)
        .join('\n---\n');

      const synthesisPrompt = `PAST SEALED LETTER (${capsule.sealedAt}):\n"${capsule.content}"\n\nRECENT REFLECTIONS (${new Date().toISOString()}):\n${recentThemes || 'Ongoing daily reflections.'}`;

      const token = user ? await user.getIdToken() : '';
      const response = await fetch('/api/reflect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: synthesisPrompt,
          mode: 'temporal_synthesis',
          history: [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate temporal evolution synthesis.');
      }

      const data = await response.json();
      setSynthesisResult(data.reply);

      // Save synthesis into capsule
      const updated = capsules.map((c) =>
        c.id === capsule.id ? { ...c, temporalSynthesis: data.reply } : c
      );
      saveCapsules(updated);
      setSelectedCapsule({ ...capsule, temporalSynthesis: data.reply });
    } catch (err: any) {
      console.error(err);
      setSynthesisResult('Unable to generate synthesis at this time.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1918]/60 backdrop-blur-xs font-serif">
      <div className="bg-[#FFFDF9] border border-[#E2DDD5] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xs overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2DDD5] flex items-center justify-between bg-[#F7F4EE]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🕯️</span>
            <div>
              <h2 className="text-lg font-serif font-medium text-[#2B2A28]">
                Time Capsule & Future Letters
              </h2>
              <p className="text-[10px] font-sans text-[#8A8478] uppercase tracking-wider">
                Seal your thoughts until the future arrives
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex border border-[#E2DDD5] bg-[#EFECE6] p-0.5 rounded-xs text-[10px] font-sans uppercase tracking-wider">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('vault');
                  setSelectedCapsule(null);
                }}
                className={`px-3 py-1 rounded-xs transition-colors ${
                  activeTab === 'vault' ? 'bg-[#2B2A28] text-[#F7F4EE] font-semibold' : 'text-[#595652]'
                }`}
              >
                Vault ({capsules.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('compose');
                  setSelectedCapsule(null);
                }}
                className={`px-3 py-1 rounded-xs transition-colors ${
                  activeTab === 'compose' ? 'bg-[#2B2A28] text-[#F7F4EE] font-semibold' : 'text-[#595652]'
                }`}
              >
                + Seal New Letter
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 hover:bg-[#EFECE6] text-[#8A8478] hover:text-[#2B2A28] rounded-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
          {activeTab === 'compose' && (
            <form onSubmit={handleCreateCapsule} className="space-y-4">
              <div>
                <label className="block text-[10px] font-sans uppercase tracking-widest text-[#8A8478] mb-1 font-semibold">
                  Letter Title / Destination
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Letter to My Autumn Self on Courage"
                  className="w-full px-3 py-2 bg-[#FBF9F5] border border-[#E2DDD5] text-sm font-serif focus:outline-none focus:border-[#C4432B]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-sans uppercase tracking-widest text-[#8A8478] mb-1 font-semibold">
                  Message to Your Future Self
                </label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What are you currently wrestling with? What do you hope has healed or resolved by the time this letter is unsealed?"
                  className="w-full px-3 py-2 bg-[#FBF9F5] border border-[#E2DDD5] text-sm font-serif focus:outline-none focus:border-[#C4432B] resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-sans uppercase tracking-widest text-[#8A8478] mb-1.5 font-semibold">
                  Sealing Duration
                </label>
                <div className="grid grid-cols-4 gap-2 text-xs font-sans">
                  {[
                    { label: '30 Days', days: 30 },
                    { label: '90 Days', days: 90 },
                    { label: '6 Months', days: 180 },
                    { label: '1 Year', days: 365 },
                  ].map((preset) => (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => setDurationDays(preset.days)}
                      className={`py-2 px-3 border rounded-xs transition-colors text-center ${
                        durationDays === preset.days
                          ? 'bg-[#C4432B] text-[#F7F4EE] border-[#C4432B] font-semibold'
                          : 'bg-[#FBF9F5] text-[#595652] border-[#E2DDD5] hover:border-[#C4432B]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('vault')}
                  className="px-4 py-2 border border-[#E2DDD5] text-[#595652] text-xs font-sans uppercase tracking-wider hover:bg-[#F7F4EE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#2B2A28] hover:bg-[#C4432B] text-[#F7F4EE] text-xs font-sans uppercase tracking-wider font-semibold flex items-center gap-1.5 rounded-xs transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Wax Seal & Deposit →</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'vault' && !selectedCapsule && (
            <div className="space-y-3">
              {capsules.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <span className="text-4xl block">✉️</span>
                  <h3 className="text-lg font-serif text-[#2B2A28]">Your Vault is Currently Empty</h3>
                  <p className="text-xs text-[#8A8478] max-w-sm mx-auto font-sans">
                    Seal your first letter to be opened in 30 days, 6 months, or 1 year. Experience the wonder of speaking across time.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('compose')}
                    className="mt-2 px-4 py-2 bg-[#2B2A28] text-[#F7F4EE] text-xs font-sans uppercase tracking-wider rounded-xs hover:bg-[#C4432B]"
                  >
                    + Compose Sealed Letter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {capsules.map((capsule) => {
                    const unlockDate = new Date(capsule.unlocksAt);
                    const now = new Date();
                    const isUnlocked = now >= unlockDate;
                    const daysRemaining = Math.max(0, Math.ceil((unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

                    return (
                      <div
                        key={capsule.id}
                        onClick={() => setSelectedCapsule(capsule)}
                        className="p-4 bg-[#FBF9F5] border border-[#E2DDD5] hover:border-[#C4432B] transition-all cursor-pointer rounded-xs space-y-2 relative group"
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-2xl">{isUnlocked ? '🔓' : '📜'}</span>
                          <span
                            className={`text-[9px] font-sans uppercase tracking-wider px-2 py-0.5 rounded-xs flex items-center gap-1 ${
                              isUnlocked
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-[#C4432B]/10 text-[#C4432B] border border-[#C4432B]/30'
                            }`}
                          >
                            {isUnlocked ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                            <span>{isUnlocked ? 'Ready to Open' : `${daysRemaining} Days Left`}</span>
                          </span>
                        </div>

                        <div>
                          <h4 className="font-serif font-medium text-sm text-[#2B2A28] line-clamp-1">
                            {capsule.title}
                          </h4>
                          <p className="text-[10px] font-sans text-[#8A8478] mt-0.5">
                            Sealed: {new Date(capsule.sealedAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="pt-1 border-t border-[#E2DDD5]/60 text-[10px] font-sans text-[#595652] flex items-center justify-between">
                          <span>Unlocks: {unlockDate.toLocaleDateString()}</span>
                          <span className="text-[#C4432B] font-semibold group-hover:translate-x-0.5 transition-transform">
                            View →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'vault' && selectedCapsule && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setSelectedCapsule(null)}
                className="text-[10px] font-sans uppercase tracking-wider text-[#8A8478] hover:text-[#2B2A28] flex items-center gap-1"
              >
                ← Back to Vault
              </button>

              {new Date() < new Date(selectedCapsule.unlocksAt) ? (
                // Still locked
                <div className="bg-[#FBF9F5] border-2 border-dashed border-[#E2DDD5] p-8 text-center space-y-4 rounded-xs">
                  <div className="w-16 h-16 rounded-full bg-[#C4432B]/10 border border-[#C4432B]/30 flex items-center justify-center mx-auto text-3xl">
                    🕯️
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-serif text-[#2B2A28]">{selectedCapsule.title}</h3>
                    <p className="text-xs font-sans text-[#8A8478] uppercase tracking-wider">
                      Sealed with Red Wax on {new Date(selectedCapsule.sealedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm font-serif text-[#595652] max-w-md mx-auto italic">
                    "Patience is the companion of wisdom. This letter is resting in the vault and will unseal automatically on{' '}
                    <span className="font-semibold text-[#2B2A28]">
                      {new Date(selectedCapsule.unlocksAt).toLocaleDateString()}
                    </span>
                    ."
                  </p>
                </div>
              ) : (
                // Unlocked
                <div className="space-y-4">
                  <div className="bg-[#FFFFFF] border border-[#E2DDD5] p-6 rounded-xs shadow-xs space-y-3">
                    <div className="border-b border-[#E2DDD5] pb-2 flex items-center justify-between">
                      <h3 className="text-lg font-serif font-medium text-[#2B2A28]">
                        {selectedCapsule.title}
                      </h3>
                      <span className="text-[10px] font-mono text-[#8A8478]">
                        Written on {new Date(selectedCapsule.sealedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="font-serif text-sm text-[#2B2A28] leading-relaxed whitespace-pre-wrap">
                      {selectedCapsule.content}
                    </div>
                  </div>

                  {/* Temporal Evolution Synthesis */}
                  <div className="bg-[#F7F4EE] border border-[#E2DDD5] border-t-2 border-t-[#C4432B] p-5 rounded-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#C4432B]" />
                        <h4 className="font-serif font-medium text-sm text-[#2B2A28]">
                          Gemini Temporal Evolution Synthesis
                        </h4>
                      </div>

                      {!selectedCapsule.temporalSynthesis && (
                        <button
                          type="button"
                          onClick={() => handleRunTemporalSynthesis(selectedCapsule)}
                          disabled={isSynthesizing}
                          className="px-3 py-1 bg-[#2B2A28] hover:bg-[#C4432B] text-[#F7F4EE] text-[10px] font-sans uppercase tracking-wider font-semibold rounded-xs transition-colors flex items-center gap-1.5"
                        >
                          {isSynthesizing ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Synthesizing Evolution…</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3" />
                              <span>Analyze Evolution Over Time</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {selectedCapsule.temporalSynthesis ? (
                      <div className="font-serif text-xs text-[#3D3A36] leading-relaxed whitespace-pre-wrap border-t border-[#E2DDD5] pt-3">
                        {selectedCapsule.temporalSynthesis}
                      </div>
                    ) : (
                      <p className="text-[11px] font-sans text-[#8A8478]">
                        Compare this past letter with your recent journal reflections to reveal how your emotional posture and personal wisdom have transformed.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
