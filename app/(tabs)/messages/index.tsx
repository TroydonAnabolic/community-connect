// app/(tabs)/messages/index.tsx
import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { subscribeToConversations } from '@/services/messagingService';
import { useAuthStore } from '@/store/authStore';
import { Colors, FontSizes, Spacing, Radii } from '@/constants/theme';
import { DirectMessage } from '@/types';

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToConversations(user.uid, (convs) => {
      setConversations(convs);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const filtered = search.trim()
    ? conversations.filter((c) =>
        Object.values((c as any).participantNames ?? {})
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : conversations;

  function getOtherParticipant(conv: DirectMessage & { participantNames?: Record<string, string> }) {
    const otherId = conv.participants.find((id) => id !== user?.uid) ?? '';
    const otherName = conv.participantNames?.[otherId] ?? 'Unknown';
    return { otherId, otherName };
  }

  function getUnread(conv: DirectMessage) {
    return conv.unreadCount?.[user?.uid ?? ''] ?? 0;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity
          style={styles.composeBtn}
          onPress={() => router.push('/messages/new')}
          accessibilityLabel="New message"
          accessibilityRole="button"
        >
          <Ionicons name="create-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations…"
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Search messages"
        />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💌</Text>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyText}>Start a private conversation with a community member.</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push('/messages/new')}
                accessibilityRole="button"
              >
                <Text style={styles.emptyBtnText}>Start a Conversation</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const conv = item as DirectMessage & { participantNames?: Record<string, string> };
            const { otherId, otherName } = getOtherParticipant(conv);
            const unread = getUnread(conv);
            const isLastByMe = conv.lastMessageBy === user?.uid;

            return (
              <TouchableOpacity
                style={[styles.convRow, unread > 0 && styles.convRowUnread]}
                onPress={() => router.push(`/chat/${conv.id}`)}
                accessibilityLabel={`Conversation with ${otherName}. ${unread > 0 ? `${unread} unread messages.` : ''}`}
                accessibilityRole="button"
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{otherName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.convInfo}>
                  <View style={styles.convTopRow}>
                    <Text style={[styles.convName, unread > 0 && styles.convNameBold]}>{otherName}</Text>
                    <Text style={styles.convTime}>
                      {conv.lastMessageAt ? formatDistanceToNow(conv.lastMessageAt, { addSuffix: true }) : ''}
                    </Text>
                  </View>
                  <Text style={[styles.convPreview, unread > 0 && styles.convPreviewBold]} numberOfLines={1}>
                    {isLastByMe ? 'You: ' : ''}{conv.lastMessage || 'Start chatting'}
                  </Text>
                </View>
                {unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{unread > 9 ? '9+' : unread}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md },
  headerTitle: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  composeBtn: { padding: Spacing.sm },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
    borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md,
  },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: FontSizes.md, color: Colors.textPrimary },
  list: { paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: Spacing.xxxl },
  emptyIcon: { fontSize: 52, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptyText: { fontSize: FontSizes.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    marginTop: Spacing.xl, backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl, paddingVertical: 14, borderRadius: Radii.lg,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.md },
  convRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  convRowUnread: { backgroundColor: Colors.primaryLight },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: FontSizes.xl, fontWeight: '700', color: '#fff' },
  convInfo: { flex: 1 },
  convTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  convName: { fontSize: FontSizes.md, color: Colors.textPrimary, fontWeight: '500' },
  convNameBold: { fontWeight: '700' },
  convTime: { fontSize: FontSizes.xs, color: Colors.textTertiary },
  convPreview: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  convPreviewBold: { fontWeight: '600', color: Colors.textPrimary },
  unreadBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
