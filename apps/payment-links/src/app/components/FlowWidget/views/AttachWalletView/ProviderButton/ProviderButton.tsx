import type { Iconic } from '@dynamic-labs/iconic';
import { Wallet } from 'lucide-react';
import type { FC } from 'react';

type ProviderButtonProps = {
  ChainIconComponent?: Iconic;
  displayName: string;
  iconSrc?: string;
  onClick: () => void;
  walletConnectIcon?: boolean;
};

export const ProviderButton: FC<ProviderButtonProps> = ({
  ChainIconComponent,
  displayName,
  iconSrc,
  onClick,
  walletConnectIcon,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-border bg-card hover:border-[var(--action)] hover:bg-[var(--action)]/5 transition-all duration-150 cursor-pointer"
  >
    {walletConnectIcon ? (
      <div className="w-7 h-7 rounded-md bg-[#3b99fc] flex items-center justify-center shrink-0">
        <svg
          viewBox="0 0 32 32"
          width="16"
          height="16"
          fill="white"
          aria-hidden
        >
          <path d="M9.6 12.8c3.5-3.4 9.2-3.4 12.8 0l.4.4c.2.2.2.5 0 .7l-1.4 1.4c-.1.1-.3.1-.4 0l-.6-.6c-2.4-2.4-6.4-2.4-8.8 0l-.7.7c-.1.1-.3.1-.4 0L9.1 14c-.2-.2-.2-.5 0-.7l.5-.5zm15.8 2.9 1.3 1.2c.2.2.2.5 0 .7l-5.7 5.6c-.2.2-.5.2-.7 0l-4-4c-.1-.1-.2-.1-.3 0l-4 4c-.2.2-.5.2-.7 0L5.6 17.6c-.2-.2-.2-.5 0-.7l1.2-1.2c.2-.2.5-.2.7 0l4 4c.1.1.2.1.3 0l4-4c.2-.2.5-.2.7 0l4 4c.1.1.2.1.3 0l4-4c.2-.2.5-.2.7 0z" />
        </svg>
      </div>
    ) : ChainIconComponent ? (
      <ChainIconComponent className="w-7 h-7 rounded-md shrink-0" />
    ) : iconSrc ? (
      <img
        src={iconSrc}
        alt={`${displayName} icon`}
        className="w-7 h-7 rounded-md shrink-0"
      />
    ) : (
      <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
        <Wallet className="w-4 h-4 text-muted-foreground" />
      </div>
    )}
    <span className="text-sm font-medium">{displayName}</span>
  </button>
);
