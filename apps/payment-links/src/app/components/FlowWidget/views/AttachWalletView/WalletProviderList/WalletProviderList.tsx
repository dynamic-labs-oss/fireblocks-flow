'use client';

import type {
  WalletAccount,
  WalletConnectCatalog,
  WalletConnectCatalogWallet,
  WalletProviderData,
} from '@dynamic-labs-sdk/client';
import { connectWithWalletProvider, getWalletConnectCatalog } from '@dynamic-labs-sdk/client';
import { useGetAvailableWalletProvidersData } from '@dynamic-labs-sdk/react-hooks';
import type { FC } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ProviderButton } from '../ProviderButton';
import { WalletConnectDialog } from '../WalletConnectDialog';

// ---------------------------------------------------------------------------
// Chain constants (mirrors demo's wallet-picker-screen.tsx)
// ---------------------------------------------------------------------------

const CHAIN_ICON_URLS: Record<string, string> = {
  EVM: 'https://app.dynamic.xyz/assets/networks/eth.svg',
  SOL: 'https://app.dynamic.xyz/assets/networks/solana.svg',
};

const CHAIN_LABELS: Record<string, string> = {
  EVM: 'EVM',
  SOL: 'Solana',
};

// ---------------------------------------------------------------------------
// WalletConnect catalog helpers (ported from demo-dashboard checkouts-widget)
// ---------------------------------------------------------------------------

interface CatalogGroup {
  id: string;
  name: string;
  spriteUrl: string | null;
  wallets: WalletConnectCatalogWallet[];
}

type ExtendedWallet = WalletConnectCatalogWallet & { groupId?: string };
type ExtendedCatalog = WalletConnectCatalog & { groups?: Record<string, { name: string; spriteUrl: string }> };

function buildCatalogGroups(catalog: WalletConnectCatalog | null, query = ''): CatalogGroup[] {
  if (!catalog) return [];
  const q = query.trim().toLowerCase();
  const ext = catalog as ExtendedCatalog;
  const byId = new Map<string, CatalogGroup>();
  for (const [walletKey, wallet] of Object.entries(catalog.wallets)) {
    const groupId = (wallet as ExtendedWallet).groupId ?? walletKey;
    const existing = byId.get(groupId);
    if (existing) { existing.wallets.push(wallet); continue; }
    const groupMeta = ext.groups?.[groupId];
    byId.set(groupId, {
      id: groupId,
      name: groupMeta?.name ?? wallet.name,
      spriteUrl: groupMeta?.spriteUrl ?? wallet.spriteUrl ?? null,
      wallets: [wallet],
    });
  }
  let groups = Array.from(byId.values());
  if (q) {
    groups = groups.filter(g =>
      g.name.toLowerCase().includes(q) || g.wallets.some(w => w.name.toLowerCase().includes(q))
    );
  }
  groups.sort((a, b) => a.name.localeCompare(b.name));
  return groups;
}

let cachedCatalogPromise: Promise<WalletConnectCatalog | null> | null = null;

