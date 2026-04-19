// app/admin/content.tsx
import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Switch, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Colors, FontSizes, Spacing, Radii } from '@/constants/theme';
import { WellbeingContent } from '@/types';
import { format } from 'date-fns';

type ContentCategory = 'safety' | 'health' | 'social' | 'mental_health' | 'exercise';
type ContentType = 'tip' | 'article' | 'checkin_prompt';

const CATEGORIES: { key: ContentCategory; label: string; emoji: string }[] = [
  { key: 'safety', label: 'Safety', emoji: '🔒' },
  { key: 'health', label: 'Health', emoji: '❤️' },
  { key: 'social', label: 'Social', emoji: '🤝' },
  { key: 'mental_health', label: 'Mental Health', emoji: '🧠' },
  { key: 'exercise', label: 'Exercise', emoji: '🏃' },
];

const TYPES: { key: ContentType; label: string }[] = [
  { key: 'tip', label: 'Tip' },
  { key: 'article', label: 'Article' },
  { key: 'checkin_prompt', label: 'Check-in Prompt' },
];

const CATEGORY_EMOJIS: Record<string, string> = {
  safety: '🔒', health: '❤️', social: '🤝', mental_health: '🧠', exercise: '🏃',
};

export default function AdminContentScreen() {
  const [content, setContent] = useState<WellbeingContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<WellbeingContent | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formCategory, setFormCategory] = useState<ContentCategory>('health');
  const [formType, setFormType] = useState<ContentType>('tip');
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'wellbeing_content'), orderBy('publishedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setContent(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            publishedAt: data.publishedAt?.toDate() ?? new Date(),
          } as WellbeingContent;
        })
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  function openCreate() {
    setEditItem(null);
    setFormTitle('');
    setFormBody('');
    setFormCategory('health');
    setFormType('tip');
    setFormActive(true);
    setModalVisible(true);
  }

  function openEdit(item: WellbeingContent) {
    setEditItem(item);
    setFormTitle(item.title);
    setFormBody(item.body);
    setFormCategory(item.category as ContentCategory);
    setFormType(item.type as ContentType);
    setFormActive(item.isActive);
    setModalVisible(true);
  }

  async function handleSave() {
    if (!formTitle.trim() || !formBody.trim()) {
      Alert.alert('Required', 'Please fill in title and body.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: formTitle.trim(),
        body: formBody.trim(),
        category: formCategory,
        type: formType,
        isActive: formActive,
      };
      if (editItem) {
        await updateDoc(doc(db, 'wellbeing_content', editItem.id), payload);
      } else {
        await addDoc(collection(db, 'wellbeing_content'), {
          ...payload,
          publishedAt: serverTimestamp(),
        });
      }
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item: WellbeingContent) {
    await updateDoc(doc(db, 'wellbeing_content', item.id), { isActive: !item.isActive });
  }

  async function handleDelete(item: WellbeingContent) {
    Alert.alert('Delete Content', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => { await deleteDoc(doc(db, 'wellbeing_content', item.id)); },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.topBar}>
        <Text style={styles.count}>{content.length} items</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={openCreate}
          accessibilityLabel="Add content"
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add Content</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={content}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>No wellbeing content yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.contentCard, !item.isActive && styles.contentCardInactive]}>
              <View style={styles.contentHeader}>
                <Text style={styles.contentEmoji}>{CATEGORY_EMOJIS[item.category] ?? '📌'}</Text>
                <View style={styles.contentMeta}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>{item.type}</Text>
                  </View>
                  <Text style={styles.contentDate}>{format(item.publishedAt, 'd MMM yyyy')}</Text>
                </View>
                <Switch
                  value={item.isActive}
                  onValueChange={() => toggleActive(item)}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor="#fff"
                  accessibilityLabel={`Toggle ${item.title} active state`}
                />
              </View>
              <Text style={styles.contentTitle}>{item.title}</Text>
              <Text style={styles.contentBody} numberOfLines={2}>{item.body}</Text>
              <View style={styles.contentActions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => openEdit(item)}
                  accessibilityLabel={`Edit ${item.title}`}
                >
                  <Ionicons name="pencil-outline" size={15} color={Colors.primary} />
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item)}
                  accessibilityLabel={`Delete ${item.title}`}
                >
                  <Ionicons name="trash-outline" size={15} color={Colors.error} />
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} accessibilityLabel="Close">
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editItem ? 'Edit Content' : 'New Content'}</Text>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              accessibilityLabel="Save content"
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.saveBtnText}>Save</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.formLabel}>Type</Text>
            <View style={styles.typeRow}>
              {TYPES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeChip, formType === t.key && styles.typeChipActive]}
                  onPress={() => setFormType(t.key)}
                  accessibilityLabel={`Content type: ${t.label}`}
                >
                  <Text style={[styles.typeChipText, formType === t.key && styles.typeChipTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Category</Text>
            <View style={styles.catRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.catChip, formCategory === c.key && styles.catChipActive]}
                  onPress={() => setFormCategory(c.key)}
                  accessibilityLabel={`Category: ${c.label}`}
                >
                  <Text style={styles.catChipEmoji}>{c.emoji}</Text>
                  <Text style={[styles.catChipText, formCategory === c.key && styles.catChipTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Title</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Content title"
              placeholderTextColor={Colors.textTertiary}
              value={formTitle}
              onChangeText={setFormTitle}
              maxLength={120}
              accessibilityLabel="Content title"
            />

            <Text style={styles.formLabel}>Body</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              placeholder="Content body text…"
              placeholderTextColor={Colors.textTertiary}
              value={formBody}
              onChangeText={setFormBody}
              multiline
              maxLength={2000}
              textAlignVertical="top"
              accessibilityLabel="Content body"
            />

            <View style={styles.activeRow}>
              <Text style={styles.formLabel}>Active</Text>
              <Switch
                value={formActive}
                onValueChange={setFormActive}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor="#fff"
                accessibilityLabel="Toggle active state"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  count: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg,
    paddingVertical: 9, borderRadius: Radii.full,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.sm },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.md },
  emptyText: { fontSize: FontSizes.md, color: Colors.textTertiary },
  contentCard: {
    backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: Spacing.lg,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight,
  },
  contentCardInactive: { opacity: 0.55 },
  contentHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  contentEmoji: { fontSize: 22 },
  contentMeta: { flex: 1, gap: 2 },
  typeBadge: { alignSelf: 'flex-start', backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radii.full },
  typeText: { fontSize: 10, fontWeight: '700', color: Colors.primaryDark, textTransform: 'capitalize' },
  contentDate: { fontSize: FontSizes.xs, color: Colors.textTertiary },
  contentTitle: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  contentBody: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.md },
  contentActions: { flexDirection: 'row', gap: Spacing.md },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.primary,
  },
  editBtnText: { fontSize: FontSizes.xs, color: Colors.primary, fontWeight: '700' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.error,
  },
  deleteBtnText: { fontSize: FontSizes.xs, color: Colors.error, fontWeight: '700' },
  // Modal
  modalSafe: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  modalCancel: { fontSize: FontSizes.md, color: Colors.textSecondary },
  modalTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.textPrimary },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: 8, borderRadius: Radii.full },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.md },
  modalContent: { padding: Spacing.xl, gap: 4, paddingBottom: 60 },
  formLabel: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: 6 },
  formInput: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radii.md, paddingHorizontal: Spacing.lg, paddingVertical: 14,
    fontSize: FontSizes.md, color: Colors.textPrimary,
  },
  formTextArea: { minHeight: 120, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', gap: Spacing.sm },
  typeChip: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: Radii.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  typeChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  typeChipText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary },
  typeChipTextActive: { color: Colors.primaryDark },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: Radii.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  catChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  catChipEmoji: { fontSize: 14 },
  catChipText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary },
  catChipTextActive: { color: Colors.primaryDark },
  activeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.lg },
});
