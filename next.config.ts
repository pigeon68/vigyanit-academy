import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hpejrbwxtbmwulhjgswk.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.stripe.com',
      },
    ],
  },
  outputFileTracingRoot: path.resolve(__dirname, '../../'),
} as NextConfig;

export default nextConfig;
