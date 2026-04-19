// app/admin/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function AdminLayout() {
  const router = useRouter();
  const { user, isInitialised } = useAuthStore();

  useEffect(() => {
    if (isInitialised && (!user || user.role !== 'admin')) {
      router.replace('/(tabs)/community');
    }
  }, [user, isInitialised]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="users"
        options={{ headerShown: true, title: 'User Management', presentation: 'card' }}
      />
      <Stack.Screen
        name="content"
        options={{ headerShown: true, title: 'Content Management', presentation: 'card' }}
      />
      <Stack.Screen
        name="analytics"
        options={{ headerShown: true, title: 'Analytics', presentation: 'card' }}
      />
    </Stack>
  );
}
