// app/admin/index.tsx — full admin dashboard with navigation to sub-screens
import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, FlatList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, query, where, onSnapshot, orderBy,
  limit, getCountFromServer, updateDoc, doc,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Colors, FontSizes, Spacing, Radii } from '@/constants/theme';
import { ModQueueItem } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDashboard() {
  const router = useRouter();
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({ users: 0, posts: 0, events: 0, pendingMod: 0 });
  const [modQueue, setModQueue] = useState<ModQueueItem[]>([]);

  useEffect(() => {
    const modUnsub = onSnapshot(
      query(
        collection(db, 'mod_queue'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(10)
      ),
      (snap) => {
        const items = snap.docs.map((d) => {
          const data = d.data();
          return { id: d.id, ...data, createdAt: data.createdAt?.toDate() ?? new Date() } as ModQueueItem;
        });
        setModQueue(items);
        setStats((prev) => ({ ...prev, pendingMod: items.length }));
      }
    );

    Promise.all([
      getCountFromServer(query(collection(db, 'users'))),
      getCountFromServer(query(collection(db, 'posts'), where('modStatus', '==', 'approved'))),
      getCountFromServer(query(collection(db, 'events'), where('modStatus', '==', 'approved'))),
    ]).then(([u, p, e]) => {
      setStats((prev) => ({
        ...prev,
        users: u.data().count,
        posts: p.data().count,
        events: e.data().count,
      }));
      setLoadingStats(false);
    });

    return modUnsub;
  }, []);

  async function handleModAction(item: ModQueueItem, action: 'approved' | 'removed' | 'warned') {
    try {
      await updateDoc(doc(db, 'mod_queue', item.id), { status: action, reviewedAt: new Date() });
      // Update the underlying content document
      const collPath = item.contentType === 'post' ? 'posts'
        : item.contentType === 'event' ? 'events'
        : 'posts'; // comments handled differently in production
      if (item.contentType !== 'comment') {
        await updateDoc(doc(db, collPath, item.contentId), {
          modStatus: action === 'warned' ? 'approved' : action,
        });
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  const LINKS = [
    { icon: 'people' as const, label: 'User Management', route: '/admin/users', color: Colors.primary },
    { icon: 'heart' as const, label: 'Wellbeing Content', route: '/admin/content', color: Colors.accent },
    { icon: 'bar-chart' as const, label: 'Analytics', route: '/admin/analytics', color: Colors.warning },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Close">
          <Ionicons name="close" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Console</Text>
        <View style={styles.adminTag}>
          <Text style={styles.adminTagText}>Admin</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <Text style={styles.sectionLabel}>Overview</Text>
        {loadingStats ? (
          <ActivityIndicator color={Colors.primary} style={{ marginBottom: Spacing.xl }} />
        ) : (
          <View style={styles.statsRow}>
            {[
              { label: 'Users', value: stats.users, color: Colors.primary },
              { label: 'Posts', value: stats.posts, color: Colors.accent },
              { label: 'Events', value: stats.events, color: Colors.warning },
              { label: 'Pending', value: stats.pendingMod, color: Colors.error, alert: stats.pendingMod > 0 },
            ].map((s) => (
              <View key={s.label} style={[styles.statCard, s.alert && styles.statCardAlert]}>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Navigation links */}
        <Text style={styles.sectionLabel}>Management</Text>
        <View style={styles.linksCol}>
          {LINKS.map((link) => (
            <TouchableOpacity
              key={link.label}
              style={styles.linkRow}
              onPress={() => router.push(link.route as any)}
              accessibilityLabel={link.label}
              accessibilityRole="button"
            >
              <View style={[styles.linkIcon, { backgroundColor: link.color + '18' }]}>
                <Ionicons name={link.icon} size={22} color={link.color} />
              </View>
              <Text style={styles.linkLabel}>{link.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Moderation queue */}
        <Text style={styles.sectionLabel}>
          Moderation Queue
          {stats.pendingMod > 0 && (
            <Text style={styles.pendingCount}> ({stats.pendingMod} pending)</Text>
          )}
        </Text>

        {modQueue.length === 0 ? (
          <View style={styles.emptyMod}>
            <Text style={styles.emptyModIcon}>✅</Text>
            <Text style={styles.emptyModText}>All clear — no content pending review</Text>
          </View>
        ) : (
          modQueue.map((item) => (
            <View key={item.id} style={styles.modCard}>
              <View style={styles.modMeta}>
                <View style={[
                  styles.modTypeBadge,
                  { backgroundColor: item.contentType === 'post' ? Colors.infoLight : Colors.warningLight },
                ]}>
                  <Text style={[
                    styles.modTypeText,
                    { color: item.contentType === 'post' ? Colors.info : Colors.warning },
                  ]}>
                    {item.contentType}
                  </Text>
                </View>
                <Text style={styles.modTime}>{formatDistanceToNow(item.createdAt, { addSuffix: true })}</Text>
              </View>
              <Text style={styles.modAuthor}>Reported content</Text>
              {item.reportReasons?.length > 0 && (
                <Text style={styles.modReason}>⚠️ {item.reportReasons.join(' · ')}</Text>
              )}
              <View style={styles.modActions}>
                <TouchableOpacity
                  style={[styles.modBtn, styles.modBtnApprove]}
                  onPress={() => handleModAction(item, 'approved')}
                  accessibilityLabel="Approve"
                >
                  <Ionicons name="checkmark" size={15} color={Colors.success} />
                  <Text style={[styles.modBtnTxt, { color: Colors.success }]}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modBtn, styles.modBtnWarn]}
                  onPress={() => handleModAction(item, 'warned')}
                  accessibilityLabel="Warn"
                >
                  <Ionicons name="warning" size={15} color={Colors.warning} />
                  <Text style={[styles.modBtnTxt, { color: Colors.warning }]}>Warn</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modBtn, styles.modBtnRemove]}
                  onPress={() =>
                    Alert.alert('Remove', 'Remove this content?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => handleModAction(item, 'removed') },
                    ])
                  }
                  accessibilityLabel="Remove"
                >
                  <Ionicons name="trash" size={15} color={Colors.error} />
                  <Text style={[styles.modBtnTxt, { color: Colors.error }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight, backgroundColor: Colors.surface,
  },
  headerTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textPrimary },
  adminTag: { backgroundColor: Colors.errorLight, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radii.full },
  adminTagText: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.error },
  scroll: { padding: Spacing.xl, paddingBottom: 60 },
  sectionLabel: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.md, marginTop: Spacing.sm },
  pendingCount: { color: Colors.error },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radii.md,
    padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight,
  },
  statCardAlert: { borderColor: Colors.error + '60', backgroundColor: Colors.errorLight },
  statValue: { fontSize: FontSizes.xxl, fontWeight: '800' },
  statLabel: { fontSize: 11, color: Colors.textTertiary, fontWeight: '500', marginTop: 2 },
  linksCol: { gap: Spacing.sm, marginBottom: Spacing.xl },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  linkIcon: { width: 42, height: 42, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { flex: 1, fontSize: FontSizes.md, fontWeight: '600', color: Colors.textPrimary },
  emptyMod: { alignItems: 'center', paddingVertical: Spacing.xxxl, backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.borderLight },
  emptyModIcon: { fontSize: 36, marginBottom: Spacing.sm },
  emptyModText: { fontSize: FontSizes.md, color: Colors.textSecondary },
  modCard: {
    backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: Spacing.lg,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight,
    borderLeftWidth: 4, borderLeftColor: Colors.warning,
  },
  modMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  modTypeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radii.full },
  modTypeText: { fontSize: FontSizes.xs, fontWeight: '700', textTransform: 'capitalize' },
  modTime: { fontSize: FontSizes.xs, color: Colors.textTertiary },
  modAuthor: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: 4, fontWeight: '500' },
  modReason: { fontSize: FontSizes.sm, color: Colors.warning, marginBottom: Spacing.md },
  modActions: { flexDirection: 'row', gap: Spacing.sm },
  modBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 9, borderRadius: Radii.md, borderWidth: 1,
  },
  modBtnApprove: { borderColor: Colors.success, backgroundColor: Colors.successLight },
  modBtnWarn: { borderColor: Colors.warning, backgroundColor: Colors.warningLight },
  modBtnRemove: { borderColor: Colors.error, backgroundColor: Colors.errorLight },
  modBtnTxt: { fontSize: FontSizes.xs, fontWeight: '700' },
});
