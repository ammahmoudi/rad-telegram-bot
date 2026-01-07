import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local first to ensure it takes priority
config({ path: resolve(__dirname, '.env.local'), override: true });
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  turbopack: {},
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL || 'file:C:/Users/ammah/Documents/GitHub/rastar-telegram-bot/data/rastar.db',
  },
  webpack: (config, { isServer }) => {
    // Handle node: protocol for built-in modules
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
