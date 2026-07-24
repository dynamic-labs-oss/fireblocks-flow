import type { Iconic } from '@dynamic-labs/iconic';
import type { FC } from 'react';

type ProviderButtonProps = {
  ChainIconComponent?: Iconic;
  connecting?: boolean;
  displayName: string;
  iconSrc?: string;
  installed?: boolean;
  onClick: () => void;
  walletConnectIcon?: boolean;
};

export const ProviderButton: FC<ProviderButtonProps> = ({
  ChainIconComponent,
  connecting,
  displayName,
  iconSrc,
  installed,
  onClick,
  walletConnectIcon,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={connecting}
    className="flex items-center justify-between gap-3 rounded-xl bg-[var(--brand-row-bg,#f9fafb)] px-4 py-3 text-sm font-medium text-[var(--brand-fg,#0e121b)] hover:bg-[var(--brand-row-hover,#f4f5f7)] disabled:opacity-50 transition-colors cursor-pointer [&_*]:pointer-events-none"
  >
    <span className="flex items-center gap-3">
      {walletConnectIcon ? (
        <div className="h-8 w-8 rounded-lg bg-[#3b99fc] flex items-center justify-center shrink-0">
          <svg viewBox="0 0 32 32" width="16" height="16" fill="white" aria-hidden>
            <path d="M9.6 12.8c3.5-3.4 9.2-3.4 12.8 0l.4.4c.2.2.2.5 0 .7l-1.4 1.4c-.1.1-.3.1-.4 0l-.6-.6c-2.4-2.4-6.4-2.4-8.8 0l-.7.7c-.1.1-.3.1-.4 0L9.1 14c-.2-.2-.2-.5 0-.7l.5-.5zm15.8 2.9 1.3 1.2c.2.2.2.5 0 .7l-5.7 5.6c-.2.2-.5.2-.7 0l-4-4c-.1-.1-.2-.1-.3 0l-4 4c-.2.2-.5.2-.7 0L5.6 17.6c-.2-.2-.2-.5 0-.7l1.2-1.2c.2-.2.5-.2.7 0l4 4c.1.1.2.1.3 0l4-4c.2-.2.5-.2.7 0l4 4c.1.1.2.1.3 0l4-4c.2-.2.5-.2.7 0z" />
          </svg>
        </div>
      ) : ChainIconComponent ? (
        <ChainIconComponent className="h-8 w-8 rounded-lg shrink-0" />
      ) : iconSrc ? (
        <img src={iconSrc} alt="" className="h-8 w-8 rounded-lg object-contain shrink-0" />
      ) : (
        <div className="h-8 w-8 rounded-lg bg-[var(--brand-row-hover,#f4f5f7)] flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-[var(--brand-muted,#99a0ae)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
          </svg>
        </div>
      )}
      <span className="text-[15px]">{displayName}</span>
    </span>
    {(connecting || installed) && (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-surface,#ffffff)] border border-[var(--brand-border,#e1e4ea)] px-2.5 py-1 text-[11px] font-medium text-[var(--brand-muted,#99a0ae)] shrink-0">
        <span aria-hidden className="size-1.5 rounded-full bg-[var(--brand-primary,#4779ff)]" />
        {connecting ? 'Connecting…' : 'Installed'}
      </span>
    )}
  </button>
);
