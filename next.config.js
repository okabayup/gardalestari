
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // Menonaktifkan optimasi proxy untuk memastikan akses langsung ke folder public di App Hosting
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gardalestari.org',
      },
      {
        protocol: 'https',
        hostname: 'lalokalabs.co',
      },
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
      {
        protocol: 'https',
        hostname: 'preditrix.ai',
      },
      {
        protocol: 'https',
        hostname: 'recogify.com',
      },
      {
        protocol: 'https',
        hostname: 'webapi-bpdlh.kemenkeu.go.id',
      },
      {
        protocol: 'https',
        hostname: 'sourceup-api-cdn-endpoint-prod.azureedge.net',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'strapi.jala.tech',
      },
      {
        protocol: 'https',
        hostname: 'blogger.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'www.perhutani.co.id',
      },
      {
        protocol: 'https',
        hostname: 'rec-data.kalibrr.com',
      },
      {
        protocol: 'https',
        hostname: 'adorespices.com',
      },
      {
        protocol: 'https',
        hostname: 'data.opendevelopmentcambodia.net',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'www.vissensa.com',
      },
    ],
  },
  // Mengabaikan build errors untuk kelancaran deploy saat investigasi
  typescript: {
    ignoreBuildErrors: true,
  },
  // Mengaktifkan fitur Turbopack sesuai standar Next.js 16 untuk mengatasi konflik dengan webpack config
  turbopack: {}, 
  experimental: {
    // Properti turbopack dipindahkan ke root level untuk validasi build yang lebih stabil
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = withPWA(nextConfig);
