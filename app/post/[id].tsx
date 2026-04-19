// app/post/[id].tsx
import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { fetchPostById, subscribeToComments, addComment, toggleLikePost, reportPost } from '@/services/postsService';
import { useAuthStore } from '@/store/authStore';
import { Colors, FontSizes, Spacing, Radii } from '@/constants/theme';
import { Post, Comment } from '@/types';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchPostById(id).then((p) => {
      setPost(p);
      setLoading(false);
      if (p) navigation.setOptions({ title: p.title || 'Post' });
    });
    const unsub = subscribeToComments(id, setComments);
    return unsub;
  }, [id]);

  async function handleLike() {
    if (!user || !post) return;
    const liked = post.likedBy.includes(user.uid);
    setPost((prev) =>
      prev
        ? {
            ...prev,
            liked: !liked,
            likeCount: liked ? prev.likeCount - 1 : prev.likeCount + 1,
            likedBy: liked ? prev.likedBy.filter((u) => u !== user.uid) : [...prev.likedBy, user.uid],
          }
        : prev
    );
    await toggleLikePost(post.id, user.uid, liked);
  }

  async function handleSubmitComment() {
    if (!user || !commentText.trim()) return;
    setSubmitting(true);
    try {
      await addComment(id, user.uid, user.displayName, user.photoURL, commentText.trim());
      setCommentText('');
      scrollRef.current?.scrollToEnd({ animated: true });
    } catch {
      Alert.alert('Error', 'Could not post comment.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReport() {
    Alert.alert('Report Post', 'Why are you reporting this post?', [
      { text: 'Inappropriate content', onPress: () => reportPost(id, 'Inappropriate content') },
      { text: 'Spam', onPress: () => reportPost(id, 'Spam') },
      { text: 'Harassment', onPress: () => reportPost(id, 'Harassment') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }
  if (!post) {
    return <View style={styles.center}><Text>Post not found.</Text></View>;
  }

  const liked = post.likedBy.includes(user?.uid ?? '');

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Post */}
        <View style={styles.postCard}>
          <View style={styles.authorRow}>
            <View style={styles.avatar}>
              {post.authorPhotoURL
                ? <Image source={{ uri: post.authorPhotoURL }} style={styles.avatarImg} />
                : <Text style={styles.avatarText}>{post.authorName.charAt(0)}</Text>
              }
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{post.authorName}</Text>
              <Text style={styles.timeAgo}>{formatDistanceToNow(post.createdAt, { addSuffix: true })}</Text>
            </View>
            <TouchableOpacity onPress={handleReport} accessibilityLabel="Report post">
              <Ionicons name="flag-outline" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {post.title ? <Text style={styles.title}>{post.title}</Text> : null}
          <Text style={styles.body}>{post.body}</Text>

          {post.mediaUrl && post.mediaType === 'image' && (
            <Image source={{ uri: post.mediaUrl }} style={styles.media} resizeMode="cover" />
          )}

          <View style={styles.postActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike}
              accessibilityLabel={`${liked ? 'Unlike' : 'Like'} post`}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={24} color={liked ? Colors.error : Colors.textTertiary} />
              <Text style={[styles.actionText, liked && { color: Colors.error }]}>{post.likeCount} likes</Text>
            </TouchableOpacity>
            <Text style={styles.commentCount}>{post.commentCount} comments</Text>
          </View>
        </View>

        {/* Comments */}
        <Text style={styles.commentsHeading}>Comments</Text>
        {comments.map((c) => (
          <View key={c.id} style={styles.commentCard}>
            <View style={styles.commentAvatar}>
              {c.authorPhotoURL
                ? <Image source={{ uri: c.authorPhotoURL }} style={styles.commentAvatarImg} />
                : <Text style={styles.commentAvatarText}>{c.authorName.charAt(0)}</Text>
              }
            </View>
            <View style={styles.commentBody}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{c.authorName}</Text>
                <Text style={styles.commentTime}>{formatDistanceToNow(c.createdAt, { addSuffix: true })}</Text>
              </View>
              <Text style={styles.commentText}>{c.body}</Text>
            </View>
          </View>
        ))}

        {comments.length === 0 && (
          <Text style={styles.noComments}>Be the first to comment!</Text>
        )}
      </ScrollView>

      {/* Comment input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment…"
          placeholderTextColor={Colors.textTertiary}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
          returnKeyType="send"
          accessibilityLabel="Comment text input"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!commentText.trim() || submitting) && styles.sendBtnDisabled]}
          onPress={handleSubmitComment}
          disabled={!commentText.trim() || submitting}
          accessibilityLabel="Send comment"
          accessibilityRole="button"
        >
          {submitting
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="send" size={20} color="#fff" />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  postCard: {
    backgroundColor: Colors.surface, borderRadius: Radii.lg,
    padding: Spacing.xl, marginBottom: Spacing.xl,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg, gap: Spacing.sm },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: 44, height: 44 },
  avatarText: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.primary },
  authorInfo: { flex: 1 },
  authorName: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textPrimary },
  timeAgo: { fontSize: FontSizes.xs, color: Colors.textTertiary },
  title: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  body: { fontSize: FontSizes.md, color: Colors.textSecondary, lineHeight: 24, marginBottom: Spacing.lg },
  media: { width: '100%', height: 220, borderRadius: Radii.md, marginBottom: Spacing.lg },
  postActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: FontSizes.sm, color: Colors.textTertiary, fontWeight: '600' },
  commentCount: { fontSize: FontSizes.sm, color: Colors.textTertiary },
  commentsHeading: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg },
  commentCard: {
    flexDirection: 'row', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radii.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  commentAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  commentAvatarImg: { width: 34, height: 34 },
  commentAvatarText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.primary },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  commentAuthor: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textPrimary },
  commentTime: { fontSize: FontSizes.xs, color: Colors.textTertiary },
  commentText: { fontSize: FontSizes.md, color: Colors.textSecondary, lineHeight: 20 },
  noComments: { textAlign: 'center', color: Colors.textTertiary, fontSize: FontSizes.md, marginTop: Spacing.xl },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    padding: Spacing.md, backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  input: {
    flex: 1, backgroundColor: Colors.background,
    borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
    fontSize: FontSizes.md, color: Colors.textPrimary, maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
