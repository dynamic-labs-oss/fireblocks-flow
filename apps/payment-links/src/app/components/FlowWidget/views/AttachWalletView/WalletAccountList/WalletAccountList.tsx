'use client';

import type { WalletAccount } from '@dynamic-labs-sdk/client';
import { Copy, Wallet } from 'lucide-react';
import type { FC } from 'react';
import { useMemo } from 'react';
import { toast } from 'sonner';

export const ZERODEV_WALLET_NAME_PREFIX = 'zerodev';

const SMART_WALLET_LABEL = 'Smart Wallet';

type WalletAccountListProps = {
  onSelect: (walletAccount: WalletAccount) => void;
  walletAccounts: WalletAccount[];
};

export const WalletAccountList: FC<WalletAccountListProps> = ({
  walletAccounts,
  onSelect,
}) => {
  const sorted = useMemo(
    () =>
      [...walletAccounts].sort((a, b) => a.address.localeCompare(b.address)),
    [walletAccounts],
  );

  return (
    <div className="space-y-2">
      {sorted.map((wallet) => {
        const isSmartWallet = wallet.walletProviderKey.startsWith(
          ZERODEV_WALLET_NAME_PREFIX,
        );

        return (
          <div
            key={wallet.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(wallet)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(wallet);
              }
            }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-border bg-card hover:border-[var(--action)] hover:bg-[var(--action)]/5 transition-all duration-150 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium">{wallet.chain}</p>
                {isSmartWallet && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                    {SMART_WALLET_LABEL}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {wallet.address}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // eslint-disable-next-line no-restricted-globals
                    void navigator.clipboard.writeText(wallet.address);
                    toast.success('Address copied');
                  }}
                  className="shrink-0 text-muted-foreground/60 hover:text-foreground transition-colors"
                  aria-label="Copy address"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="shrink-0 text-muted-foreground/40 group-hover:text-[var(--action)] transition-colors duration-150">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden
              >
                <path
                  d="M6 3l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
};
