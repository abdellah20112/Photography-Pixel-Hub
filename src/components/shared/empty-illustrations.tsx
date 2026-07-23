import { cn } from "@/lib/utils/cn";

/* ============================================
   EmptyIllustrations — Professional SVGs
   Used with EmptyState for polished UX.
   ============================================ */

type IllustrationProps = {
  className?: string;
};

export function NoProjectsIllustration({ className }: IllustrationProps) {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className={cn("text-muted-foreground/30", className)}>
      <rect x="10" y="18" width="60" height="44" rx="6" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M28 18 L30 12 L50 12 L52 18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="40" r="12" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="40" cy="40" r="5" fill="currentColor" />
      <path d="M56 12 L57 9 L58 12 L61 13 L58 14 L57 17 L56 14 L53 13 Z" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function NoVideosIllustration({ className }: IllustrationProps) {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className={cn("text-muted-foreground/30", className)}>
      <rect x="20" y="14" width="40" height="52" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="40" cy="36" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M36 32 L46 36 L36 40 Z" fill="currentColor" />
      <rect x="24" y="18" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.5" />
      <rect x="24" y="26" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.5" />
      <rect x="53" y="18" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.5" />
      <rect x="53" y="26" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function NoClientsIllustration({ className }: IllustrationProps) {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className={cn("text-muted-foreground/30", className)}>
      <circle cx="32" cy="28" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M16 58 Q16 44 32 44 Q48 44 48 58" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="56" cy="32" r="8" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M44 58 Q44 48 56 48 Q68 48 68 58" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export function NoCommentsIllustration({ className }: IllustrationProps) {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className={cn("text-muted-foreground/30", className)}>
      <path
        d="M20 24 Q20 18 26 18 L54 18 Q60 18 60 24 L60 40 Q60 46 54 46 L38 46 L30 54 L30 46 L26 46 Q20 46 20 40 Z"
        stroke="currentColor" strokeWidth="2" fill="none"
      />
      <circle cx="32" cy="32" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="40" cy="32" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="48" cy="32" r="2" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function NoActivityIllustration({ className }: IllustrationProps) {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className={cn("text-muted-foreground/30", className)}>
      <path d="M10 50 L22 50 L28 36 L36 64 L42 50 L70 50" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="36" cy="64" r="3" fill="currentColor" opacity="0.5" />
      <path d="M60 18 L61 15 L62 18 L65 19 L62 20 L61 23 L60 20 L57 19 Z" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

export function NoSearchResultsIllustration({ className }: IllustrationProps) {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className={cn("text-muted-foreground/30", className)}>
      <circle cx="34" cy="34" r="16" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M46 46 L60 60" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M28 34 L40 34 M34 28 L34 40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export function NoDataIllustration({ className }: IllustrationProps) {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className={cn("text-muted-foreground/30", className)}>
      <rect x="16" y="14" width="48" height="52" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="24" y1="28" x2="56" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="24" y1="38" x2="56" y2="38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="24" y1="48" x2="44" y2="48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}
