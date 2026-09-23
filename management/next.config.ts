import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.airavatsecurity.in',
      },
      {
        protocol: 'https',
        hostname: 'airavatsecurity.in',
      },
    ],
  },
};

export default nextConfig;
