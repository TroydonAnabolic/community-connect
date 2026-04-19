// app/post/_layout.tsx
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function PostLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          title: 'Post',
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.primary,
          headerTitleStyle: { fontWeight: '700', color: Colors.textPrimary },
          headerShadowVisible: false,
          headerBackTitle: 'Back',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />
    </Stack>
  );
}
