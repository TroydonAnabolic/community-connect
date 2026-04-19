// components/ui/CategoryPill.tsx
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes, Spacing, Radii } from '@/constants/theme';

interface CategoryPillProps {
  label: string;
  emoji?: string;
  active: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

export default function CategoryPill({
  label, emoji, active, onPress, accessibilityLabel,
}: CategoryPillProps) {
  return (
    <TouchableOpacity
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? `Filter: ${label}`}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      activeOpacity={0.75}
    >
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  emoji: { fontSize: 13 },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  labelActive: { color: '#fff' },
});
