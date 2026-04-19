// constants/theme.ts
import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const Colors = {
  // Brand
  primary: "#1D9E75",
  primaryDark: "#0F6E56",
  primaryLight: "#E1F5EE",
  primaryMid: "#9FE1CB",

  // Accent
  accent: "#534AB7",
  accentLight: "#EEEDFE",

  // Neutral
  background: "#F8FAF9",
  surface: "#FFFFFF",
  surfaceSecondary: "#F1EFE8",
  border: "#D3D1C7",
  borderLight: "#E8E6DE",

  // Text
  textPrimary: "#1A1A18",
  textSecondary: "#5F5E5A",
  textTertiary: "#888780",
  textOnPrimary: "#FFFFFF",

  // Semantic
  success: "#3B6D11",
  successLight: "#EAF3DE",
  warning: "#BA7517",
  warningLight: "#FAEEDA",
  error: "#A32D2D",
  errorLight: "#FCEBEB",
  info: "#185FA5",
  infoLight: "#E6F1FB",

  // Role badges
  roleSenior: "#1D9E75",
  roleCaregiver: "#534AB7",
  roleOrg: "#BA7517",
  roleAdmin: "#A32D2D",
} as const;

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
} as const;

// Accessibility-aware font scaling
export function getAccessibleFontSize(
  base: number,
  size: "normal" | "large" | "xlarge",
): number {
  const multipliers = { normal: 1, large: 1.2, xlarge: 1.4 };
  return Math.round(base * multipliers[size]);
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
} as const;

export const SCREEN_WIDTH_VAL = SCREEN_WIDTH;

export const POST_CATEGORIES = [
  { key: "all", label: "All" },
  { key: "general", label: "General" },
  { key: "safety", label: "Safety" },
  { key: "health", label: "Health" },
  { key: "social", label: "Social" },
  { key: "news", label: "News" },
  { key: "support", label: "Support" },
  { key: "announcements", label: "Announcements" },
] as const;

export const EVENT_CATEGORIES = [
  { key: "social", label: "Social", icon: "🤝" },
  { key: "health", label: "Health", icon: "❤️" },
  { key: "arts", label: "Arts", icon: "🎨" },
  { key: "technology", label: "Tech Help", icon: "💻" },
  { key: "outdoors", label: "Outdoors", icon: "🌳" },
  { key: "education", label: "Education", icon: "📚" },
  { key: "support_group", label: "Support Group", icon: "🫂" },
  { key: "other", label: "Other", icon: "📌" },
] as const;

export const MOOD_LABELS: Record<
  number,
  { label: string; emoji: string; color: string }
> = {
  1: { label: "Very Low", emoji: "😔", color: "#A32D2D" },
  2: { label: "Low", emoji: "😕", color: "#BA7517" },
  3: { label: "Okay", emoji: "😐", color: "#888780" },
  4: { label: "Good", emoji: "🙂", color: "#3B6D11" },
  5: { label: "Great", emoji: "😄", color: "#1D9E75" },
};

export const ROLE_LABELS: Record<
  string,
  { label: string; color: string; description: string }
> = {
  senior: {
    label: "Senior",
    color: Colors.roleSenior,
    description: "I am a community member (60+)",
  },
  caregiver: {
    label: "Caregiver",
    color: Colors.roleCaregiver,
    description: "I support seniors in my life",
  },
  organisation: {
    label: "Organisation",
    color: Colors.roleOrg,
    description: "We run community programmes",
  },
  admin: {
    label: "Admin",
    color: Colors.roleAdmin,
    description: "Platform administrator",
  },
};
