import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/legal/*": ["./content/legal/**/*.md"],
  },
};

export default nextConfig;
