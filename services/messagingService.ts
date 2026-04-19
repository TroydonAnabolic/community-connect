// services/messagingService.ts
import {
  collection, doc, addDoc, updateDoc, setDoc, getDoc,
  query, where, orderBy, limit, onSnapshot,
  serverTimestamp, increment, Unsubscribe, DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { DirectMessage, Message } from '@/types';

function sortedKey(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join('_');
}

export async function getOrCreateConversation(
  uid1: string,
  uid2: string,
  name1: string,
  name2: string
): Promise<string> {
  const convId = sortedKey(uid1, uid2);
  const ref = doc(db, 'conversations', convId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      participants: [uid1, uid2],
      participantNames: { [uid1]: name1, [uid2]: name2 },
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      lastMessageBy: uid1,
      unreadCount: { [uid1]: 0, [uid2]: 0 },
    });
  }
  return convId;
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  body: string,
  recipientId: string
): Promise<void> {
  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    conversationId,
    senderId,
    senderName,
    body,
    isRead: false,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage: body,
    lastMessageAt: serverTimestamp(),
    lastMessageBy: senderId,
    [`unreadCount.${recipientId}`]: increment(1),
  });
}

export async function markConversationRead(conversationId: string, uid: string) {
  await updateDoc(doc(db, 'conversations', conversationId), {
    [`unreadCount.${uid}`]: 0,
  });
}

export function subscribeToConversations(
  uid: string,
  callback: (convs: DirectMessage[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', uid),
    orderBy('lastMessageAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const convs = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        lastMessageAt: data.lastMessageAt?.toDate() ?? new Date(),
      } as DirectMessage;
    });
    callback(convs);
  });
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(100)
  );
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate() ?? new Date(),
      } as Message;
    });
    callback(msgs);
  });
}
