// services/adminService.ts
// Admin-only Firestore operations - only callable when user.role === 'admin'

import {
  collection, doc, updateDoc, getDocs, query, where,
  orderBy, limit, getCountFromServer, serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, UserRole } from '@/types';

/**
 * Change a user's role.
 */
export async function setUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { role });
}

/**
 * Ban or unban a user.
 */
export async function setUserBanned(uid: string, banned: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { isBanned: banned });
}

/**
 * Bulk-remove all pending mod queue items older than N days.
 */
export async function clearStaleModerationItems(olderThanDays = 30): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const snap = await getDocs(query(
    collection(db, 'mod_queue'),
    where('status', '==', 'pending'),
    where('createdAt', '<', cutoff),
    limit(200)
  ));

  if (snap.empty) return 0;

  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { status: 'auto-dismissed' }));
  await batch.commit();
  return snap.size;
}

/**
 * Get platform engagement statistics for the analytics screen.
 */
export async function getEngagementStats() {
  const [
    totalUsersSnap,
    seniorSnap,
    caregiverSnap,
    orgSnap,
    postsSnap,
    eventsSnap,
    pendingModSnap,
  ] = await Promise.all([
    getCountFromServer(query(collection(db, 'users'))),
    getCountFromServer(query(collection(db, 'users'), where('role', '==', 'senior'))),
    getCountFromServer(query(collection(db, 'users'), where('role', '==', 'caregiver'))),
    getCountFromServer(query(collection(db, 'users'), where('role', '==', 'organisation'))),
    getCountFromServer(query(collection(db, 'posts'), where('modStatus', '==', 'approved'))),
    getCountFromServer(query(collection(db, 'events'), where('modStatus', '==', 'approved'))),
    getCountFromServer(query(collection(db, 'mod_queue'), where('status', '==', 'pending'))),
  ]);

  return {
    totalUsers: totalUsersSnap.data().count,
    seniorCount: seniorSnap.data().count,
    caregiverCount: caregiverSnap.data().count,
    orgCount: orgSnap.data().count,
    totalPosts: postsSnap.data().count,
    totalEvents: eventsSnap.data().count,
    pendingModeration: pendingModSnap.data().count,
  };
}

/**
 * Approve a moderation queue item and its underlying content.
 */
export async function approveModItem(
  modItemId: string,
  contentType: 'post' | 'event' | 'comment',
  contentId: string,
  adminUid: string
): Promise<void> {
  const batch = writeBatch(db);

  batch.update(doc(db, 'mod_queue', modItemId), {
    status: 'approved',
    reviewedBy: adminUid,
    reviewedAt: serverTimestamp(),
  });

  if (contentType !== 'comment') {
    const collName = contentType === 'post' ? 'posts' : 'events';
    batch.update(doc(db, collName, contentId), { modStatus: 'approved' });
  }

  await batch.commit();
}

/**
 * Remove content and update the mod queue item.
 */
export async function removeContent(
  modItemId: string,
  contentType: 'post' | 'event' | 'comment',
  contentId: string,
  adminUid: string
): Promise<void> {
  const batch = writeBatch(db);

  batch.update(doc(db, 'mod_queue', modItemId), {
    status: 'removed',
    reviewedBy: adminUid,
    reviewedAt: serverTimestamp(),
  });

  if (contentType !== 'comment') {
    const collName = contentType === 'post' ? 'posts' : 'events';
    batch.update(doc(db, collName, contentId), { modStatus: 'removed' });
  }

  await batch.commit();
}
