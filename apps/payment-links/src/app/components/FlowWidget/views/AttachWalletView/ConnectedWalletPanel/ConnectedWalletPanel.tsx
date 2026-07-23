/* eslint-disable custom-rules/require-single-object-param */
'use client';

import type {
  Flow,
  WalletAccount,
  getTokenBalances,
} from '@dynamic-labs-sdk/client';
import {
  attachFlowSource,
  getFlowQuote,
} from '@dynamic-labs-sdk/client';
import { Spinner } from '@dynamic-labs-sdk/droplet';
import { useGetActiveNetworkData } from '@dynamic-labs-sdk/react-hooks';
import { X } from 'lucide-react';
import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import type { AttachWalletViewProps } from '../AttachWalletView.types';
import { truncateAddress } from '../helpers/truncateAddress';
import { TokenListPanel } from '../TokenListPanel';

const ALLOWED_TESTNET_CHAIN_IDS = new Set(['84532', '421614', '5042002', '11155420']);

type TokenBalance = Awaited<ReturnType<typeof getTokenBalances>>[number];

type ConnectedWalletPanelProps = {
  flow: Flow;
  onAttached: AttachWalletViewProps['onAttached'];
  onChangeWallet: () => void;
  onFlowUpdated: AttachWalletViewProps['onFlowUpdated'];
  walletAccount: WalletAccount;
};

const DEFAULT_SLIPPAGE = 0.005;

export const ConnectedWalletPanel: FC<ConnectedWalletPanelProps> = ({
  flow,
  walletAccount,
  onAttached,
  onChangeWallet,
  onFlowUpdated,
}) => {
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSourceReady, setIsSourceReady] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);

  const { data: activeNetworkResult } = useGetActiveNetworkData({ walletAccount });
  const activeNetwork = activeNetworkResult?.networkData;

  // Auto-attach as soon as activeNetwork resolves — useRef guards against
  // StrictMode double-invoke. Calls attachFlowSource directly to avoid the
  // waitForClientInitialized hang that can occur with useBaseMutation.
  const hasAttachedRef = useRef(false);

  useEffect(() => {
    if (!activeNetwork?.networkId) return;
    if (hasAttachedRef.current) return;
    hasAttachedRef.current = true;

    setIsAttaching(true);
    attachFlowSource({
      flowId: flow.id,
      fromAddress: walletAccount.address,
      fromChainId: String(activeNetwork.networkId),
      fromChainName: walletAccount.chain,
      sourceType: 'wallet',
    })
      .then((response) => {
        onFlowUpdated(response.flow);
        setIsSourceReady(true);
      })
      .catch((err) => {
        toast.error(
          err instanceof Error ? err.message : 'Failed to attach wallet source.'
        );
        hasAttachedRef.current = false;
      })
      .finally(() => setIsAttaching(false));
  }, [walletAccount.id, activeNetwork?.networkId]);

  const fetchQuoteAndAttach = async ({
    fromChainId,
    fromTokenAddress,
    fromTokenDecimals,
    fromTokenSymbol,
  }: {
    fromChainId: string | undefined;
    fromTokenAddress: string | undefined;
    fromTokenDecimals: number | undefined;
    fromTokenSymbol: string | undefined;
  }) => {
    setIsQuoting(true);
    try {
      const quotedFlow = await getFlowQuote({
        flowId: flow.id,
        fromChainId,
        fromTokenAddress,
        slippage: DEFAULT_SLIPPAGE,
      });
      onAttached({
        fromChainId,
        fromTokenAddress,
        fromTokenDecimals,
        fromTokenSymbol,
        quotedFlow,
        walletAccount: walletAccount as WalletAccount,
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to get quote. Please try again.'
      );
    } finally {
      setIsQuoting(false);
    }
  };

  const handleTokenSelect = (token: TokenBalance) =>
    fetchQuoteAndAttach({
      fromChainId: token.networkId?.toString(),
      fromTokenAddress: token.address,
      fromTokenDecimals: token.decimals,
      fromTokenSymbol: token.symbol,
    });

  const handleManualAddressSubmit = (address: string) =>
    fetchQuoteAndAttach({
      fromChainId: activeNetwork?.networkId?.toString(),
      fromTokenAddress: address,
      fromTokenDecimals: undefined,
      fromTokenSymbol: undefined,
    });

  const handleNativeTokenSelect = () =>
    fetchQuoteAndAttach({
      fromChainId: activeNetwork?.networkId?.toString(),
      fromTokenAddress: undefined,
      fromTokenDecimals: activeNetwork?.nativeCurrency.decimals,
      fromTokenSymbol: activeNetwork?.nativeCurrency.symbol,
    });

  const isBusy = isAttaching || isQuoting;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-0.5">
            Payment {flow.amount} {flow.currency}
          </p>
          <h2 className="text-xl font-bold">Pick a token</h2>
        </div>
        <button
          onClick={onChangeWallet}
          disabled={isBusy}
          className="flex items-center gap-1.5 mt-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-mono text-foreground hover:border-[var(--action)] transition-colors disabled:opacity-50 shrink-0"
        >
          {truncateAddress(walletAccount.address)}
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Block token selection until attachFlowSource completes */}
      {isAttaching || !isSourceReady ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <Spinner className="size-5 text-[var(--action)]" />
          <p className="text-xs text-muted-foreground">Preparing source…</p>
        </div>
      ) : isQuoting ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <Spinner className="size-5 text-[var(--action)]" />
          <p className="text-xs text-muted-foreground">Fetching quote…</p>
        </div>
      ) : (
        <TokenListPanel
          walletAccount={walletAccount}
          onTokenSelect={(token) => void handleTokenSelect(token)}
          onManualAddressSubmit={(address) => void handleManualAddressSubmit(address)}
          onNativeTokenSelect={() => void handleNativeTokenSelect()}
          isPending={isBusy}
        />
      )}
    </div>
  );
};
