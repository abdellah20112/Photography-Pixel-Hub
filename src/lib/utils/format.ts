/* ============================================
   Formatting Utilities
   ============================================ */

/**
 * Format bytes into a human-readable string.
 * @example formatBytes(1536) → "1.5 KB"
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  if (bytes < 0) return "—";
  if (!Number.isFinite(bytes)) return "—";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format a date for display in the Arabic locale.
 * @example formatDate("2025-01-15") → "١٥ يناير ٢٠٢٥"
 */
export function formatDate(
  date: Date | string | number,
  locale = "ar-SA",
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }
): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Format a date and time for display.
 */
export function formatDateTime(
  date: Date | string | number,
  locale = "ar-SA"
): string {
  return formatDate(date, locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a number with thousands separators.
 */
export function formatNumber(
  value: number,
  locale = "ar-SA"
): string {
  return new Intl.NumberFormat(locale).format(value);
}
