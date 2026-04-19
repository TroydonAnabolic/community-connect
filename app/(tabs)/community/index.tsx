// app/(tabs)/community/index.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, Radii, POST_CATEGORIES } from '@/constants/theme';
import { subscribeToPosts, toggleLikePost } from '@/services/postsService';
import { useAuthStore } from '@/store/authStore';
import { Post, PostCategory } from '@/types';
import PostCard from '@/components/feed/PostCard';

export default function CommunityScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState<PostCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToPosts(category, (newPosts) => {
      setPosts(newPosts);
      setLoading(false);
    });
    return unsub;
  }, [category]);

  const filtered = search.trim()
    ? posts.filter(
        (p) =>
          p.body.toLowerCase().includes(search.toLowerCase()) ||
          p.authorName.toLowerCase().includes(search.toLowerCase()) ||
          (p.title ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : posts;

  async function handleLike(post: Post) {
    if (!user) return;
    const liked = post.likedBy.includes(user.uid);
    await toggleLikePost(post.id, user.uid, liked);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day, {user?.displayName?.split(' ')[0]} 👋</Text>
          <Text style={styles.headerTitle}>Community</Text>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => router.push('/notifications')}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={20} color={Colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search discussions…"
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          accessibilityLabel="Search posts"
        />
      </View>

      {/* Category pills */}
      <FlatList
        horizontal
        data={POST_CATEGORIES}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.catPill, category === item.key && styles.catPillActive]}
            onPress={() => setCategory(item.key as PostCategory | 'all')}
            accessibilityLabel={`Filter by ${item.label}`}
            accessibilityRole="button"
          >
            <Text style={[styles.catText, category === item.key && styles.catTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Posts */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptyText}>Be the first to start a discussion!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              currentUserId={user?.uid ?? ''}
              onPress={() => router.push(`/post/${item.id}`)}
              onLike={() => handleLike(item)}
            />
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/post/new')}
        accessibilityLabel="Create new post"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  greeting: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  headerTitle: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  notifBtn: { padding: Spacing.sm },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: FontSizes.md, color: Colors.textPrimary },
  catList: { paddingHorizontal: Spacing.xl, gap: Spacing.sm, paddingBottom: Spacing.md },
  catPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  catPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary },
  catTextActive: { color: '#fff' },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 52, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: FontSizes.md, color: Colors.textSecondary, marginTop: Spacing.sm },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
