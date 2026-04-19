// app/(tabs)/profile/index.tsx
import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/services/firebase';
import { signOut, updateUserProfile } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { Colors, FontSizes, Spacing, Radii, ROLE_LABELS } from '@/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  if (!user) return null;

  const roleInfo = ROLE_LABELS[user.role];

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  }

  async function handlePickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    setUploadingPhoto(true);
    try {
      const uri = result.assets[0].uri;
      const resp = await fetch(uri);
      const blob = await resp.blob();
      const storageRef = ref(storage, `avatars/${user.uid}.jpg`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      await updateUserProfile(user.uid, { photoURL: url });
      updateUser({ photoURL: url });
    } catch {
      Alert.alert('Error', 'Could not upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function toggleHighContrast(value: boolean) {
    const prefs = { ...user.accessibilityPrefs, highContrast: value };
    updateUser({ accessibilityPrefs: prefs });
    await updateUserProfile(user.uid, { accessibilityPrefs: prefs });
  }

  async function cycleFontSize() {
    const sizes = ['normal', 'large', 'xlarge'] as const;
    const idx = sizes.indexOf(user.accessibilityPrefs.fontSize);
    const next = sizes[(idx + 1) % sizes.length];
    const prefs = { ...user.accessibilityPrefs, fontSize: next };
    updateUser({ accessibilityPrefs: prefs });
    await updateUserProfile(user.uid, { accessibilityPrefs: prefs });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Admin console button */}
        {user.role === 'admin' && (
          <TouchableOpacity
            style={styles.adminBtn}
            onPress={() => router.push('/admin')}
            accessibilityLabel="Open admin console"
          >
            <Ionicons name="shield-checkmark" size={18} color={Colors.roleAdmin} />
            <Text style={styles.adminBtnText}>Admin Console</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.roleAdmin} />
          </TouchableOpacity>
        )}

        {/* Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            onPress={handlePickPhoto}
            style={styles.avatarWrap}
            disabled={uploadingPhoto}
            accessibilityLabel="Change profile photo"
            accessibilityRole="button"
          >
            {user.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{user.displayName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.displayName}>{user.displayName}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleInfo.color + '20' }]}>
            <Text style={[styles.roleText, { color: roleInfo.color }]}>{roleInfo.label}</Text>
          </View>
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{user.trustedContacts.length}</Text>
            <Text style={styles.statLabel}>Trusted</Text>
          </View>
        </View>

        {/* Settings sections */}
        <SettingsSection title="Account">
          <SettingsRow
            icon="person-outline"
            label="Edit Profile"
            onPress={() => router.push('/profile/edit')}
          />
          <SettingsRow
            icon="people-outline"
            label="Trusted Contacts"
            onPress={() => router.push('/profile/trusted-contacts')}
            isLast
          />
        </SettingsSection>

        <SettingsSection title="Accessibility">
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name="text-outline" size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Text Size</Text>
                <Text style={styles.settingValue}>{user.accessibilityPrefs.fontSize}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.cyclBtn}
              onPress={cycleFontSize}
              accessibilityLabel="Change text size"
            >
              <Text style={styles.cyclBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name="contrast-outline" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.settingLabel}>High Contrast</Text>
            </View>
            <Switch
              value={user.accessibilityPrefs.highContrast}
              onValueChange={toggleHighContrast}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#fff"
              accessibilityLabel="Toggle high contrast"
            />
          </View>
        </SettingsSection>

        <SettingsSection title="Notifications">
          <SettingsRow icon="notifications-outline" label="Notification Preferences" onPress={() => {}} isLast />
        </SettingsSection>

        <SettingsSection title="Support">
          <SettingsRow icon="help-circle-outline" label="Help & FAQ" onPress={() => {}} />
          <SettingsRow icon="document-text-outline" label="Privacy Policy" onPress={() => {}} />
          <SettingsRow icon="shield-outline" label="Community Guidelines" onPress={() => {}} isLast />
        </SettingsSection>

        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          accessibilityLabel="Sign out"
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>CommunityConnect v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sStyles.section}>
      <Text style={sStyles.sectionTitle}>{title}</Text>
      <View style={sStyles.sectionCard}>{children}</View>
    </View>
  );
}

function SettingsRow({
  icon, label, value, onPress, isLast,
}: {
  icon: string; label: string; value?: string; onPress: () => void; isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[sStyles.row, !isLast && sStyles.rowBorder]}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <View style={sStyles.rowLeft}>
        <View style={sStyles.rowIcon}>
          <Ionicons name={icon as any} size={18} color={Colors.primary} />
        </View>
        <Text style={sStyles.rowLabel}>{label}</Text>
      </View>
      <View style={sStyles.rowRight}>
        {value && <Text style={sStyles.rowValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}

const sStyles = StyleSheet.create({
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm, paddingHorizontal: Spacing.xs },
  sectionCard: { backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.borderLight, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  rowIcon: { width: 34, height: 34, borderRadius: 9, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: FontSizes.md, color: Colors.textPrimary, fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValue: { fontSize: FontSizes.sm, color: Colors.textTertiary },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingBottom: 100 },
  adminBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.errorLight, borderRadius: Radii.md,
    padding: Spacing.md, marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.error + '40',
  },
  adminBtnText: { flex: 1, fontSize: FontSizes.md, fontWeight: '700', color: Colors.roleAdmin },
  profileHeader: { alignItems: 'center', marginBottom: Spacing.xl },
  avatarWrap: { position: 'relative', marginBottom: Spacing.md },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 40, fontWeight: '700', color: '#fff' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.background },
  displayName: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.textPrimary },
  email: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2, marginBottom: Spacing.sm },
  roleBadge: { paddingHorizontal: Spacing.lg, paddingVertical: 5, borderRadius: Radii.full, marginBottom: Spacing.sm },
  roleText: { fontSize: FontSizes.sm, fontWeight: '700' },
  bio: { fontSize: FontSizes.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginTop: Spacing.sm },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: Spacing.lg, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.borderLight },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textTertiary, marginTop: 2, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: Colors.borderLight, marginVertical: 4 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  settingRowLast: { borderBottomWidth: 0 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  settingIcon: { width: 34, height: 34, borderRadius: 9, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: FontSizes.md, color: Colors.textPrimary, fontWeight: '500' },
  settingValue: { fontSize: FontSizes.sm, color: Colors.textTertiary, textTransform: 'capitalize' },
  cyclBtn: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radii.full, borderWidth: 1, borderColor: Colors.primary },
  cyclBtnText: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: '600' },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.errorLight, borderRadius: Radii.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.error + '40' },
  signOutText: { color: Colors.error, fontSize: FontSizes.md, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: FontSizes.xs, color: Colors.textTertiary },
});
