// services/eventsService.ts
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, query, where, orderBy, limit,
  onSnapshot, serverTimestamp, arrayUnion, arrayRemove,
  increment, Unsubscribe, DocumentSnapshot, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Event, EventCategory } from '@/types';

function docToEvent(snap: DocumentSnapshot): Event {
  const d = snap.data()!;
  return {
    id: snap.id,
    ...d,
    rsvpList: d.rsvpList ?? [],
    startsAt: d.startsAt instanceof Timestamp ? d.startsAt.toDate() : new Date(d.startsAt),
    endsAt: d.endsAt instanceof Timestamp ? d.endsAt.toDate() : new Date(d.endsAt),
    createdAt: d.createdAt?.toDate() ?? new Date(),
  } as Event;
}

export async function createEvent(
  hostId: string,
  hostName: string,
  hostPhotoURL: string | undefined,
  data: {
    title: string;
    description: string;
    category: EventCategory;
    location: string;
    startsAt: Date;
    endsAt: Date;
    isOnline: boolean;
    onlineUrl?: string;
    maxAttendees?: number;
    imageUrl?: string;
  }
): Promise<string> {
  const ref = await addDoc(collection(db, 'events'), {
    hostId,
    hostName,
    hostPhotoURL: hostPhotoURL ?? null,
    ...data,
    startsAt: Timestamp.fromDate(data.startsAt),
    endsAt: Timestamp.fromDate(data.endsAt),
    rsvpCount: 0,
    rsvpList: [],
    isRecurring: false,
    modStatus: 'approved',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeToUpcomingEvents(
  callback: (events: Event[]) => void
): Unsubscribe {
  const now = Timestamp.now();
  const q = query(
    collection(db, 'events'),
    where('modStatus', '==', 'approved'),
    where('startsAt', '>=', now),
    orderBy('startsAt', 'asc'),
    limit(50)
  );
  return onSnapshot(q, (snap) => callback(snap.docs.map(docToEvent)));
}

export async function fetchEventById(eventId: string): Promise<Event | null> {
  const snap = await getDoc(doc(db, 'events', eventId));
  return snap.exists() ? docToEvent(snap) : null;
}

export async function toggleRSVP(eventId: string, uid: string, hasRsvp: boolean) {
  const ref = doc(db, 'events', eventId);
  await updateDoc(ref, {
    rsvpList: hasRsvp ? arrayRemove(uid) : arrayUnion(uid),
    rsvpCount: increment(hasRsvp ? -1 : 1),
  });
}

export async function deleteEvent(eventId: string) {
  await updateDoc(doc(db, 'events', eventId), { modStatus: 'removed' });
}
