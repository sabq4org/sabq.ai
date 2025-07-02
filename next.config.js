/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better error handling
  reactStrictMode: true,
  
  // Remove standalone output for Vercel deployment
  // output: 'standalone',
  
  // تعطيل الكاش في وضع التطوير
  generateBuildId: async () => {
    // إنشاء build ID فريد في كل مرة في وضع التطوير
    if (process.env.NODE_ENV === 'development') {
      return `dev-${Date.now()}`
    }
    return null
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'sabq-ai-cms.vercel.app',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Headers for security and proper MIME types
  async headers() {
    return [
      // Headers للملفات الثابتة في الإنتاج فقط
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'development' 
              ? 'no-cache, no-store, must-revalidate' 
              : 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=UTF-8',
          }
        ]
      },
      // Headers لملفات CSS
      {
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=UTF-8',
          },
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'development' 
              ? 'no-cache, no-store, must-revalidate' 
              : 'public, max-age=31536000, immutable',
          }
        ]
      },
      // Headers لملفات JavaScript
      {
        source: '/_next/static/chunks/:path*.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=UTF-8',
          },
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'development' 
              ? 'no-cache, no-store, must-revalidate' 
              : 'public, max-age=31536000, immutable',
          }
        ]
      },
      // Headers عامة للأمان
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          // إضافة CORS headers لحل مشكلة RSC
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization, Accept'
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          }
        ]
      },
      // Headers خاصة لـ RSC
      {
        source: '/:path*',
        has: [
          {
            type: 'query',
            key: '_rsc'
          }
        ],
        headers: [
          {
            key: 'Content-Type',
            value: 'text/x-component'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          }
        ]
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization, Accept'
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          }
        ]
      },
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: true,
      },
    ]
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
  },
  
  // Webpack configuration - محسن لحل مشاكل Fast Refresh
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // إصلاح مشاكل Node.js modules في المتصفح
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    
    // تحسين الأداء وتعطيل الكاش في وضع التطوير
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
    };
    
    // تعطيل الكاش في وضع التطوير لحل مشاكل Fast Refresh
    if (dev) {
      config.cache = false;
      // إضافة إعدادات Fast Refresh
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.next', '**/.git'],
      };
      
      // إضافة إعدادات لحل مشاكل HMR و RSC
      config.optimization = {
        ...config.optimization,
        runtimeChunk: false,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
          },
        },
      };
    }
    
    return config;
  },
  
  // Experimental features
  // experimental: {
  //   optimizeCss: true,
  // },
  
  // Turbopack configuration
  turbopack: {
    resolveAlias: {
      underscore: 'lodash',
      mocha: { browser: 'mocha/browser-entry.js' },
    },
  },
  
  // Performance
  poweredByHeader: false,
  compress: true,
  
  // إضافة trailing slashes للمسارات
  trailingSlash: false,
  
  // تحسينات الإنتاج
  productionBrowserSourceMaps: false,
  
  // TypeScript
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  
  // ESLint
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  
  // نقل serverComponentsExternalPackages للمكان الصحيح
  serverExternalPackages: ['@prisma/client', 'bcrypt'],
  
  // Short link rewrites
  async rewrites() {
    return [
      { source: '/n/:slug', destination: '/article/:slug' }
    ]
  },
}

module.exports = nextConfig 