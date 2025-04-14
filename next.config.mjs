/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/:path*`,
      },
      {
        source: "/api/users/:path*",
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/:path*`,
      },
    ];
  },
};

export default nextConfig;
