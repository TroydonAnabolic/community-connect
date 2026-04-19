// components/feed/PostCard.tsx
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { Colors, FontSizes, Spacing, Radii } from '@/constants/theme';
import { Post } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  general: Colors.textTertiary,
  safety: Colors.error,
  health: '#1D9E75',
  social: Colors.accent,
  news: Colors.info,
  support: '#BA7517',
  announcements: Colors.primary,
};

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onPress: () => void;
  onLike: () => void;
}

export default function PostCard({ post, currentUserId, onPress, onLike }: PostCardProps) {
  const liked = post.likedBy.includes(currentUserId);
  const timeAgo = formatDistanceToNow(post.createdAt, { addSuffix: true });
  const catColor = CATEGORY_COLORS[post.category] ?? Colors.textTertiary;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={`Post by ${post.authorName}: ${post.body.slice(0, 60)}`}
      accessibilityRole="button"
    >
      {/* Author row */}
      <View style={styles.authorRow}>
        <View style={styles.avatar}>
          {post.authorPhotoURL ? (
            <Image source={{ uri: post.authorPhotoURL }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarText}>{post.authorName.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{post.authorName}</Text>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>
        <View style={[styles.catBadge, { backgroundColor: catColor + '20' }]}>
          <Text style={[styles.catText, { color: catColor }]}>{post.category}</Text>
        </View>
      </View>

      {/* Content */}
      {post.title ? <Text style={styles.title}>{post.title}</Text> : null}
      <Text style={styles.body} numberOfLines={4}>{post.body}</Text>

      {/* Media preview */}
      {post.mediaUrl && post.mediaType === 'image' ? (
        <Image source={{ uri: post.mediaUrl }} style={styles.media} resizeMode="cover" />
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onLike}
          accessibilityLabel={liked ? `Unlike post. ${post.likeCount} likes` : `Like post. ${post.likeCount} likes`}
          accessibilityRole="button"
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? Colors.error : Colors.textTertiary}
          />
          <Text style={[styles.actionText, liked && { color: Colors.error }]}>{post.likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onPress}
          accessibilityLabel={`${post.commentCount} comments`}
        >
          <Ionicons name="chatbubble-outline" size={20} color={Colors.textTertiary} />
          <Text style={styles.actionText}>{post.commentCount}</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />
        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.sm },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: 40, height: 40 },
  avatarText: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.primary },
  authorInfo: { flex: 1 },
  authorName: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textPrimary },
  timeAgo: { fontSize: FontSizes.xs, color: Colors.textTertiary, marginTop: 1 },
  catBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radii.full },
  catText: { fontSize: FontSizes.xs, fontWeight: '700', textTransform: 'capitalize' },
  title: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  body: { fontSize: FontSizes.md, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.md },
  media: { width: '100%', height: 200, borderRadius: Radii.md, marginBottom: Spacing.md },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: FontSizes.sm, color: Colors.textTertiary, fontWeight: '600' },
  spacer: { flex: 1 },
});
