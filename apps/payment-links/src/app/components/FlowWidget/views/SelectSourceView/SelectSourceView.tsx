'use client';

import { ArrowDownToLine, ArrowLeftRight, ChevronRight, KeyRound, Wallet } from 'lucide-react';
import type { FC } from 'react';

type SelectSourceViewProps = {
  amount?: string;
  currency?: string;
  onSelectDepositAddress: () => void;
  onSelectEmbeddedWallet: () => void;
  onSelectExchange: () => void;
  onSelectWallet: () => void;
};

type SourceOption = {
  description: string;
  icon: FC<{ className?: string }>;
  id: 'wallet' | 'exchange' | 'embedded' | 'depositAddress';
  label: string;
  onSelect: () => void;
};

export const SelectSourceView: FC<SelectSourceViewProps> = ({
  amount,
  currency,
  onSelectWallet,
  onSelectExchange,
  onSelectDepositAddress,
  onSelectEmbeddedWallet,
}) => {
  const options: SourceOption[] = [
    {
      description: 'Use an embedded wallet to pay',
      icon: KeyRound,
      id: 'embedded',
      label: 'Embedded Wallet',
      onSelect: onSelectEmbeddedWallet,
    },
    {
      description: 'MetaMask, Phantom, Coinbase & more',
      icon: Wallet,
      id: 'wallet',
      label: 'Wallet',
      onSelect: onSelectWallet,
    },
    {
      description: 'Pay from your exchange balance',
      icon: ArrowLeftRight,
      id: 'exchange',
      label: 'Exchange',
      onSelect: onSelectExchange,
    },
    {
      description: 'Pay via a deposit address',
      icon: ArrowDownToLine,
      id: 'depositAddress',
      label: 'Deposit Address',
      onSelect: onSelectDepositAddress,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="px-5 py-5 border-b border-border-default">
        {amount && currency && (
          <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium mb-1">
            PAYMENT {amount} {currency}
          </span>
        )}
        <h2 className="text-base font-semibold tracking-[-0.01em]">Pick how you'll pay</h2>
      </div>

      {/* Source rows */}
      <div className="px-5 py-4 flex flex-col gap-1.5">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              onClick={option.onSelect}
              className="h-[52px] flex items-center gap-3 bg-bg-bottom hover:bg-bg-accented rounded-lg px-3 w-full transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-action/40"
            >
              <span className="w-8 h-8 rounded-full bg-action/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-action" />
              </span>
              <span className="flex flex-col items-start min-w-0 flex-1 text-left">
                <span className="text-sm font-medium text-foreground leading-tight">{option.label}</span>
                <span className="text-[11px] text-muted-foreground leading-tight">{option.description}</span>
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
