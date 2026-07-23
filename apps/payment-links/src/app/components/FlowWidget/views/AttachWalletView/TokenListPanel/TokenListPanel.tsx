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
    <div className="space-y-2">
      {tokens.map((token) => (
        <button
          key={`${token.address}-${token.symbol}`}
          type="button"
          disabled={isPending}
          onClick={() => onTokenSelect(token)}
          className="flex w-full items-center justify-between px-4 py-3 rounded-xl bg-[var(--bg-bottom)] border border-transparent hover:border-[var(--border-default)] transition-colors cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            {token.logoURI ? (
              <img
                src={token.logoURI}
                alt={token.symbol}
                className="w-10 h-10 rounded-full shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                {token.symbol.slice(0, 2)}
              </div>
            )}
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold">{token.name}</span>
              <span className="text-xs text-muted-foreground">
                {token.balance} {token.symbol}
              </span>
            </div>
          </div>
          {token.marketValue !== undefined && (
            <span className="text-base font-bold shrink-0">
              ${token.marketValue.toFixed(2)}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
