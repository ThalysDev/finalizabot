import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Prisma + monorepo: prevent bundling of shared package (contains #generated/prisma
  // subpath import and native query engine binary that bundlers can't handle)
  serverExternalPackages: ["@finalizabot/shared"],

  // Ensure Vercel includes the generated Prisma client files (runtime, query engine
  // binary, schema) in serverless functions — needed because output is a custom path,
  // not the default node_modules/.prisma/client that Vercel auto-traces
  outputFileTracingIncludes: {
    "/**": ["../../packages/shared/generated/prisma/**/*"],
  },

  // Image Optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
  },

  // Compression
  compress: true,

  // Build Output Analysis
  productionBrowserSourceMaps: false,

  // SWR Cache Headers
  onDemandEntries: {
    maxInactiveAge: 25 * 1000, // 25 seconds
    pagesBufferLength: 5,
  },
};

export default nextConfig;
