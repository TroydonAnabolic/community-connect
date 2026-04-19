// app/profile/trusted-contacts.tsx
import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, query, orderBy, getDocs, startAt, endAt, doc, getDoc,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { updateUserProfile } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { Colors, FontSizes, Spacing, Radii, ROLE_LABELS } from '@/constants/theme';
import { UserProfile } from '@/types';

export default function TrustedContactsScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [trustedProfiles, setTrustedProfiles] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load existing trusted contacts
  useEffect(() => {
    if (!user) return;
    loadTrustedProfiles();
  }, [user]);

  async function loadTrustedProfiles() {
    if (!user || user.trustedContacts.length === 0) {
      setTrustedProfiles([]);
      setLoading(false);
      return;
    }
    try {
      const profiles = await Promise.all(
        user.trustedContacts.map(async (uid) => {
          const snap = await getDoc(doc(db, 'users', uid));
          if (!snap.exists()) return null;
          const data = snap.data();
          return { uid: snap.id, ...data, createdAt: data.createdAt?.toDate() ?? new Date(), lastSeen: data.lastSeen?.toDate() ?? new Date() } as UserProfile;
        })
      );
      setTrustedProfiles(profiles.filter(Boolean) as UserProfile[]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(text: string) {
    setSearch(text);
    if (text.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('displayName'),
        startAt(text),
        endAt(text + '\uf8ff')
      );
      const snap = await getDocs(q);
      const results = snap.docs
        .map((d) => {
          const data = d.data();
          return { uid: d.id, ...data, createdAt: data.createdAt?.toDate() ?? new Date(), lastSeen: data.lastSeen?.toDate() ?? new Date() } as UserProfile;
        })
        .filter((u) => u.uid !== user?.uid && !user?.trustedContacts.includes(u.uid));
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  }

  async function addContact(contactUid: string) {
    if (!user) return;
    if (user.trustedContacts.length >= 5) {
      Alert.alert('Limit Reached', 'You can have up to 5 trusted contacts.');
      return;
    }
    const newList = [...user.trustedContacts, contactUid];
    await updateUserProfile(user.uid, { trustedContacts: newList });
    updateUser({ trustedContacts: newList });
    setSearch('');
    setSearchResults([]);
    await loadTrustedProfiles();
  }

  async function removeContact(contactUid: string) {
    if (!user) return;
    Alert.alert('Remove Contact', 'Remove this person as a trusted contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const newList = user.trustedContacts.filter((uid) => uid !== contactUid);
          await updateUserProfile(user.uid, { trustedContacts: newList });
          updateUser({ trustedContacts: newList });
          setTrustedProfiles((prev) => prev.filter((p) => p.uid !== contactUid));
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={Colors.info} />
        <Text style={styles.infoText}>
          Trusted contacts receive alerts if you miss a wellbeing check-in or mark yourself as unsafe.
          You can add up to 5 contacts.
        </Text>
      </View>

      {/* Search to add */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search community members to add…"
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={handleSearch}
          accessibilityLabel="Search trusted contacts"
        />
        {searching && <ActivityIndicator size="small" color={Colors.primary} />}
      </View>

      {/* Search results */}
      {searchResults.length > 0 && (
        <View style={styles.resultsPanel}>
          {searchResults.slice(0, 5).map((u) => {
            const roleInfo = ROLE_LABELS[u.role];
            return (
              <TouchableOpacity
                key={u.uid}
                style={styles.resultRow}
                onPress={() => addContact(u.uid)}
                accessibilityLabel={`Add ${u.displayName} as trusted contact`}
              >
                <View style={styles.resultAvatar}>
                  <Text style={styles.resultAvatarText}>{u.displayName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{u.displayName}</Text>
                  <Text style={[styles.resultRole, { color: roleInfo.color }]}>{roleInfo.label}</Text>
                </View>
                <View style={styles.addIconWrap}>
                  <Ionicons name="add-circle" size={26} color={Colors.primary} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Current trusted contacts */}
      <Text style={styles.currentTitle}>
        Your Trusted Contacts ({user?.trustedContacts.length ?? 0}/5)
      </Text>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : trustedProfiles.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🤝</Text>
          <Text style={styles.emptyTitle}>No trusted contacts yet</Text>
          <Text style={styles.emptyText}>Search above to add someone you trust.</Text>
        </View>
      ) : (
        <FlatList
          data={trustedProfiles}
          keyExtractor={(u) => u.uid}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const roleInfo = ROLE_LABELS[item.role];
            return (
              <View style={styles.contactCard}>
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactAvatarText}>{item.displayName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{item.displayName}</Text>
                  <Text style={[styles.contactRole, { color: roleInfo.color }]}>{roleInfo.label}</Text>
                  {item.phone && <Text style={styles.contactPhone}>{item.phone}</Text>}
                </View>
                <TouchableOpacity
                  onPress={() => removeContact(item.uid)}
                  style={styles.removeBtn}
                  accessibilityLabel={`Remove ${item.displayName}`}
                >
                  <Ionicons name="close-circle" size={22} color={Colors.error} />
                </TouchableOpacity>
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
  infoBox: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    backgroundColor: Colors.infoLight, margin: Spacing.xl, marginBottom: Spacing.md,
    borderRadius: Radii.md, padding: Spacing.md,
  },
  infoText: { flex: 1, fontSize: FontSizes.sm, color: Colors.info, lineHeight: 20 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, marginHorizontal: Spacing.xl, marginBottom: Spacing.sm,
    borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: FontSizes.md, color: Colors.textPrimary },
  resultsPanel: {
    backgroundColor: Colors.surface, marginHorizontal: Spacing.xl, borderRadius: Radii.lg,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md, overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  resultAvatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  resultAvatarText: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.primary },
  resultInfo: { flex: 1 },
  resultName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.textPrimary },
  resultRole: { fontSize: FontSizes.xs, fontWeight: '600', marginTop: 2 },
  addIconWrap: {},
  currentTitle: {
    fontSize: FontSizes.md, fontWeight: '700', color: Colors.textPrimary,
    paddingHorizontal: Spacing.xl, marginBottom: Spacing.md,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: FontSizes.md, color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  contactCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: Spacing.lg,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.borderLight,
  },
  contactAvatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  contactAvatarText: { fontSize: FontSizes.lg, fontWeight: '700', color: '#fff' },
  contactInfo: { flex: 1 },
  contactName: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textPrimary },
  contactRole: { fontSize: FontSizes.xs, fontWeight: '600', marginTop: 2 },
  contactPhone: { fontSize: FontSizes.xs, color: Colors.textTertiary, marginTop: 2 },
  removeBtn: { padding: 4 },
});
