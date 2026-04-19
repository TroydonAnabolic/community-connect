// app/post/new.tsx
import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/services/firebase';
import { createPost } from '@/services/postsService';
import { useAuthStore } from '@/store/authStore';
import { Colors, FontSizes, Spacing, Radii, POST_CATEGORIES } from '@/constants/theme';
import { PostCategory } from '@/types';

const CATEGORIES = POST_CATEGORIES.filter((c) => c.key !== 'all');

export default function NewPostScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<PostCategory>('general');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function uploadImage(uri: string): Promise<string> {
    const resp = await fetch(uri);
    const blob = await resp.blob();
    const storageRef = ref(storage, `posts/${user!.uid}/${Date.now()}.jpg`);
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  }

  async function handleSubmit() {
    if (!body.trim()) return Alert.alert('Required', 'Please write something before posting.');
    if (!user) return;
    try {
      setLoading(true);
      let mediaUrl: string | undefined;
      if (imageUri) mediaUrl = await uploadImage(imageUri);
      await createPost(user.uid, user.displayName, user.photoURL, category, body.trim(), title.trim() || undefined, mediaUrl);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not create post.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Cancel">
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <TouchableOpacity
            style={[styles.postBtn, (!body.trim() || loading) && styles.postBtnDisabled]}
            onPress={handleSubmit}
            disabled={!body.trim() || loading}
            accessibilityLabel="Publish post"
            accessibilityRole="button"
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.postBtnText}>Post</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            <View style={styles.catRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.catChip, category === c.key && styles.catChipActive]}
                  onPress={() => setCategory(c.key as PostCategory)}
                  accessibilityLabel={`Category: ${c.label}`}
                  accessibilityRole="radio"
                >
                  <Text style={[styles.catChipText, category === c.key && styles.catChipTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Title */}
          <Text style={styles.label}>Title (optional)</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Add a title…"
            placeholderTextColor={Colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            maxLength={120}
            returnKeyType="next"
            accessibilityLabel="Post title"
          />

          {/* Body */}
          <Text style={styles.label}>What's on your mind? *</Text>
          <TextInput
            style={styles.bodyInput}
            placeholder="Share with your community…"
            placeholderTextColor={Colors.textTertiary}
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={2000}
            textAlignVertical="top"
            accessibilityLabel="Post body"
          />
          <Text style={styles.charCount}>{body.length}/2000</Text>

          {/* Image */}
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} accessibilityLabel="Add photo">
            {imageUri ? (
              <View style={styles.imagePreviewRow}>
                <Ionicons name="image" size={20} color={Colors.primary} />
                <Text style={styles.imagePickerText}>Photo added ✓</Text>
                <TouchableOpacity onPress={() => setImageUri(null)} accessibilityLabel="Remove photo">
                  <Ionicons name="close-circle" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePickerRow}>
                <Ionicons name="image-outline" size={20} color={Colors.textTertiary} />
                <Text style={styles.imagePickerPlaceholder}>Add a photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  cancel: { fontSize: FontSizes.md, color: Colors.textSecondary },
  headerTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.textPrimary },
  postBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg,
    paddingVertical: 8, borderRadius: Radii.full,
  },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.md },
  content: { padding: Spacing.xl, gap: Spacing.sm, paddingBottom: 60 },
  label: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4, marginTop: Spacing.md },
  catScroll: { marginBottom: Spacing.sm },
  catRow: { flexDirection: 'row', gap: Spacing.sm },
  catChip: {
    paddingHorizontal: Spacing.lg, paddingVertical: 8,
    borderRadius: Radii.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary },
  catChipTextActive: { color: '#fff' },
  titleInput: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radii.md, paddingHorizontal: Spacing.lg, paddingVertical: 14,
    fontSize: FontSizes.lg, color: Colors.textPrimary, fontWeight: '600',
  },
  bodyInput: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radii.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
    fontSize: FontSizes.md, color: Colors.textPrimary, lineHeight: 24, minHeight: 160,
  },
  charCount: { fontSize: FontSizes.xs, color: Colors.textTertiary, textAlign: 'right', marginTop: -4 },
  imagePicker: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radii.md, padding: Spacing.lg, marginTop: Spacing.sm,
  },
  imagePickerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  imagePreviewRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  imagePickerPlaceholder: { fontSize: FontSizes.md, color: Colors.textTertiary },
  imagePickerText: { fontSize: FontSizes.md, color: Colors.primary, flex: 1 },
});
