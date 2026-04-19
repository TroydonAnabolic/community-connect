// app/messages/_layout.tsx
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function MessagesSubLayout() {
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
        name="new"
        options={{ title: 'New Message', presentation: 'card' }}
      />
    </Stack>
  );
}
