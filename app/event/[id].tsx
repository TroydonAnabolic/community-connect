// app/event/[id].tsx
import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Calendar from 'expo-calendar';
import { fetchEventById, toggleRSVP } from '@/services/eventsService';
import { useAuthStore } from '@/store/authStore';
import { Colors, FontSizes, Spacing, Radii, EVENT_CATEGORIES } from '@/constants/theme';
import { Event } from '@/types';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { user } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState(false);

  useEffect(() => {
    fetchEventById(id).then((e) => {
      setEvent(e);
      setLoading(false);
      if (e) navigation.setOptions({ title: e.title });
    });
  }, [id]);

  async function handleRSVP() {
    if (!user || !event) return;
    const hasRsvp = event.rsvpList.includes(user.uid);
    setRsvpLoading(true);
    try {
      await toggleRSVP(event.id, user.uid, hasRsvp);
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              rsvpList: hasRsvp
                ? prev.rsvpList.filter((u) => u !== user.uid)
                : [...prev.rsvpList, user.uid],
              rsvpCount: hasRsvp ? prev.rsvpCount - 1 : prev.rsvpCount + 1,
            }
          : prev
      );
    } finally {
      setRsvpLoading(false);
    }
  }

  async function handleAddToCalendar() {
    if (!event) return;
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow calendar access in Settings.');
        return;
      }
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar =
        calendars.find((c) => c.allowsModifications && c.type === Calendar.CalendarType.LOCAL) ||
        calendars.find((c) => c.allowsModifications);

      if (!defaultCalendar) {
        Alert.alert('Error', 'No writable calendar found.');
        return;
      }

      await Calendar.createEventAsync(defaultCalendar.id, {
        title: event.title,
        notes: event.description,
        location: event.isOnline ? event.onlineUrl : event.location,
        startDate: event.startsAt,
        endDate: event.endsAt,
        alarms: [{ relativeOffset: -60 }, { relativeOffset: -15 }],
      });

      setCalendarAdded(true);
      Alert.alert('Added!', 'This event has been added to your calendar with reminders.');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not add to calendar.');
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (!event) return <View style={styles.center}><Text>Event not found.</Text></View>;

  const hasRsvp = event.rsvpList.includes(user?.uid ?? '');
  const isFull = event.maxAttendees ? event.rsvpCount >= event.maxAttendees : false;
  const catInfo = EVENT_CATEGORIES.find((c) => c.key === event.category);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Category badge */}
        <View style={styles.catRow}>
          <View style={styles.catBadge}>
            <Text style={styles.catBadgeText}>{catInfo?.icon} {catInfo?.label}</Text>
          </View>
          {event.isOnline && (
            <View style={styles.onlineBadge}><Text style={styles.onlineBadgeText}>Online</Text></View>
          )}
        </View>

        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.desc}>{event.description}</Text>

        {/* Details */}
        <View style={styles.detailsCard}>
          <DetailRow icon="calendar" label="Date & Time"
            value={`${format(event.startsAt, 'EEEE, d MMMM yyyy')}\n${format(event.startsAt, 'h:mm a')} – ${format(event.endsAt, 'h:mm a')}`}
          />
          <DetailRow icon="location" label={event.isOnline ? 'Online Link' : 'Location'}
            value={event.isOnline ? event.onlineUrl ?? 'Link TBA' : event.location}
            onPress={event.isOnline && event.onlineUrl ? () => Linking.openURL(event.onlineUrl!) : undefined}
          />
          <DetailRow icon="people" label="Attendees"
            value={`${event.rsvpCount} going${event.maxAttendees ? ` of ${event.maxAttendees} max` : ''}`}
          />
          <DetailRow icon="person" label="Hosted by" value={event.hostName} isLast />
        </View>

        {/* Calendar */}
        <TouchableOpacity
          style={[styles.calBtn, calendarAdded && styles.calBtnAdded]}
          onPress={handleAddToCalendar}
          disabled={calendarAdded}
          accessibilityLabel={calendarAdded ? 'Added to calendar' : 'Add to calendar'}
        >
          <Ionicons name={calendarAdded ? 'checkmark-circle' : 'calendar-outline'} size={20} color={calendarAdded ? Colors.success : Colors.primary} />
          <Text style={[styles.calBtnText, calendarAdded && styles.calBtnTextAdded]}>
            {calendarAdded ? 'Added to Calendar' : 'Add to Calendar'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* RSVP footer */}
      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerLabel}>{event.rsvpCount} people going</Text>
          {event.maxAttendees && (
            <Text style={styles.footerSub}>{Math.max(0, event.maxAttendees - event.rsvpCount)} spots remaining</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.rsvpBtn, hasRsvp && styles.rsvpBtnActive, isFull && !hasRsvp && styles.rsvpBtnFull]}
          onPress={handleRSVP}
          disabled={rsvpLoading || (isFull && !hasRsvp)}
          accessibilityLabel={hasRsvp ? 'Cancel RSVP' : 'RSVP to this event'}
          accessibilityRole="button"
        >
          {rsvpLoading
            ? <ActivityIndicator size="small" color={hasRsvp ? '#fff' : Colors.primary} />
            : (
              <>
                <Ionicons name={hasRsvp ? 'checkmark-circle' : 'add-circle-outline'} size={22} color={hasRsvp ? '#fff' : Colors.primary} />
                <Text style={[styles.rsvpText, hasRsvp && styles.rsvpTextActive]}>
                  {hasRsvp ? "I'm Going!" : isFull ? 'Event Full' : "I'll Attend"}
                </Text>
              </>
            )
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DetailRow({
  icon, label, value, onPress, isLast,
}: {
  icon: string; label: string; value: string; onPress?: () => void; isLast?: boolean;
}) {
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap
      style={[styles.detailRow, !isLast && styles.detailRowBorder]}
      onPress={onPress}
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={styles.detailIcon}>
        <Ionicons name={`${icon}-outline` as any} size={18} color={Colors.primary} />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, onPress && styles.detailLink]}>{value}</Text>
      </View>
      {onPress && <Ionicons name="open-outline" size={16} color={Colors.primary} />}
    </Wrap>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingBottom: 120 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  catRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  catBadge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radii.full },
  catBadgeText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.primaryDark },
  onlineBadge: { backgroundColor: Colors.infoLight, paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radii.full },
  onlineBadgeText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.info },
  title: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md, lineHeight: 34 },
  desc: { fontSize: FontSizes.md, color: Colors.textSecondary, lineHeight: 24, marginBottom: Spacing.xl },
  detailsCard: {
    backgroundColor: Colors.surface, borderRadius: Radii.lg,
    borderWidth: 1, borderColor: Colors.borderLight, marginBottom: Spacing.xl,
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, padding: Spacing.lg },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  detailIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: FontSizes.xs, color: Colors.textTertiary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  detailValue: { fontSize: FontSizes.md, color: Colors.textPrimary, lineHeight: 22 },
  detailLink: { color: Colors.primary },
  calBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 2, borderColor: Colors.primary, borderRadius: Radii.lg,
    padding: Spacing.lg, justifyContent: 'center',
  },
  calBtnAdded: { borderColor: Colors.success, backgroundColor: Colors.successLight },
  calBtnText: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.primary },
  calBtnTextAdded: { color: Colors.success },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, padding: Spacing.xl,
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingBottom: 32,
  },
  footerInfo: {},
  footerLabel: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textPrimary },
  footerSub: { fontSize: FontSizes.sm, color: Colors.textTertiary, marginTop: 2 },
  rsvpBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 2, borderColor: Colors.primary,
    paddingHorizontal: Spacing.xl, paddingVertical: 14, borderRadius: Radii.lg,
  },
  rsvpBtnActive: { backgroundColor: Colors.primary },
  rsvpBtnFull: { borderColor: Colors.border },
  rsvpText: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.primary },
  rsvpTextActive: { color: '#fff' },
});
