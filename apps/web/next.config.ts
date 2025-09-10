import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
  experimental: {
    esmExternals: "loose",
  },
  eslint: {
    // ✅ Prevent ESLint errors from failing `next build`
    ignoreDuringBuilds: true,
  },
  typescript: {
    // (Optional) Uncomment if TS errors also block your build
    // ignoreBuildErrors: true,
  },
};

export default nextConfig;
