/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  webpack: (config, { isServer }) => {
    // إصلاح مشاكل المكتبات
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // إصلاح مشكلة self is not defined
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        self: false,
      };
      
      // إصلاح مشكلة exports is not defined
      config.output = {
        ...config.output,
        globalObject: 'this',
      };
    }
    
    // تعطيل splitChunks مؤقتاً لحل المشكلة
    config.optimization = {
      ...config.optimization,
      splitChunks: false,
    };
    
    return config;
  },
  // إعدادات الصور
  images: {
    domains: ['res.cloudinary.com', 'localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  // تحسين الأداء
  compress: true,
  poweredByHeader: false,
  // إعدادات البيئة
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // إعدادات التصدير
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
};

module.exports = nextConfig;
