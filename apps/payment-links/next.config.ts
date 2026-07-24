import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // utf-8-validate and bufferutil are native Node addons pulled in by
  // WalletConnect — webpack can't bundle them, so exclude from the bundle.
  serverExternalPackages: ['utf-8-validate', 'bufferutil'],
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
