// services/postsService.ts
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy, limit,
  onSnapshot, serverTimestamp, arrayUnion, arrayRemove,
  increment, Unsubscribe, startAfter, DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { Post, Comment, PostCategory } from '@/types';

function docToPost(snap: DocumentSnapshot): Post {
  const d = snap.data()!;
  return {
    id: snap.id,
    ...d,
    likedBy: d.likedBy ?? [],
    createdAt: d.createdAt?.toDate() ?? new Date(),
    updatedAt: d.updatedAt?.toDate() ?? new Date(),
  } as Post;
}

function docToComment(snap: DocumentSnapshot): Comment {
  const d = snap.data()!;
  return {
    id: snap.id,
    ...d,
    likedBy: d.likedBy ?? [],
    createdAt: d.createdAt?.toDate() ?? new Date(),
  } as Comment;
}

export async function createPost(
  authorId: string,
  authorName: string,
  authorPhotoURL: string | undefined,
  category: PostCategory,
  body: string,
  title?: string,
  mediaUrl?: string
): Promise<string> {
  const ref = await addDoc(collection(db, 'posts'), {
    authorId,
    authorName,
    authorPhotoURL: authorPhotoURL ?? null,
    category,
    body,
    title: title ?? null,
    mediaUrl: mediaUrl ?? null,
    modStatus: 'approved', // simple auto-approve; plug in Perspective API in Cloud Function
    likeCount: 0,
    commentCount: 0,
    likedBy: [],
    reportCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeToPosts(
  category: PostCategory | 'all',
  callback: (posts: Post[]) => void
): Unsubscribe {
  let q =
    category === 'all'
      ? query(
          collection(db, 'posts'),
          where('modStatus', '==', 'approved'),
          orderBy('createdAt', 'desc'),
          limit(30)
        )
      : query(
          collection(db, 'posts'),
          where('modStatus', '==', 'approved'),
          where('category', '==', category),
          orderBy('createdAt', 'desc'),
          limit(30)
        );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(docToPost));
  });
}

export async function fetchPostById(postId: string): Promise<Post | null> {
  const snap = await getDoc(doc(db, 'posts', postId));
  return snap.exists() ? docToPost(snap) : null;
}

export async function toggleLikePost(postId: string, uid: string, liked: boolean) {
  const ref = doc(db, 'posts', postId);
  await updateDoc(ref, {
    likedBy: liked ? arrayRemove(uid) : arrayUnion(uid),
    likeCount: increment(liked ? -1 : 1),
  });
}

export async function reportPost(postId: string, reason: string) {
  await updateDoc(doc(db, 'posts', postId), {
    reportCount: increment(1),
  });
  await addDoc(collection(db, 'mod_queue'), {
    contentType: 'post',
    contentId: postId,
    reportReasons: [reason],
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

export async function deletePost(postId: string) {
  await updateDoc(doc(db, 'posts', postId), { modStatus: 'removed' });
}

// --- Comments ---

export async function addComment(
  postId: string,
  authorId: string,
  authorName: string,
  authorPhotoURL: string | undefined,
  body: string
): Promise<string> {
  const ref = await addDoc(collection(db, 'posts', postId, 'comments'), {
    postId,
    authorId,
    authorName,
    authorPhotoURL: authorPhotoURL ?? null,
    body,
    likeCount: 0,
    likedBy: [],
    modStatus: 'approved',
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'posts', postId), { commentCount: increment(1) });
  return ref.id;
}

export function subscribeToComments(
  postId: string,
  callback: (comments: Comment[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'posts', postId, 'comments'),
    where('modStatus', '==', 'approved'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => callback(snap.docs.map(docToComment)));
}
