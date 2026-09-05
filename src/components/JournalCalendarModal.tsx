import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Flame, BookOpen, Sparkles, ChevronLeft, ChevronRight, Compass, Copy, Check, TrendingUp, Feather } from 'lucide-react';
import { Interaction } from '../types';

interface JournalCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  interactions: Interaction[];
}

const DAILY_PROMPTS = [
  "What is an unexamined assumption you held today?",
  "Where did you feel friction or anxiety, and what does it reveal?",
  "If today were your entire life in miniature, how well did you live it?",
  "What truth did you avoid expressing or acknowledging today?",
  "What detail of beauty or quiet grace did you notice in the ordinary?",
  "What expectation did you place on someone else that caused disappointment?",
  "What idea or belief are you currently outgrowing?",
];

export const JournalCalendarModal: React.FC<JournalCalendarModalProps> = ({
  isOpen,
  onClose,
  interactions,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState<{
    breakthrough: string;
    emotionalArc: string;
    intention: string;
    themes: string[];
  } | null>(null);
  const [copiedDigest, setCopiedDigest] = useState(false);

  if (!isOpen) return null;

  // Calculate total word count across all interactions
  const totalWords = interactions.reduce((acc, interaction) => {
    const msgs = interaction.messages || [];
    const text = msgs.map((m) => m.content).join(' ');
    const count = text.trim() ? text.trim().split(/\s+/).length : 0;
    return acc + count;
  }, 0);

  // Filter reflections from the past 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentInteractions = interactions.filter(
    (i) => new Date(i.createdAt) >= sevenDaysAgo
  );

  const recentWords = recentInteractions.reduce((acc, interaction) => {
    const msgs = interaction.messages || [];
    const text = msgs.map((m) => m.content).join(' ');
    return acc + (text.trim() ? text.trim().split(/\s+/).length : 0);
  }, 0);

  // Map dates (YYYY-MM-DD) to entry count
  const dateCounts: Record<string, number> = {};
  interactions.forEach((i) => {
    const dateKey = new Date(i.createdAt).toISOString().split('T')[0];
    dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
  });

  // Calculate streak
  const todayKey = new Date().toISOString().split('T')[0];
  let streak = 0;
  let checkDate = new Date();
  while (true) {
    const key = checkDate.toISOString().split('T')[0];
    if (dateCounts[key]) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      if (key === todayKey) {
        checkDate.setDate(checkDate.getDate() - 1);
        const yestKey = checkDate.toISOString().split('T')[0];
        if (dateCounts[yestKey]) {
          continue;
        }
      }
      break;
    }
  }

  // Count active days in the last 7
  let activeDaysInLast7 = 0;
  for (let d = 0; d < 7; d++) {
    const dayCheck = new Date();
    dayCheck.setDate(dayCheck.getDate() - d);
    const dayKey = dayCheck.toISOString().split('T')[0];
    if (dateCounts[dayKey]) activeDaysInLast7++;
  }

  // Calendar Days calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Daily prompt indexed by day of year
  const dayOfYear = Math.floor((Date.now() - new Date(year, 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const dailyPrompt = DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];

  // Generate Weekly Sunday Synthesis
  const handleGenerateWeeklySynthesis = () => {
    setIsSynthesizing(true);
    setTimeout(() => {
      if (recentInteractions.length > 0) {
        // Collect titles and excerpt clues
        const topics = Array.from(
          new Set(recentInteractions.map((i) => i.title).filter(Boolean))
        ).slice(0, 3);

        setWeeklyDigest({
          breakthrough:
            topics.length > 0
              ? `You dedicated deep inquiry to "${topics.join('", "')}". Across ${recentInteractions.length} reflections (${recentWords.toLocaleString()} words), you shifted from reactive deliberation to structured clarity.`
              : `Across ${recentInteractions.length} reflections this week, you consistently carved out sanctuary time to question habits, observe internal friction, and clarify your convictions.`,
          emotionalArc:
            activeDaysInLast7 >= 3
              ? "Steady cadence — moving from mid-week tension and restlessness into weekend calm and sovereign resolve."
              : "Reflective and contemplative — moments of quiet examination that rekindled intentional focus.",
          intention:
            "What is the single most essential priority that, if approached with stillness, will simplify everything else this coming week?",
          themes: topics.length > 0 ? topics : ['Inner Stillness', 'Intentional Action', 'Self-Examination'],
        });
      } else {
        setWeeklyDigest({
          breakthrough:
            "No entries recorded over the past 7 days. Silence can be a sanctuary, but writing is the crucible where fleeting thoughts become lasting wisdom.",
          emotionalArc: "Resting dormant — waiting for the ink of honest reflection.",
          intention:
            "What unsaid truth or quiet intuition has been lingering in your mind this week? Put pen to page today.",
          themes: ['Fresh Beginning', 'Quiet Presence'],
        });
      }
      setIsSynthesizing(false);
    }, 450);
  };

  const handleCopyDigest = () => {
    if (!weeklyDigest) return;
    const text = `=== WEEKLY SUNDAY GROWTH SYNTHESIS ===\nCadence: ${activeDaysInLast7}/7 Days Active · ${recentInteractions.length} Entries · ${recentWords} Words\n\nCORE BREAKTHROUGH:\n${weeklyDigest.breakthrough}\n\nEMOTIONAL ARC:\n${weeklyDigest.emotionalArc}\n\nINTENTION FOR THE COMING WEEK:\n"${weeklyDigest.intention}"\n\nArchived with Sanctuary Journal.`;
    navigator.clipboard.writeText(text);
    setCopiedDigest(true);
    setTimeout(() => setCopiedDigest(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B2A28]/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#FFFDF9] border border-[#E2DDD5] border-t-4 border-t-[#C4432B] max-w-xl w-full p-6 sm:p-8 shadow-xl space-y-6 rounded-2xl my-8 max-h-[90vh] overflow-y-auto box-sanctuary">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C4432B]/10 text-[#C4432B] rounded-lg">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-sans uppercase tracking-[0.22em] font-bold text-[#C4432B]">
                Philosophical Archive
              </span>
              <h2 className="text-xl sm:text-2xl font-serif text-[#2B2A28] font-light">
                Writing Calendar &amp; Streaks
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8A8478] hover:text-[#2B2A28] hover:bg-[#EFECE6] transition-colors rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#F7F4EE] border border-[#E2DDD5] p-3.5 space-y-1 text-center rounded-xl">
            <div className="flex items-center justify-center gap-1 text-[10px] font-sans uppercase tracking-wider text-[#8A8478]">
              <Flame className="w-3.5 h-3.5 text-[#C4432B]" />
              <span>Streak</span>
            </div>
            <p className="text-2xl font-serif font-semibold text-[#2B2A28]">{streak} Days</p>
          </div>

          <div className="bg-[#F7F4EE] border border-[#E2DDD5] p-3.5 space-y-1 text-center rounded-xl">
            <div className="flex items-center justify-center gap-1 text-[10px] font-sans uppercase tracking-wider text-[#8A8478]">
              <BookOpen className="w-3.5 h-3.5 text-[#C4432B]" />
              <span>Total Words</span>
            </div>
            <p className="text-2xl font-serif font-semibold text-[#2B2A28]">{totalWords.toLocaleString()}</p>
          </div>

          <div className="bg-[#F7F4EE] border border-[#E2DDD5] p-3.5 space-y-1 text-center rounded-xl">
            <div className="flex items-center justify-center gap-1 text-[10px] font-sans uppercase tracking-wider text-[#8A8478]">
              <Sparkles className="w-3.5 h-3.5 text-[#C4432B]" />
              <span>Entries</span>
            </div>
            <p className="text-2xl font-serif font-semibold text-[#2B2A28]">{interactions.length}</p>
          </div>
        </div>

        {/* Weekly Sunday Growth Synthesis Card */}
        <div className="border border-[#E2DDD5] bg-[#F7F4EE]/80 rounded-2xl p-4 sm:p-5 space-y-3.5 box-sanctuary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#C4432B]" />
              <span className="text-[10px] font-sans uppercase tracking-[0.2em] font-bold text-[#2B2A28]">
                Weekly Growth Digest (7-Day Review)
              </span>
            </div>
            <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-[#EFECE6] text-[#595652] font-medium">
              {activeDaysInLast7}/7 Days Active
            </span>
          </div>

          {!weeklyDigest ? (
            <div className="space-y-3">
              <p className="text-xs font-serif text-[#595652] leading-relaxed">
                Review your thoughts from the past 7 days ({recentInteractions.length} reflections, {recentWords.toLocaleString()} words) to reveal your underlying growth trajectory and set your compass for the week ahead.
              </p>
              <button
                onClick={handleGenerateWeeklySynthesis}
                disabled={isSynthesizing}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#2B2A28] text-[#F7F4EE] hover:bg-[#C4432B] text-xs font-sans uppercase tracking-wider font-semibold transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSynthesizing ? 'Synthesizing Your Week…' : 'Synthesize My Past 7 Days'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-1 animate-in fade-in duration-200">
              <div className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-xl p-3.5 space-y-2">
                <span className="text-[9px] font-sans uppercase tracking-widest text-[#C4432B] font-bold block">
                  Core Breakthrough &amp; Themes
                </span>
                <p className="text-xs font-serif text-[#2B2A28] leading-relaxed">
                  {weeklyDigest.breakthrough}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-xl p-3 space-y-1">
                  <span className="text-[9px] font-sans uppercase tracking-widest text-[#8A8478] font-bold block">
                    Emotional Arc
                  </span>
                  <p className="font-serif text-[#2B2A28] text-xs leading-snug">
                    {weeklyDigest.emotionalArc}
                  </p>
                </div>
                <div className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-xl p-3 space-y-1">
                  <span className="text-[9px] font-sans uppercase tracking-widest text-[#8A8478] font-bold block flex items-center gap-1">
                    <Compass className="w-3 h-3 text-[#C4432B]" />
                    Compass Intention
                  </span>
                  <p className="font-serif italic text-[#2B2A28] text-xs leading-snug">
                    "{weeklyDigest.intention}"
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={handleGenerateWeeklySynthesis}
                  className="text-[10px] font-sans uppercase tracking-wider text-[#8A8478] hover:text-[#2B2A28] underline underline-offset-2"
                >
                  Regenerate
                </button>
                <button
                  onClick={handleCopyDigest}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2DDD5] hover:border-[#C4432B] bg-[#FFFDF9] text-[#2B2A28] text-[10px] font-sans uppercase tracking-wider transition-colors"
                >
                  {copiedDigest ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-[#C4432B]" />
                      <span>Copy Weekly Digest</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Daily Philosophical Meditation Banner */}
        <div className="bg-[#EFECE6]/70 border-l-2 border-l-[#C4432B] p-4 space-y-1 rounded-r-xl">
          <span className="text-[9px] font-sans uppercase tracking-widest text-[#C4432B] font-bold">
            Today's Philosophical Meditation
          </span>
          <p className="text-sm font-serif italic text-[#2B2A28] leading-relaxed">
            "{dailyPrompt}"
          </p>
        </div>

        {/* Month Calendar View */}
        <div className="space-y-3 border-t border-[#E2DDD5] pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-serif font-semibold text-[#2B2A28]">
              {monthNames[month]} {year}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="p-1 border border-[#E2DDD5] hover:border-[#C4432B] bg-[#FFFDF9] text-[#2B2A28] rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="p-1 border border-[#E2DDD5] hover:border-[#C4432B] bg-[#FFFDF9] text-[#2B2A28] rounded-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid Header */}
          <div className="grid grid-cols-7 text-center text-[10px] font-sans uppercase tracking-widest text-[#8A8478] pb-1 border-b border-[#E2DDD5]">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-sans">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const count = dateCounts[dateStr] || 0;
              const isToday = dateStr === todayKey;

              return (
                <div
                  key={day}
                  className={`h-9 flex flex-col items-center justify-center border text-[11px] rounded-lg transition-colors relative ${
                    isToday
                      ? 'border-[#C4432B] font-bold text-[#C4432B]'
                      : 'border-[#E2DDD5] text-[#2B2A28]'
                  } ${
                    count > 0
                      ? 'bg-[#C4432B]/15 font-semibold'
                      : 'bg-[#FFFDF9]'
                  }`}
                >
                  <span>{day}</span>
                  {count > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C4432B] absolute bottom-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Close Button */}
        <div className="border-t border-[#E2DDD5] pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#2B2A28] text-[#F7F4EE] text-xs font-sans uppercase tracking-widest font-semibold hover:bg-[#C4432B] transition-colors rounded-xl"
          >
            Close Calendar
          </button>
        </div>
      </div>
    </div>
  );
};
