// hooks/useCheckInStreak.ts
import { useEffect, useState } from 'react';
import { isYesterday, isToday, differenceInCalendarDays } from 'date-fns';
import { subscribeToMyCheckIns } from '@/services/wellbeingService';
import { useAuthStore } from '@/store/authStore';
import { CheckIn } from '@/types';

interface StreakResult {
  streak: number;       // consecutive days
  checkedInToday: boolean;
  longestStreak: number;
  totalCheckIns: number;
}

export function useCheckInStreak(): StreakResult {
  const { user } = useAuthStore();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToMyCheckIns(user.uid, setCheckIns);
    return unsub;
  }, [user?.uid]);

  return calculateStreak(checkIns);
}

function calculateStreak(checkIns: CheckIn[]): StreakResult {
  if (checkIns.length === 0) {
    return { streak: 0, checkedInToday: false, longestStreak: 0, totalCheckIns: 0 };
  }

  // Sort newest first (already the case from Firestore orderBy desc)
  const sorted = [...checkIns].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  // Deduplicate by calendar day (keep only one per day)
  const uniqueDays: Date[] = [];
  const seen = new Set<string>();
  for (const ci of sorted) {
    const key = ci.timestamp.toISOString().split('T')[0];
    if (!seen.has(key)) {
      seen.add(key);
      uniqueDays.push(ci.timestamp);
    }
  }

  const checkedInToday = uniqueDays.length > 0 && isToday(uniqueDays[0]);
  const totalCheckIns = checkIns.length;

  // Count current streak (consecutive days including today or yesterday)
  let streak = 0;
  if (uniqueDays.length > 0) {
    const firstDay = uniqueDays[0];
    if (isToday(firstDay) || isYesterday(firstDay)) {
      streak = 1;
      for (let i = 1; i < uniqueDays.length; i++) {
        const diff = differenceInCalendarDays(uniqueDays[i - 1], uniqueDays[i]);
        if (diff === 1) {
          streak++;
        } else {
          break;
        }
      }
    }
  }

  // Calculate longest-ever streak
  let longestStreak = 0;
  let currentRun = uniqueDays.length > 0 ? 1 : 0;
  for (let i = 1; i < uniqueDays.length; i++) {
    const diff = differenceInCalendarDays(uniqueDays[i - 1], uniqueDays[i]);
    if (diff === 1) {
      currentRun++;
    } else {
      longestStreak = Math.max(longestStreak, currentRun);
      currentRun = 1;
    }
  }
  longestStreak = Math.max(longestStreak, currentRun);

  return { streak, checkedInToday, longestStreak, totalCheckIns };
}
