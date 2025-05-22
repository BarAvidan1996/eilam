/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    // Enable App Router
    appDir: true,
    // Remove @tremor/react from serverComponentsExternalPackages
    // since it's already in transpilePackages
  },
  // Disable static generation for specific paths
  unstable_excludeFiles: ["**/not-found.tsx", "**/error.tsx", "**/global-error.tsx", "**/agent/**"],
  // Add transpilePackages for @tremor/react
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
}

module.exports = nextConfig
