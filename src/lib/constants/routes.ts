/* ============================================
   Route Constants
   ============================================ */

export const ROUTES = {
  /* ── Public ─────────────────────────────── */
  HOME: "/",

  /* ── Auth ───────────────────────────────── */
  LOGIN: "/login",

  /* ── Dashboard ──────────────────────────── */
  DASHBOARD: "/dashboard",
  DASHBOARD_ANALYTICS: "/dashboard/analytics",
  DASHBOARD_CLIENTS: "/dashboard/clients",
  DASHBOARD_PROJECTS: "/dashboard/projects",
  DASHBOARD_PROJECT_DETAILS: (id: string) => `/dashboard/projects/${id}`,
  DASHBOARD_UPLOADS: "/dashboard/uploads",
  DASHBOARD_DELIVERIES: "/dashboard/deliveries",
  DASHBOARD_MODELS: "/dashboard/models",
  DASHBOARD_FINANCE: "/dashboard/finance",
  DASHBOARD_TEAM: "/dashboard/team",
  DASHBOARD_CALENDAR: "/dashboard/calendar",
  DASHBOARD_TASKS: "/dashboard/tasks",
  DASHBOARD_EXECUTIVE: "/dashboard/executive",
  DASHBOARD_ACTIVITY: "/dashboard/activity",
  DASHBOARD_SETTINGS: "/dashboard/settings",
  DASHBOARD_PROFILE: "/dashboard/profile",

  /* ── Public Gallery (token-based) ──────── */
  PUBLIC_GALLERY: (token: string) => `/p/${token}`,

  /* ── Public Delivery Portal ───────────── */
  PUBLIC_DELIVERY: (slug: string) => `/delivery/${slug}`,
  PUBLIC_DELIVERY_THANK_YOU: (slug: string) => `/delivery/${slug}/thank-you`,
} as const;

/* ── Route Groups ────────────────────────── */
export const PROTECTED_ROUTES = ["/dashboard"] as const;

export const AUTH_ROUTES = ["/login"] as const;

/* ── API Routes ──────────────────────────── */
export const API_ROUTES = {
  UPLOAD: "/api/upload",
  WEBHOOKS: "/api/webhooks",
} as const;
