/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // 这里加上转发规则，把 /api/v1 代理到后端
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://1.94.61.64:8080/api/v1/:path*',
      },
    ]
  },
}

export default nextConfig
