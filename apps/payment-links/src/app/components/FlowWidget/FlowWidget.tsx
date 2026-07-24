'use client';

import type { Flow, WalletAccount } from '@dynamic-labs-sdk/client';
import { getFlow, logout } from '@dynamic-labs-sdk/client';
import { Button, Spinner } from '@dynamic-labs-sdk/droplet';
import {
  useAttachFlowSource,
  useUser,
} from '@dynamic-labs-sdk/react-hooks';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { FLOW_ID_STORAGE_KEY, TERMINAL_STATES } from './FlowWidget.constants';
import type { FlowWidgetView } from './FlowWidget.types';
import { AttachWalletView } from './views/AttachWalletView/AttachWalletView';
import { DepositAddressView } from './views/DepositAddressView/DepositAddressView';
import { EmailLoginView } from './views/EmailLoginView/EmailLoginView';
import { ExchangeView } from './views/ExchangeView/ExchangeView';
import { ReviewQuoteView } from './views/ReviewQuoteView/ReviewQuoteView';
import { SelectSourceView } from './views/SelectSourceView/SelectSourceView';
import { StatusView } from './views/StatusView/StatusView';
import { SubmitView } from './views/SubmitView/SubmitView';

type FlowWidgetProps = {
  initialFlowId?: string;
  onReset?: () => void;
};


