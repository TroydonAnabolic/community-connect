// app/(auth)/welcome.tsx
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSizes, Spacing, Radii } from '@/constants/theme';

const { height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🤝</Text>
        </View>
        <Text style={styles.appName}>CommunityConnect</Text>
        <Text style={styles.tagline}>
          Building stronger communities,{'\n'}one connection at a time
        </Text>
      </View>

      <View style={styles.features}>
        {[
          { icon: '💬', text: 'Join local discussions & make friends' },
          { icon: '📅', text: 'Discover events near you' },
          { icon: '❤️', text: 'Daily wellbeing check-ins & safety tips' },
          { icon: '🔒', text: 'Safe, moderated community space' },
        ].map((f) => (
          <View key={f.text} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => router.push('/(auth)/register')}
          accessibilityLabel="Create a new account"
          accessibilityRole="button"
        >
          <Text style={styles.btnPrimaryText}>Create Account</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => router.push('/(auth)/login')}
          accessibilityLabel="Sign in to your account"
          accessibilityRole="button"
        >
          <Text style={styles.btnSecondaryText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F2D1E',
    paddingHorizontal: Spacing.xl,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xxxl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  logoIcon: { fontSize: 52 },
  appName: {
    fontSize: FontSizes.xxxl,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  tagline: {
    fontSize: FontSizes.md,
    color: '#A8D4B5',
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    marginBottom: Spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  featureIcon: { fontSize: 22 },
  featureText: {
    fontSize: FontSizes.md,
    color: '#D4EED9',
    flex: 1,
    lineHeight: 22,
  },
  actions: {
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.lg,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radii.lg,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  btnSecondaryText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
});
