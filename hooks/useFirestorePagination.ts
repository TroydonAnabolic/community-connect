// hooks/useFirestorePagination.ts
import { useState, useCallback } from 'react';
import {
  Query, DocumentData, getDocs, QueryDocumentSnapshot,
  startAfter, limit, query,
} from 'firebase/firestore';

const PAGE_SIZE = 20;

interface PaginationResult<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  fetchFirst: () => Promise<void>;
  fetchMore: () => Promise<void>;
  reset: () => void;
}

/**
 * Generic Firestore pagination hook.
 *
 * @param baseQuery  - A Firestore query WITHOUT limit() applied
 * @param transform  - Maps a Firestore doc snapshot to your data type T
 * @param pageSize   - Number of items per page (default 20)
 *
 * Usage:
 *   const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
 *   const { items, fetchFirst, fetchMore, hasMore } = useFirestorePagination(q, docToPost);
 */
export function useFirestorePagination<T>(
  baseQuery: Query<DocumentData>,
  transform: (doc: QueryDocumentSnapshot<DocumentData>) => T,
  pageSize = PAGE_SIZE
): PaginationResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const fetchFirst = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLastDoc(null);
    try {
      const q = query(baseQuery, limit(pageSize));
      const snap = await getDocs(q);
      const docs = snap.docs.map(transform);
      setItems(docs);
      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
      setHasMore(snap.docs.length === pageSize);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [baseQuery, pageSize]);

  const fetchMore = useCallback(async () => {
    if (!hasMore || loadingMore || !lastDoc) return;
    setLoadingMore(true);
    try {
      const q = query(baseQuery, startAfter(lastDoc), limit(pageSize));
      const snap = await getDocs(q);
      const docs = snap.docs.map(transform);
      setItems((prev) => [...prev, ...docs]);
      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
      setHasMore(snap.docs.length === pageSize);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  }, [baseQuery, hasMore, lastDoc, loadingMore, pageSize]);

  const reset = useCallback(() => {
    setItems([]);
    setLastDoc(null);
    setHasMore(true);
    setError(null);
  }, []);

  return { items, loading, loadingMore, hasMore, error, fetchFirst, fetchMore, reset };
}
