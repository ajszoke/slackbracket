import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  typedRoutes: true,
  images: { unoptimized: true }
};

export default nextConfig;
