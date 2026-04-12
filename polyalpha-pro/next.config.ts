import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "polymarket-upload.s3.us-east-2.amazonaws.com",
      },
    ],
  },
  serverExternalPackages: ["@anthropic-ai/sdk"],
};

export default nextConfig;
