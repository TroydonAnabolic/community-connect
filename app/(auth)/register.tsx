// app/(auth)/register.tsx
import {
  Colors,
  FontSizes,
  Radii,
  Spacing
} from "@/constants/theme";
import { registerUser } from "@/services/authService";
import { UserRole } from "@/types";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ROLES: {
  key: UserRole;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    key: "senior",
    label: "Senior",
    description: "I am a community member (60+)",
    icon: "🧓",
  },
  {
    key: "caregiver",
    label: "Caregiver",
    description: "I support seniors in my life",
    icon: "🤲",
  },
  {
    key: "organisation",
    label: "Organisation",
    description: "We run community programmes",
    icon: "🏢",
  },
];

export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleNextStep() {
    if (!selectedRole) {
      Alert.alert("Select Role", "Please select who you are to continue.");
      return;
    }
    setStep(2);
  }

  async function handleRegister() {
    if (!displayName.trim())
      return Alert.alert("Required", "Please enter your name.");
    if (!email.trim())
      return Alert.alert("Required", "Please enter your email.");
    if (password.length < 8)
      return Alert.alert(
        "Weak Password",
        "Password must be at least 8 characters.",
      );
    if (password !== confirmPassword)
      return Alert.alert("Mismatch", "Passwords do not match.");

    try {
      setLoading(true);
      await registerUser(
        email.trim(),
        password,
        displayName.trim(),
        selectedRole!,
      );
      // Auth state listener handles navigation to tabs
    } catch (err: any) {
      Alert.alert(
        "Registration Failed",
        err.message ?? "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <TouchableOpacity
            style={styles.back}
            onPress={() => (step === 2 ? setStep(1) : router.back())}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Progress */}
          <View style={styles.progress}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View
              style={[
                styles.progressLine,
                step === 2 && styles.progressLineActive,
              ]}
            />
            <View
              style={[
                styles.progressDot,
                step === 2 && styles.progressDotActive,
              ]}
            />
          </View>

          {step === 1 ? (
            <>
              <Text style={styles.heading}>Who are you?</Text>
              <Text style={styles.subheading}>
                Choose the option that best describes you
              </Text>
              <View style={styles.roleList}>
                {ROLES.map((role) => (
                  <TouchableOpacity
                    key={role.key}
                    style={[
                      styles.roleCard,
                      selectedRole === role.key && styles.roleCardSelected,
                    ]}
                    onPress={() => setSelectedRole(role.key)}
                    accessibilityLabel={`Select role: ${role.label}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selectedRole === role.key }}
                  >
                    <Text style={styles.roleIcon}>{role.icon}</Text>
                    <View style={styles.roleText}>
                      <Text
                        style={[
                          styles.roleLabel,
                          selectedRole === role.key && styles.roleLabelSelected,
                        ]}
                      >
                        {role.label}
                      </Text>
                      <Text style={styles.roleDesc}>{role.description}</Text>
                    </View>
                    <View
                      style={[
                        styles.radioOuter,
                        selectedRole === role.key && styles.radioOuterSelected,
                      ]}
                    >
                      {selectedRole === role.key && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={handleNextStep}
                accessibilityRole="button"
              >
                <Text style={styles.btnText}>Continue</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.heading}>Create Account</Text>
              <Text style={styles.subheading}>
                Fill in your details to get started
              </Text>
              <View style={styles.form}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={Colors.textTertiary}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  returnKeyType="next"
                  accessibilityLabel="Full name"
                />
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  accessibilityLabel="Email address"
                />
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={[styles.input, styles.inputWithAction]}
                    placeholder="At least 8 characters"
                    placeholderTextColor={Colors.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCorrect={false}
                    returnKeyType="next"
                    accessibilityLabel="Password"
                  />
                  <TouchableOpacity
                    style={styles.inputActionBtn}
                    onPress={() => setShowPassword((prev) => !prev)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    <Text style={styles.inputActionText}>
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={[styles.input, styles.inputWithAction]}
                    placeholder="Repeat your password"
                    placeholderTextColor={Colors.textTertiary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                    accessibilityLabel="Confirm password"
                  />
                  <TouchableOpacity
                    style={styles.inputActionBtn}
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    <Text style={styles.inputActionText}>
                      {showConfirmPassword ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.btnPrimary, loading && styles.btnDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Create account"
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Create Account</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  back: { marginBottom: Spacing.lg },
  backText: {
    color: Colors.primary,
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  progress: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  progressDotActive: { backgroundColor: Colors.primary },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  progressLineActive: { backgroundColor: Colors.primary },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subheading: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  roleList: { gap: Spacing.md, marginBottom: Spacing.xl },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  roleCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  roleIcon: { fontSize: 32 },
  roleText: { flex: 1 },
  roleLabel: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  roleLabelSelected: { color: Colors.primaryDark },
  roleDesc: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: { borderColor: Colors.primary },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  form: { gap: Spacing.sm },
  label: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 16,
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
  },
  inputWrap: { position: "relative" },
  inputWithAction: { paddingRight: 84 },
  inputActionBtn: {
    position: "absolute",
    right: Spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  inputActionText: {
    color: Colors.primary,
    fontSize: FontSizes.md,
    fontWeight: "700",
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.lg,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: FontSizes.lg, fontWeight: "700" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.xxxl,
  },
  footerText: { color: Colors.textSecondary, fontSize: FontSizes.md },
  footerLink: {
    color: Colors.primary,
    fontSize: FontSizes.md,
    fontWeight: "700",
  },
});
