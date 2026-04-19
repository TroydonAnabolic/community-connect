// app/(tabs)/events/index.tsx
import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { subscribeToUpcomingEvents, toggleRSVP } from '@/services/eventsService';
import { useAuthStore } from '@/store/authStore';
import { Colors, FontSizes, Spacing, Radii, EVENT_CATEGORIES } from '@/constants/theme';
import { Event, EventCategory } from '@/types';

function EventCard({
  event, currentUserId, onPress, onRSVP,
}: {
  event: Event;
  currentUserId: string;
  onPress: () => void;
  onRSVP: () => void;
}) {
  const hasRsvp = event.rsvpList.includes(currentUserId);
  const isFull = event.maxAttendees ? event.rsvpCount >= event.maxAttendees : false;
  const catInfo = EVENT_CATEGORIES.find((c) => c.key === event.category);

  function dateLabel(d: Date) {
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    if (isThisWeek(d)) return format(d, 'EEEE');
    return format(d, 'EEE, d MMM');
  }

  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress} activeOpacity={0.85}
      accessibilityLabel={`Event: ${event.title}, ${dateLabel(event.startsAt)}`}>
      {/* Top accent */}
      <View style={[styles.eventAccent, { backgroundColor: Colors.primary }]} />
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <View style={styles.catTag}>
            <Text style={styles.catTagText}>{catInfo?.icon} {catInfo?.label}</Text>
          </View>
          {event.isOnline && (
            <View style={styles.onlineBadge}>
              <Text style={styles.onlineBadgeText}>Online</Text>
            </View>
          )}
        </View>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventDesc} numberOfLines={2}>{event.description}</Text>

        <View style={styles.eventMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textTertiary} />
            <Text style={styles.metaText}>{dateLabel(event.startsAt)} · {format(event.startsAt, 'h:mm a')}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={16} color={Colors.textTertiary} />
            <Text style={styles.metaText} numberOfLines={1}>{event.location}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={16} color={Colors.textTertiary} />
            <Text style={styles.metaText}>
              {event.rsvpCount} going{event.maxAttendees ? ` · ${event.maxAttendees - event.rsvpCount} spots left` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.eventFooter}>
          <View style={styles.hostRow}>
            <View style={styles.hostAvatar}>
              <Text style={styles.hostAvatarText}>{event.hostName.charAt(0)}</Text>
            </View>
            <Text style={styles.hostName}>{event.hostName}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.rsvpBtn,
              hasRsvp && styles.rsvpBtnActive,
              isFull && !hasRsvp && styles.rsvpBtnFull,
            ]}
            onPress={onRSVP}
            disabled={isFull && !hasRsvp}
            accessibilityLabel={hasRsvp ? 'Cancel RSVP' : 'RSVP to event'}
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

export default function EventsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<EventCategory | 'all'>('all');

  useEffect(() => {
    const unsub = subscribeToUpcomingEvents((evts) => {
      setEvents(evts);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = filter === 'all' ? events : events.filter((e) => e.category === filter);

  async function handleRSVP(event: Event) {
    if (!user) return;
    const hasRsvp = event.rsvpList.includes(user.uid);
    await toggleRSVP(event.id, user.uid, hasRsvp);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/event/new')}
          accessibilityLabel="Create event"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addBtnText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Category filter */}
      <FlatList
        horizontal
        data={[{ key: 'all', label: 'All', icon: '🗓️' }, ...EVENT_CATEGORIES]}
        keyExtractor={(i) => i.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
            onPress={() => setFilter(item.key as EventCategory | 'all')}
            accessibilityLabel={`Filter events: ${item.label}`}
          >
            <Text style={styles.filterEmoji}>{item.icon}</Text>
            <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>No upcoming events</Text>
              <Text style={styles.emptyText}>Be the first to create one!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <EventCard
              event={item}
              currentUserId={user?.uid ?? ''}
              onPress={() => router.push(`/event/${item.id}`)}
              onRSVP={() => handleRSVP(item)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md,
    paddingVertical: 8, borderRadius: Radii.full,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.sm },
  filterList: { paddingHorizontal: Spacing.xl, gap: Spacing.sm, paddingBottom: Spacing.md },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radii.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  filterEmoji: { fontSize: 14 },
  filterText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.primaryDark },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 52, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: FontSizes.md, color: Colors.textSecondary, marginTop: Spacing.sm },
  // Event card
  eventCard: {
    backgroundColor: Colors.surface, borderRadius: Radii.lg,
    marginBottom: Spacing.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  eventAccent: { height: 4, width: '100%' },
  eventContent: { padding: Spacing.lg },
  eventHeader: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, alignItems: 'center' },
  catTag: {
    backgroundColor: Colors.primaryLight, paddingHorizontal: 10,
    paddingVertical: 3, borderRadius: Radii.full,
  },
  catTagText: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.primaryDark },
  onlineBadge: {
    backgroundColor: Colors.infoLight, paddingHorizontal: 10,
    paddingVertical: 3, borderRadius: Radii.full,
  },
  onlineBadgeText: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.info },
  eventTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  eventDesc: { fontSize: FontSizes.md, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.md },
  eventMeta: { gap: 6, marginBottom: Spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: FontSizes.sm, color: Colors.textSecondary, flex: 1 },
  eventFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.md },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hostAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  hostAvatarText: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.primary },
  hostName: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: '600' },
  rsvpBtn: {
    paddingHorizontal: Spacing.lg, paddingVertical: 9,
    borderRadius: Radii.full, borderWidth: 2, borderColor: Colors.primary,
  },
  rsvpBtnActive: { backgroundColor: Colors.primary },
  rsvpBtnFull: { borderColor: Colors.border },
  rsvpText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.primary },
  rsvpTextActive: { color: '#fff' },
});
