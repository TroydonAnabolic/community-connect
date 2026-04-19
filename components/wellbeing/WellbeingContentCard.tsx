// components/wellbeing/WellbeingContentCard.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, FontSizes, Spacing, Radii } from '@/constants/theme';
import { WellbeingContent } from '@/types';

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string; bg: string }> = {
  health:       { emoji: '❤️', color: '#A32D2D', bg: Colors.errorLight },
  exercise:     { emoji: '🏃', color: Colors.primaryDark, bg: Colors.primaryLight },
  social:       { emoji: '🤝', color: '#3C3489', bg: '#EEEDFE' },
  safety:       { emoji: '🔒', color: '#633806', bg: Colors.warningLight },
  mental_health:{ emoji: '🧠', color: Colors.info, bg: Colors.infoLight },
};

interface Props {
  item: WellbeingContent;
  onPress?: () => void;
}

export default function WellbeingContentCard({ item, onPress }: Props) {
  const cfg = CATEGORY_CONFIG[item.category] ?? { emoji: '📌', color: Colors.primary, bg: Colors.primaryLight };
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={`${item.title}. ${item.body}`}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
        <Text style={styles.iconEmoji}>{cfg.emoji}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.typeText, { color: cfg.color }]}>{item.type}</Text>
          </View>
          <View style={[styles.catBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.catText, { color: cfg.color }]}>{item.category.replace('_', ' ')}</Text>
          </View>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body} numberOfLines={3}>{item.body}</Text>
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radii.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  iconBox: {
    width: 52, height: 52, borderRadius: Radii.md,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  iconEmoji: { fontSize: 26 },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radii.full },
  typeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radii.full },
  catText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  title: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  body: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 20 },
});
