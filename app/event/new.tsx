// app/event/new.tsx
import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, addHours } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { createEvent } from '@/services/eventsService';
import { useAuthStore } from '@/store/authStore';
import { Colors, FontSizes, Spacing, Radii, EVENT_CATEGORIES } from '@/constants/theme';
import { EventCategory } from '@/types';

type PickerMode = 'start-date' | 'start-time' | 'end-date' | 'end-time' | null;

export default function NewEventScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('social');
  const [location, setLocation] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [onlineUrl, setOnlineUrl] = useState('');
  const [startsAt, setStartsAt] = useState(addHours(new Date(), 1));
  const [endsAt, setEndsAt] = useState(addHours(new Date(), 2));
  const [maxAttendees, setMaxAttendees] = useState('');
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [loading, setLoading] = useState(false);

  function handleDateChange(_: any, date?: Date) {
    if (!date) { setPickerMode(null); return; }
    if (pickerMode === 'start-date' || pickerMode === 'start-time') {
      const updated = new Date(startsAt);
      if (pickerMode === 'start-date') { updated.setFullYear(date.getFullYear(), date.getMonth(), date.getDate()); }
      else { updated.setHours(date.getHours(), date.getMinutes()); }
      setStartsAt(updated);
    } else if (pickerMode === 'end-date' || pickerMode === 'end-time') {
      const updated = new Date(endsAt);
      if (pickerMode === 'end-date') { updated.setFullYear(date.getFullYear(), date.getMonth(), date.getDate()); }
      else { updated.setHours(date.getHours(), date.getMinutes()); }
      setEndsAt(updated);
    }
    if (Platform.OS === 'android') setPickerMode(null);
  }

  async function handleCreate() {
    if (!title.trim()) return Alert.alert('Required', 'Please enter an event title.');
    if (!description.trim()) return Alert.alert('Required', 'Please add a description.');
    if (!isOnline && !location.trim()) return Alert.alert('Required', 'Please enter a location or mark as online.');
    if (startsAt >= endsAt) return Alert.alert('Invalid Time', 'End time must be after start time.');
    if (!user) return;
    try {
      setLoading(true);
      const id = await createEvent(user.uid, user.displayName, user.photoURL, {
        title: title.trim(),
        description: description.trim(),
        category,
        location: isOnline ? 'Online' : location.trim(),
        startsAt,
        endsAt,
        isOnline,
        onlineUrl: isOnline ? onlineUrl.trim() : undefined,
        maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
      });
      router.replace(`/event/${id}`);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not create event.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Cancel">
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
          <TouchableOpacity
            style={[styles.createBtn, (!title.trim() || loading) && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={!title.trim() || loading}
            accessibilityLabel="Create event"
          >
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.createBtnText}>Create</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.catRow}>
              {EVENT_CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.catChip, category === c.key && styles.catChipActive]}
                  onPress={() => setCategory(c.key as EventCategory)}
                  accessibilityLabel={`Category ${c.label}`}
                >
                  <Text style={styles.catEmoji}>{c.icon}</Text>
                  <Text style={[styles.catText, category === c.key && styles.catTextActive]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.label}>Event Title *</Text>
          <TextInput style={styles.input} placeholder="What's happening?" placeholderTextColor={Colors.textTertiary}
            value={title} onChangeText={setTitle} maxLength={100} accessibilityLabel="Event title" />

          <Text style={styles.label}>Description *</Text>
          <TextInput style={[styles.input, styles.multiline]} placeholder="Tell people about your event…"
            placeholderTextColor={Colors.textTertiary} value={description} onChangeText={setDescription}
            multiline maxLength={1000} textAlignVertical="top" accessibilityLabel="Event description" />

          {/* Date/time pickers */}
          <Text style={styles.label}>Start Date & Time</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setPickerMode('start-date')} accessibilityLabel="Pick start date">
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
              <Text style={styles.dateBtnText}>{format(startsAt, 'd MMM yyyy')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setPickerMode('start-time')} accessibilityLabel="Pick start time">
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
              <Text style={styles.dateBtnText}>{format(startsAt, 'h:mm a')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>End Date & Time</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setPickerMode('end-date')} accessibilityLabel="Pick end date">
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
              <Text style={styles.dateBtnText}>{format(endsAt, 'd MMM yyyy')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setPickerMode('end-time')} accessibilityLabel="Pick end time">
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
              <Text style={styles.dateBtnText}>{format(endsAt, 'h:mm a')}</Text>
            </TouchableOpacity>
          </View>

          {pickerMode && (
            <DateTimePicker
              value={pickerMode.startsWith('start') ? startsAt : endsAt}
              mode={pickerMode.endsWith('date') ? 'date' : 'time'}
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          )}

          {/* Location */}
          <View style={styles.onlineRow}>
            <Text style={styles.label}>Online Event</Text>
            <Switch value={isOnline} onValueChange={setIsOnline}
              trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor="#fff"
              accessibilityLabel="Toggle online event" />
          </View>

          {isOnline ? (
            <>
              <Text style={styles.label}>Meeting Link</Text>
              <TextInput style={styles.input} placeholder="https://zoom.us/j/…" placeholderTextColor={Colors.textTertiary}
                value={onlineUrl} onChangeText={setOnlineUrl} keyboardType="url" autoCapitalize="none"
                accessibilityLabel="Online meeting link" />
            </>
          ) : (
            <>
              <Text style={styles.label}>Location *</Text>
              <TextInput style={styles.input} placeholder="Address or venue name"
                placeholderTextColor={Colors.textTertiary} value={location} onChangeText={setLocation}
                accessibilityLabel="Event location" />
            </>
          )}

          <Text style={styles.label}>Max Attendees (optional)</Text>
          <TextInput style={styles.input} placeholder="Leave blank for unlimited"
            placeholderTextColor={Colors.textTertiary} value={maxAttendees} onChangeText={setMaxAttendees}
            keyboardType="number-pad" maxLength={4} accessibilityLabel="Maximum attendees" />
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
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface,
  },
  cancel: { fontSize: FontSizes.md, color: Colors.textSecondary },
  headerTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.textPrimary },
  createBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: 8, borderRadius: Radii.full },
  createBtnDisabled: { opacity: 0.4 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.md },
  content: { padding: Spacing.xl, paddingBottom: 60, gap: 4 },
  label: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.textPrimary, marginTop: Spacing.md, marginBottom: 6 },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radii.md, paddingHorizontal: Spacing.lg, paddingVertical: 14,
    fontSize: FontSizes.md, color: Colors.textPrimary,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  catRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: Radii.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catEmoji: { fontSize: 14 },
  catText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary },
  catTextActive: { color: '#fff' },
  dateRow: { flexDirection: 'row', gap: Spacing.md },
  dateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radii.md, padding: Spacing.md,
  },
  dateBtnText: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: '600' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.md },
});
