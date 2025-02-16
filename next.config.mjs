/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Disable server-side features
  // experimental: {
  // appDir: false,
  // },
}

export default nextConfig