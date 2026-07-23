/* ============================================
   WhatsApp URL Utility
   Generates WhatsApp message URLs.
   Handles Moroccan phone number formatting.
   ============================================ */

/**
 * Convert a Moroccan local phone number to international format.
 * 06xxxxxxxx → 2126xxxxxxxx
 * 07xxxxxxxx → 2127xxxxxxxx
 * Already international numbers are returned as-is.
 */
export function formatMoroccanPhone(phone: string): string {
  const cleanPhone = phone.replace(/[^0-9+]/g, "");

  // Already international (starts with 212)
  if (cleanPhone.startsWith("212")) {
    return cleanPhone.replace(/^\+/, "");
  }

  // Local Moroccan format: 06xxxxxxxx or 07xxxxxxxx
  if (/^0[67]\d{8}$/.test(cleanPhone)) {
    return "212" + cleanPhone.slice(1);
  }

  // Fallback — just strip non-digits
  return cleanPhone;
}

/** Generate a WhatsApp message URL from phone number. */
export function getWhatsAppUrl(phone: string, message?: string): string {
  const formatted = formatMoroccanPhone(phone);
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${formatted}${text}`;
}