function useCatalog(enabled: boolean) {
  const [catalog, setCatalog] = useState<WalletConnectCatalog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled || catalog) return;
    let cancelled = false;
    setLoading(true);
    if (!cachedCatalogPromise) {
      cachedCatalogPromise = getWalletConnectCatalog().catch((err: unknown) => {
        cachedCatalogPromise = null; throw err;
      });
    }
    cachedCatalogPromise
      .then(data => { if (!cancelled) { setCatalog(data); setLoading(false); } })
      .catch((err: unknown) => {
        if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load wallets'); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [enabled, catalog]);
  return { catalog, loading, error };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type WalletProviderListProps = {
  onConnected: (walletAccount: WalletAccount | null) => void;
  onBack: () => void;
};

export const WalletProviderList: FC<WalletProviderListProps> = ({ onConnected, onBack }) => {
  const { data: providers = [] } = useGetAvailableWalletProvidersData();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [view, setView] = useState<'installed' | 'discovered'>('installed');
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement | null>(null);

  // Group installed providers by groupKey
  const groups: Record<string, WalletProviderData[]> = {};
  for (const p of providers) {
    if (!groups[p.groupKey]) groups[p.groupKey] = [];
    groups[p.groupKey]!.push(p);
  }

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const [wcDialogOpen, setWcDialogOpen] = useState(false);
  const [wcDialogChain, setWcDialogChain] = useState<'EVM' | 'SOL' | null>(null);

  const { catalog, loading: catalogLoading, error: catalogError } = useCatalog(view === 'discovered');
  const catalogGroups = useMemo(() => buildCatalogGroups(catalog, query), [catalog, query]);

  useEffect(() => {
    if (view === 'discovered') setTimeout(() => searchRef.current?.focus(), 50);
  }, [view]);

  const connectInstalled = async (provider: WalletProviderData) => {
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

  const handleGroupClick = async (groupKey: string) => {
    const group = groups[groupKey];
    if (!group) return;
    if (group.length > 1) { setExpandedGroup(groupKey); return; }
    await connectInstalled(group[0]!);
  };

  const handleCatalogWalletClick = (group: CatalogGroup) => {
    const chain = group.wallets[0]?.chain === 'SOL' ? 'SOL' : 'EVM';
    setWcDialogChain(chain);
    setWcDialogOpen(true);
  };

  // Shared header for installed + discovered views
  const defaultHeader = (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={onBack}
        className="w-7 h-7 mt-0.5 -ml-1 shrink-0 flex items-center justify-center rounded-full text-[var(--brand-muted,#99a0ae)] hover:text-[var(--brand-fg,#0e121b)] hover:bg-[var(--brand-row-bg,#f9fafb)] transition-colors cursor-pointer"
        aria-label="Go back"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-[0.18em] font-medium text-[var(--brand-muted,#99a0ae)]">
          Connect a wallet
        </span>
        <h2 className="text-base font-semibold text-[var(--brand-fg,#0e121b)] tracking-[-0.01em]">
          Connect your wallet
        </h2>
      </div>
    </div>
  );

  // ── Chain selection view ────────────────────────────────────────────────
  if (expandedGroup) {
    const expandedProviders = groups[expandedGroup] ?? [];
    const displayName = expandedProviders[0]?.metadata.displayName ?? '';
    const icon = expandedProviders[0]?.metadata.icon;

    return (
      <div className="px-5 py-5 flex flex-col gap-4">
        {/* Header: eyebrow "Select a network", title = wallet name, ← Back pill */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.18em] font-medium text-[var(--brand-muted,#99a0ae)]">
              Select a network
            </span>
            <h2 className="text-base font-semibold text-[var(--brand-fg,#0e121b)] tracking-[-0.01em]">
              {displayName}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setExpandedGroup(null)}
            className="inline-flex items-center gap-1.5 self-end rounded-full border border-[var(--brand-border,#e1e4ea)] bg-[var(--brand-surface,#ffffff)] px-2.5 py-1 text-[11px] font-medium text-[var(--brand-muted,#99a0ae)] hover:text-[var(--brand-fg,#0e121b)] hover:bg-[var(--brand-row-hover,#f4f5f7)] transition-colors cursor-pointer"
          >
            ← Back
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {/* Info card */}
          <div className="flex items-center gap-3 rounded-xl bg-[var(--brand-row-bg,#f9fafb)] px-4 py-3">
            {icon && (
              <img src={icon} alt="" className="h-8 w-8 rounded-lg object-contain shrink-0" />
            )}
            <p className="text-[13px] font-medium text-[var(--brand-fg,#0e121b)]">
              {displayName} supports multiple chains. Select your preferred chain to connect.
            </p>
          </div>

          {/* Chain rows */}
          <div className="flex flex-col gap-1.5">
            {expandedProviders.map((p) => {
              const chainLabel = CHAIN_LABELS[p.chain] ?? p.chain;
              const chainIconUrl = CHAIN_ICON_URLS[p.chain];
              const isConnecting = connecting === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => void connectInstalled(p)}
                  disabled={connecting !== null}
                  className="flex items-center justify-between gap-3 rounded-xl bg-[var(--brand-row-bg,#f9fafb)] px-4 py-3 text-sm font-medium text-[var(--brand-fg,#0e121b)] hover:bg-[var(--brand-row-hover,#f4f5f7)] disabled:opacity-50 transition-colors cursor-pointer [&_*]:pointer-events-none"
                >
                  <span className="flex items-center gap-3">
                    {chainIconUrl ? (
                      <img src={chainIconUrl} alt="" className="h-7 w-7 rounded-full object-contain shrink-0" />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-[var(--brand-row-hover,#f4f5f7)] shrink-0" />
                    )}
                    <span className="text-[15px]">{chainLabel}</span>
                  </span>
                  {isConnecting && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-surface,#ffffff)] border border-[var(--brand-border,#e1e4ea)] px-2.5 py-1 text-[11px] font-medium text-[var(--brand-muted,#99a0ae)]">
                      <span aria-hidden className="size-1.5 rounded-full bg-[var(--brand-primary,#4779ff)]" />
                      Connecting…
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Discovered (WalletConnect catalog) view ─────────────────────────────
  if (view === 'discovered') {
    return (
      <>
        <div className="px-5 py-5 flex flex-col gap-4">
          {defaultHeader}

          <div className="flex flex-col gap-3">
            {Object.keys(groups).length > 0 && (
              <button
                type="button"
                onClick={() => { setView('installed'); setQuery(''); }}
                className="inline-flex items-center gap-1.5 self-start cursor-pointer text-[11px] font-medium text-[var(--brand-muted,#99a0ae)] hover:text-[var(--brand-fg,#0e121b)] transition-colors"
              >
                <BackArrow />
                Back to installed wallets
              </button>
            )}

            <label className="flex items-center gap-2 rounded-xl bg-[var(--brand-row-bg,#f9fafb)] px-3 py-2.5 focus-within:ring-2 focus-within:ring-[var(--brand-primary,#4779ff)] focus-within:ring-offset-1 focus-within:ring-offset-[var(--brand-surface,#ffffff)]">
              <SearchIcon />
              <input
                ref={searchRef}
                type="search"
                autoComplete="off"
                spellCheck={false}
                placeholder="Search wallets"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-[16px] text-[var(--brand-fg,#0e121b)] placeholder:text-[var(--brand-muted,#99a0ae)] outline-none [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-ms-clear]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="shrink-0 cursor-pointer text-[var(--brand-muted,#99a0ae)] hover:text-[var(--brand-fg,#0e121b)] transition-colors"
                >
                  <ClearIcon />
                </button>
              )}
            </label>

            {catalogLoading || !catalog ? (
              <p className="text-sm text-[var(--brand-muted,#99a0ae)] px-1 py-2">Loading wallets…</p>
            ) : catalogError ? (
              <p className="text-sm text-[var(--brand-error,#ef4444)] px-1 py-2">{catalogError}</p>
            ) : catalogGroups.length === 0 ? (
              <p className="text-sm text-[var(--brand-muted,#99a0ae)] px-1 py-2">
                {query.trim() ? `No wallets match "${query.trim()}".` : 'No additional wallets available.'}
              </p>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto pr-1" style={{ maxHeight: '310px' }}>
                {catalogGroups.map(group => {
                  const chains = Array.from(new Set(group.wallets.map(w => w.chain)));
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => handleCatalogWalletClick(group)}
                      className="flex items-center justify-between gap-3 rounded-xl bg-[var(--brand-row-bg,#f9fafb)] px-4 py-3 text-sm font-medium text-[var(--brand-fg,#0e121b)] hover:bg-[var(--brand-row-hover,#f4f5f7)] transition-colors cursor-pointer [&_*]:pointer-events-none"
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        {group.spriteUrl ? (
                          <img src={group.spriteUrl} alt="" className="h-8 w-8 rounded-lg object-contain bg-[var(--brand-surface,#ffffff)] shrink-0" />
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-[var(--brand-row-hover,#f4f5f7)] shrink-0" />
                        )}
                        <span className="text-[15px] truncate">{group.name}</span>
                      </span>
                      {chains.length > 0 && (
                        <span className="inline-flex items-center gap-1 shrink-0">
                          {chains.map(chain => (
                            <span
                              key={chain}
                              className="inline-flex items-center rounded-full bg-[var(--brand-surface,#ffffff)] border border-[var(--brand-border,#e1e4ea)] px-2 py-0.5 text-[10px] font-medium text-[var(--brand-muted,#99a0ae)] uppercase tracking-wide"
                            >
                              {chain}
                            </span>
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <WalletConnectDialog
          open={wcDialogOpen}
          initialChain={wcDialogChain}
          onOpenChange={(open) => { setWcDialogOpen(open); if (!open) setWcDialogChain(null); }}
          onConnected={(walletAccount) => { setWcDialogOpen(false); onConnected(walletAccount); }}
        />
      </>
    );
  }

  // ── Installed view ───────────────────────────────────────────────────────
  const sortedGroups = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="px-5 py-5 flex flex-col gap-4">
      {defaultHeader}

      <div className="flex flex-col gap-2">
        {sortedGroups.map(([groupKey, ps]) => {
          const isConnecting = ps.some(p => p.key === connecting);
          return (
            <ProviderButton
              key={groupKey}
              displayName={ps[0]!.metadata.displayName}
              iconSrc={ps[0]!.metadata.icon}
              installed={!isConnecting}
              connecting={isConnecting}
              onClick={() => void handleGroupClick(groupKey)}
            />
          );
        })}

        {sortedGroups.length === 0 && (
          <p className="text-sm text-[var(--brand-muted,#99a0ae)] text-center py-4">
            No wallet extensions detected.
          </p>
        )}

        <button
          type="button"
          onClick={() => setView('discovered')}
          className="mt-1 self-center cursor-pointer text-[13px] font-medium text-[var(--brand-muted,#99a0ae)] hover:text-[var(--brand-fg,#0e121b)] transition-colors"
        >
          Show more wallets
        </button>
      </div>
    </div>
  );
};

function BackArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="block">
      <path d="M11 7H1m0 0l4-4M1 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="block shrink-0 text-[var(--brand-muted,#99a0ae)]">
      <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="block">
      <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
