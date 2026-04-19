// components/ui/ConfirmSheet.tsx
// A lightweight bottom-sheet confirmation dialog that avoids relying on
// native Alert, giving us consistent styling across Android and iOS.

import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Animated, TouchableWithoutFeedback,
} from 'react-native';
import { Colors, FontSizes, Spacing, Radii } from '@/constants/theme';

interface Action {
  label: string;
  onPress: () => void;
  style?: 'default' | 'destructive' | 'cancel';
}

interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  message?: string;
  actions: Action[];
  onDismiss: () => void;
}

export default function ConfirmSheet({
  visible, title, message, actions, onDismiss,
}: ConfirmSheetProps) {
  const translateY = useRef(new Animated.Value(300)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
        Animated.timing(opacity,    { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 300, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 0,   duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onDismiss}>
      <TouchableWithoutFeedback onPress={onDismiss} accessibilityLabel="Dismiss">
        <Animated.View style={[styles.backdrop, { opacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />

        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={styles.actions}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[
                styles.actionBtn,
                action.style === 'destructive' && styles.actionDestructive,
                action.style === 'cancel'      && styles.actionCancel,
              ]}
              onPress={() => { action.onPress(); onDismiss(); }}
              accessibilityLabel={action.label}
              accessibilityRole="button"
            >
              <Text style={[
                styles.actionText,
                action.style === 'destructive' && styles.actionTextDestructive,
                action.style === 'cancel'      && styles.actionTextCancel,
              ]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  actions: { gap: Spacing.sm },
  actionBtn: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionDestructive: { backgroundColor: Colors.errorLight },
  actionCancel:      { backgroundColor: Colors.surfaceSecondary },
  actionText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  actionTextDestructive: { color: Colors.error },
  actionTextCancel:      { color: Colors.textSecondary },
});
