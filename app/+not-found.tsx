// app/+not-found.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSizes, Spacing, Radii } from '@/constants/theme';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.emoji}>🔍</Text>
        <Text style={styles.title}>Page not found</Text>
        <Text style={styles.subtitle}>
          The screen you're looking for doesn't exist or may have been moved.
        </Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.replace('/(tabs)/community')}
          accessibilityLabel="Go to home screen"
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>Go to Community</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>← Go back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  emoji: { fontSize: 64, marginBottom: Spacing.xl },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xxxl,
  },
  btn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: 16,
    borderRadius: Radii.lg,
    marginBottom: Spacing.lg,
  },
  btnText: { color: '#fff', fontSize: FontSizes.lg, fontWeight: '700' },
  backBtn: { padding: Spacing.md },
  backText: { color: Colors.primary, fontSize: FontSizes.md, fontWeight: '600' },
});
