// hooks/useAccessibility.ts
// Provides scaled font sizes and theme adjustments based on the user's
// accessibility preferences stored in their Firestore profile.

import { useAuthStore } from '@/store/authStore';
import { getAccessibleFontSize, FontSizes, Colors } from '@/constants/theme';
import { AccessibilityPrefs } from '@/types';

const DEFAULT_PREFS: AccessibilityPrefs = {
  fontSize: 'large',
  highContrast: false,
  reduceMotion: false,
};

interface AccessibilityValues {
  /** Scaled versions of each base font size */
  fs: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  /** Whether high-contrast mode is active */
  highContrast: boolean;
  /** Whether the user prefers reduced motion */
  reduceMotion: boolean;
  /** Recommended minimum touch target height (px) */
  touchTargetHeight: number;
  /** Active font size preference key */
  fontSizeLevel: 'normal' | 'large' | 'xlarge';
  /** Colour overrides when highContrast is enabled */
  textColor: string;
  secondaryTextColor: string;
  backgroundColor: string;
}

export function useAccessibility(): AccessibilityValues {
  const { user } = useAuthStore();
  const prefs = user?.accessibilityPrefs ?? DEFAULT_PREFS;
  const level = prefs.fontSize;

  const scale = (base: number) => getAccessibleFontSize(base, level);

  // High-contrast mode uses pure black/white instead of the muted greys
  const textColor           = prefs.highContrast ? '#000000' : Colors.textPrimary;
  const secondaryTextColor  = prefs.highContrast ? '#1A1A1A' : Colors.textSecondary;
  const backgroundColor     = prefs.highContrast ? '#FFFFFF' : Colors.background;

  // Larger touch targets for xlarge font mode
  const touchTargetHeight = level === 'xlarge' ? 60 : level === 'large' ? 52 : 44;

  return {
    fs: {
      xs:   scale(FontSizes.xs),
      sm:   scale(FontSizes.sm),
      md:   scale(FontSizes.md),
      lg:   scale(FontSizes.lg),
      xl:   scale(FontSizes.xl),
      xxl:  scale(FontSizes.xxl),
      xxxl: scale(FontSizes.xxxl),
    },
    highContrast: prefs.highContrast,
    reduceMotion: prefs.reduceMotion,
    touchTargetHeight,
    fontSizeLevel: level,
    textColor,
    secondaryTextColor,
    backgroundColor,
  };
}
