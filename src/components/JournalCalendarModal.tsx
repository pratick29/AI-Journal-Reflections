import React, { useState, useMemo } from 'react';
import { X, Calendar as CalendarIcon, Flame, BookOpen, Sparkles, ChevronLeft, ChevronRight, Compass, Copy, Check, TrendingUp, Feather, Award } from 'lucide-react';
import { Interaction } from '../types';
import { calculateHabitStats } from '../utils/badges';

interface JournalCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  interactions: Interaction[];
}

const DAILY_PROMPTS = [
  "What made you feel grateful or happy today?",
  "What was on your mind the most today?",
  "What is one small win from today you're proud of?",
  "What made you feel stressed, and what can you do about it?",
  "Who is someone you appreciated talking to recently?",
  "What is one thing you want to do better tomorrow?",
  "What is something you learned about yourself this week?",
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

  // Compute commemorative badges and streaks
  const habitStats = useMemo(() => calculateHabitStats(interactions), [interactions]);

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

  // Generate Weekly Summary
  const handleGenerateWeeklySynthesis = () => {
    setIsSynthesizing(true);
    setTimeout(() => {
      if (recentInteractions.length > 0) {
        const topics = Array.from(
          new Set(recentInteractions.map((i) => i.title).filter(Boolean))
        ).slice(0, 3);

        setWeeklyDigest({
          breakthrough:
            topics.length > 0
              ? `You focused on "${topics.join('", "')}". Across your ${recentInteractions.length} entries (${recentWords.toLocaleString()} words), writing things down helped you clear your head and see what matters most.`
              : `Across your ${recentInteractions.length} entries this week, taking a few minutes to write helped you organize your thoughts and feel more focused.`,
          emotionalArc:
            activeDaysInLast7 >= 3
              ? "You stayed consistent this week. Even when things felt busy, taking time to write helped you find calm."
              : "A good start — writing helped you reflect and take a step back from busy days.",
          intention:
            "What is the one most important thing you want to focus on this week?",
          themes: topics.length > 0 ? topics : ['Clarity', 'Taking Action', 'Staying Calm'],
        });
      } else {
        setWeeklyDigest({
          breakthrough:
            "You haven't written any entries in the past 7 days. Even taking 2 minutes to write a couple of sentences can help clear your mind.",
          emotionalArc: "Ready for a fresh start.",
          intention:
            "How are you feeling right now? Write a few sentences today to get started.",
          themes: ['Fresh Start', 'Peace of Mind'],
        });
      }
      setIsSynthesizing(false);
    }, 450);
  };

  const handleCopyDigest = () => {
    if (!weeklyDigest) return;
    const text = `=== WEEKLY JOURNAL SUMMARY ===\nActive: ${activeDaysInLast7}/7 Days · ${recentInteractions.length} Entries · ${recentWords} Words\n\nMAIN TAKEAWAY:\n${weeklyDigest.breakthrough}\n\nHOW YOU FELT:\n${weeklyDigest.emotionalArc}\n\nFOCUS FOR NEXT WEEK:\n"${weeklyDigest.intention}"\n\nFrom MindScribe.`;
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
                Your Journal
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
            <p className="text-2xl font-serif font-semibold text-[#2B2A28]">{habitStats.currentStreak} Days</p>
            {habitStats.longestStreak > 0 && (
              <span className="text-[9px] text-[#8A8478] font-sans block">Best: {habitStats.longestStreak} days</span>
            )}
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
                Weekly Summary (Past 7 Days)
              </span>
            </div>
            <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-[#EFECE6] text-[#595652] font-medium">
              {activeDaysInLast7}/7 Days Active
            </span>
          </div>

          {!weeklyDigest ? (
            <div className="space-y-3">
              <p className="text-xs font-serif text-[#595652] leading-relaxed">
                Review your {recentInteractions.length} entries ({recentWords.toLocaleString()} words) from the past 7 days to see what you learned and plan your focus for the week ahead.
              </p>
              <button
                onClick={handleGenerateWeeklySynthesis}
                disabled={isSynthesizing}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#2B2A28] text-[#F7F4EE] hover:bg-[#C4432B] text-xs font-sans uppercase tracking-wider font-semibold transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSynthesizing ? 'Reading Your Entries…' : 'Summarize My Week'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-1 animate-in fade-in duration-200">
              <div className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-xl p-3.5 space-y-2">
                <span className="text-[9px] font-sans uppercase tracking-widest text-[#C4432B] font-bold block">
                  Main Takeaway This Week
                </span>
                <p className="text-xs font-serif text-[#2B2A28] leading-relaxed">
                  {weeklyDigest.breakthrough}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-xl p-3 space-y-1">
                  <span className="text-[9px] font-sans uppercase tracking-widest text-[#8A8478] font-bold block">
                    How You Felt
                  </span>
                  <p className="font-serif text-[#2B2A28] text-xs leading-snug">
                    {weeklyDigest.emotionalArc}
                  </p>
                </div>
                <div className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-xl p-3 space-y-1">
                  <span className="text-[9px] font-sans uppercase tracking-widest text-[#8A8478] font-bold block flex items-center gap-1">
                    <Compass className="w-3 h-3 text-[#C4432B]" />
                    Focus for Next Week
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
                  Refresh
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
                      <span>Copy Summary</span>
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
            Today's Question
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

        {/* Habit & Streak Badges Section */}
        <div className="space-y-3 border-t border-[#E2DDD5] pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🎖️</span>
              <h4 className="text-xs font-serif font-semibold text-[#2B2A28]">
                Habit &amp; Solitude Badges
              </h4>
            </div>
            <span className="text-[10px] font-sans text-[#8A8478] uppercase tracking-wider">
              {habitStats.badges.filter((b) => b.isUnlocked).length} of {habitStats.badges.length} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto pr-1">
            {habitStats.badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-2.5 border rounded-xl flex items-start gap-2.5 transition-all ${
                  badge.isUnlocked
                    ? 'bg-[#FFFDF9] border-[#C4432B]/40 shadow-2xs'
                    : 'bg-[#EFECE6]/40 border-[#E2DDD5]/60 opacity-60'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 ${
                  badge.isUnlocked ? 'bg-[#C4432B]/10' : 'bg-stone-200/50'
                }`}>
                  {badge.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-serif font-medium text-[#2B2A28] truncate">
                      {badge.name}
                    </span>
                    <span className="text-[9px] font-sans font-medium text-[#8A8478] shrink-0">
                      {badge.progressLabel}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#595652] font-sans line-clamp-1 mt-0.5">
                    {badge.description}
                  </p>
                  <div className="w-full h-1 bg-[#E2DDD5]/70 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        badge.isUnlocked ? 'bg-[#C4432B]' : 'bg-stone-400'
                      }`}
                      style={{ width: `${badge.progress * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
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
