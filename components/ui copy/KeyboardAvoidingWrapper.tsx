// components/ui/KeyboardAvoidingWrapper.tsx
// Wraps content in a KeyboardAvoidingView + ScrollView so form screens
// behave correctly on both iOS and Android without repetition.

import {
  KeyboardAvoidingView, ScrollView, StyleSheet,
  Platform, ViewStyle, ScrollViewProps,
} from 'react-native';
import { Colors } from '@/constants/theme';

interface Props extends ScrollViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  keyboardOffset?: number;
}

export default function KeyboardAvoidingWrapper({
  children,
  style,
  contentStyle,
  keyboardOffset = 0,
  ...scrollProps
}: Props) {
  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardOffset}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1 },
});
