import { BRANDING } from "@/config/branding";

/* ============================================
   Footer — Dashboard footer
   ============================================ */

export function Footer() {
  return (
    <footer className="shrink-0 border-t px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
        <p>
          © {new Date().getFullYear()} {BRANDING.companyName}. جميع الحقوق محفوظة.
        </p>
        <p>{BRANDING.tagline}</p>
      </div>
    </footer>
  );
}
