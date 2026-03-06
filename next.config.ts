import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: '**.openbeautyfacts.org' },
      { protocol: 'https', hostname: 'images.openfoodfacts.org' },
    ],
  },
};

export default nextConfig;
