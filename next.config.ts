import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    // [FIX] Izinkan SVG dari domain eksternal (Dicebear)
    dangerouslyAllowSVG: true,
    // Opsional: Tambahkan header keamanan untuk SVG
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com', // Mengizinkan gambar dari Google Drive
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // (Opsional) Tetap simpan jika masih pakai Unsplash
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        // Opsional: Anda dapat membatasi path jika diperlukan, misalnya:
        // pathname: '/7.x/avataaars/svg/**',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;