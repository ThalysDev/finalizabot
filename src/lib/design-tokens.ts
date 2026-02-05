/**
 * Design Tokens - FinalizaBOT
 * Valores centralizados de design para consistência em todo o produto
 */

// ============================================================================
// COLORS
// ============================================================================

export const COLORS = {
  // Primary Palette
  primary: {
    50: "#f0f7ff",
    100: "#e0effe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9",
    600: "#0284c7",
    700: "#0369a1",
    800: "#075985",
    900: "#0c3d66",
    950: "#0c2d4d",
    dark: "#0F3A7D", // Primary used in hero
  },

  // Secondary Palette (Light Blue)
  secondary: {
    light: "#4F9FD4",
    lighter: "#E8F4FF",
  },

  // Success
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#145231",
    950: "#0f2817",
    base: "#10B981",
  },

  // Warning/Orange
  warning: {
    base: "#F59E0B",
    50: "#fffbeb",
    100: "#fef3c7",
  },

  // Neutral
  neutral: {
    50: "#f9fafb",
    100: "#f3f4f6",
    150: "#f5f5f5", // Usado como background
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
    text: "#333333", // Text color
    border: "#CCCCCC",
    white: "#FFFFFF",
  },

  // Data Visualization
  data: {
    green: "#047857",
    orange: "#F59E0B",
    red: "#EF4444",
    blue: "#3B82F6",
  },
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const TYPOGRAPHY = {
  fontFamily: {
    base: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },

  // Headline sizes
  headline: {
    xl: {
      desktop: { fontSize: "48px", fontWeight: 700, lineHeight: "1.2" },
      mobile: { fontSize: "32px", fontWeight: 700, lineHeight: "1.2" },
    },
    lg: {
      desktop: { fontSize: "40px", fontWeight: 700, lineHeight: "1.2" },
      mobile: { fontSize: "28px", fontWeight: 700, lineHeight: "1.2" },
    },
    md: {
      desktop: { fontSize: "32px", fontWeight: 700, lineHeight: "1.2" },
      mobile: { fontSize: "24px", fontWeight: 700, lineHeight: "1.2" },
    },
    sm: {
      desktop: { fontSize: "24px", fontWeight: 700, lineHeight: "1.3" },
      mobile: { fontSize: "20px", fontWeight: 700, lineHeight: "1.3" },
    },
  },

  // Subheadline sizes
  subheadline: {
    lg: {
      desktop: { fontSize: "20px", fontWeight: 400, lineHeight: "1.6" },
      mobile: { fontSize: "16px", fontWeight: 400, lineHeight: "1.6" },
    },
    md: {
      desktop: { fontSize: "18px", fontWeight: 400, lineHeight: "1.6" },
      mobile: { fontSize: "14px", fontWeight: 400, lineHeight: "1.6" },
    },
  },

  // Body text
  body: {
    lg: {
      desktop: { fontSize: "16px", fontWeight: 400, lineHeight: "1.6" },
      mobile: { fontSize: "14px", fontWeight: 400, lineHeight: "1.6" },
    },
    md: {
      desktop: { fontSize: "14px", fontWeight: 400, lineHeight: "1.6" },
      mobile: { fontSize: "12px", fontWeight: 400, lineHeight: "1.6" },
    },
  },

  // Button text
  button: {
    fontSize: "16px",
    fontWeight: 600,
    lineHeight: "1.4",
  },
} as const;

// ============================================================================
// SPACING
// ============================================================================

export const SPACING = {
  // Section padding
  section: {
    desktop: "80px",
    tablet: "60px",
    mobile: "40px",
  },

  // Padding base
  px: {
    4: "4px",
    8: "8px",
    12: "12px",
    16: "16px",
    24: "24px",
    32: "32px",
    40: "40px",
    48: "48px",
    64: "64px",
    80: "80px",
  },

  // Gap between items
  gap: {
    card: "24px",
    item: "16px",
    tight: "12px",
  },

  // Card padding
  card: "24px",

  // Component padding
  button: {
    x: "16px",
    y: "12px",
  },
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const BORDER_RADIUS = {
  none: "0",
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const SHADOWS = {
  none: "none",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  card: "0 4px 12px rgba(0, 0, 0, 0.08)",
} as const;

// ============================================================================
// TRANSITIONS
// ============================================================================

export const TRANSITIONS = {
  fast: "150ms ease-in-out",
  default: "200ms ease-in-out",
  slow: "300ms ease-in-out",
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const BREAKPOINTS = {
  mobile: "375px",
  mobileLg: "425px",
  tablet: "768px",
  desktop: "1024px",
  desktopLg: "1280px",
  desktopXl: "1536px",
} as const;

// ============================================================================
// Z-INDEX
// ============================================================================

export const Z_INDEX = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  backdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;
