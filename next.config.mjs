/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['tailwind-merge'],
  webpack: (config, { isServer }) => {
    // A custom webpack configuration to handle potential module resolution issues.
    if (!isServer) {
      // Ensures that node-related packages are not bundled on the client-side.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
};

export default nextConfig; 