const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  // Next.js 16 + Turbopack configuration
  // Mengosongkan objek ini akan menonaktifkan kesalahan peringatan migrasi
  // dan menghindari penggunaan nilai boolean pada resolveAlias yang menyebabkan error.
  turbopack: {},
  // Konfigurasi webpack tetap dipertahankan untuk fallback atau lingkungan non-turbopack
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = withPWA(nextConfig);
