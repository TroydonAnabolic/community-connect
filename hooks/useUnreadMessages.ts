// hooks/useUnreadMessages.ts
import { useEffect, useState } from 'react';
import { subscribeToConversations } from '@/services/messagingService';
import { useAuthStore } from '@/store/authStore';
import { DirectMessage } from '@/types';

export function useUnreadMessages() {
  const { user } = useAuthStore();
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToConversations(user.uid, (convs) => {
      const total = convs.reduce((sum, c) => sum + (c.unreadCount?.[user.uid] ?? 0), 0);
      setTotalUnread(total);
    });
    return unsub;
  }, [user]);

  return totalUnread;
}
