import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: [
    '@dynamic-labs-sdk/bitcoin',
    '@dynamic-labs-sdk/client',
    '@dynamic-labs-sdk/droplet',
    '@dynamic-labs-sdk/evm',
    '@dynamic-labs-sdk/react-hooks',
    '@dynamic-labs-sdk/solana',
    '@dynamic-labs-sdk/sui',
    '@dynamic-labs-sdk/tron',
    '@dynamic-labs-sdk/wallet-connect',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
