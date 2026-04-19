// app/index.tsx
// Expo Router entry point — redirects based on auth state.
// The auth guard in app/_layout.tsx handles the actual routing logic;
// this file just provides a loading placeholder while it resolves.

import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
