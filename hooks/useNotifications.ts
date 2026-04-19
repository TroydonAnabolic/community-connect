// hooks/useNotifications.ts
import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { subscribeToNotifications, markNotificationRead } from '@/services/notificationsService';
import { useAuthStore } from '@/store/authStore';
import { Notification } from '@/types';

export function useNotifications() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const unsub = subscribeToNotifications(user.uid, (notifs) => {
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.isRead).length);
    });

    // Handle foreground notification taps
    const tapSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      if (data?.screen === 'wellbeing') router.push('/(tabs)/wellbeing');
      else if (data?.postId) router.push(`/post/${data.postId}`);
      else if (data?.eventId) router.push(`/event/${data.eventId}`);
      else if (data?.chatId) router.push(`/chat/${data.chatId}`);
    });

    return () => {
      unsub();
      tapSub.remove();
    };
  }, [user]);

  return { notifications, unreadCount };
}
