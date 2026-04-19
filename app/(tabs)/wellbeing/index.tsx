// app/(tabs)/wellbeing/index.tsx
import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday } from 'date-fns';
import { submitCheckIn, subscribeToMyCheckIns, getWellbeingContent } from '@/services/wellbeingService';
import { useAuthStore } from '@/store/authStore';
import { Colors, FontSizes, Spacing, Radii, MOOD_LABELS } from '@/constants/theme';
import { useCheckInStreak } from '@/hooks/useCheckInStreak';
import { CheckIn, WellbeingContent } from '@/types';
import MoodSelector from '@/components/wellbeing/MoodSelector';
import WellbeingContentCard from '@/components/wellbeing/WellbeingContentCard';

export default function WellbeingScreen() {
  const { user } = useAuthStore();
  const { streak, totalCheckIns } = useCheckInStreak();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [content, setContent] = useState<WellbeingContent[]>([]);
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [safetyOk, setSafetyOk] = useState<boolean | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [loadingContent, setLoadingContent] = useState(true);

  const todayCheckIn = checkIns.find((c) => isToday(c.timestamp));

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToMyCheckIns(user.uid, (cis) => {
      setCheckIns(cis);
      if (cis.some((c) => isToday(c.timestamp))) setShowForm(false);
    });
    getWellbeingContent().then((c) => { setContent(c); setLoadingContent(false); });
    return unsub;
  }, [user]);

  async function handleSubmit() {
    if (mood === null) return Alert.alert('Select Mood', 'How are you feeling today?');
    if (safetyOk === null) return Alert.alert('Safety Check', 'Please answer the safety question.');
    if (!user) return;
    setSubmitting(true);
    try {
      await submitCheckIn(user.uid, mood, safetyOk, notes, user.trustedContacts);
      setShowForm(false);
      setMood(null);
      setSafetyOk(null);
      setNotes('');
    } catch {
      Alert.alert('Error', 'Could not save your check-in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Wellbeing</Text>

        {/* Streak banner */}
        {streak > 0 && (
          <View style={styles.streakBanner}>
            <Text style={styles.streakFire}>🔥</Text>
            <View>
              <Text style={styles.streakTitle}>{streak}-day streak!</Text>
              <Text style={styles.streakSub}>{totalCheckIns} check-ins total</Text>
            </View>
          </View>
        )}

        {/* Done state */}
        {!showForm && todayCheckIn ? (
          <View style={styles.doneCard}>
            <Text style={styles.doneEmoji}>{MOOD_LABELS[todayCheckIn.moodScore].emoji}</Text>
            <Text style={styles.doneTitle}>Check-in complete!</Text>
            <Text style={styles.doneText}>
              {`Feeling ${MOOD_LABELS[todayCheckIn.moodScore].label.toLowerCase()} today. `}
              {todayCheckIn.safetyOk ? '✓ All safe at home.' : '⚠️ Safety concern noted.'}
            </Text>
            <TouchableOpacity style={styles.redoBtn} onPress={() => setShowForm(true)}
              accessibilityLabel="Update check-in">
              <Text style={styles.redoBtnText}>Update today's check-in</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Check-in form */
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <View>
                <Text style={styles.formTitle}>Daily Check-in</Text>
                <Text style={styles.formDate}>{format(new Date(), 'EEEE, d MMMM')}</Text>
              </View>
              <View style={styles.formIcon}>
                <Ionicons name="heart" size={22} color={Colors.primary} />
              </View>
            </View>

            <Text style={styles.qLabel}>How are you feeling today?</Text>
            <MoodSelector value={mood} onChange={setMood} />

            <Text style={styles.qLabel}>Are you safe and well at home?</Text>
            <View style={styles.safetyRow}>
              {[
                { val: true, label: 'Yes, all good', icon: 'checkmark-circle', activeStyle: styles.safetyYes, textStyle: styles.safetyTextYes },
                { val: false, label: 'Not quite', icon: 'alert-circle', activeStyle: styles.safetyNo, textStyle: styles.safetyTextNo },
              ].map(({ val, label, icon, activeStyle, textStyle }) => (
                <TouchableOpacity
                  key={String(val)}
                  style={[styles.safetyBtn, safetyOk === val && activeStyle]}
                  onPress={() => setSafetyOk(val)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: safetyOk === val }}
                  accessibilityLabel={label}
                >
                  <Ionicons
                    name={icon as any}
                    size={20}
                    color={safetyOk === val ? (val ? Colors.success : Colors.error) : Colors.textTertiary}
                  />
                  <Text style={[styles.safetyText, safetyOk === val && textStyle]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {safetyOk === false && (
              <View style={styles.alertBanner}>
                <Ionicons name="information-circle" size={16} color={Colors.error} />
                <Text style={styles.alertText}>
                  Your trusted contacts ({user?.trustedContacts.length ?? 0}) will be notified.
                </Text>
              </View>
            )}

            <Text style={styles.qLabel}>
              Anything on your mind? <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.notesInput}
              placeholder="How was your day?"
              placeholderTextColor={Colors.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={500}
              textAlignVertical="top"
              accessibilityLabel="Optional notes"
            />

            <TouchableOpacity
              style={[styles.submitBtn, (mood === null || safetyOk === null || submitting) && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={mood === null || safetyOk === null || submitting}
              accessibilityLabel="Submit check-in"
              accessibilityRole="button"
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>Submit Check-in</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* History */}
        {checkIns.length > 1 && (
          <>
            <Text style={styles.sectionTitle}>Recent Check-ins</Text>
            {checkIns.slice(0, 7).map((ci) => (
              <View key={ci.id} style={styles.historyRow}>
                <Text style={styles.historyEmoji}>{MOOD_LABELS[ci.moodScore].emoji}</Text>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyDate}>{format(ci.timestamp, 'EEE, d MMM')}</Text>
                  <Text style={styles.historyMood}>
                    {MOOD_LABELS[ci.moodScore].label} ·{' '}
                    {ci.safetyOk
                      ? <Text style={{ color: Colors.success }}>✓ Safe</Text>
                      : <Text style={{ color: Colors.error }}>⚠️ Concern</Text>
                    }
                  </Text>
                </View>
                <View style={[styles.dot, { backgroundColor: MOOD_LABELS[ci.moodScore].color }]} />
              </View>
            ))}
          </>
        )}

        {/* Content */}
        <Text style={styles.sectionTitle}>Tips & Resources</Text>
        {loadingContent
          ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
          : content.map((item) => <WellbeingContentCard key={item.id} item={item} />)
        }
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingBottom: 100 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg },
  streakBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: '#FFF8EC', borderRadius: Radii.lg, padding: Spacing.lg,
    marginBottom: Spacing.lg, borderWidth: 1, borderColor: '#F5C97A',
  },
  streakFire: { fontSize: 30 },
  streakTitle: { fontSize: FontSizes.md, fontWeight: '700', color: '#7A4F0B' },
  streakSub: { fontSize: FontSizes.xs, color: '#9A6A20', marginTop: 2 },
  doneCard: {
    backgroundColor: Colors.primaryLight, borderRadius: Radii.xl,
    padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.xl,
    borderWidth: 1, borderColor: Colors.primaryMid,
  },
  doneEmoji: { fontSize: 52, marginBottom: Spacing.md },
  doneTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.primaryDark, marginBottom: Spacing.sm },
  doneText: { fontSize: FontSizes.md, color: Colors.primaryDark, textAlign: 'center', lineHeight: 22 },
  redoBtn: { marginTop: Spacing.lg },
  redoBtnText: { color: Colors.primary, fontWeight: '700', fontSize: FontSizes.sm },
  formCard: {
    backgroundColor: Colors.surface, borderRadius: Radii.xl, padding: Spacing.xl,
    marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.borderLight,
  },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xl },
  formTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textPrimary },
  formDate: { fontSize: FontSizes.sm, color: Colors.textTertiary, marginTop: 2 },
  formIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  qLabel: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.lg },
  optional: { fontWeight: '400', color: Colors.textTertiary },
  safetyRow: { flexDirection: 'row', gap: Spacing.md },
  safetyBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: Spacing.md, borderRadius: Radii.md,
    borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.background,
  },
  safetyYes: { borderColor: Colors.success, backgroundColor: Colors.successLight },
  safetyNo: { borderColor: Colors.error, backgroundColor: Colors.errorLight },
  safetyText: { fontSize: FontSizes.md, color: Colors.textSecondary, fontWeight: '500' },
  safetyTextYes: { color: Colors.success, fontWeight: '700' },
  safetyTextNo: { color: Colors.error, fontWeight: '700' },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.errorLight, borderRadius: Radii.md,
    padding: Spacing.md, marginTop: Spacing.sm,
  },
  alertText: { fontSize: FontSizes.sm, color: Colors.error, flex: 1, lineHeight: 18 },
  notesInput: {
    backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radii.md, padding: Spacing.lg,
    fontSize: FontSizes.md, color: Colors.textPrimary, minHeight: 90,
  },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: Radii.lg,
    paddingVertical: 18, alignItems: 'center', marginTop: Spacing.xl,
  },
  submitDisabled: { opacity: 0.45 },
  submitText: { color: '#fff', fontSize: FontSizes.lg, fontWeight: '700' },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.sm },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radii.md, padding: Spacing.md,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.borderLight,
  },
  historyEmoji: { fontSize: 26 },
  historyInfo: { flex: 1 },
  historyDate: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.textPrimary },
  historyMood: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
