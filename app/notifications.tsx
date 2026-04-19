// app/notifications.tsx
import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { subscribeToNotifications, markNotificationRead } from '@/services/notificationsService';
import { useAuthStore } from '@/store/authStore';
import { Colors, FontSizes, Spacing, Radii } from '@/constants/theme';
import { Notification, NotificationType } from '@/types';

const TYPE_CONFIG: Record<NotificationType, { icon: string; color: string }> = {
  event_reminder: { icon: 'calendar', color: Colors.primary },
  new_comment: { icon: 'chatbubble', color: Colors.accent },
  new_message: { icon: 'mail', color: Colors.info },
  checkin_prompt: { icon: 'heart', color: Colors.error },
  safety_alert: { icon: 'warning', color: Colors.warning },
  welcome: { icon: 'hand-left', color: Colors.primary },
  post_approved: { icon: 'checkmark-circle', color: Colors.success },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToNotifications(user.uid, (notifs) => {
      setNotifications(notifs);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  async function handlePress(notif: Notification) {
    await markNotificationRead(notif.id);
    if (notif.data?.screen === 'wellbeing') router.push('/(tabs)/wellbeing');
    else if (notif.data?.postId) router.push(`/post/${notif.data.postId}`);
    else if (notif.data?.eventId) router.push(`/event/${notif.data.eventId}`);
    else if (notif.data?.chatId) router.push(`/chat/${notif.data.chatId}`);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyText}>We'll let you know when something happens.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const config = TYPE_CONFIG[item.type] ?? { icon: 'notifications', color: Colors.primary };
            return (
              <TouchableOpacity
                style={[styles.notifRow, !item.isRead && styles.notifRowUnread]}
                onPress={() => handlePress(item)}
                accessibilityLabel={`${item.title}. ${item.body}`}
              >
                <View style={[styles.notifIcon, { backgroundColor: config.color + '20' }]}>
                  <Ionicons name={config.icon as any} size={20} color={config.color} />
                </View>
                <View style={styles.notifContent}>
                  <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]}>{item.title}</Text>
                  <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
                  <Text style={styles.notifTime}>{formatDistanceToNow(item.createdAt, { addSuffix: true })}</Text>
                </View>
                {!item.isRead && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  headerTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textPrimary },
  list: { paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 52, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: FontSizes.md, color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' },
  notifRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: Colors.surface, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  notifRowUnread: { backgroundColor: Colors.primaryLight },
  notifIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: FontSizes.md, fontWeight: '500', color: Colors.textPrimary, marginBottom: 3 },
  notifTitleUnread: { fontWeight: '700' },
  notifBody: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: 4 },
  notifTime: { fontSize: FontSizes.xs, color: Colors.textTertiary },
  unreadDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: Colors.primary, marginTop: 6 },
});
