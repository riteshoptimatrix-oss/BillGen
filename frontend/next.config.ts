import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Ensure allowed dev origins for secure local LAN and mobile testing
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '192.168.1.14',
  ],
};

export default nextConfig;
