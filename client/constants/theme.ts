import { Platform } from "react-native";

const primaryColor = "#FF3B30";
const successColor = "#34C759";
const warningColor = "#FF9500";

export const Colors = {
  light: {
    text: "#000000",
    textSecondary: "#6E6E73",
    buttonText: "#FFFFFF",
    tabIconDefault: "#6E6E73",
    tabIconSelected: primaryColor,
    link: primaryColor,
    primary: primaryColor,
    success: successColor,
    warning: warningColor,
    error: primaryColor,
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#F5F5F5",
    backgroundSecondary: "#E5E5EA",
    backgroundTertiary: "#D1D1D6",
    border: "#E5E5EA",
    feelingEasy: successColor,
    feelingModerate: warningColor,
    feelingHard: primaryColor,
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#8E8E93",
    buttonText: "#FFFFFF",
    tabIconDefault: "#8E8E93",
    tabIconSelected: primaryColor,
    link: primaryColor,
    primary: primaryColor,
    success: successColor,
    warning: warningColor,
    error: primaryColor,
    backgroundRoot: "#000000",
    backgroundDefault: "#1C1C1E",
    backgroundSecondary: "#2C2C2E",
    backgroundTertiary: "#3A3A3C",
    border: "#38383A",
    feelingEasy: successColor,
    feelingModerate: warningColor,
    feelingHard: primaryColor,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
  inputHeight: 56,
  buttonHeight: 56,
  touchTarget: 60,
  fabSize: 72,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  full: 9999,
};

export const Typography = {
  hero: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: "700" as const,
  },
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600" as const,
  },
  bodyLarge: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
