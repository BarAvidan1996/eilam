/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    // Disable static generation for pages that use ThemeProvider
    // This will make Next.js render these pages at runtime instead of build time
    appDir: true,
    serverComponentsExternalPackages: ["@tremor/react"],
  },
  // Disable static generation for specific paths
  unstable_excludeFiles: ["**/not-found.tsx", "**/error.tsx", "**/global-error.tsx", "**/agent/**"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
