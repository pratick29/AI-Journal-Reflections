/**
 * Google Calendar Integration Utility
 * Generates direct Google Calendar event templates for daily reflection habits and rituals.
 */

export interface CalendarEventOptions {
  title: string;
  description: string;
  hour?: number; // 0-23 (default 21 for 9 PM)
  minute?: number; // default 0
  durationMinutes?: number; // default 15
  isRecurringDaily?: boolean; // default true
}

export function buildGoogleCalendarUrl(options: CalendarEventOptions): string {
  const {
    title,
    description,
    hour = 21,
    minute = 0,
    durationMinutes = 15,
    isRecurringDaily = true,
  } = options;

  // Format today's date at specified hour/minute in UTC or local format YYYYMMDDTHHmmSS
  const start = new Date();
  start.setHours(hour, minute, 0, 0);

  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const formatCalTime = (d: Date) => {
    return d.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const datesParam = `${formatCalTime(start)}/${formatCalTime(end)}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: `${description}\n\n✨ Open MindScribe Sanctuary: https://mindscribe.app`,
    location: 'MindScribe Sanctuary',
    dates: datesParam,
  });

  if (isRecurringDaily) {
    params.set('recur', 'RRULE:FREQ=DAILY');
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Quick-action to open Google Calendar with a pre-configured Contemplative Habit event
 */
export function openGoogleCalendarHabit(ritualType: 'morning' | 'evening' | 'custom' = 'evening', customPrompt?: string): void {
  const isMorning = ritualType === 'morning';
  const title = isMorning ? '🌅 MindScribe · Morning Contemplation' : '🌙 MindScribe · Evening Reflection';
  const description = isMorning
    ? (customPrompt || 'Take 10 quiet minutes to anchor your morning intentions, calibrate your mindset, and write freely.')
    : (customPrompt || 'A quiet space before sleep: examine the day with honesty, celebrate small victories, and let go of stress.');

  const hour = isMorning ? 8 : 21; // 8:00 AM or 9:00 PM

  const url = buildGoogleCalendarUrl({
    title,
    description,
    hour,
    minute: 0,
    durationMinutes: 15,
    isRecurringDaily: true,
  });

  window.open(url, '_blank', 'noopener,noreferrer');
}
