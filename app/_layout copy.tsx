// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Colors } from '@/constants/theme';
import { onAuthChange, fetchUserProfile } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { useNotificationsStore } from '@/store/notificationsStore';
import {
  registerForPushNotifications,
  scheduleLocalCheckinReminder,
  subscribeToNotifications,
} from '@/services/notificationsService';
import { seedWellbeingContent } from '@/services/wellbeingService';

SplashScreen.preventAutoHideAsync();

const HEADER_OPTS = {
  headerTintColor: Colors.primary,
  headerStyle: { backgroundColor: Colors.surface },
  headerShadowVisible: false,
  headerBackTitle: 'Back',
};

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { user, isInitialised, setUser, setInitialised } = useAuthStore();
  const { setNotifications } = useNotificationsStore();

  // Auth state listener
  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await fetchUserProfile(firebaseUser.uid);
        setUser(profile);
        if (profile) {
          registerForPushNotifications(profile.uid);
          scheduleLocalCheckinReminder();
          seedWellbeingContent();
        }
      } else {
        setUser(null);
      }
      setInitialised(true);
      SplashScreen.hideAsync();
    });
    return unsub;
  }, []);

  // Wire notifications store
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToNotifications(user.uid, setNotifications);
    return unsub;
  }, [user?.uid]);

  // Route guard
  useEffect(() => {
    if (!isInitialised) return;
    const inAuthGroup  = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === 'admin';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/community');
    } else if (user && user.role !== 'admin' && inAdminGroup) {
      router.replace('/(tabs)/community');
    }
  }, [user, isInitialised, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="post/[id]" options={{ headerShown: true, title: 'Post', ...HEADER_OPTS }} />
      <Stack.Screen name="post/new"  options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <Stack.Screen name="event/[id]" options={{ headerShown: true, title: 'Event', ...HEADER_OPTS }} />
      <Stack.Screen name="event/new"  options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <Stack.Screen name="chat/[id]"  options={{ headerShown: true, ...HEADER_OPTS }} />
      <Stack.Screen name="messages"   />
      <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Notifications', ...HEADER_OPTS }} />
      <Stack.Screen name="profile"    />
      <Stack.Screen name="admin"      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="auto" />
      <RootLayoutNav />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
