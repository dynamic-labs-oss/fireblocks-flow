'use client';

import type { Flow, WalletAccount } from '@dynamic-labs-sdk/client';
import { getFlow, logout } from '@dynamic-labs-sdk/client';
import { Button, Spinner } from '@dynamic-labs-sdk/droplet';
import {
  useAttachFlowSource,
  useCancelFlow,
  useUser,
} from '@dynamic-labs-sdk/react-hooks';
import { Lock, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { FLOW_ID_STORAGE_KEY, STATE_CONFIG, TERMINAL_STATES, VIEWS_WITH_CANCEL } from './FlowWidget.constants';
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

const STEP_TITLES: Record<FlowWidgetView, string> = {
  selectSource: 'Choose payment method',
  emailLogin: 'Sign in with email',
  attachWallet: 'Connect your wallet',
  reviewQuote: 'Review payment',
  submit: 'Confirm payment',
  depositAddress: 'Deposit address',
  exchange: 'Complete via exchange',
  status: 'Payment status',
};

const FireblocksLogo: FC = () => (
  <div className="flex items-center gap-2.5">
    <svg width="20" height="17" viewBox="0 0 28 24" fill="none" aria-hidden>
      <path
        d="M12.0639 1.80289C11.5488 2.28286 11.0427 2.75394 10.5366 3.2228C8.18574 5.40488 5.8349 7.58919 3.48184 9.76683C2.94241 10.2668 2.383 10.7468 1.70594 11.0401C0.900128 11.3889 0.438394 11.1712 0.178669 10.3023C-0.18317 9.08687 0.00995842 7.95361 0.709218 6.90923C1.30414 6.0204 2.05446 5.28045 2.82476 4.56049C4.05234 3.4139 5.28881 2.27841 6.54082 1.16293C7.08913 0.674073 7.68849 0.227435 8.42105 0.0785558C10.6143 -0.363638 12.0128 1.73845 12.0661 1.80067L12.0639 1.80289Z"
        fill="oklch(0.60 0.18 258)"
      />
      <path
        d="M1.5105 12.9044C2.84464 12.52 3.8458 11.6734 4.82033 10.7823C7.92814 7.94695 11.0315 5.10935 14.1527 2.28953C14.8408 1.66735 15.5645 1.07183 16.3304 0.551865C17.3049 -0.110315 18.3638 -0.205864 19.4071 0.425206C19.7845 0.651859 20.1552 0.916287 20.4615 1.23182C21.5249 2.33175 22.5749 3.44946 23.5982 4.58716C24.6859 5.79597 25.7559 7.02256 26.797 8.27137C27.1544 8.70023 27.4475 9.2002 27.6894 9.70683C28.1401 10.649 28.0246 11.58 27.4763 12.4578C26.9857 13.2444 26.3287 13.8888 25.6516 14.4999C23.0011 16.8953 20.3505 19.2907 17.6689 21.6527C16.9497 22.2882 16.1572 22.8571 15.3403 23.3593C13.8019 24.3081 12.2591 24.1904 10.8562 23.066C10.0392 22.4127 9.27117 21.6816 8.56969 20.9039C6.30986 18.3996 4.09221 15.8598 1.85902 13.331C1.7458 13.2044 1.64369 13.0666 1.5105 12.9022V12.9044Z"
        fill="oklch(0.60 0.18 258)"
      />
    </svg>
    <span className="text-sm font-semibold tracking-wide text-white/80">
      Fireblocks
    </span>
  </div>
);

const SummaryPanel: FC<{ flow: Flow | null }> = ({ flow }) => (
  <div className="lg:w-[280px] shrink-0 bg-[oklch(0.18_0.025_260)] text-white flex flex-col p-8">
    <FireblocksLogo />

    <div className="flex-1 mt-10">
      {flow ? (
        <>
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-3">
            Amount due
          </p>
          <p className="text-4xl font-bold tracking-tight leading-none">
            {flow.amount}
          </p>
          <p className="text-base font-medium mt-1.5 mb-8" style={{ color: 'oklch(0.60 0.18 258)' }}>
            {flow.currency}
          </p>

          {flow.memo && (() => {
            const entries = Object.entries(flow.memo as Record<string, unknown>).filter(
              ([, v]) => typeof v === 'string' || typeof v === 'number'
            );
            return entries.length > 0 ? (
              <dl className="space-y-2.5 mb-8">
                {entries.map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4 text-sm">
                    <dt className="text-white/40 capitalize shrink-0">
                      {key.replace(/_/g, ' ')}
                    </dt>
                    <dd className="text-white/75 font-medium text-right truncate">
                      {String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null;
          })()}

          <div className="border-t border-white/10 pt-4">
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-white/50">Total</span>
              <span className="text-white">
                {flow.amount} {flow.currency}
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="animate-pulse space-y-3">
          <div className="h-2.5 w-16 rounded-full bg-white/10" />
          <div className="h-9 w-28 rounded bg-white/15" />
          <div className="h-4 w-14 rounded bg-white/10" />
        </div>
      )}
    </div>

    <div className="mt-8 flex items-center gap-1.5 text-[11px] text-white/25">
      <Lock className="size-3" />
      <span>Secured by Fireblocks</span>
    </div>
  </div>
);

const CheckoutShell: FC<{ left: React.ReactNode; right: React.ReactNode }> = ({ left, right }) => (
  <div className="w-full max-w-[800px] mx-auto rounded-2xl overflow-hidden shadow-2xl flex flex-col lg:flex-row min-h-[480px]">
    {left}
    {right}
  </div>
);

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

  const { mutate: cancelFlow, isPending: isCancelling } = useCancelFlow({
    mutateParams: {
      onError: () => { toast.error('Could not cancel flow.'); },
      onSettled: handleReset,
    },
  });

  const handleCancel = useCallback(() => {
    if (flowId) {
      cancelFlow({ flowId });
    } else {
      handleReset();
    }
  }, [flowId, cancelFlow, handleReset]);

  const { mutate: attachExchangeSource, isPending: isAttachingExchange } =
    useAttachFlowSource({
      mutateParams: {
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : 'Failed to attach exchange source.'
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

  const executionState = flow ? String(flow.executionState) : null;
  const stateConfig = executionState
    ? (STATE_CONFIG[executionState] ?? { dot: 'bg-gray-400', label: executionState })
    : null;

  if (isRestoring) {
    return (
      <CheckoutShell
        left={<SummaryPanel flow={null} />}
        right={
          <div className="flex-1 bg-white p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-5 w-40 rounded bg-gray-100" />
              <div className="h-36 w-full rounded-xl bg-gray-100" />
              <div className="h-11 w-full rounded-lg bg-gray-100" />
              <div className="h-11 w-full rounded-lg bg-gray-100" />
            </div>
          </div>
        }
      />
    );
  }

  if (restoreError) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4 text-center">
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
    <CheckoutShell
      left={<SummaryPanel flow={flow} />}
      right={
        <div className="flex-1 bg-white flex flex-col">
          {/* Step header */}
          <div className="px-8 pt-7 pb-5 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-base font-semibold text-gray-900">
                {STEP_TITLES[view]}
              </h2>
              {stateConfig && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 mt-0.5">
                  <span className={`size-1.5 rounded-full shrink-0 ${stateConfig.dot}`} />
                  {stateConfig.label}
                </span>
              )}
            </div>
            {flow && (
              <p className="text-[11px] font-mono text-gray-400 mt-1">
                {flow.id.slice(0, 8)}…
              </p>
            )}
          </div>

          {/* View content */}
          <div className="flex-1 p-8 relative">
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
                sponsorshipMode={sponsorshipMode}
                walletAccount={selectedWallet}
                onBack={() => setView('reviewQuote')}
                onRequote={() => {
                  setFlow((prev) => prev ? { ...prev, quote: undefined } : prev);
                  setView('reviewQuote');
                }}
                onSubmitted={(completedFlow) => {
                  setFlow(completedFlow);
                  setView('status');
                }}
              />
            )}

            {view === 'depositAddress' && flow && (
              <DepositAddressView
                flow={flow}
                onBack={() => setView('selectSource')}
                onFlowUpdated={setFlow}
                onTransitionToStatus={(updatedFlow) => {
                  setFlow(updatedFlow);
                  setView('status');
                }}
              />
            )}

            {view === 'exchange' && flow && (
              <ExchangeView
                flow={flow}
                onBack={() => setView('selectSource')}
                onCompleted={(completedFlow) => {
                  setFlow(completedFlow);
                  setView('status');
                }}
              />
            )}

            {view === 'status' && flow && (
              <StatusView flow={flow} onFlowUpdated={setFlow} onReset={handleReset} />
            )}

            {isAttachingExchange && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Spinner className="size-6 text-[var(--action)]" />
                  <p className="text-sm text-muted-foreground">Setting up exchange…</p>
                </div>
              </div>
            )}

            {VIEWS_WITH_CANCEL.includes(view) && flow && (
              <Button
                variant="ghost"
                className="w-full mt-4 text-[var(--text-danger)] hover:text-[var(--text-danger)]"
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? <Spinner className="size-4" /> : <X className="w-4 h-4" />}
                {isCancelling ? 'Cancelling…' : 'Cancel flow'}
              </Button>
            )}
          </div>
        </div>
      }
    />
  );
};
