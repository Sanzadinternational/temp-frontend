/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode
  typescript: {
    ignoreBuildErrors: true, // Ignore TypeScript errors during build
  },
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint errors during build
  },
  images: {
    domains: ['api.sanzadinternational.in'],
    // Alternatively, you can use remotePatterns for more control:
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.sanzadinternational.in',
        port: '',
        pathname: '/api/V1/uploads/**',
      },
    ],
  },
};

export default nextConfig;
