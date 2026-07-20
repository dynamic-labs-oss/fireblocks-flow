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
  getNetworksData,
  switchActiveNetwork,
} from '@dynamic-labs-sdk/client';
import { Button, Spinner } from '@dynamic-labs-sdk/droplet';
import { useGetActiveNetworkData } from '@dynamic-labs-sdk/react-hooks';
import type { FC } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { SLIPPAGE_OPTIONS } from '../../../FlowWidget.constants';
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

export const ConnectedWalletPanel: FC<ConnectedWalletPanelProps> = ({
  flow,
  walletAccount,
  onAttached,
  onChangeWallet,
  onFlowUpdated,
}) => {
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSourceReady, setIsSourceReady] = useState(false);
  const [slippage, setSlippage] = useState(SLIPPAGE_OPTIONS[0].value);

  const { data: activeNetworkResult, refetch: refetchActiveNetwork } =
    useGetActiveNetworkData({ walletAccount });
  const activeNetwork = activeNetworkResult?.networkData;

  const allNetworks = useMemo(() => {
    try {
      return getNetworksData();
    } catch {
      return [];
    }
  }, []);
  const walletNetworks = allNetworks.filter(
    (n) =>
      n.chain === walletAccount.chain &&
      (!n.testnet || ALLOWED_TESTNET_CHAIN_IDS.has(String(n.networkId))),
  );

  const handleSwitchNetwork = async (networkId: string) => {
    await switchActiveNetwork({ networkId, walletAccount });
    await refetchActiveNetwork();
  };

  const [isAttaching, setIsAttaching] = useState(false);

  console.log('[ConnectedWalletPanel] render', {
    walletAddress: walletAccount.address,
    walletChain: walletAccount.chain,
    activeNetworkId: activeNetwork?.networkId ?? '(undefined — still loading)',
    activeNetworkName: activeNetwork?.displayName ?? '(undefined)',
    isAttaching,
    isSourceReady,
  });

  // Auto-attach as soon as activeNetwork resolves — useRef guards against
  // StrictMode double-invoke. Calls attachFlowSource directly to avoid the
  // waitForClientInitialized hang that can occur with useBaseMutation.
  const hasAttachedRef = useRef(false);

  useEffect(() => {
    console.log('[ConnectedWalletPanel] effect fired', {
      walletId: walletAccount.id,
      address: walletAccount.address,
      chain: walletAccount.chain,
      networkId: activeNetwork?.networkId ?? '(undefined — waiting)',
      alreadyAttached: hasAttachedRef.current,
    });
    if (!activeNetwork?.networkId) {
      console.log('[ConnectedWalletPanel] no networkId yet, skipping attach');
      return;
    }
    if (hasAttachedRef.current) {
      console.log('[ConnectedWalletPanel] already attached, skipping');
      return;
    }
    hasAttachedRef.current = true;

    console.log('[ConnectedWalletPanel] calling attachFlowSource', {
      flowId: flow.id,
      fromAddress: walletAccount.address,
      fromChainId: String(activeNetwork.networkId),
      fromChainName: walletAccount.chain,
    });
    setIsAttaching(true);
    attachFlowSource({
      flowId: flow.id,
      fromAddress: walletAccount.address,
      fromChainId: String(activeNetwork.networkId),
      fromChainName: walletAccount.chain,
      sourceType: 'wallet',
    })
      .then((response) => {
        console.log('[ConnectedWalletPanel] attachFlowSource succeeded', response.flow);
        onFlowUpdated(response.flow);
        setIsSourceReady(true);
      })
      .catch((err) => {
        console.error('[ConnectedWalletPanel] attachFlowSource failed', err);
        toast.error(
          err instanceof Error ? err.message : 'Failed to attach wallet source.'
        );
        // Reset so the effect can retry if the user switches network or reconnects
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
        slippage,
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
        err instanceof Error
          ? err.message
          : 'Failed to get quote. Please try again.'
      );
    } finally {
      setIsQuoting(false);
    }
  };

  // When a token is selected, fetch the quote immediately and navigate
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
      {/* Wallet identity card */}
      <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-sm font-medium font-mono">
              {truncateAddress(walletAccount.address)}
            </span>
            <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted uppercase tracking-wide">
              {walletAccount.chain}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onChangeWallet}
            disabled={isBusy}
          >
            Change
          </Button>
        </div>

        {walletNetworks.length > 1 && (
          <div className="flex items-center gap-2 pt-2.5 border-t border-border">
            <span className="text-xs text-muted-foreground">Network</span>
            <div className="flex items-center gap-1.5">
              {activeNetwork?.iconUrl && (
                <img
                  src={activeNetwork.iconUrl}
                  alt={activeNetwork.displayName}
                  className="w-3.5 h-3.5 rounded-full"
                />
              )}
              <select
                className="text-xs border border-border rounded-md px-2 py-0.5 bg-card text-foreground cursor-pointer outline-none"
                value={activeNetwork?.networkId ?? ''}
                onChange={(e) => void handleSwitchNetwork(e.target.value)}
              >
                {walletNetworks.map((network) => (
                  <option key={network.networkId} value={network.networkId}>
                    {network.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="text-xs text-muted-foreground">Slippage</span>
          <div className="flex items-center gap-1">
            {SLIPPAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={isBusy}
                onClick={() => setSlippage(opt.value)}
                className={`h-6 px-2 rounded text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                  slippage === opt.value
                    ? 'bg-[var(--action)] text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-2 px-1">
          Select a token to use as payment source
        </p>
        {/* Block token selection until attachFlowSource has completed — prevents
            a race where the user selects a token before the source is attached,
            causing the component to unmount before the attach effect fires. */}
        {isAttaching || !isSourceReady ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <Spinner className="size-5 text-[var(--action)]" />
            <p className="text-xs text-muted-foreground">Preparing source…</p>
          </div>
        ) : isQuoting ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <Spinner className="size-5 text-[var(--action)]" />
            <p className="text-xs text-muted-foreground">Fetching quote…</p>
          </div>
        ) : (
          <TokenListPanel
            walletAccount={walletAccount}
            networkId={
              activeNetwork?.networkId
                ? Number(activeNetwork.networkId)
                : undefined
            }
            onTokenSelect={(token) => void handleTokenSelect(token)}
            onManualAddressSubmit={(address) =>
              void handleManualAddressSubmit(address)
            }
            onNativeTokenSelect={() => void handleNativeTokenSelect()}
            isPending={isBusy}
          />
        )}
      </div>
    </div>
  );
};
