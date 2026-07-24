'use client';

import type { WalletAccount } from '@dynamic-labs-sdk/client';
import { isWaasWalletAccount } from '@dynamic-labs-sdk/client/waas';
import { Spinner } from '@dynamic-labs-sdk/droplet';
import { useGetWalletAccounts } from '@dynamic-labs-sdk/react-hooks';
import { ChevronLeft, LogOut } from 'lucide-react';
import type { FC } from 'react';
import { useMemo, useState } from 'react';

import { ZERODEV_WALLET_NAME_PREFIX } from './WalletAccountList/WalletAccountList';
import type { AttachWalletViewProps } from './AttachWalletView.types';
import { ConnectedWalletPanel } from './ConnectedWalletPanel';
import { WalletAccountList } from './WalletAccountList';
import { WalletProviderList } from './WalletProviderList';

export const AttachWalletView: FC<AttachWalletViewProps> = ({
  flow,
  initiallyConnected = false,
  onAttached,
  onBack,
  onFlowUpdated,
  onLogout,
}) => {
  const [hasConnectedInSession, setHasConnectedInSession] =
    useState(initiallyConnected);

  const [pickedWallet, setPickedWallet] = useState<WalletAccount | null>(null);

  // Overrides auto-selection so the wallet picker is shown even with one wallet
  const [forceShowPicker, setForceShowPicker] = useState(false);

  const { data: allWalletAccounts = [], isLoading: isLoadingWallets } =
    useGetWalletAccounts();

  const walletAccounts = useMemo(() => {
    if (!initiallyConnected) {
      return allWalletAccounts;
    }

    return allWalletAccounts.filter(
      (wa) =>
        isWaasWalletAccount({ walletAccount: wa as WalletAccount }) ||
        wa.walletProviderKey.startsWith(ZERODEV_WALLET_NAME_PREFIX),
    );
  }, [allWalletAccounts, initiallyConnected]);

  const hasMultipleWallets = walletAccounts.length > 1;
  const hasWallets = walletAccounts.length > 0;

  const connectedWallet =
    hasConnectedInSession && !forceShowPicker
      ? pickedWallet ??
        (hasMultipleWallets ? null : (walletAccounts[0] ?? null))
      : null;

  const showWalletPicker =
    hasConnectedInSession &&
    !connectedWallet &&
    (hasMultipleWallets || forceShowPicker) &&
    hasWallets;

  const heading = showWalletPicker
    ? 'Choose a wallet'
    : connectedWallet
      ? 'Select a token'
      : 'Connect your wallet';

  const subheading = showWalletPicker
    ? 'Pick which wallet to use as the payment source'
    : connectedWallet
      ? 'Choose which token to pay with'
      : 'Pick a wallet to use as the payment source';

  const handlePickWallet = (wallet: WalletAccount) => {
    setPickedWallet(wallet);
    setForceShowPicker(false);
  };

  return (
    <div>
      {/* Header — hidden when ConnectedWalletPanel renders its own */}
      {!connectedWallet && (
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border-default">
          <button
            onClick={
              forceShowPicker
                ? () => setForceShowPicker(false)
                : pickedWallet
                  ? () => setPickedWallet(null)
                  : onBack
            }
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-semibold tracking-[-0.01em]">{heading}</h2>
        </div>
      )}

      {hasConnectedInSession && isLoadingWallets ? (
        <div className="px-5 py-12 flex flex-col items-center gap-2">
          <Spinner className="size-5 text-[var(--action)]" />
        </div>
      ) : showWalletPicker ? (
        <div className="px-5 py-5 space-y-4">
          <WalletAccountList
            walletAccounts={walletAccounts as WalletAccount[]}
            onSelect={handlePickWallet}
          />
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log out
            </button>
          )}
        </div>
      ) : connectedWallet ? (
        <ConnectedWalletPanel
          flow={flow}
          walletAccount={connectedWallet as WalletAccount}
          onAttached={onAttached}
          onChangeWallet={
            initiallyConnected
              ? () => {
                  setPickedWallet(null);
                  setForceShowPicker(true);
                }
              : () => {
                  setPickedWallet(null);
                  setHasConnectedInSession(false);
                }
          }
          onFlowUpdated={onFlowUpdated}
        />
      ) : (
        <div className="px-5 py-5">
          <WalletProviderList
            onConnected={(walletAccount) => {
              if (walletAccount) {
                setPickedWallet(walletAccount);
              }
              setHasConnectedInSession(true);
            }}
          />
        </div>
      )}
    </div>
  );
};
