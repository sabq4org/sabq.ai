import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // إعدادات التجريبية
  experimental: {
    // تم نقل serverComponentsExternalPackages إلى serverExternalPackages
    // serverExternalPackages: ['@prisma/client'],
  },
  
  // External packages for server components
  serverExternalPackages: ['@prisma/client'],
  
  // إعدادات الصور
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  
  // إعادة توجيه للـ ML service
  async rewrites() {
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    
    return [
      {
        source: '/api/ml/:path*',
        destination: `${mlServiceUrl}/:path*`,
      },
    ];
  },
  
  // إعدادات CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.CORS_ORIGINS || '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
        ],
      },
    ];
  },
  
  // إعدادات الأمان
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/auth/login',
        permanent: false,
      },
    ];
  },
  
  // إعدادات Webpack
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  
  // إعدادات البيئة
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // إعدادات الضغط
  compress: true,
  
  // إعدادات التتبع
  trailingSlash: false,
  
  // إعدادات الأداء
  poweredByHeader: false,
  
  // إعدادات TypeScript
  typescript: {
    // تجاهل أخطاء TypeScript أثناء البناء (للتطوير فقط)
    ignoreBuildErrors: false,
  },
  
  // إعدادات ESLint
  eslint: {
    // تجاهل أخطاء ESLint أثناء البناء (للتطوير فقط)
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
