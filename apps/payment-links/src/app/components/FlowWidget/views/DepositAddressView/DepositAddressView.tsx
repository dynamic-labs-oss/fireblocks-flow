'use client';

import type { Flow } from '@dynamic-labs-sdk/client';
import { attachFlowSource, getFlow, getFlowQuote } from '@dynamic-labs-sdk/client';
import { Spinner } from '@dynamic-labs-sdk/droplet';
import { useMutation, useQuery } from '@tanstack/react-query';
import { type FC, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

type SupportedChain = {
  chainId: string;
  chainName: 'BTC' | 'SOL' | 'EVM';
  decimals: number;
  label: string;
  symbol: string;
  tokenAddress?: string;
};

const SUPPORTED_CHAINS: SupportedChain[] = [
  { chainId: '1', chainName: 'BTC', decimals: 8, label: 'Bitcoin', symbol: 'BTC' },
  { chainId: '101', chainName: 'SOL', decimals: 9, label: 'Solana', symbol: 'SOL' },
  { chainId: '1', chainName: 'EVM', decimals: 18, label: 'Ethereum / EVM', symbol: 'ETH' },
  {
    chainId: '1',
    chainName: 'EVM',
    decimals: 6,
    label: 'Ethereum USDC',
    symbol: 'USDC',
    tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  },
];

const formatTokenAmount = (raw: string | undefined, decimals: number): string => {
  if (!raw) return '—';
  const val = Number(BigInt(raw)) / Math.pow(10, decimals);
  return val.toLocaleString(undefined, { maximumSignificantDigits: 6 });
};

const CHAIN_NATIVE_TOKEN: Record<string, { decimals: number; symbol: string }> = {
  BTC: { decimals: 8, symbol: 'BTC' },
  EVM: { decimals: 18, symbol: 'ETH' },
  SOL: { decimals: 9, symbol: 'SOL' },
};

// Common ERC-20 addresses (lowercase) → decimals + symbol
const TOKEN_ADDRESS_INFO: Record<string, { decimals: number; symbol: string }> = {
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': { decimals: 6, symbol: 'USDC' }, // Base
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { decimals: 6, symbol: 'USDC' }, // Ethereum
  '0xaf88d065e77c8cc2239327c5edb3a432268e5831': { decimals: 6, symbol: 'USDC' }, // Arbitrum
  '0xdac17f958d2ee523a2206206994597c13d831ec7': { decimals: 6, symbol: 'USDT' }, // Ethereum
};

const getDestinationTokenInfo = (flow: Flow): { decimals: number; symbol: string } => {
  if (flow.toToken) {
    const info = TOKEN_ADDRESS_INFO[flow.toToken.toLowerCase()];
    if (info) return info;
  }
  const chain = String(flow.toChainName ?? '').toUpperCase();
  return CHAIN_NATIVE_TOKEN[chain] ?? { decimals: 18, symbol: '?' };
};

type DepositAddressViewProps = {
  flow: Flow;
  onBack: () => void;
  onFlowUpdated: (flow: Flow) => void;
  onTransitionToStatus: (flow: Flow) => void;
};

export const DepositAddressView: FC<DepositAddressViewProps> = ({
  flow,
  onBack,
  onFlowUpdated,
  onTransitionToStatus,
}) => {
  const [selectedChain, setSelectedChain] = useState<SupportedChain | null>(null);
  const [refundAddress, setRefundAddress] = useState('');
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (depositAddress && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, depositAddress, { width: 200 }).catch(
        (error: unknown) => console.error('Failed to generate QR code', error),
      );
    }
  }, [depositAddress]);

  // Once the deposit address is shown, poll until the flow leaves "quoted" state
  const { data: polledFlow } = useQuery({
    enabled: !!depositAddress,
    queryFn: () => getFlow({ flowId: flow.id }),
    queryKey: ['depositAddressStatus', flow.id],
    refetchInterval: (query) =>
      (query.state.data?.executionState ?? 'quoted') === 'quoted' ? 3000 : false,
    staleTime: 0,
  });

  useEffect(() => {
    if (!polledFlow) return;
    const state = String(polledFlow.executionState);
    if (state !== 'quoted') {
      onTransitionToStatus(polledFlow);
    }
  }, [polledFlow, onTransitionToStatus]);

  const attachAndQuoteMutation = useMutation({
    mutationFn: async (chain: SupportedChain) => {
      console.log('[DepositAddress] attachFlowSource →', { flowId: flow.id, chain });
      await attachFlowSource({
        flowId: flow.id,
        fromChainId: chain.chainId,
        fromChainName: chain.chainName,
        ...(refundAddress.trim() && { refundAddress: refundAddress.trim() }),
        sourceType: 'deposit_address',
      });
      console.log('[DepositAddress] attachFlowSource done, calling getFlowQuote');

      const updatedFlow = await getFlowQuote({
        flowId: flow.id,
        ...(chain.tokenAddress && { fromTokenAddress: chain.tokenAddress }),
      });
      console.log('[DepositAddress] getFlowQuote result →', {
        executionState: updatedFlow.executionState,
        depositAddress: updatedFlow.depositAddress,
        'quote?.depositAddress': (updatedFlow.quote as Record<string, unknown>)?.depositAddress,
        quote: updatedFlow.quote,
        fullFlow: updatedFlow,
      });
      return { addr: updatedFlow.depositAddress, updatedFlow };
    },
    onSuccess: ({ addr, updatedFlow }, chain) => {
      console.log('[DepositAddress] onSuccess → addr:', addr, 'chain:', chain.label);
      setSelectedChain(chain);
      setDepositAddress(addr ?? null);
      onFlowUpdated(updatedFlow);
    },
    onError: (error) => {
      console.error('[DepositAddress] mutation error:', error);
    },
  });

  const handleCopy = async () => {
    if (!depositAddress) return;
    await navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (depositAddress && selectedChain) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Send {selectedChain.symbol}</h3>

        <div className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">You send</span>
            <span>{formatTokenAmount(flow.quote?.fromAmount, selectedChain.decimals)} {selectedChain.symbol}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">You receive</span>
            {(() => {
              const dest = getDestinationTokenInfo(flow);
              return <span>{formatTokenAmount(flow.quote?.toAmount, dest.decimals)} {dest.symbol}</span>;
            })()}
          </div>
          {flow.quote?.fees?.totalFeeUsd && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fees</span>
              <span>${flow.quote.fees.totalFeeUsd}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-center">
            <canvas ref={qrCanvasRef} className="rounded-lg" />
          </div>
          <p className="text-xs text-muted-foreground">
            Send exactly {formatTokenAmount(flow.quote?.fromAmount, selectedChain.decimals)} {selectedChain.symbol} to:
          </p>
          <div className="rounded-xl border border-border bg-muted p-3 flex items-center justify-between gap-2">
            <span className="text-xs font-mono break-all">{depositAddress}</span>
            <button
              type="button"
              className="shrink-0 text-xs font-medium text-[var(--action)] hover:underline"
              onClick={handleCopy}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Once your transfer is detected the payment will complete automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Pay with Deposit Address</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Choose the chain you&apos;ll send from.
        </p>
      </div>

      <div className="space-y-2">
        {SUPPORTED_CHAINS.map((chain) => (
          <button
            key={`${chain.chainName}-${chain.chainId}-${chain.tokenAddress ?? 'native'}`}
            type="button"
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card text-left transition-all duration-150 hover:border-[var(--action)] hover:bg-[var(--action)]/5 group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--action)]/40 disabled:opacity-50"
            disabled={attachAndQuoteMutation.isPending}
            onClick={() => attachAndQuoteMutation.mutate(chain)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{chain.label}</p>
              <p className="text-xs text-muted-foreground">{chain.symbol}</p>
            </div>
            {attachAndQuoteMutation.isPending &&
              attachAndQuoteMutation.variables?.chainName === chain.chainName &&
              attachAndQuoteMutation.variables?.tokenAddress === chain.tokenAddress ? (
              <Spinner className="size-4 text-[var(--action)]" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="text-muted-foreground/40 group-hover:text-[var(--action)] transition-colors">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">
          Refund address <span className="text-muted-foreground/60">(optional)</span>
        </label>
        <input
          type="text"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--action)]/40"
          placeholder="Address to receive refunds if transfer fails"
          value={refundAddress}
          onChange={(e) => setRefundAddress(e.target.value)}
        />
      </div>

      {attachAndQuoteMutation.error && (
        <p className="text-sm text-[var(--text-danger)]">
          {attachAndQuoteMutation.error instanceof Error
            ? attachAndQuoteMutation.error.message
            : 'Something went wrong.'}
        </p>
      )}

      <button
        type="button"
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        onClick={onBack}
      >
        ← Back
      </button>
    </div>
  );
};
