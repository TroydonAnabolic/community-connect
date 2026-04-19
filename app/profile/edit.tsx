// app/profile/edit.tsx
import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { updateUserProfile } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { Colors, FontSizes, Spacing, Radii } from '@/constants/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [organisation, setOrganisation] = useState(user?.organisation ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!displayName.trim()) {
      Alert.alert('Required', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const updates = {
        displayName: displayName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        phone: phone.trim(),
        organisation: organisation.trim(),
      };
      await updateUserProfile(user!.uid, updates);
      updateUser(updates);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Cancel">
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            accessibilityLabel="Save profile"
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.saveBtnText}>Save</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Field
            label="Display Name *"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            autoCapitalize="words"
            accessibilityLabel="Display name"
          />
          <Field
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell the community a little about yourself"
            multiline
            accessibilityLabel="Bio"
          />
          <Field
            label="Location"
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Auckland, New Zealand"
            accessibilityLabel="Location"
          />
          <Field
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 021 123 4567"
            keyboardType="phone-pad"
            accessibilityLabel="Phone number"
          />
          {(user?.role === 'organisation' || user?.role === 'caregiver') && (
            <Field
              label="Organisation"
              value={organisation}
              onChangeText={setOrganisation}
              placeholder="Organisation name"
              autoCapitalize="words"
              accessibilityLabel="Organisation name"
            />
          )}

          <Text style={styles.hint}>
            Your profile information is visible to other community members.
            Your phone number is only visible to your trusted contacts.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label, value, onChangeText, placeholder, multiline, keyboardType, autoCapitalize, accessibilityLabel,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  accessibilityLabel: string;
}) {
  return (
    <View style={fStyles.wrap}>
      <Text style={fStyles.label}>{label}</Text>
      <TextInput
        style={[fStyles.input, multiline && fStyles.inputMulti]}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        textAlignVertical={multiline ? 'top' : 'center'}
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
}

const fStyles = StyleSheet.create({
  wrap: { marginBottom: Spacing.md },
  label: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6 },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radii.md, paddingHorizontal: Spacing.lg, paddingVertical: 14,
    fontSize: FontSizes.md, color: Colors.textPrimary,
  },
  inputMulti: { minHeight: 100 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface,
  },
  cancel: { fontSize: FontSizes.md, color: Colors.textSecondary },
  headerTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.textPrimary },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: 8, borderRadius: Radii.full },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.md },
  content: { padding: Spacing.xl, paddingBottom: 60 },
  hint: {
    fontSize: FontSizes.xs, color: Colors.textTertiary,
    lineHeight: 18, marginTop: Spacing.xl, textAlign: 'center',
  },
});
