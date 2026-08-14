import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal .next/standalone server bundle for Docker,
  // instead of requiring the full node_modules tree at runtime.
  output: "standalone",
};

export default nextConfig;
