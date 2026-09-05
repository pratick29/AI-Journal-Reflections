import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Award,
  BookOpen,
  Sparkles,
  Sliders,
  Check,
  Heart,
  Plus,
  Trash2,
  Lock,
  Compass,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { AuthorProfile, AuthorWaxSeal, SocraticTone, Interaction, PhilosophicalPersona, WAX_SEALS, SOCRATIC_TONES } from '../../types';
import { useAuth } from '../../context/AuthContext';

export { WAX_SEALS, SOCRATIC_TONES };

interface AuthorSanctuaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AuthorProfile;
  onSaveProfile: (profile: AuthorProfile) => void;
  interactions: Interaction[];
  initialTab?: 'identity' | 'ledger' | 'preferences' | 'grounding';
}

export const AuthorSanctuaryModal: React.FC<AuthorSanctuaryModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  interactions,
  initialTab = 'identity',
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'identity' | 'ledger' | 'preferences' | 'grounding'>(initialTab);

  // Form states
  const [penName, setPenName] = useState(profile.penName);
  const [creed, setCreed] = useState(profile.creed);
  const [waxSeal, setWaxSeal] = useState<AuthorWaxSeal>(profile.waxSeal);
  const [socraticTone, setSocraticTone] = useState<SocraticTone>(profile.socraticTone);
  const [defaultInterlocutor, setDefaultInterlocutor] = useState<PhilosophicalPersona>(profile.defaultInterlocutor);
  const [defaultHeadspace, setDefaultHeadspace] = useState(profile.defaultHeadspace);
  const [lexicon, setLexicon] = useState(profile.lexicon || []);
  const [typographyStyle, setTypographyStyle] = useState(profile.typographyStyle || 'newsreader');

  // New lexicon term input
  const [newTerm, setNewTerm] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Grounding breath pacer state
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [breathCount, setBreathCount] = useState<number>(4);
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setPenName(profile.penName);
      setCreed(profile.creed);
      setWaxSeal(profile.waxSeal);
      setSocraticTone(profile.socraticTone);
      setDefaultInterlocutor(profile.defaultInterlocutor);
      setDefaultHeadspace(profile.defaultHeadspace);
      setLexicon(profile.lexicon || []);
      setTypographyStyle(profile.typographyStyle || 'newsreader');
    }
  }, [isOpen, profile, initialTab]);

  // Grounding breath timer loop
  useEffect(() => {
    if (!isBreathingActive) return;

    const timer = setInterval(() => {
      setBreathCount((prev) => {
        if (prev <= 1) {
          setBreathPhase((currentPhase) => {
            if (currentPhase === 'Inhale') return 'Hold';
            if (currentPhase === 'Hold') return 'Exhale';
            return 'Inhale';
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBreathingActive]);

  if (!isOpen) return null;

  // Cumulative stats calculation
  const totalWords = interactions.reduce((acc, curr) => {
    const text = curr.messages.map((m) => m.content).join(' ');
    return acc + (text ? text.trim().split(/\s+/).length : 0);
  }, 0);

  const totalTurns = interactions.reduce((acc, curr) => acc + curr.messages.length, 0);
  const avgTurnsPerInquiry = interactions.length > 0 ? (totalTurns / interactions.length).toFixed(1) : '0';

  // Laurels logic
  const hasCompletedDeepDialogue = interactions.some((i) => i.messages.length >= 8);
  const hasShadowWork = interactions.some((i) => i.messages.some((m) => m.content.toLowerCase().includes('shadow') || m.content.toLowerCase().includes('friction')));
  const hasStoicEquanimity = interactions.some((i) => i.category === 'reflection' || i.category === 'mindfulness');
  const hasNightReflection = interactions.some((i) => {
    const hour = new Date(i.createdAt).getHours();
    return hour >= 21 || hour <= 4;
  });

  const handleAddLexiconItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim() || !newMeaning.trim()) return;
    setLexicon([...lexicon, { id: `lex_${Date.now()}`, term: newTerm.trim(), meaning: newMeaning.trim() }]);
    setNewTerm('');
    setNewMeaning('');
  };

  const handleRemoveLexiconItem = (id: string) => {
    setLexicon(lexicon.filter((item) => item.id !== id));
  };

  const handleSaveAll = () => {
    const updated: AuthorProfile = {
      penName: penName.trim() || user?.email?.split('@')[0] || 'The Author',
      creed: creed.trim(),
      waxSeal,
      socraticTone,
      defaultInterlocutor,
      defaultHeadspace,
      lexicon,
      typographyStyle,
    };
    onSaveProfile(updated);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  const currentSealObj = WAX_SEALS.find((s) => s.id === waxSeal) || WAX_SEALS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1A1918]/70 backdrop-blur-xs font-serif">
      <div className="bg-[#FFFDF9] border border-[#E2DDD5] border-t-2 border-t-[#C4432B] shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col rounded-xs overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#E2DDD5] flex items-center justify-between bg-[#F7F4EE] shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-1 bg-[#FFFDF9] border border-[#E2DDD5] rounded-xs shadow-2xs">
              {currentSealObj.symbol}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-medium text-[#2B2A28]">
                  {penName || 'Author Sanctuary'}
                </h2>
                <span className="text-[9px] font-sans uppercase tracking-widest px-2 py-0.5 bg-[#C4432B]/10 text-[#C4432B] border border-[#C4432B]/20 rounded-xs font-bold">
                  {currentSealObj.label}
                </span>
              </div>
              <p className="text-[10px] font-sans text-[#8A8478] tracking-wide">
                {user?.email || 'Private Literary Ledger'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAll}
              className="px-3.5 py-1.5 bg-[#2B2A28] hover:bg-[#C4432B] text-[#F7F4EE] text-[10px] font-sans uppercase tracking-wider font-semibold rounded-xs transition-colors flex items-center gap-1.5"
            >
              {isSavedNotice ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{isSavedNotice ? 'Saved!' : 'Save Sanctuary'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#EFECE6] text-[#8A8478] hover:text-[#2B2A28] rounded-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E2DDD5] bg-[#EFECE6]/60 px-6 text-xs font-sans uppercase tracking-[0.18em] overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('identity')}
            className={`py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'identity'
                ? 'border-b-[#C4432B] text-[#2B2A28] font-bold bg-[#FFFDF9]'
                : 'border-b-transparent text-[#595652] hover:text-[#2B2A28]'
            }`}
          >
            <User className="w-3.5 h-3.5 text-[#C4432B]" />
            <span>Identity &amp; Creed</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'ledger'
                ? 'border-b-[#C4432B] text-[#2B2A28] font-bold bg-[#FFFDF9]'
                : 'border-b-transparent text-[#595652] hover:text-[#2B2A28]'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-[#C4432B]" />
            <span>Ledger &amp; Laurels</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'preferences'
                ? 'border-b-[#C4432B] text-[#2B2A28] font-bold bg-[#FFFDF9]'
                : 'border-b-transparent text-[#595652] hover:text-[#2B2A28]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-[#C4432B]" />
            <span>Preferences</span>
          </button>

          <button
            onClick={() => setActiveTab('grounding')}
            className={`py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'grounding'
                ? 'border-b-[#C4432B] text-[#2B2A28] font-bold bg-[#FFFDF9]'
                : 'border-b-transparent text-[#595652] hover:text-[#2B2A28]'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>Grounding Anchor</span>
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#FBF9F5]">
          {/* TAB 1: IDENTITY & CREED */}
          {activeTab === 'identity' && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="space-y-1">
                <label className="block text-[10px] font-sans uppercase tracking-widest text-[#8A8478] font-bold">
                  Author's Pen Name / Moniker
                </label>
                <input
                  type="text"
                  value={penName}
                  onChange={(e) => setPenName(e.target.value)}
                  placeholder="e.g. Marcus Aurelius, or The Stoic Wanderer"
                  className="w-full px-3.5 py-2 bg-[#FFFDF9] border border-[#E2DDD5] text-sm font-serif focus:outline-none focus:border-[#C4432B]"
                />
                <p className="text-[10px] text-[#8A8478] font-sans">
                  This name will be inscribed across your transcripts, book-bound memoirs, and exports.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-sans uppercase tracking-widest text-[#8A8478] font-bold">
                  Personal Guiding Creed / Core Maxim
                </label>
                <textarea
                  rows={2}
                  value={creed}
                  onChange={(e) => setCreed(e.target.value)}
                  placeholder="e.g. Amor Fati — To love whatever life brings forth; Stillness in action."
                  className="w-full px-3.5 py-2 bg-[#FFFDF9] border border-[#E2DDD5] text-sm font-serif focus:outline-none focus:border-[#C4432B] resize-none italic leading-relaxed"
                />
                <p className="text-[10px] text-[#8A8478] font-sans">
                  Gemini weaves your creed into its Socratic questions to align reflections with your core values.
                </p>
              </div>

              {/* Wax Seal Selector */}
              <div className="space-y-2">
                <label className="block text-[10px] font-sans uppercase tracking-widest text-[#8A8478] font-bold">
                  Personal Wax Seal Monogram
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {WAX_SEALS.map((seal) => (
                    <button
                      key={seal.id}
                      type="button"
                      onClick={() => setWaxSeal(seal.id)}
                      className={`p-2.5 rounded-xs border text-left transition-all flex items-start gap-2 ${
                        waxSeal === seal.id
                          ? 'bg-[#C4432B]/10 border-[#C4432B] text-[#2B2A28]'
                          : 'bg-[#FFFDF9] border-[#E2DDD5] hover:border-[#C4432B] text-[#595652]'
                      }`}
                    >
                      <span className="text-xl shrink-0">{seal.symbol}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-serif font-medium">{seal.label}</div>
                        <div className="text-[9px] text-[#8A8478] line-clamp-1">{seal.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Socratic Voice Calibration */}
              <div className="space-y-2">
                <label className="block text-[10px] font-sans uppercase tracking-widest text-[#8A8478] font-bold">
                  Gemini Socratic Voice Calibration
                </label>
                <div className="space-y-1.5">
                  {SOCRATIC_TONES.map((tone) => (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => setSocraticTone(tone.id)}
                      className={`w-full p-2.5 rounded-xs border text-left transition-all flex items-center justify-between ${
                        socraticTone === tone.id
                          ? 'bg-[#C4432B]/10 border-[#C4432B] text-[#2B2A28]'
                          : 'bg-[#FFFDF9] border-[#E2DDD5] hover:border-[#C4432B] text-[#595652]'
                      }`}
                    >
                      <div>
                        <span className="font-serif font-medium text-xs text-[#2B2A28]">
                          {tone.label}
                        </span>
                        <p className="text-[10px] font-sans text-[#8A8478]">{tone.desc}</p>
                      </div>
                      {socraticTone === tone.id && <Check className="w-3.5 h-3.5 text-[#C4432B] shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal Lexicon */}
              <div className="space-y-3 pt-2 border-t border-[#E2DDD5]">
                <div>
                  <h4 className="text-[10px] font-sans uppercase tracking-widest text-[#8A8478] font-bold">
                    Personal Lexicon &amp; Symbol Dictionary
                  </h4>
                  <p className="text-[10px] text-[#8A8478] font-sans">
                    Define personal metaphors, code-words, or recurring projects so Gemini understands your private lore.
                  </p>
                </div>

                <form onSubmit={handleAddLexiconItem} className="flex gap-2">
                  <input
                    type="text"
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    placeholder="Symbol / Term (e.g. 'The Mountain')"
                    className="w-1/3 px-3 py-1.5 bg-[#FFFDF9] border border-[#E2DDD5] text-xs font-serif focus:outline-none focus:border-[#C4432B]"
                  />
                  <input
                    type="text"
                    value={newMeaning}
                    onChange={(e) => setNewMeaning(e.target.value)}
                    placeholder="Personal Meaning (e.g. 'My 2026 marathon challenge')"
                    className="flex-1 px-3 py-1.5 bg-[#FFFDF9] border border-[#E2DDD5] text-xs font-serif focus:outline-none focus:border-[#C4432B]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#2B2A28] text-[#F7F4EE] text-xs uppercase font-sans tracking-wider rounded-xs hover:bg-[#C4432B]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>

                {lexicon.length > 0 && (
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {lexicon.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-[#FFFDF9] border border-[#E2DDD5] text-xs rounded-xs"
                      >
                        <div>
                          <strong className="text-[#2B2A28] font-serif">{item.term}</strong>:
                          <span className="text-[#595652] ml-1.5 font-sans text-[11px]">{item.meaning}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveLexiconItem(item.id)}
                          className="text-[#8A8478] hover:text-[#C4432B] p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LIFETIME LEDGER & LAURELS */}
          {activeTab === 'ledger' && (
            <div className="space-y-6 max-w-xl mx-auto">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#FFFDF9] border border-[#E2DDD5] p-3.5 text-center rounded-xs space-y-1">
                  <span className="text-[9px] font-sans uppercase tracking-widest text-[#8A8478]">Inquiries</span>
                  <div className="text-xl font-serif font-light text-[#2B2A28]">{interactions.length}</div>
                </div>

                <div className="bg-[#FFFDF9] border border-[#E2DDD5] p-3.5 text-center rounded-xs space-y-1">
                  <span className="text-[9px] font-sans uppercase tracking-widest text-[#8A8478]">Words Penned</span>
                  <div className="text-xl font-serif font-light text-[#2B2A28]">{totalWords.toLocaleString()}</div>
                </div>

                <div className="bg-[#FFFDF9] border border-[#E2DDD5] p-3.5 text-center rounded-xs space-y-1">
                  <span className="text-[9px] font-sans uppercase tracking-widest text-[#8A8478]">Avg Depth</span>
                  <div className="text-xl font-serif font-light text-[#2B2A28]">{avgTurnsPerInquiry} <span className="text-xs">turns</span></div>
                </div>

                <div className="bg-[#FFFDF9] border border-[#E2DDD5] p-3.5 text-center rounded-xs space-y-1">
                  <span className="text-[9px] font-sans uppercase tracking-widest text-[#8A8478]">Vault Status</span>
                  <div className="text-xl font-serif font-light text-[#C4432B]">Active</div>
                </div>
              </div>

              {/* Philosophical Alignment Matrix */}
              <div className="bg-[#FFFDF9] border border-[#E2DDD5] p-5 rounded-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-serif font-medium text-[#2B2A28]">
                    Philosophical Alignment Matrix
                  </h4>
                  <span className="text-[9px] font-sans uppercase tracking-widest text-[#8A8478]">
                    Heuristic Resonance
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[10px] font-sans uppercase tracking-wider text-[#595652] mb-1">
                      <span>Stoic Equanimity (Aurelius / Seneca)</span>
                      <span>55%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#EFECE6] rounded-full overflow-hidden">
                      <div className="h-full bg-[#C4432B] rounded-full" style={{ width: '55%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-sans uppercase tracking-wider text-[#595652] mb-1">
                      <span>Existential Agency (de Beauvoir / Sartre)</span>
                      <span>25%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#EFECE6] rounded-full overflow-hidden">
                      <div className="h-full bg-amber-600 rounded-full" style={{ width: '25%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-sans uppercase tracking-wider text-[#595652] mb-1">
                      <span>Zen Non-Dualism (Alan Watts)</span>
                      <span>20%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#EFECE6] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: '20%' }} />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E2DDD5]/60 text-[11px] font-serif text-[#595652] italic">
                  "Your reflections closely mirror Seneca’s Letters to Lucilius on discerning internal sovereignty from external storms."
                </div>
              </div>

              {/* Socratic Laurels */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-sans uppercase tracking-widest text-[#8A8478] font-bold">
                  Socratic Laurels (Mindful Milestones)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className={`p-3 border rounded-xs flex items-center gap-2.5 ${hasCompletedDeepDialogue ? 'bg-[#FFFDF9] border-[#C4432B]/50' : 'bg-[#EFECE6]/40 border-[#E2DDD5] opacity-60'}`}>
                    <span className="text-xl">🌿</span>
                    <div>
                      <div className="text-xs font-serif font-medium text-[#2B2A28]">The Socratic Elenchus</div>
                      <div className="text-[9px] text-[#8A8478] font-sans">Engaged in profound multi-turn dialogue</div>
                    </div>
                  </div>

                  <div className={`p-3 border rounded-xs flex items-center gap-2.5 ${hasShadowWork ? 'bg-[#FFFDF9] border-[#C4432B]/50' : 'bg-[#EFECE6]/40 border-[#E2DDD5] opacity-60'}`}>
                    <span className="text-xl">🕯️</span>
                    <div>
                      <div className="text-xs font-serif font-medium text-[#2B2A28]">The Shadow Worker</div>
                      <div className="text-[9px] text-[#8A8478] font-sans">Confronted inner friction with honesty</div>
                    </div>
                  </div>

                  <div className={`p-3 border rounded-xs flex items-center gap-2.5 ${hasStoicEquanimity ? 'bg-[#FFFDF9] border-[#C4432B]/50' : 'bg-[#EFECE6]/40 border-[#E2DDD5] opacity-60'}`}>
                    <span className="text-xl">🏛️</span>
                    <div>
                      <div className="text-xs font-serif font-medium text-[#2B2A28]">The Stoic Fortress</div>
                      <div className="text-[9px] text-[#8A8478] font-sans">Distinguished control from circumstance</div>
                    </div>
                  </div>

                  <div className={`p-3 border rounded-xs flex items-center gap-2.5 ${hasNightReflection ? 'bg-[#FFFDF9] border-[#C4432B]/50' : 'bg-[#EFECE6]/40 border-[#E2DDD5] opacity-60'}`}>
                    <span className="text-xl">🌙</span>
                    <div>
                      <div className="text-xs font-serif font-medium text-[#2B2A28]">The Twilight Vigil</div>
                      <div className="text-[9px] text-[#8A8478] font-sans">Inscribed reflections in the quiet hours</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STUDIO PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="space-y-1">
                <label className="block text-[10px] font-sans uppercase tracking-widest text-[#8A8478] font-bold">
                  Default Interlocutor (The Lyceum)
                </label>
                <select
                  value={defaultInterlocutor}
                  onChange={(e) => setDefaultInterlocutor(e.target.value as PhilosophicalPersona)}
                  className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#E2DDD5] text-xs font-serif focus:outline-none focus:border-[#C4432B]"
                >
                  <option value="default">The Scribe (Literary Journal Companion)</option>
                  <option value="marcus_aurelius">Marcus Aurelius (Stoic Master &amp; Emperor)</option>
                  <option value="carl_jung">Carl Gustav Jung (Depth Psychologist)</option>
                  <option value="socrates">Socrates (Father of Dialectic)</option>
                  <option value="simone_de_beauvoir">Simone de Beauvoir (Existentialist Ethicist)</option>
                  <option value="alan_watts">Alan Watts (Philosopher of Zen &amp; Tao)</option>
                </select>
                <p className="text-[10px] text-[#8A8478] font-sans">
                  The philosophical companion that will automatically stand ready when starting a new session.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-sans uppercase tracking-widest text-[#8A8478] font-bold">
                  Default Emotional Headspace
                </label>
                <select
                  value={defaultHeadspace}
                  onChange={(e) => setDefaultHeadspace(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#E2DDD5] text-xs font-serif focus:outline-none focus:border-[#C4432B]"
                >
                  <option value="equanimity">🌿 Equanimity</option>
                  <option value="creative">⚡ Creative Fire</option>
                  <option value="friction">🌪️ Inner Friction</option>
                  <option value="curiosity">🔍 Deep Curiosity</option>
                  <option value="melancholy">🌙 Melancholy</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-sans uppercase tracking-widest text-[#8A8478] font-bold">
                  Manuscript Typography Profile
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-serif">
                  {[
                    { id: 'newsreader', label: 'Newsreader', desc: 'Classic Literary Serif' },
                    { id: 'roman', label: 'Classical Roman', desc: 'Imperial Monograph' },
                    { id: 'minimal', label: 'Minimal Sans', desc: 'Modern Clean' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setTypographyStyle(style.id as any)}
                      className={`p-3 border rounded-xs text-left transition-all ${
                        typographyStyle === style.id
                          ? 'bg-[#C4432B]/10 border-[#C4432B] text-[#2B2A28]'
                          : 'bg-[#FFFDF9] border-[#E2DDD5] text-[#595652] hover:border-[#C4432B]'
                      }`}
                    >
                      <div className="font-medium text-xs">{style.label}</div>
                      <div className="text-[9px] text-[#8A8478] font-sans">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GROUNDING ANCHOR */}
          {activeTab === 'grounding' && (
            <div className="space-y-8 max-w-lg mx-auto text-center py-4">
              <div className="space-y-2">
                <span className="text-3xl">🕯️</span>
                <h3 className="text-xl font-serif text-[#2B2A28]">Emergency Grounding Anchor</h3>
                <p className="text-xs text-[#8A8478] font-serif max-w-sm mx-auto">
                  When the mind is racing or overwhelmed, set aside writing. Breathe with the rhythm and anchor yourself in what remains steadfast.
                </p>
              </div>

              {/* Breath Pacer Visualizer */}
              <div className="flex flex-col items-center justify-center space-y-4">
                <div
                  className={`w-36 h-36 rounded-full border-2 border-[#C4432B] flex flex-col items-center justify-center transition-all duration-1000 shadow-xl ${
                    isBreathingActive
                      ? breathPhase === 'Inhale'
                        ? 'scale-110 bg-[#C4432B]/15'
                        : breathPhase === 'Hold'
                        ? 'scale-110 bg-[#C4432B]/25 border-amber-600'
                        : 'scale-90 bg-[#C4432B]/5'
                      : 'bg-[#FFFDF9]'
                  }`}
                >
                  <span className="text-sm font-sans uppercase tracking-[0.2em] text-[#C4432B] font-bold">
                    {isBreathingActive ? breathPhase : 'Ready'}
                  </span>
                  <span className="text-3xl font-mono text-[#2B2A28] font-light">
                    {isBreathingActive ? breathCount : '4s'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBreathingActive(!isBreathingActive)}
                    className="px-5 py-2 bg-[#2B2A28] hover:bg-[#C4432B] text-[#F7F4EE] text-xs font-sans uppercase tracking-wider font-semibold rounded-xs transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    {isBreathingActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isBreathingActive ? 'Pause Breath' : 'Begin Breathing Cycle'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsBreathingActive(false);
                      setBreathPhase('Inhale');
                      setBreathCount(4);
                    }}
                    className="p-2 border border-[#E2DDD5] bg-[#FFFDF9] hover:border-[#2B2A28] text-[#595652] rounded-xs"
                    title="Reset Pacer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Anchor Passage */}
              <div className="bg-[#FFFDF9] border border-[#E2DDD5] border-t-2 border-t-[#C4432B] p-5 rounded-xs space-y-2 text-left">
                <span className="text-[9px] font-sans uppercase tracking-widest text-[#C4432B] font-bold">
                  Timeless Stoic Anchor
                </span>
                <p className="text-xs font-serif text-[#2B2A28] italic leading-relaxed">
                  "Never let the future disturb you. You will meet it, if you have to, with the same weapons of reason which today arm you against the present. Retire into yourself. The rational principle which rules has this nature: it is content with itself when it does what is just, and when it achieves peace thereby."
                </p>
                <div className="text-[10px] font-sans text-[#8A8478] text-right font-medium">
                  — Marcus Aurelius, *Meditations VII.8*
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
