'use client';

import { ArrowDownToLine, ArrowLeftRight, KeyRound, Wallet } from 'lucide-react';
import type { FC } from 'react';

type SelectSourceViewProps = {
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
      description: 'Sign the transaction with your connected Web3 wallet',
      icon: Wallet,
      id: 'wallet',
      label: 'Pay with Wallet',
      onSelect: onSelectWallet,
    },
    {
      description: 'Complete the payment via your Coinbase account',
      icon: ArrowLeftRight,
      id: 'exchange',
      label: 'Pay with Exchange',
      onSelect: onSelectExchange,
    },
    {
      description: 'Pay via deposit address',
      icon: ArrowDownToLine,
      id: 'depositAddress',
      label: 'Pay with Deposit Address',
      onSelect: onSelectDepositAddress,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Choose payment method</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          How would you like to fund this flow?
        </p>
      </div>

      <div className="space-y-2">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={option.onSelect}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card text-left transition-all duration-150 hover:border-[var(--action)] hover:bg-[var(--action)]/5 group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--action)]/40"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center transition-colors duration-150 group-hover:bg-[var(--action)]/10">
                <Icon className="w-5 h-5 text-muted-foreground transition-colors duration-150 group-hover:text-[var(--action)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{option.label}</p>
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
