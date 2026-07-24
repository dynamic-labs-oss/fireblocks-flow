'use client';

import type { WalletAccount, WalletProviderData } from '@dynamic-labs-sdk/client';
import { connectWithWalletProvider } from '@dynamic-labs-sdk/client';
import { Spinner } from '@dynamic-labs-sdk/droplet';
import { useGetAvailableWalletProvidersData } from '@dynamic-labs-sdk/react-hooks';
import { ChevronLeft } from 'lucide-react';
import type { FC } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

import { CHAIN_ICON_MAP } from '../chainIconMap';
import { ProviderButton } from '../ProviderButton';
import { WalletConnectDialog } from '../WalletConnectDialog';

type WalletProviderListProps = {
  onConnected: (walletAccount: WalletAccount | null) => void;
};

export const WalletProviderList: FC<WalletProviderListProps> = ({ onConnected }) => {
  const { data: providers = [] } = useGetAvailableWalletProvidersData();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [wcOpen, setWcOpen] = useState(false);

  // Group providers by groupKey — same wallet across chains shown as one entry
  const groups: Record<string, WalletProviderData[]> = {};
  for (const p of providers) {
    if (!groups[p.groupKey]) groups[p.groupKey] = [];
    groups[p.groupKey].push(p);
  }

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const handleGroupClick = async (groupKey: string) => {
    const group = groups[groupKey];
    if (group.length > 1) {
      setExpandedGroup(groupKey);
      return;
    }
    await connect(group[0]);
  };

  const connect = async (provider: WalletProviderData) => {
    setConnecting(provider.key);
    try {
      const walletAccount = await connectWithWalletProvider({ walletProviderKey: provider.key });
      onConnected(walletAccount);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to connect wallet.');
    } finally {
      setConnecting(null);
    }
  };

  if (connecting) {
    return (
      <div className="flex flex-col items-center gap-2 py-6">
        <Spinner className="size-5 text-[var(--action)]" />
        <p className="text-xs text-muted-foreground">Connecting wallet…</p>
      </div>
    );
  }

  if (expandedGroup) {
    return (
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setExpandedGroup(null)}
          className="text-xs text-[var(--brand-muted,#99a0ae)] hover:text-[var(--brand-fg,#0e121b)] transition-colors flex items-center gap-1 mb-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to all wallets
        </button>
        {groups[expandedGroup].map((p) => (
          <ProviderButton
            key={p.key}
            displayName={p.chain}
            ChainIconComponent={CHAIN_ICON_MAP[p.chain]}
            onClick={() => void connect(p)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {Object.entries(groups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([groupKey, ps]) => (
          <ProviderButton
            key={groupKey}
            displayName={ps[0].metadata.displayName}
            iconSrc={ps[0].metadata.icon}
            installed
            onClick={() => void handleGroupClick(groupKey)}
          />
        ))}

      <ProviderButton
        displayName="WalletConnect"
        onClick={() => setWcOpen(true)}
        walletConnectIcon
      />

      <WalletConnectDialog
        open={wcOpen}
        onOpenChange={setWcOpen}
        onConnected={onConnected}
      />

      {providers.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No wallet extensions detected.
        </p>
      )}
    </div>
  );
};
