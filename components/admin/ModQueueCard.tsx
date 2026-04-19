// components/admin/ModQueueCard.tsx
import { Colors, FontSizes, Radii, Spacing } from "@/constants/theme";
import { ModQueueItem } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  item: ModQueueItem;
  onApprove: () => void;
  onWarn: () => void;
  onRemove: () => void;
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  post: { bg: Colors.infoLight, text: Colors.info },
  event: { bg: Colors.warningLight, text: Colors.warning },
  comment: { bg: "#EEEDFE", text: "#3C3489" },
};

export default function ModQueueCard({
  item,
  onApprove,
  onWarn,
  onRemove,
}: Props) {
  const tc = TYPE_COLORS[item.contentType] ?? {
    bg: Colors.surfaceSecondary,
    text: Colors.textSecondary,
  };

  function confirmRemove() {
    Alert.alert(
      "Remove Content",
      "This will permanently hide the content from the community. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: onRemove },
      ],
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: tc.bg }]}>
          <Text style={[styles.typeText, { color: tc.text }]}>
            {item.contentType}
          </Text>
        </View>
        <Text style={styles.time}>
          {formatDistanceToNow(item.createdAt, { addSuffix: true })}
        </Text>
      </View>

      {/* Report info */}
      {item.reportReasons && item.reportReasons.length > 0 && (
        <View style={styles.reasonRow}>
          <Ionicons name="flag" size={14} color={Colors.warning} />
          <Text style={styles.reason}>{item.reportReasons.join(" · ")}</Text>
        </View>
      )}

      {/* Content preview */}
      {item.contentPreview ? (
        <View style={styles.preview}>
          <Text style={styles.previewText} numberOfLines={4}>
            {item.contentPreview}
          </Text>
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.approveBtn]}
          onPress={onApprove}
          accessibilityLabel="Approve this content"
          accessibilityRole="button"
        >
          <Ionicons name="checkmark" size={16} color={Colors.success} />
          <Text style={[styles.actionText, { color: Colors.success }]}>
            Approve
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.warnBtn]}
          onPress={onWarn}
          accessibilityLabel="Warn the author"
          accessibilityRole="button"
        >
          <Ionicons name="warning" size={16} color={Colors.warning} />
          <Text style={[styles.actionText, { color: Colors.warning }]}>
            Warn
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.removeBtn]}
          onPress={confirmRemove}
          accessibilityLabel="Remove this content"
          accessibilityRole="button"
        >
          <Ionicons name="trash" size={16} color={Colors.error} />
          <Text style={[styles.actionText, { color: Colors.error }]}>
            Remove
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  typeText: {
    fontSize: FontSizes.xs,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  time: { fontSize: FontSizes.xs, color: Colors.textTertiary },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: Spacing.sm,
  },
  reason: {
    fontSize: FontSizes.sm,
    color: Colors.warning,
    fontStyle: "italic",
    flex: 1,
  },
  preview: {
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  previewText: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  actions: { flexDirection: "row", gap: Spacing.sm },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: Radii.md,
    borderWidth: 1.5,
  },
  approveBtn: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  warnBtn: {
    borderColor: Colors.warning,
    backgroundColor: Colors.warningLight,
  },
  removeBtn: { borderColor: Colors.error, backgroundColor: Colors.errorLight },
  actionText: { fontSize: FontSizes.xs, fontWeight: "700" },
});
