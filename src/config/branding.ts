/* ============================================
   Centralized Branding Configuration
   All components should import from here.
   ============================================ */

export const BRANDING = {
  /** Full company name */
  companyName: "Photography Pixel Hub",

  /** Short name for mobile/compact UI */
  shortName: "Pixel Hub",

  /** Tagline / description */
  tagline: "منصة التصوير الاحترافية",

  /** Logo paths (relative to /public) */
  logo: {
    /** Transparent background logo — use everywhere */
    full: "/logo-transparent.png",
    /** Logo on black background (original) */
    fullDark: "/logo.png",
    /** Logo on white background */
    fullLight: "/logo-light-bg.png",
    /** White version (for dark backgrounds) */
    white: "/logo-white.png",
    /** Dark version (for light backgrounds) */
    dark: "/logo-dark.png",
    /** Icon only — for favicon, sidebar compact */
    icon: "/logo-transparent.png",
  },

  /** Favicon path */
  favicon: "/favicon.ico",

  /** Icons for PWA / manifest */
  icons: {
    favicon16: "/favicon-16x16.png",
    favicon32: "/favicon-32x32.png",
    appleTouchIcon: "/apple-touch-icon.png",
    icon192: "/icon-192.png",
    icon512: "/icon-512.png",
    icon1024: "/icon-1024.png",
  },

  /** Brand colors */
  colors: {
    /** Primary — Violet/Purple (from logo gradient) */
    primary: "#7C3AED",
    /** Secondary — Cyan/Blue (from logo gradient) */
    secondary: "#06B6D4",
    /** Accent — Royal Blue (PHOTOGRAPHY text) */
    accent: "#2563EB",
  },

  /** Social / Contact */
  contact: {
    email: "info@pixelpixel.hub",
    website: "https://pixelpixel.hub",
  },

  /** Metadata defaults */
  metadata: {
    title: "Photography Pixel Hub",
    description: "منصة إدارة التصوير الاحترافية — أرشفة ومشاركة ومعارض صور للعملاء",
    keywords: [
      "photography",
      "photo gallery",
      "client portal",
      "photographer platform",
      "تصوير",
      "معرض صور",
      "وكالة تصوير",
      "marketing agency",
    ],
  },
} as const;

/** Spread keywords as a mutable array for metadata usage. */
export const BRANDING_METADATA = {
  ...BRANDING,
  metadata: {
    ...BRANDING.metadata,
    keywords: [...BRANDING.metadata.keywords],
  },
};
