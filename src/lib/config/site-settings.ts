/* ============================================
   Site Settings Store
   Reads/writes settings to a JSON file.
   No database changes required.
   Provides branded defaults from BRANDING config.
   ============================================ */

import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { BRANDING } from "@/config/branding";

const SETTINGS_FILE = join(process.cwd(), "src", "config", "site-settings.json");

export type WatermarkPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type SiteSettings = {
  /* ── Brand ─────────────────────────────── */
  agencyName: string;
  agencyShortName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;

  /* ── Contact ──────────────────────────── */
  supportEmail: string;
  whatsappNumber: string;
  website: string;
  instagram: string;
  facebook: string;
  tiktok: string;

  /* ── Portal Defaults ───────────────────── */
  defaultPortalExpiryDays: number;
  defaultPasswordProtected: boolean;

  /* ── Delivery Defaults ─────────────────── */
  defaultDownloadEnabled: boolean;
  defaultAllowStreaming: boolean;
  defaultAllowComments: boolean;

  /* ── Review ────────────────────────────── */
  reviewCommentEditWindowMinutes: number;
  autoNotifyOnComment: boolean;
  autoNotifyOnApproval: boolean;
  autoNotifyOnRevision: boolean;

  /* ── Watermark ─────────────────────────── */
  watermarkEnabled: boolean;
  watermarkText: string;
  watermarkOpacity: number;
  watermarkPosition: WatermarkPosition;
  watermarkScale: number;
  watermarkAnimation: boolean;
};

const DEFAULT_SETTINGS: SiteSettings = {
  agencyName: BRANDING.companyName,
  agencyShortName: BRANDING.shortName,
  logoUrl: BRANDING.logo.white,
  primaryColor: BRANDING.colors.primary,
  secondaryColor: BRANDING.colors.secondary,
  accentColor: BRANDING.colors.accent,

  supportEmail: BRANDING.contact.email,
  whatsappNumber: "",
  website: BRANDING.contact.website,
  instagram: "",
  facebook: "",
  tiktok: "",

  defaultPortalExpiryDays: 7,
  defaultPasswordProtected: false,

  defaultDownloadEnabled: true,
  defaultAllowStreaming: true,
  defaultAllowComments: true,

  reviewCommentEditWindowMinutes: 15,
  autoNotifyOnComment: true,
  autoNotifyOnApproval: true,
  autoNotifyOnRevision: true,

  watermarkEnabled: true,
  watermarkText: BRANDING.companyName,
  watermarkOpacity: 12,
  watermarkPosition: "middle-center" as WatermarkPosition,
  watermarkScale: 100,
  watermarkAnimation: true,
};

let cachedSettings: SiteSettings | null = null;

export async function getSettings(): Promise<SiteSettings> {
  if (cachedSettings) return cachedSettings;

  let settings: SiteSettings;

  try {
    if (existsSync(SETTINGS_FILE)) {
      const raw = await readFile(SETTINGS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      settings = { ...DEFAULT_SETTINGS, ...parsed };
    } else {
      settings = { ...DEFAULT_SETTINGS };
    }
  } catch {
    settings = { ...DEFAULT_SETTINGS };
  }

  cachedSettings = settings;
  return settings;
}

export async function saveSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await getSettings();
  const merged = { ...current, ...data };

  try {
    await mkdir(dirname(SETTINGS_FILE), { recursive: true });
    await writeFile(SETTINGS_FILE, JSON.stringify(merged, null, 2), "utf-8");
    cachedSettings = merged;
  } catch {
    // If file write fails, still update cache for this session
    cachedSettings = merged;
  }

  return merged;
}

/** Sync version for client components — returns cached defaults. */
export function getDefaultSettings(): SiteSettings {
  return { ...DEFAULT_SETTINGS };
}
