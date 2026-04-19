// app/profile/_layout.tsx
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function ProfileSubLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.primary,
        headerTitleStyle: { fontWeight: '700', color: Colors.textPrimary },
        headerShadowVisible: false,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="edit"
        options={{ title: 'Edit Profile', presentation: 'card' }}
      />
      <Stack.Screen
        name="trusted-contacts"
        options={{ title: 'Trusted Contacts', presentation: 'card' }}
      />
    </Stack>
  );
}
