import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/legal/*": ["./content/legal/**/*.md"],
  },
  images: {
    // Avatars of users who signed in with Google or GitHub: BetterAuth stores
    // the provider's URL on the account, so next/image has to be told those
    // two hosts are allowed. A picture uploaded in Settings is a data URL and
    // never reaches the optimizer.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',},
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
