'use client';

import { ArrowDownToLine, ArrowLeftRight, KeyRound, Wallet } from 'lucide-react';
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
    <div className="space-y-5">
      {amount && currency && (
        <div className="pb-2 border-b border-border">
          <p className="text-4xl font-bold tracking-tight">{amount}</p>
          <p className="text-base font-medium text-[var(--action)] mt-0.5">{currency}</p>
        </div>
      )}
      <h2 className="text-xl font-bold">Pick how you'll pay</h2>

      <div className="space-y-2">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={option.onSelect}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-[var(--bg-bottom)] text-left transition-all duration-150 hover:border-[var(--action)] hover:bg-[var(--action)]/5 group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--action)]/40"
            >
              <div className="shrink-0 w-10 h-10 rounded-full bg-[var(--brand-light)] flex items-center justify-center transition-colors duration-150 group-hover:bg-[var(--action)]/10">
                <Icon className="w-5 h-5 text-[var(--action)] transition-colors duration-150" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{option.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {option.description}
                </p>
              </div>
              <div className="shrink-0 text-muted-foreground/40 group-hover:text-[var(--action)] transition-colors duration-150">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
