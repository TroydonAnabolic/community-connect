// app/messages/new.tsx
import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy, startAt, endAt } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { getOrCreateConversation } from '@/services/messagingService';
import { useAuthStore } from '@/store/authStore';
import { Colors, FontSizes, Spacing, Radii, ROLE_LABELS } from '@/constants/theme';
import { UserProfile } from '@/types';

export default function NewMessageScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(text: string) {
    setSearch(text);
    if (text.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('displayName'),
        startAt(text),
        endAt(text + '\uf8ff')
      );
      const snap = await getDocs(q);
      const users = snap.docs
        .map((d) => ({ uid: d.id, ...d.data() } as UserProfile))
        .filter((u) => u.uid !== user?.uid && !u.isBanned);
      setResults(users);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(other: UserProfile) {
    if (!user) return;
    try {
      const convId = await getOrCreateConversation(user.uid, other.uid, user.displayName, other.displayName);
      router.replace(`/chat/${convId}`);
    } catch {
      Alert.alert('Error', 'Could not open conversation.');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Message</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name…"
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={handleSearch}
          autoFocus
          accessibilityLabel="Search community members"
        />
        {loading && <ActivityIndicator size="small" color={Colors.primary} />}
      </View>

      <FlatList
        data={results}
        keyExtractor={(u) => u.uid}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          search.length >= 2 && !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No members found for "{search}"</Text>
            </View>
          ) : search.length < 2 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Type at least 2 characters to search</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const roleInfo = ROLE_LABELS[item.role];
          return (
            <TouchableOpacity
              style={styles.userRow}
              onPress={() => handleSelect(item)}
              accessibilityLabel={`Message ${item.displayName}`}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.displayName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.displayName}</Text>
                <View style={[styles.roleBadge, { backgroundColor: roleInfo.color + '20' }]}>
                  <Text style={[styles.roleText, { color: roleInfo.color }]}>{roleInfo.label}</Text>
                </View>
              </View>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  headerTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textPrimary },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, marginHorizontal: Spacing.xl, marginBottom: Spacing.sm,
    borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: FontSizes.md, color: Colors.textPrimary },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: FontSizes.md, color: Colors.textTertiary, textAlign: 'center' },
  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: Spacing.lg,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.borderLight,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: FontSizes.lg, fontWeight: '700', color: '#fff' },
  userInfo: { flex: 1 },
  userName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 2, borderRadius: Radii.full },
  roleText: { fontSize: FontSizes.xs, fontWeight: '700' },
});
