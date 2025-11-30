/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // For Cloudflare Pages static export
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
  },
  // Enable static export for Cloudflare Pages
  experimental: {
    // Add experimental features if needed
  },
};

module.exports = nextConfig;
