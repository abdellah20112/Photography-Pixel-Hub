/* ============================================
   WhatsApp URL Utility
   Generates WhatsApp message URLs.
   ============================================ */

/** Generate a WhatsApp message URL from phone number. */
export function getWhatsAppUrl(phone: string, message?: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${cleanPhone}${text}`;
}
