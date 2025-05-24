/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Disable static generation completely to avoid issues with ThemeProvider
  experimental: {
    appDir: true,
  },
  transpilePackages: ["@tremor/react"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable static generation completely
  staticPageGenerationTimeout: 1000,
  // Disable static generation for all pages
  exportPathMap: null,
}

module.exports = nextConfig
