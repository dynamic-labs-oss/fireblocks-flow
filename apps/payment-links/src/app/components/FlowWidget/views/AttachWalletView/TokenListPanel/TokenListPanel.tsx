'use client';

import type { WalletAccount } from '@dynamic-labs-sdk/client';
import { getTokenBalances } from '@dynamic-labs-sdk/client';
import { Button, Spinner } from '@dynamic-labs-sdk/droplet';
import { useGetTokenBalances } from '@dynamic-labs-sdk/react-hooks';
import { RotateCcw } from 'lucide-react';
import type { FC } from 'react';
import { useState } from 'react';

type TokenBalance = Awaited<ReturnType<typeof getTokenBalances>>[number];

type TokenListPanelProps = {
  isPending: boolean;
  networkId?: number;
  onManualAddressSubmit?: (address: string) => void;
  onNativeTokenSelect?: () => void;
  onTokenSelect: (token: TokenBalance) => void;
  walletAccount: WalletAccount;
};

export const TokenListPanel: FC<TokenListPanelProps> = ({
  walletAccount,
  networkId,
  onTokenSelect,
  onManualAddressSubmit,
  onNativeTokenSelect,
  isPending,
}) => {
  const [manualAddress, setManualAddress] = useState('');

  const {
    data: tokens = [],
    isLoading,
    refetch,
  } = useGetTokenBalances({
    filterSpamTokens: true,
    includeNative: true,
    includePrices: true,
    networkId,
    walletAccount,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-2 py-6">
        <Spinner className="size-5 text-[var(--action)]" />
        <p className="text-xs text-muted-foreground">Loading balances…</p>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="py-4 space-y-4">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">No tokens found</p>
          <Button variant="ghost" size="sm" onClick={() => void refetch()}>
            <RotateCcw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>

        {onManualAddressSubmit && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground px-1">
              Enter a token address manually
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="0x…"
                disabled={isPending}
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-[var(--action)] disabled:opacity-50"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={isPending || !manualAddress.trim()}
                onClick={() => onManualAddressSubmit(manualAddress.trim())}
              >
                Use
              </Button>
            </div>
          </div>
        )}

        {onNativeTokenSelect && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            disabled={isPending}
            onClick={onNativeTokenSelect}
          >
            Use native token
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {tokens.map((token) => (
        <button
          key={`${token.address}-${token.symbol}`}
          type="button"
          disabled={isPending}
          onClick={() => onTokenSelect(token)}
          className="h-[52px] flex w-full items-center gap-3 px-3 rounded-lg bg-bg-bottom hover:bg-bg-accented transition-colors cursor-pointer disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-action/40"
        >
          {token.logoURI ? (
            <img
              src={token.logoURI}
              alt={token.symbol}
              className="w-8 h-8 rounded-full shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-action/10 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-action">
                {token.symbol.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex flex-col items-start min-w-0 flex-1">
            <span className="text-sm font-medium text-foreground leading-tight">{token.name}</span>
            <span className="text-[11px] text-muted-foreground leading-tight">
              {token.balance} {token.symbol}
            </span>
          </div>
          {token.marketValue !== undefined && (
            <span className="text-sm font-medium shrink-0">
              ${token.marketValue.toFixed(2)}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
