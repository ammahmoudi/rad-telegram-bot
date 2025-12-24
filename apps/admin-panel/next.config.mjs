/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    ADMIN_BASIC_AUTH_USER: process.env.ADMIN_BASIC_AUTH_USER,
    ADMIN_BASIC_AUTH_PASS: process.env.ADMIN_BASIC_AUTH_PASS,
  },
};

export default nextConfig;
