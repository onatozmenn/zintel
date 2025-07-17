/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  serverExternalPackages: ['mssql'],
  // Production settings
  poweredByHeader: false,
  compress: true,
  // Error handling
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Image optimization
  images: {
    unoptimized: true,
    domains: ['blob.v0.dev'],
  },
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.NODE_ENV,
  },
}

export default nextConfig
