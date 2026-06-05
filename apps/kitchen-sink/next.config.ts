import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@agent-ready/react",
    "@agent-ready/runtime",
    "@agent-ready/schema"
  ]
};

export default nextConfig;
