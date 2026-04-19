// components/wellbeing/MoodSelector.tsx
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Colors, FontSizes, Spacing, Radii, MOOD_LABELS } from '@/constants/theme';

interface MoodSelectorProps {
  value: 1 | 2 | 3 | 4 | 5 | null;
  onChange: (score: 1 | 2 | 3 | 4 | 5) => void;
}

export default function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Select your mood">
      {([1, 2, 3, 4, 5] as const).map((score) => {
        const info = MOOD_LABELS[score];
        const selected = value === score;
        return (
          <TouchableOpacity
            key={score}
            style={[
              styles.btn,
              selected && { backgroundColor: info.color + '20', borderColor: info.color },
            ]}
            onPress={() => onChange(score)}
            accessibilityLabel={`Mood: ${info.label}`}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <Text style={styles.emoji}>{info.emoji}</Text>
            <Text style={[styles.label, selected && { color: info.color, fontWeight: '700' }]}>
              {info.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  btn: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.md,
    borderRadius: Radii.md, borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  emoji: { fontSize: 26, marginBottom: 4 },
  label: {
    fontSize: 10, color: Colors.textTertiary, textAlign: 'center',
    fontWeight: '500', lineHeight: 14,
  },
});