export const FlowWidget: FC<FlowWidgetProps> = ({ initialFlowId, onReset }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFlowId = initialFlowId ?? searchParams.get('flowId');
  const { data: user } = useUser();

  const savedFlowId = typeof window !== 'undefined'
    ? sessionStorage.getItem(FLOW_ID_STORAGE_KEY)
    : null;

  const effectiveFlowId = urlFlowId ?? savedFlowId;

  const [flowId, setFlowId] = useState<string | null>(null);
  const [flow, setFlow] = useState<Flow | null>(null);
  const [view, setView] = useState<FlowWidgetView>('selectSource');
  const [isRestoring, setIsRestoring] = useState(!!effectiveFlowId);
  const [selectedWallet, setSelectedWallet] = useState<WalletAccount | null>(null);
  const [selectedFromTokenAddress, setSelectedFromTokenAddress] = useState<string | undefined>();
  const [selectedFromChainId, setSelectedFromChainId] = useState<string | undefined>();
  const [selectedFromTokenDecimals, setSelectedFromTokenDecimals] = useState<number | undefined>();
  const [selectedFromTokenSymbol, setSelectedFromTokenSymbol] = useState<string | undefined>();
  const [sponsorshipMode, setSponsorshipMode] = useState<'auto' | 'off'>('auto');
  const [restoreError, setRestoreError] = useState(false);
  const [usedEmailLogin, setUsedEmailLogin] = useState(false);

  const isFromStorage = !urlFlowId && !!savedFlowId;

  useEffect(() => {
    if (!effectiveFlowId) return;
    if (isFromStorage && !user) return;

    let cancelled = false;

    getFlow({ flowId: effectiveFlowId })
      .then((restoredFlow) => {
        if (cancelled) return;

        const state = String(restoredFlow.executionState);

        if (TERMINAL_STATES.has(state)) {
          if (initialFlowId) {
            setFlowId(effectiveFlowId);
            setFlow(restoredFlow);
            setView('status');
          } else {
            toast.error('This flow can no longer be modified. Please create a new flow.');
            sessionStorage.removeItem(FLOW_ID_STORAGE_KEY);
            router.replace('/');
          }
          return;
        }

        setFlowId(effectiveFlowId);
        setFlow(restoredFlow);
        if (isFromStorage) setUsedEmailLogin(true);
        setView('selectSource');
      })
      .catch(() => {
        if (cancelled) return;
        sessionStorage.removeItem(FLOW_ID_STORAGE_KEY);
        if (initialFlowId) {
          setRestoreError(true);
        } else {
          router.replace('/');
        }
      })
      .finally(() => {
        if (!cancelled) setIsRestoring(false);
      });

    return () => { cancelled = true; };
  }, [effectiveFlowId, user, router]);

  const handleReset = useCallback(() => {
    void logout();
    sessionStorage.removeItem(FLOW_ID_STORAGE_KEY);
    if (onReset) {
      // Page is about to reload — skip state updates to avoid a flash of enterFlowId.
      onReset();
      return;
    }
    setFlow(null);
    setFlowId(null);
    setSelectedWallet(null);
    setUsedEmailLogin(false);
    setView('enterFlowId');
    router.replace('/');
  }, [router, onReset]);

  const { mutate: attachExchangeSource, isPending: isAttachingExchange } =
    useAttachFlowSource({
      mutateParams: {
        onError: (error) => {
          const raw = error instanceof Error ? error.message : '';
          const isChainMismatch = raw.toLowerCase().includes('settlement chain') ||
            raw.toLowerCase().includes('destination address');
          toast.error(
            isChainMismatch
              ? 'Exchange payment isn\'t available for this flow. Please choose another payment method.'
              : (raw || 'Failed to attach exchange source.')
          );
        },
        onSuccess: (response) => {
          setFlow(response.flow);
          setView('exchange');
        },
      },
    });

  const handleSelectExchange = () => {
    if (!flowId) return;
    attachExchangeSource({ exchangeProvider: 'coinbase', flowId, sourceType: 'exchange' });
  };

  const handleWalletAttached = ({
    walletAccount,
    fromTokenAddress,
    fromChainId,
    fromTokenDecimals,
    fromTokenSymbol,
    quotedFlow,
  }: {
    fromChainId: string | undefined;
    fromTokenAddress: string | undefined;
    fromTokenDecimals: number | undefined;
    fromTokenSymbol: string | undefined;
    quotedFlow: Flow;
    walletAccount: WalletAccount;
  }) => {
    setFlow(quotedFlow);
    setSelectedWallet(walletAccount);
    setSelectedFromTokenAddress(fromTokenAddress);
    setSelectedFromChainId(fromChainId);
    setSelectedFromTokenDecimals(fromTokenDecimals);
    setSelectedFromTokenSymbol(fromTokenSymbol);
    setView('reviewQuote');
  };

  if (isRestoring) {
    return (
      <div className="w-full max-w-[440px] mx-auto">
        <div className="bg-white rounded-[20px] shadow-elevated p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-7 w-48 rounded bg-gray-100" />
            <div className="h-14 w-full rounded-xl bg-gray-100" />
            <div className="h-14 w-full rounded-xl bg-gray-100" />
            <div className="h-11 w-full rounded-lg bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  if (restoreError) {
    return (
      <div className="w-full max-w-[440px] mx-auto bg-white rounded-[20px] shadow-elevated p-8 flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
          <X className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Flow not found</h2>
          <p className="text-sm text-muted-foreground mt-1">
            This flow could not be loaded. It may have been deleted or the link may be incorrect.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[440px] mx-auto flex flex-col gap-4">
      {/* Back to product — hidden on the first view */}
      {view !== 'selectSource' && (
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to product
        </button>
      )}

      {/* Card */}
      <div className="bg-white rounded-[20px] overflow-hidden shadow-elevated relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
          >
            {/* Primary views — handle their own px-5 section padding */}
            {view === 'selectSource' && flow && (
              <SelectSourceView
                onSelectWallet={() => setView('attachWallet')}
                onSelectExchange={handleSelectExchange}
                onSelectDepositAddress={() => setView('depositAddress')}
                onSelectEmbeddedWallet={() => {
                  if (user) {
                    setUsedEmailLogin(true);
                    setView('attachWallet');
                  } else {
                    setView('emailLogin');
                  }
                }}
              />
            )}

            {view === 'emailLogin' && flow && (
              <EmailLoginView
                onBack={() => setView('selectSource')}
                onLoggedIn={() => {
                  setUsedEmailLogin(true);
                  setView('attachWallet');
                }}
              />
            )}

            {view === 'attachWallet' && flow && (
              <AttachWalletView
                flow={flow}
                initiallyConnected={usedEmailLogin}
                onAttached={handleWalletAttached}
                onBack={() => setView('selectSource')}
                onFlowUpdated={setFlow}
                onLogout={
                  usedEmailLogin
                    ? () => {
                        void logout();
                        setUsedEmailLogin(false);
                        setView('selectSource');
                      }
                    : undefined
                }
              />
            )}

            {view === 'reviewQuote' && flow && selectedWallet && (
              <ReviewQuoteView
                flow={flow}
                fromTokenAddress={selectedFromTokenAddress}
                fromChainId={selectedFromChainId}
                fromTokenDecimals={selectedFromTokenDecimals}
                fromTokenSymbol={selectedFromTokenSymbol}
                onBack={() => setView('selectSource')}
                walletAccount={selectedWallet}
                onConfirm={(updatedFlow, mode) => {
                  setFlow(updatedFlow);
                  setSponsorshipMode(mode);
                  setView('submit');
                }}
              />
            )}

            {view === 'submit' && flow && selectedWallet && (
              <SubmitView
                flow={flow}
                fromTokenSymbol={selectedFromTokenSymbol}
                sponsorshipMode={sponsorshipMode}
                walletAccount={selectedWallet}
                onBack={() => setView('reviewQuote')}
                onDone={handleReset}
                onRequote={() => {
                  setFlow((prev) => prev ? { ...prev, quote: undefined } : prev);
                  setView('reviewQuote');
                }}
              />
            )}

            {/* Secondary views — wrapped in uniform padding */}
            {view === 'depositAddress' && flow && (
              <div className="px-5 py-5">
                <DepositAddressView
                  flow={flow}
                  onBack={() => setView('selectSource')}
                  onFlowUpdated={setFlow}
                  onTransitionToStatus={(updatedFlow) => {
                    setFlow(updatedFlow);
                    setView('status');
                  }}
                />
              </div>
            )}

            {view === 'exchange' && flow && (
              <div className="px-5 py-5">
                <ExchangeView
                  flow={flow}
                  onBack={() => setView('selectSource')}
                  onCompleted={(completedFlow) => {
                    setFlow(completedFlow);
                    setView('status');
                  }}
                />
              </div>
            )}

            {view === 'status' && flow && (
              <div className="px-5 py-5">
                <StatusView flow={flow} onFlowUpdated={setFlow} onReset={handleReset} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {isAttachingExchange && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Spinner className="size-6 text-[var(--action)]" />
              <p className="text-sm text-muted-foreground">Setting up exchange…</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
