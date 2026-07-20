import { addBitcoinExtension } from '@dynamic-labs-sdk/bitcoin';
import {
  createDynamicClient,
  initializeClient,
} from '@dynamic-labs-sdk/client';
import { addEvmExtension } from '@dynamic-labs-sdk/evm';
import { addWalletConnectEvmExtension } from '@dynamic-labs-sdk/evm/wallet-connect';
import { addSolanaExtension } from '@dynamic-labs-sdk/solana';
import { addWalletConnectSolanaExtension } from '@dynamic-labs-sdk/solana/wallet-connect';
import { addSuiExtension } from '@dynamic-labs-sdk/sui';
import { addTronExtension } from '@dynamic-labs-sdk/tron';

let initialized = false;

export const initializeDynamicClient = ({
  environmentId,
}: {
  environmentId: string;
}): void => {
  if (initialized) {
    return;
  }

  initialized = true;

  const apiBaseUrl =
    typeof window !== 'undefined'
      ? (localStorage.getItem('payment-links-api-url') ?? undefined)
      : undefined;

  createDynamicClient({
    autoInitialize: false,
    ...(apiBaseUrl ? { coreConfig: { apiBaseUrl } } : {}),
    environmentId,
    logLevel: 'debug',
  });

  void initializeClient();

  addEvmExtension();
  addSolanaExtension();
  addBitcoinExtension();
  addSuiExtension();
  addTronExtension();
  void addWalletConnectEvmExtension();
  void addWalletConnectSolanaExtension();
};
