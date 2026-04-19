// app/(tabs)/wellbeing/_layout.tsx
import { Stack } from 'expo-router';

export default function WellbeingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
