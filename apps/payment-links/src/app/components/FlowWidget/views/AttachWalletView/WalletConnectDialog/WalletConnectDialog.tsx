'use client';

import type { WalletAccount } from '@dynamic-labs-sdk/client';
import {
  getWalletAccounts,
  waitForClientInitialized,
} from '@dynamic-labs-sdk/client';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Spinner,
} from '@dynamic-labs-sdk/droplet';
import { connectWithWalletConnectEvm } from '@dynamic-labs-sdk/evm/wallet-connect';
import { connectWithWalletConnectSolana } from '@dynamic-labs-sdk/solana/wallet-connect';
import { RotateCcw } from 'lucide-react';
import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { CHAIN_ICON_MAP } from '../chainIconMap';

type WalletConnectChain = 'EVM' | 'SOL';

type WalletConnectDialogProps = {
  onConnected: (walletAccount: WalletAccount | null) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  /** Pre-select a chain, skipping the chain-picker step. */
  initialChain?: WalletConnectChain | null;
};

export const WalletConnectDialog: FC<WalletConnectDialogProps> = ({
  open,
  onOpenChange,
  onConnected,
  initialChain,
}) => {
  const [chain, setChain] = useState<WalletConnectChain | null>(initialChain ?? null);
  const [, setUri] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setChain(initialChain ?? null);
    setUri(null);
    setQrDataUrl(null);
    setError(null);
  }, [initialChain]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  // Sync when a different initialChain is passed while the dialog is open
  useEffect(() => {
    if (open && initialChain) setChain(initialChain);
  }, [initialChain, open]);

  const attemptConnection = useCallback(async () => {
    if (!chain) return;
    setError(null);
    setUri(null);
    setQrDataUrl(null);

    try {
      await waitForClientInitialized();
      const connect =
        chain === 'EVM'
          ? connectWithWalletConnectEvm
          : connectWithWalletConnectSolana;
      const { approval, uri: pairingUri } = await connect();
      setUri(pairingUri);

      const QRCode = await import('qrcode');
      const dataUrl = await QRCode.toDataURL(pairingUri, {
        margin: 2,
        width: 200,
      });
      setQrDataUrl(dataUrl);

      await approval();

      const accounts = getWalletAccounts();
      const lastConnected = accounts.at(-1) ?? null;

      onConnected(lastConnected);
      onOpenChange(false);
    } catch {
      setError('Connection failed. Please try again.');
    }
  }, [chain, onConnected, onOpenChange]);

  useEffect(() => {
    void attemptConnection();
  }, [attemptConnection]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">WalletConnect</DialogTitle>
        </DialogHeader>

        {!chain ? (
          <div className="p-4 space-y-2">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Select the chain to connect
            </p>
            {(['EVM', 'SOL'] as WalletConnectChain[]).map((c) => {
              const ChainIcon = CHAIN_ICON_MAP[c];
              return (
                <Button
                  key={c}
                  variant="outline"
                  className="w-full justify-start h-auto py-3 gap-3"
                  onClick={() => setChain(c)}
                >
                  {ChainIcon ? (
                    <ChainIcon className="w-6 h-6 shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-md bg-muted shrink-0" />
                  )}
                  {c === 'EVM' ? 'EVM (Ethereum, Polygon…)' : 'Solana'}
                </Button>
              );
            })}
          </div>
        ) : (
          <div className="p-4 flex flex-col items-center gap-4">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="WalletConnect QR code"
                className="rounded-lg w-[200px] h-[200px]"
              />
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center">
                <Spinner className="size-6 text-[var(--action)]" />
              </div>
            )}

            {error ? (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-destructive text-center">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => void attemptConnection()}
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center">
                Scan with your mobile wallet
              </p>
            )}

            <Button variant="ghost" className="w-full" onClick={reset}>
              Switch chain
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
