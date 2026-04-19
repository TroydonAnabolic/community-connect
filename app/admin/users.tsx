// app/admin/users.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Switch, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, query, orderBy, limit, getDocs,
  updateDoc, doc, startAfter, DocumentSnapshot, where,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Colors, FontSizes, Spacing, Radii, ROLE_LABELS } from '@/constants/theme';
import { UserProfile, UserRole } from '@/types';
import { formatDistanceToNow } from 'date-fns';

const PAGE_SIZE = 20;

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');

  const loadUsers = useCallback(async (reset = false) => {
    if (reset) { setLoading(true); setLastDoc(null); }
    else setLoadingMore(true);

    try {
      let q = filterRole === 'all'
        ? query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE))
        : query(collection(db, 'users'), where('role', '==', filterRole), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));

      if (!reset && lastDoc) q = query(q, startAfter(lastDoc));

      const snap = await getDocs(q);
      const newUsers = snap.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          ...data,
          createdAt: data.createdAt?.toDate() ?? new Date(),
          lastSeen: data.lastSeen?.toDate() ?? new Date(),
        } as UserProfile;
      });

      setUsers((prev) => reset ? newUsers : [...prev, ...newUsers]);
      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filterRole, lastDoc]);

  useEffect(() => { loadUsers(true); }, [filterRole]);

  async function toggleBan(user: UserProfile) {
    const action = user.isBanned ? 'unban' : 'ban';
    Alert.alert(
      `${action === 'ban' ? 'Ban' : 'Unban'} User`,
      `Are you sure you want to ${action} ${user.displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'ban' ? 'Ban' : 'Unban',
          style: action === 'ban' ? 'destructive' : 'default',
          onPress: async () => {
            await updateDoc(doc(db, 'users', user.uid), { isBanned: !user.isBanned });
            setUsers((prev) =>
              prev.map((u) => u.uid === user.uid ? { ...u, isBanned: !u.isBanned } : u)
            );
          },
        },
      ]
    );
  }

  async function changeRole(user: UserProfile, newRole: UserRole) {
    await updateDoc(doc(db, 'users', user.uid), { role: newRole });
    setUsers((prev) => prev.map((u) => u.uid === user.uid ? { ...u, role: newRole } : u));
  }

  function handleRoleChange(user: UserProfile) {
    const roles: UserRole[] = ['senior', 'caregiver', 'organisation', 'admin'];
    Alert.alert(
      'Change Role',
      `Current role: ${user.role}`,
      [
        ...roles.filter((r) => r !== user.role).map((r) => ({
          text: ROLE_LABELS[r].label,
          onPress: () => changeRole(user, r),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          u.displayName.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const ROLE_FILTERS: { key: UserRole | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'senior', label: 'Seniors' },
    { key: 'caregiver', label: 'Caregivers' },
    { key: 'organisation', label: 'Orgs' },
    { key: 'admin', label: 'Admins' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search name or email…"
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Search users"
        />
      </View>

      {/* Role filter pills */}
      <View style={styles.filterRow}>
        {ROLE_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterPill, filterRole === f.key && styles.filterPillActive]}
            onPress={() => setFilterRole(f.key)}
            accessibilityLabel={`Filter by ${f.label}`}
          >
            <Text style={[styles.filterPillText, filterRole === f.key && styles.filterPillTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(u) => u.uid}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
          onEndReached={() => {
            if (hasMore && !loadingMore && !search) loadUsers(false);
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={Colors.primary} style={{ margin: 20 }} /> : null
          }
          renderItem={({ item: user }) => {
            const roleInfo = ROLE_LABELS[user.role];
            return (
              <View style={[styles.userCard, user.isBanned && styles.userCardBanned]}>
                {/* Header row */}
                <View style={styles.userHeader}>
                  <View style={styles.avatar}>
                    {user.photoURL ? (
                      <Image source={{ uri: user.photoURL }} style={styles.avatarImg} />
                    ) : (
                      <Text style={styles.avatarText}>{user.displayName.charAt(0).toUpperCase()}</Text>
                    )}
                  </View>
                  <View style={styles.userInfo}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userName}>{user.displayName}</Text>
                      {user.isBanned && (
                        <View style={styles.bannedBadge}>
                          <Text style={styles.bannedText}>Banned</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
                    <Text style={styles.userSeen}>
                      Last seen {formatDistanceToNow(user.lastSeen, { addSuffix: true })}
                    </Text>
                  </View>
                </View>

                {/* Role + actions row */}
                <View style={styles.userActions}>
                  <TouchableOpacity
                    style={[styles.roleBadge, { backgroundColor: roleInfo.color + '20' }]}
                    onPress={() => handleRoleChange(user)}
                    accessibilityLabel={`Change role. Current: ${roleInfo.label}`}
                  >
                    <Text style={[styles.roleText, { color: roleInfo.color }]}>{roleInfo.label}</Text>
                    <Ionicons name="chevron-down" size={12} color={roleInfo.color} />
                  </TouchableOpacity>

                  <View style={styles.actionBtns}>
                    <TouchableOpacity
                      style={[styles.actionBtn, user.isBanned ? styles.actionBtnUnban : styles.actionBtnBan]}
                      onPress={() => toggleBan(user)}
                      accessibilityLabel={user.isBanned ? `Unban ${user.displayName}` : `Ban ${user.displayName}`}
                    >
                      <Ionicons
                        name={user.isBanned ? 'checkmark-circle-outline' : 'ban-outline'}
                        size={16}
                        color={user.isBanned ? Colors.success : Colors.error}
                      />
                      <Text style={[styles.actionBtnText, { color: user.isBanned ? Colors.success : Colors.error }]}>
                        {user.isBanned ? 'Unban' : 'Ban'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, margin: Spacing.xl,
    marginBottom: Spacing.sm, borderRadius: Radii.lg,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: FontSizes.md, color: Colors.textPrimary },
  filterRow: {
    flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md, flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radii.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterPillText: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.textSecondary },
  filterPillTextActive: { color: '#fff' },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: FontSizes.md, color: Colors.textTertiary },
  userCard: {
    backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: Spacing.lg,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight,
  },
  userCardBanned: { borderColor: Colors.error + '40', backgroundColor: Colors.errorLight },
  userHeader: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: 46, height: 46 },
  avatarText: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.primary },
  userInfo: { flex: 1 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  userName: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textPrimary },
  bannedBadge: { backgroundColor: Colors.errorLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radii.full },
  bannedText: { fontSize: 10, fontWeight: '700', color: Colors.error },
  userEmail: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  userSeen: { fontSize: FontSizes.xs, color: Colors.textTertiary, marginTop: 2 },
  userActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radii.full,
  },
  roleText: { fontSize: FontSizes.xs, fontWeight: '700' },
  actionBtns: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radii.md, borderWidth: 1,
  },
  actionBtnBan: { borderColor: Colors.error, backgroundColor: Colors.errorLight },
  actionBtnUnban: { borderColor: Colors.success, backgroundColor: Colors.successLight },
  actionBtnText: { fontSize: FontSizes.xs, fontWeight: '700' },
});
