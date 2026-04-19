// app/admin/moderation.tsx
import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  collection, query, where, orderBy, limit, onSnapshot,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { approveModItem, removeContent } from '@/services/adminService';
import { useAuthStore } from '@/store/authStore';
import { Colors, FontSizes, Spacing, Radii } from '@/constants/theme';
import { ModQueueItem } from '@/types';
import ModQueueCard from '@/components/admin/ModQueueCard';

export default function AdminModerationScreen() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<ModQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'mod_queue'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => {
        const data = d.data();
        return { id: d.id, ...data, createdAt: data.createdAt?.toDate() ?? new Date() } as ModQueueItem;
      }));
      setLoading(false);
    });
    return unsub;
  }, []);

  async function handleApprove(item: ModQueueItem) {
    await approveModItem(item.id, item.contentType as any, item.contentId, user!.uid);
  }

  async function handleWarn(item: ModQueueItem) {
    // Warn = approve content but flag author — extend with warning notification in production
    await approveModItem(item.id, item.contentType as any, item.contentId, user!.uid);
  }

  async function handleRemove(item: ModQueueItem) {
    await removeContent(item.id, item.contentType as any, item.contentId, user!.uid);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.statsRow}>
              <View style={[styles.statChip, items.length > 0 && styles.statChipAlert]}>
                <Text style={[styles.statText, items.length > 0 && styles.statTextAlert]}>
                  {items.length} pending review
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyTitle}>Queue is clear!</Text>
              <Text style={styles.emptyText}>No content currently awaiting review.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ModQueueCard
              item={item}
              onApprove={() => handleApprove(item)}
              onWarn={() => handleWarn(item)}
              onRemove={() => handleRemove(item)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.xl, paddingBottom: 40 },
  statsRow: { marginBottom: Spacing.md },
  statChip: {
    alignSelf: 'flex-start', backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radii.full,
  },
  statChipAlert: { backgroundColor: Colors.warningLight },
  statText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary },
  statTextAlert: { color: Colors.warning },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 52, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: FontSizes.md, color: Colors.textSecondary, marginTop: Spacing.sm },
});
