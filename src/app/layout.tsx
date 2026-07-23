import type { Metadata, Viewport } from "next";
import { Cairo, Inter } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/providers/theme-provider";
import { SessionProvider } from "@/providers/session-provider";
import { QueryProvider } from "@/providers/query-provider";
import { getCurrentUser } from "@/lib/auth/session";
import { BRANDING_METADATA } from "@/config/branding";

import { Toaster } from "sonner";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: BRANDING_METADATA.metadata.title,
    template: `%s | ${BRANDING_METADATA.metadata.title}`,
  },
  description: BRANDING_METADATA.metadata.description,
  applicationName: BRANDING_METADATA.metadata.title,
  authors: [{ name: BRANDING_METADATA.companyName }],
  keywords: BRANDING_METADATA.metadata.keywords,
  icons: {
    icon: [
      { url: BRANDING_METADATA.favicon },
      { url: BRANDING_METADATA.icons.favicon16, sizes: "16x16", type: "image/png" },
      { url: BRANDING_METADATA.icons.favicon32, sizes: "32x32", type: "image/png" },
    ],
    shortcut: BRANDING_METADATA.favicon,
    apple: BRANDING_METADATA.icons.appleTouchIcon,
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    title: BRANDING_METADATA.metadata.title,
    description: BRANDING_METADATA.metadata.description,
    siteName: BRANDING_METADATA.companyName,
    images: [{ url: BRANDING_METADATA.icons.icon512 }],
  },
  twitter: {
    card: "summary_large_image",
    title: BRANDING_METADATA.metadata.title,
    description: BRANDING_METADATA.metadata.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    // Authentication failure is non-fatal — render without session
  }

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="icon" href={BRANDING_METADATA.favicon} />
        <link rel="icon" type="image/png" sizes="16x16" href={BRANDING_METADATA.icons.favicon16} />
        <link rel="icon" type="image/png" sizes="32x32" href={BRANDING_METADATA.icons.favicon32} />
        <link rel="apple-touch-icon" href={BRANDING_METADATA.icons.appleTouchIcon} />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${cairo.variable} ${inter.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider initialUser={user}>
            <QueryProvider>
              {children}
              <Toaster
                position="top-center"
                richColors
                closeButton
                dir="rtl"
              />
            </QueryProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
