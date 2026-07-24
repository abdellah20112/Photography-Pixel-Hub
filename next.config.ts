import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;

const nextConfig = {
  // ...
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  middlewareClientMaxBodySize: 524288000, // 500 MB
};

export default nextConfig;