// services/wellbeingService.ts
import {
  collection, doc, addDoc, getDocs, onSnapshot,
  query, orderBy, limit, where, serverTimestamp,
  Unsubscribe, DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { CheckIn, WellbeingContent } from '@/types';

function docToCheckIn(snap: DocumentSnapshot): CheckIn {
  const d = snap.data()!;
  return {
    id: snap.id,
    ...d,
    timestamp: d.timestamp?.toDate() ?? new Date(),
  } as CheckIn;
}

export async function submitCheckIn(
  userId: string,
  moodScore: 1 | 2 | 3 | 4 | 5,
  safetyOk: boolean,
  notes: string,
  visibleTo: string[]
): Promise<void> {
  await addDoc(collection(db, 'check_ins', userId, 'entries'), {
    userId,
    moodScore,
    safetyOk,
    notes: notes || null,
    visibleTo,
    timestamp: serverTimestamp(),
  });
}

export function subscribeToMyCheckIns(
  userId: string,
  callback: (checkIns: CheckIn[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'check_ins', userId, 'entries'),
    orderBy('timestamp', 'desc'),
    limit(30)
  );
  return onSnapshot(q, (snap) => callback(snap.docs.map(docToCheckIn)));
}

export async function getWellbeingContent(): Promise<WellbeingContent[]> {
  const q = query(
    collection(db, 'wellbeing_content'),
    where('isActive', '==', true),
    orderBy('publishedAt', 'desc'),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      publishedAt: data.publishedAt?.toDate() ?? new Date(),
    } as WellbeingContent;
  });
}

export async function seedWellbeingContent() {
  // Seed initial wellbeing content if collection is empty
  const q = query(collection(db, 'wellbeing_content'), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) return;

  const items = [
    {
      type: 'tip',
      title: 'Stay Hydrated',
      body: 'Drink at least 6–8 glasses of water daily. Staying hydrated helps with energy, focus, and joint health.',
      category: 'health',
      isActive: true,
    },
    {
      type: 'tip',
      title: 'Daily Walk',
      body: 'A 20-minute walk each day can significantly improve your mood and cardiovascular health.',
      category: 'exercise',
      isActive: true,
    },
    {
      type: 'tip',
      title: 'Connect with a Friend',
      body: 'Call or message someone you haven\'t spoken to in a while. Social connections are vital for wellbeing.',
      category: 'social',
      isActive: true,
    },
    {
      type: 'tip',
      title: 'Home Safety Check',
      body: 'Make sure pathways are clear and night lights are working. Small changes can prevent falls.',
      category: 'safety',
      isActive: true,
    },
    {
      type: 'tip',
      title: 'Mindful Breathing',
      body: 'Take 5 slow deep breaths when you feel stressed. Breathe in for 4 counts, hold for 4, out for 6.',
      category: 'mental_health',
      isActive: true,
    },
  ];

  for (const item of items) {
    await addDoc(collection(db, 'wellbeing_content'), {
      ...item,
      publishedAt: serverTimestamp(),
    });
  }
}
