import React, { useState } from 'react';
import { X, Sun, Moon, Sparkles, Check, BookmarkPlus } from 'lucide-react';
import { Interaction } from '../../types';

interface DailyRitualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRitualAsInquiry: (interaction: Interaction) => void;
  userId?: string;
}

const STOIC_MAXIMS = [
  { quote: 'You have power over your mind - not outside events. Realize this, and you will find strength.', author: 'Marcus Aurelius' },
  { quote: 'We suffer more often in imagination than in reality.', author: 'Seneca' },
  { quote: 'Do not seek for things to happen the way you want them to; rather, wish that what happens happens the way it happens: then you will be happy.', author: 'Epictetus' },
  { quote: 'Waste no more time arguing about what a good person should be. Be one.', author: 'Marcus Aurelius' },
  { quote: 'Begin at once to live, and count each separate day as a separate life.', author: 'Seneca' },
  { quote: 'If you are distressed by anything external, the pain is not due to the thing itself, but to your estimate of it.', author: 'Marcus Aurelius' },
];

export const DailyRitualModal: React.FC<DailyRitualModalProps> = ({
  isOpen,
  onClose,
  onSaveRitualAsInquiry,
  userId,
}) => {
  const currentHour = new Date().getHours();
  const defaultTab = currentHour < 14 ? 'morning' : 'evening';
  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>(defaultTab);

  // Morning fields
  const [morningIntention, setMorningIntention] = useState('');
  const [morningFriction, setMorningFriction] = useState('');
  const [maximIndex, setMaximIndex] = useState(0);

  // Evening fields
  const [eveningActions, setEveningActions] = useState('');
  const [eveningFriction, setEveningFriction] = useState('');
  const [eveningGratitude, setEveningGratitude] = useState('');

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const currentMaxim = STOIC_MAXIMS[maximIndex % STOIC_MAXIMS.length];

  const handleSaveMorning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!morningIntention.trim()) return;

    const todayDate = new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const content = `### 🌅 Morning Primer — ${todayDate}\n\n**Core Guiding Intention:**\n${morningIntention}\n\n**Anticipated Friction & Response:**\n${morningFriction || 'Approaching all unexpected delays with patient equanimity.'}\n\n**Anchor Maxim:**\n> "${currentMaxim.quote}"\n> — *${currentMaxim.author}*`;

    const interaction: Interaction = {
      id: `ritual_morning_${Date.now()}`,
      userId: userId || 'guest',
      title: `🌅 Morning Primer: ${todayDate}`,
      category: 'mindfulness',
      summary: `Daily morning intention: ${morningIntention.slice(0, 100)}...`,
      tags: ['DailyRitual', 'MorningPrimer'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg_${Date.now()}`,
          role: 'user',
          content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: `msg_ai_${Date.now()}`,
          role: 'assistant',
          content: `May this intention steady your compass throughout the day. Remember: external currents may shift, but your response remains entirely your own. Step into the day with quiet groundedness.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };

    onSaveRitualAsInquiry(interaction);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleSaveEvening = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eveningActions.trim() && !eveningGratitude.trim()) return;

    const todayDate = new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const content = `### 🌙 Evening Examen — ${todayDate}\n\n**Aligned Actions & Presence:**\n${eveningActions || 'Maintained steady presence through daily tasks.'}\n\n**Emotional Friction Audit & Learning:**\n${eveningFriction || 'Notice when hurry crept in, reminding myself to slow down.'}\n\n**Quiet Grace & Gratitude:**\n${eveningGratitude || 'Grateful for the quiet moments between obligations.'}`;

    const interaction: Interaction = {
      id: `ritual_evening_${Date.now()}`,
      userId: userId || 'guest',
      title: `🌙 Evening Examen: ${todayDate}`,
      category: 'reflection',
      summary: `Evening retrospective audit & gratitude.`,
      tags: ['DailyRitual', 'EveningExamen'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg_${Date.now()}`,
          role: 'user',
          content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: `msg_ai_${Date.now()}`,
          role: 'assistant',
          content: `The ledger of today is closed with honesty and acceptance. What is done is done; what was learned is retained. Rest now in quiet peace.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };

    onSaveRitualAsInquiry(interaction);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1918]/60 backdrop-blur-xs font-serif">
      <div className="bg-[#FFFDF9] border border-[#E2DDD5] shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col rounded-xs overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2DDD5] flex items-center justify-between bg-[#F7F4EE]">
          <div className="flex items-center gap-2">
            <span className="text-xl">{activeTab === 'morning' ? '🌅' : '🌙'}</span>
            <div>
              <h2 className="text-lg font-serif font-medium text-[#2B2A28]">
                Daily Dual Rituals
              </h2>
              <p className="text-[10px] font-sans text-[#8A8478] uppercase tracking-wider">
                Morning Primer & Evening Examen
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex border border-[#E2DDD5] bg-[#EFECE6] p-0.5 rounded-xs text-[10px] font-sans uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setActiveTab('morning')}
                className={`px-3 py-1 rounded-xs flex items-center gap-1 transition-colors ${
                  activeTab === 'morning' ? 'bg-[#2B2A28] text-[#F7F4EE] font-semibold' : 'text-[#595652]'
                }`}
              >
                <Sun className="w-3 h-3 text-amber-500" />
                <span>Morning Primer</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('evening')}
                className={`px-3 py-1 rounded-xs flex items-center gap-1 transition-colors ${
                  activeTab === 'evening' ? 'bg-[#2B2A28] text-[#F7F4EE] font-semibold' : 'text-[#595652]'
                }`}
              >
                <Moon className="w-3 h-3 text-indigo-400" />
                <span>Evening Examen</span>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {savedSuccess ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif text-[#2B2A28]">Ritual Inscribed into Journal</h3>
              <p className="text-xs text-[#8A8478] font-sans">
                Your entry has been saved into your personal archive.
              </p>
            </div>
          ) : activeTab === 'morning' ? (
            <form onSubmit={handleSaveMorning} className="space-y-4">
              {/* Daily Maxim */}
              <div className="bg-[#FBF9F5] border border-[#E2DDD5] p-3.5 rounded-xs space-y-1 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-sans uppercase tracking-widest text-[#C4432B] font-bold">
                    Anchor Maxim for Today
                  </span>
                  <button
                    type="button"
                    onClick={() => setMaximIndex((prev) => prev + 1)}
                    className="text-[9px] font-sans text-[#8A8478] hover:text-[#2B2A28] underline"
                  >
                    Shuffle Maxim ↻
                  </button>
                </div>
                <p className="text-xs font-serif italic text-[#2B2A28]">
                  "{currentMaxim.quote}"
                </p>
                <p className="text-[10px] font-sans text-[#8A8478] text-right">
                  — {currentMaxim.author}
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-sans uppercase tracking-widest text-[#8A8478] mb-1 font-semibold">
                  1. What single posture or intention will I embody today?
                </label>
                <input
                  type="text"
                  required
                  value={morningIntention}
                  onChange={(e) => setMorningIntention(e.target.value)}
                  placeholder="e.g. Calm deliberate focus, patience with colleagues, unhurried presence."
                  className="w-full px-3 py-2 bg-[#FBF9F5] border border-[#E2DDD5] text-sm font-serif focus:outline-none focus:border-[#C4432B]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-sans uppercase tracking-widest text-[#8A8478] mb-1 font-semibold">
                  2. What obstacle or inner friction might arise, and how will I respond?
                </label>
                <textarea
                  rows={3}
                  value={morningFriction}
                  onChange={(e) => setMorningFriction(e.target.value)}
                  placeholder="e.g. When the afternoon deadlines create urgency, I will take three deep breaths before reacting."
                  className="w-full px-3 py-2 bg-[#FBF9F5] border border-[#E2DDD5] text-sm font-serif focus:outline-none focus:border-[#C4432B] resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#2B2A28] hover:bg-[#C4432B] text-[#F7F4EE] text-xs font-sans uppercase tracking-wider font-semibold flex items-center gap-1.5 rounded-xs transition-colors"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>Inscribe Morning Primer →</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSaveEvening} className="space-y-4">
              <div>
                <label className="block text-[10px] font-sans uppercase tracking-widest text-[#8A8478] mb-1 font-semibold">
                  1. Where did I act with presence and alignment today?
                </label>
                <textarea
                  rows={2}
                  value={eveningActions}
                  onChange={(e) => setEveningActions(e.target.value)}
                  placeholder="e.g. Stayed composed during the tense morning discussion."
                  className="w-full px-3 py-2 bg-[#FBF9F5] border border-[#E2DDD5] text-sm font-serif focus:outline-none focus:border-[#C4432B] resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-sans uppercase tracking-widest text-[#8A8478] mb-1 font-semibold">
                  2. Where did I lose composure, and what can I learn without self-criticism?
                </label>
                <textarea
                  rows={2}
                  value={eveningFriction}
                  onChange={(e) => setEveningFriction(e.target.value)}
                  placeholder="e.g. Rushed lunch while looking at emails; next time I will step outside."
                  className="w-full px-3 py-2 bg-[#FBF9F5] border border-[#E2DDD5] text-sm font-serif focus:outline-none focus:border-[#C4432B] resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-sans uppercase tracking-widest text-[#8A8478] mb-1 font-semibold">
                  3. One quiet moment of beauty or grace I am grateful for:
                </label>
                <input
                  type="text"
                  value={eveningGratitude}
                  onChange={(e) => setEveningGratitude(e.target.value)}
                  placeholder="e.g. The late afternoon sunlight filtering through the trees."
                  className="w-full px-3 py-2 bg-[#FBF9F5] border border-[#E2DDD5] text-sm font-serif focus:outline-none focus:border-[#C4432B]"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#2B2A28] hover:bg-[#C4432B] text-[#F7F4EE] text-xs font-sans uppercase tracking-wider font-semibold flex items-center gap-1.5 rounded-xs transition-colors"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>Inscribe Evening Examen →</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
