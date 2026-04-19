// services/notificationsService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc, collection, addDoc, query, where, getDocs,
  onSnapshot, orderBy, limit, Unsubscribe, serverTimestamp, updateDoc as firestoreUpdate } from 'firebase/firestore';
import { db } from './firebase';
import { Notification, NotificationType } from '@/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(uid: string): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'CommunityConnect',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
    await Notifications.setNotificationChannelAsync('wellbeing', {
      name: 'Wellbeing Check-ins',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Save token to Firestore
  await updateDoc(doc(db, 'users', uid), { fcmToken: token });

  return token;
}

export async function scheduleLocalCheckinReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  // Schedule daily at 10am
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Good morning! How are you today?',
      body: 'Tap to complete your daily wellbeing check-in.',
      sound: true,
      data: { screen: 'wellbeing' },
    },
    trigger: {
      hour: 10,
      minute: 0,
      repeats: true,
    } as any,
  });
}

export function subscribeToNotifications(
  uid: string,
  callback: (notifs: Notification[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(30)
  );
  return onSnapshot(q, (snap) => {
    const notifs = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate() ?? new Date(),
      } as Notification;
    });
    callback(notifs);
  });
}

export async function markNotificationRead(notifId: string) {
  await firestoreUpdate(doc(db, 'notifications', notifId), { isRead: true });
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  await addDoc(collection(db, 'notifications'), {
    userId,
    type,
    title,
    body,
    data: data ?? {},
    isRead: false,
    createdAt: serverTimestamp(),
  });
}
