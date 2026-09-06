import { Interaction } from '../types';

export interface HabitBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'streak' | 'mindfulness' | 'expression' | 'security';
  isUnlocked: boolean;
  progress: number; // 0 to 1
  progressLabel: string;
  unlockedAt?: string;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalReflections: number;
  totalAudioMemos: number;
  totalEncrypted: number;
  badges: HabitBadge[];
}

export function calculateHabitStats(interactions: Interaction[]): HabitStats {
  const totalReflections = interactions.length;
  let totalAudioMemos = 0;
  let totalEncrypted = 0;
  let hasDawnEntry = false;
  let hasNightEntry = false;
  let hasThinkingMap = false;

  // Extract unique active days (YYYY-MM-DD in local time)
  const activeDaysSet = new Set<string>();

  interactions.forEach((item) => {
    if (item.audioMemo) totalAudioMemos++;
    if (item.isEncrypted) totalEncrypted++;
    if (item.thinkingMap && item.thinkingMap.nodes?.length > 0) hasThinkingMap = true;

    const date = new Date(item.createdAt || Date.now());
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    activeDaysSet.add(dateKey);

    const hour = date.getHours();
    if (hour >= 5 && hour < 8) {
      hasDawnEntry = true;
    }
    if (hour >= 22 || hour < 3) {
      hasNightEntry = true;
    }
  });

  // Calculate streaks
  const sortedDays = Array.from(activeDaysSet).sort();
  let longestStreak = 0;
  let currentStreak = 0;

  if (sortedDays.length > 0) {
    let runningStreak = 0;
    let prevDate: Date | null = null;

    for (const dayStr of sortedDays) {
      const [y, m, d] = dayStr.split('-').map(Number);
      const currDate = new Date(y, m - 1, d);

      if (!prevDate) {
        runningStreak = 1;
      } else {
        const diffTime = currDate.getTime() - prevDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          runningStreak++;
        } else if (diffDays > 1) {
          runningStreak = 1;
        }
      }

      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
      prevDate = currDate;
    }

    // Determine current streak: checks if the most recent active day is today or yesterday
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    const lastActiveDay = sortedDays[sortedDays.length - 1];
    if (lastActiveDay === todayStr || lastActiveDay === yesterdayStr) {
      currentStreak = runningStreak;
    } else {
      currentStreak = 0;
    }
  }

  // Define badges
  const badges: HabitBadge[] = [
    {
      id: 'solitude_3',
      name: '3-Day Solitude',
      icon: '🌱',
      description: 'Reflected for 3 consecutive days.',
      category: 'streak',
      isUnlocked: longestStreak >= 3,
      progress: Math.min(1, longestStreak / 3),
      progressLabel: `${Math.min(longestStreak, 3)}/3 days`,
    },
    {
      id: 'inquirer_7',
      name: '7-Day Inquirer',
      icon: '✨',
      description: 'Cultivated an unbroken 7-day contemplative habit.',
      category: 'streak',
      isUnlocked: longestStreak >= 7,
      progress: Math.min(1, longestStreak / 7),
      progressLabel: `${Math.min(longestStreak, 7)}/7 days`,
    },
    {
      id: 'fortnight_14',
      name: 'Fortnight Sage',
      icon: '🌿',
      description: 'Fourteen days of dedication to mindful journaling.',
      category: 'streak',
      isUnlocked: longestStreak >= 14,
      progress: Math.min(1, longestStreak / 14),
      progressLabel: `${Math.min(longestStreak, 14)}/14 days`,
    },
    {
      id: 'centurion_30',
      name: 'Monthly Chronicler',
      icon: '🏛️',
      description: 'Thirty continuous days of disciplined reflection.',
      category: 'streak',
      isUnlocked: longestStreak >= 30,
      progress: Math.min(1, longestStreak / 30),
      progressLabel: `${Math.min(longestStreak, 30)}/30 days`,
    },
    {
      id: 'dawn_pilgrim',
      name: 'Dawn Pilgrim',
      icon: '🌅',
      description: 'Pondered in early morning stillness (5:00 AM – 8:00 AM).',
      category: 'mindfulness',
      isUnlocked: hasDawnEntry,
      progress: hasDawnEntry ? 1 : 0,
      progressLabel: hasDawnEntry ? 'Unlocked' : '0/1 entry',
    },
    {
      id: 'night_watchman',
      name: 'Night Watchman',
      icon: '🌙',
      description: 'Composed thoughts under late night stars (10:00 PM – 3:00 AM).',
      category: 'mindfulness',
      isUnlocked: hasNightEntry,
      progress: hasNightEntry ? 1 : 0,
      progressLabel: hasNightEntry ? 'Unlocked' : '0/1 entry',
    },
    {
      id: 'spoken_diarist',
      name: 'Spoken Diarist',
      icon: '🎙️',
      description: 'Captured spontaneous voice memos alongside entries.',
      category: 'expression',
      isUnlocked: totalAudioMemos >= 1,
      progress: Math.min(1, totalAudioMemos / 1),
      progressLabel: `${Math.min(totalAudioMemos, 1)}/1 memo`,
    },
    {
      id: 'vault_keeper',
      name: 'Vault Keeper',
      icon: '🛡️',
      description: 'Protected sacred entries with Zero-Knowledge E2EE.',
      category: 'security',
      isUnlocked: totalEncrypted >= 1,
      progress: Math.min(1, totalEncrypted / 1),
      progressLabel: `${Math.min(totalEncrypted, 1)}/1 encrypted`,
    },
    {
      id: 'cartographer',
      name: 'Dialectical Cartographer',
      icon: '🗺️',
      description: 'Synthesized thinking pathways with a Thinking Map.',
      category: 'mindfulness',
      isUnlocked: hasThinkingMap,
      progress: hasThinkingMap ? 1 : 0,
      progressLabel: hasThinkingMap ? 'Unlocked' : '0/1 map',
    },
    {
      id: 'stoic_anchor',
      name: 'Stoic Anchor',
      icon: '⚓',
      description: 'Created 10 or more reflective sanctuary entries.',
      category: 'expression',
      isUnlocked: totalReflections >= 10,
      progress: Math.min(1, totalReflections / 10),
      progressLabel: `${Math.min(totalReflections, 10)}/10 entries`,
    },
  ];

  return {
    currentStreak,
    longestStreak,
    totalReflections,
    totalAudioMemos,
    totalEncrypted,
    badges,
  };
}
