// app/chat/_layout.tsx
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function ChatLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.primary,
          headerTitleStyle: { fontWeight: '700', color: Colors.textPrimary },
          headerShadowVisible: false,
          headerBackTitle: 'Messages',
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
