// components/events/EventCard.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { Colors, FontSizes, Spacing, Radii, EVENT_CATEGORIES } from '@/constants/theme';
import { Event } from '@/types';
import { Avatar } from '@/components/ui';

interface EventCardProps {
  event: Event;
  currentUserId: string;
  onPress: () => void;
  onRSVP: () => void;
  compact?: boolean;
}

function dateLabel(d: Date) {
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isThisWeek(d)) return format(d, 'EEEE');
  return format(d, 'EEE, d MMM');
}

export default function EventCard({ event, currentUserId, onPress, onRSVP, compact }: EventCardProps) {
  const hasRsvp = event.rsvpList.includes(currentUserId);
  const isFull = event.maxAttendees ? event.rsvpCount >= event.maxAttendees : false;
  const catInfo = EVENT_CATEGORIES.find((c) => c.key === event.category);

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={`Event: ${event.title}, ${dateLabel(event.startsAt)} at ${format(event.startsAt, 'h:mm a')}`}
      accessibilityRole="button"
    >
      {/* Top accent bar */}
      <View style={styles.accentBar} />

      <View style={styles.body}>
        {/* Tags row */}
        <View style={styles.tagsRow}>
          <View style={styles.catTag}>
            <Text style={styles.catTagText}>{catInfo?.icon} {catInfo?.label}</Text>
          </View>
          {event.isOnline && (
            <View style={styles.onlineTag}>
              <Text style={styles.onlineTagText}>Online</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={compact ? 1 : 2}>{event.title}</Text>

        {!compact && (
          <Text style={styles.description} numberOfLines={2}>{event.description}</Text>
        )}

        {/* Meta info */}
        <View style={styles.metaCol}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={15} color={Colors.primary} />
            <Text style={styles.metaText}>
              {dateLabel(event.startsAt)} · {format(event.startsAt, 'h:mm a')}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={15} color={Colors.primary} />
            <Text style={styles.metaText} numberOfLines={1}>{event.location}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={15} color={Colors.primary} />
            <Text style={styles.metaText}>
              {event.rsvpCount} attending
              {event.maxAttendees ? ` · ${event.maxAttendees - event.rsvpCount} spots left` : ''}
            </Text>
          </View>
        </View>

        {/* Footer: host + RSVP */}
        <View style={styles.footer}>
          <View style={styles.hostRow}>
            <Avatar name={event.hostName} photoURL={event.hostPhotoURL} size={28} />
            <Text style={styles.hostName} numberOfLines={1}>{event.hostName}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.rsvpBtn,
              hasRsvp && styles.rsvpActive,
              isFull && !hasRsvp && styles.rsvpFull,
            ]}
            onPress={(e) => { e.stopPropagation?.(); onRSVP(); }}
            disabled={isFull && !hasRsvp}
            accessibilityLabel={hasRsvp ? 'Cancel RSVP' : `RSVP to ${event.title}`}
            accessibilityRole="button"
          >
            <Text style={[styles.rsvpText, hasRsvp && styles.rsvpTextActive]}>
              {hasRsvp ? '✓ Going' : isFull ? 'Full' : 'RSVP'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: Radii.lg, overflow: 'hidden',
    marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  cardCompact: { marginBottom: Spacing.md },
  accentBar: { height: 4, backgroundColor: Colors.primary },
  body: { padding: Spacing.lg },
  tagsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  catTag: { backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radii.full },
  catTagText: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.primaryDark },
  onlineTag: { backgroundColor: Colors.infoLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radii.full },
  onlineTagText: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.info },
  title: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm, lineHeight: 26 },
  description: { fontSize: FontSizes.md, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.md },
  metaCol: { gap: 6, marginBottom: Spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  metaText: { fontSize: FontSizes.sm, color: Colors.textSecondary, flex: 1 },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.md,
  },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  hostName: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: '500', flex: 1 },
  rsvpBtn: {
    paddingHorizontal: Spacing.lg, paddingVertical: 8,
    borderRadius: Radii.full, borderWidth: 2, borderColor: Colors.primary,
  },
  rsvpActive: { backgroundColor: Colors.primary },
  rsvpFull: { borderColor: Colors.border },
  rsvpText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.primary },
  rsvpTextActive: { color: '#fff' },
});
