import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Flame, BookOpen, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
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

  if (!isOpen) return null;

  // Calculate total word count across all interactions
  const totalWords = interactions.reduce((acc, interaction) => {
    const msgs = interaction.messages || [];
    const text = msgs.map((m) => m.content).join(' ');
    const count = text.trim() ? text.trim().split(/\s+/).length : 0;
    return acc + count;
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
      // Allow today to not be written yet if yesterday was written
      if (key === todayKey) {
        checkDate.setDate(checkDate.getDate() - 1);
        const yestKey = checkDate.toISOString().split('T')[0];
        if (dateCounts[yestKey]) {
          // continue checking
          continue;
        }
      }
      break;
    }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B2A28]/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#FFFDF9] border border-[#E2DDD5] border-t-4 border-t-[#C4432B] max-w-xl w-full p-6 sm:p-8 shadow-xl space-y-6 rounded-xs my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C4432B]/10 text-[#C4432B] rounded-xs">
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
            className="p-1.5 text-[#8A8478] hover:text-[#2B2A28] hover:bg-[#EFECE6] transition-colors rounded-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#F7F4EE] border border-[#E2DDD5] p-3.5 space-y-1 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-sans uppercase tracking-wider text-[#8A8478]">
              <Flame className="w-3.5 h-3.5 text-[#C4432B]" />
              <span>Streak</span>
            </div>
            <p className="text-2xl font-serif font-semibold text-[#2B2A28]">{streak} Days</p>
          </div>

          <div className="bg-[#F7F4EE] border border-[#E2DDD5] p-3.5 space-y-1 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-sans uppercase tracking-wider text-[#8A8478]">
              <BookOpen className="w-3.5 h-3.5 text-[#C4432B]" />
              <span>Total Words</span>
            </div>
            <p className="text-2xl font-serif font-semibold text-[#2B2A28]">{totalWords.toLocaleString()}</p>
          </div>

          <div className="bg-[#F7F4EE] border border-[#E2DDD5] p-3.5 space-y-1 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-sans uppercase tracking-wider text-[#8A8478]">
              <Sparkles className="w-3.5 h-3.5 text-[#C4432B]" />
              <span>Entries</span>
            </div>
            <p className="text-2xl font-serif font-semibold text-[#2B2A28]">{interactions.length}</p>
          </div>
        </div>

        {/* Daily Philosophical Meditation Banner */}
        <div className="bg-[#EFECE6]/70 border-l-2 border-l-[#C4432B] p-4 space-y-1">
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
                className="p-1 border border-[#E2DDD5] hover:border-[#C4432B] bg-[#FFFDF9] text-[#2B2A28]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="p-1 border border-[#E2DDD5] hover:border-[#C4432B] bg-[#FFFDF9] text-[#2B2A28]"
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
                  className={`h-9 flex flex-col items-center justify-center border text-[11px] rounded-xs transition-colors relative ${
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
            className="px-5 py-2 bg-[#2B2A28] text-[#F7F4EE] text-xs font-sans uppercase tracking-widest font-semibold hover:bg-[#C4432B] transition-colors rounded-xs"
          >
            Close Calendar
          </button>
        </div>
      </div>
    </div>
  );
};
