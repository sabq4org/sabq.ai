/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['tailwind-merge', '@prisma/client'],
  
  // إعدادات الصور
  images: {
    domains: ['res.cloudinary.com', 'images.unsplash.com', 'source.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  
  // إعدادات webpack محسنة
  webpack: (config, { isServer, dev }) => {
    // حل مشاكل module resolution
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve.fallback,
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
      },
    };
    
    // حل مشاكل cache في development
    if (dev) {
      config.cache = false;
    }
    
    // حل مشاكل vendor chunks
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              enforce: true,
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // إعدادات تجريبية لحل مشاكل React 19
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // إعدادات TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // إعدادات ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // إعدادات التطوير
  devIndicators: {
    position: 'bottom-right',
  },
};

export default nextConfig; 