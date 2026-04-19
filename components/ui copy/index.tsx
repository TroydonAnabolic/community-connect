// components/ui/index.tsx
// Shared, accessible UI primitives used across the app

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, Radii } from '@/constants/theme';

// ── Button ──────────────────────────────────────────────
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  accessibilityLabel?: string;
}

export function Button({
  label, onPress, variant = 'primary', size = 'md',
  loading, disabled, icon, accessibilityLabel,
}: ButtonProps) {
  const btnStyle = [
    bStyles.base,
    bStyles[variant],
    bStyles[`size_${size}`],
    (disabled || loading) && bStyles.disabled,
  ];
  const textStyle = [bStyles.text, bStyles[`text_${variant}`], bStyles[`textSize_${size}`]];

  return (
    <TouchableOpacity
      style={btnStyle}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#fff' : Colors.primary}
        />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={size === 'sm' ? 16 : size === 'lg' ? 22 : 18}
              color={variant === 'primary' ? '#fff' : variant === 'danger' ? Colors.error : Colors.primary}
            />
          )}
          <Text style={textStyle}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const bStyles = StyleSheet.create({
  base: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: Radii.lg, borderWidth: 0,
  },
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary },
  danger: { backgroundColor: Colors.errorLight, borderWidth: 1.5, borderColor: Colors.error },
  ghost: { backgroundColor: 'transparent' },
  size_sm: { paddingHorizontal: Spacing.md, paddingVertical: 8 },
  size_md: { paddingHorizontal: Spacing.xl, paddingVertical: 14 },
  size_lg: { paddingHorizontal: Spacing.xxl, paddingVertical: 18 },
  disabled: { opacity: 0.45 },
  text: { fontWeight: '700' },
  text_primary: { color: '#fff' },
  text_secondary: { color: Colors.primary },
  text_danger: { color: Colors.error },
  text_ghost: { color: Colors.primary },
  textSize_sm: { fontSize: FontSizes.sm },
  textSize_md: { fontSize: FontSizes.md },
  textSize_lg: { fontSize: FontSizes.lg },
});

// ── Avatar ──────────────────────────────────────────────
interface AvatarProps {
  name: string;
  photoURL?: string | null;
  size?: number;
  color?: string;
}

export function Avatar({ name, photoURL, size = 40, color }: AvatarProps) {
  const bg = color ?? Colors.primary;
  const fontSize = Math.round(size * 0.4);
  return (
    <View
      style={[aStyles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}
      accessibilityElementsHidden
    >
      {photoURL ? (
        <Image
          source={{ uri: photoURL }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <Text style={[aStyles.initial, { fontSize }]}>
          {name.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const aStyles = StyleSheet.create({
  wrap: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#fff', fontWeight: '700' },
});

// ── RoleBadge ───────────────────────────────────────────
interface RoleBadgeProps { role: string; }

const ROLE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  senior:       { bg: Colors.primaryLight,  text: Colors.primaryDark, label: 'Senior' },
  caregiver:    { bg: '#EEEDFE',             text: '#3C3489',          label: 'Caregiver' },
  organisation: { bg: Colors.warningLight,  text: '#633806',          label: 'Organisation' },
  admin:        { bg: Colors.errorLight,    text: Colors.error,       label: 'Admin' },
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const cfg = ROLE_COLORS[role] ?? { bg: Colors.surfaceSecondary, text: Colors.textSecondary, label: role };
  return (
    <View style={[rbStyles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[rbStyles.text, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const rbStyles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radii.full, alignSelf: 'flex-start' },
  text: { fontSize: FontSizes.xs, fontWeight: '700' },
});

// ── EmptyState ──────────────────────────────────────────
interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <View style={esStyles.wrap} accessibilityLiveRegion="polite">
      {icon && <Text style={esStyles.icon}>{icon}</Text>}
      <Text style={esStyles.title}>{title}</Text>
      {subtitle && <Text style={esStyles.subtitle}>{subtitle}</Text>}
      {action && (
        <TouchableOpacity
          style={esStyles.btn}
          onPress={action.onPress}
          accessibilityLabel={action.label}
          accessibilityRole="button"
        >
          <Text style={esStyles.btnText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const esStyles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 72, paddingHorizontal: Spacing.xxxl },
  icon: { fontSize: 52, marginBottom: Spacing.lg },
  title: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: FontSizes.md, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 22 },
  btn: {
    marginTop: Spacing.xl, backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl, paddingVertical: 14, borderRadius: Radii.lg,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.md },
});

// ── SectionHeader ───────────────────────────────────────
export function SectionHeader({ title, action, onAction }: {
  title: string; action?: string; onAction?: () => void;
}) {
  return (
    <View style={shStyles.row}>
      <Text style={shStyles.title}>{title}</Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction} accessibilityLabel={action}>
          <Text style={shStyles.action}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const shStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  title: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.textPrimary },
  action: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: '600' },
});

// ── LoadingScreen ────────────────────────────────────────
export function LoadingScreen() {
  return (
    <View style={lsStyles.wrap}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const lsStyles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
});

// ── Divider ──────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  if (!label) return <View style={divStyles.line} />;
  return (
    <View style={divStyles.row}>
      <View style={divStyles.line} />
      <Text style={divStyles.label}>{label}</Text>
      <View style={divStyles.line} />
    </View>
  );
}

const divStyles = StyleSheet.create({
  line: { flex: 1, height: 1, backgroundColor: Colors.borderLight },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.lg },
  label: { fontSize: FontSizes.xs, color: Colors.textTertiary, fontWeight: '500' },
});
