'use client';

import type { Flow, WalletAccount } from '@dynamic-labs-sdk/client';
import { getFlow, logout } from '@dynamic-labs-sdk/client';
import { Button, Spinner } from '@dynamic-labs-sdk/droplet';
import {
  useAttachFlowSource,
  useCancelFlow,
  useUser,
} from '@dynamic-labs-sdk/react-hooks';
import { X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { FLOW_ID_STORAGE_KEY, STATE_CONFIG, TERMINAL_STATES, VIEWS_WITH_CANCEL } from './FlowWidget.constants';
import type { FlowWidgetView } from './FlowWidget.types';
import { AttachWalletView } from './views/AttachWalletView/AttachWalletView';
import { DepositAddressView } from './views/DepositAddressView/DepositAddressView';
import { EmailLoginView } from './views/EmailLoginView/EmailLoginView';
import { EnterFlowIdView } from './views/EnterFlowIdView/EnterFlowIdView';
import { ExchangeView } from './views/ExchangeView/ExchangeView';
import { ReviewQuoteView } from './views/ReviewQuoteView/ReviewQuoteView';
import { SelectSourceView } from './views/SelectSourceView/SelectSourceView';
import { StatusView } from './views/StatusView/StatusView';
import { SubmitView } from './views/SubmitView/SubmitView';

type FlowWidgetProps = {
  /**
   * Flow id to restore on mount, taken from a decoded payment link. Takes
   * precedence over the `?flowId=` URL param used on the manual-entry page.
   */
  initialFlowId?: string;
  /**
   * Controls exit behaviour after the widget's local state is cleared. The
   * payment-link page passes a full-reload callback (`window.location.href`)
   * so the module-level SDK init flag resets; the manual-entry page omits it
   * and falls back to an SPA navigation (`router.replace('/')`).
   */
  onReset?: () => void;
};

export const FlowWidget: FC<FlowWidgetProps> = ({ initialFlowId, onReset }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFlowId = initialFlowId ?? searchParams.get('flowId');
  const { data: user } = useUser();

  // Restore flow ID from sessionStorage when returning from a device registration redirect
  const savedFlowId = typeof window !== 'undefined'
    ? sessionStorage.getItem(FLOW_ID_STORAGE_KEY)
    : null;

  const effectiveFlowId = urlFlowId ?? savedFlowId;

  const [flowId, setFlowId] = useState<string | null>(null);
  const [flow, setFlow] = useState<Flow | null>(null);
  const [view, setView] = useState<FlowWidgetView>('enterFlowId');
  const [isRestoring, setIsRestoring] = useState(!!effectiveFlowId);
  const [selectedWallet, setSelectedWallet] = useState<WalletAccount | null>(null);
  const [selectedFromTokenAddress, setSelectedFromTokenAddress] = useState<string | undefined>();
  const [selectedFromChainId, setSelectedFromChainId] = useState<string | undefined>();
  const [selectedFromTokenDecimals, setSelectedFromTokenDecimals] = useState<number | undefined>();
  const [selectedFromTokenSymbol, setSelectedFromTokenSymbol] = useState<string | undefined>();
  const [sponsorshipMode, setSponsorshipMode] = useState<'auto' | 'off'>('auto');
  const [restoreError, setRestoreError] = useState(false);
  const [usedEmailLogin, setUsedEmailLogin] = useState(false);

  // Whether the flow ID was restored from sessionStorage rather than the URL
  const isFromStorage = !urlFlowId && !!savedFlowId;

  // On mount: if a flowId is in the URL (or sessionStorage), restore it.
  // When the flow ID comes from sessionStorage (device registration redirect),
  // wait until the user session is available before calling getFlow.
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

        if (isFromStorage) {
          setUsedEmailLogin(true);
        }

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

    return () => {
      cancelled = true;
    };
  }, [effectiveFlowId, user, router]);

  const handleReset = useCallback(() => {
    void logout();

    sessionStorage.removeItem(FLOW_ID_STORAGE_KEY);

    setFlow(null);
    setFlowId(null);
    setSelectedWallet(null);
    setUsedEmailLogin(false);
    setView('enterFlowId');

    if (onReset) {
      onReset();
    } else {
      router.replace('/');
    }
  }, [router, onReset]);

  const { mutate: cancelFlow, isPending: isCancelling } = useCancelFlow({
    mutateParams: {
      onError: () => {
        toast.error('Could not cancel flow.');
      },
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
            error instanceof Error
              ? error.message
              : 'Failed to attach exchange source.'
          );
        },
        onSuccess: (response) => {
          setFlow(response.flow);
          setView('exchange');
        },
      },
    });

  const handleFlowLoaded = (loadedFlow: Flow) => {
    const state = String(loadedFlow.executionState);

    sessionStorage.setItem(FLOW_ID_STORAGE_KEY, loadedFlow.id);

    if (TERMINAL_STATES.has(state)) {
      setFlowId(loadedFlow.id);
      setFlow(loadedFlow);
      setView('status');
      return;
    }

    setFlowId(loadedFlow.id);
    setFlow(loadedFlow);
    setView('selectSource');
  };

  const handleSelectExchange = () => {
    if (!flowId) return;
    attachExchangeSource({
      exchangeProvider: 'coinbase',
      flowId,
      sourceType: 'exchange',
    });
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
      <div className="w-full max-w-md mx-auto">
        <div className="rounded-2xl bg-card overflow-hidden border border-[oklch(0.278_0.03_256.85_/_0.10)]" style={{ boxShadow: '0 0 0 1px oklch(0.278 0.03 256.85 / 0.06), 0 8px 40px oklch(0.278 0.03 256.85 / 0.18), 0 2px 8px oklch(0.278 0.03 256.85 / 0.10)' }}>
          <div className="p-8 flex flex-col items-center gap-3">
            <Spinner className="size-6 text-[var(--action)]" />
            <p className="text-sm text-muted-foreground">Loading flow…</p>
          </div>
        </div>
      </div>
    );
  }

  if (restoreError) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="rounded-2xl bg-card overflow-hidden border border-[oklch(0.278_0.03_256.85_/_0.10)]" style={{ boxShadow: '0 0 0 1px oklch(0.278 0.03 256.85 / 0.06), 0 8px 40px oklch(0.278 0.03 256.85 / 0.18), 0 2px 8px oklch(0.278 0.03 256.85 / 0.10)' }}>
          <div className="p-8 flex flex-col items-center gap-3 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <X className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Flow not found
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                This flow could not be loaded. It may have been deleted or the
                link may be incorrect.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-2xl bg-card overflow-hidden border border-[oklch(0.278_0.03_256.85_/_0.10)]" style={{ boxShadow: '0 0 0 1px oklch(0.278 0.03 256.85 / 0.06), 0 8px 40px oklch(0.278 0.03 256.85 / 0.18), 0 2px 8px oklch(0.278 0.03 256.85 / 0.10)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-sm font-semibold tracking-tight">
            Fireblocks Flow
          </span>
          <div className="flex items-center gap-2">
            {stateConfig && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`size-1.5 rounded-full shrink-0 ${stateConfig.dot}`} />
                {stateConfig.label}
              </span>
            )}
            {flow && (
              <span className="font-mono text-xs text-muted-foreground">
                {flow.id.slice(0, 8)}…
              </span>
            )}
          </div>
        </div>

        {/* Amount band */}
        {flow && (
          <div
            className="px-6 py-5 text-center border-b border-border"
            style={{
              background: `oklch(0.574 0.207 257.4 / 0.12)`,
            }}
          >
            <p className="text-xs uppercase tracking-widest font-medium" style={{ color: 'oklch(0.497 0.174 256.63)' }}>
              Amount
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: 'oklch(0.22 0.025 260)' }}>
              {flow.amount}{' '}
              <span className="text-xl font-semibold" style={{ color: 'oklch(0.574 0.207 257.4)' }}>
                {flow.currency}
              </span>
            </p>
            {flow.memo && (() => {
              const entries = Object.entries(flow.memo as Record<string, unknown>).filter(
                ([, v]) => typeof v === 'string' || typeof v === 'number'
              );
              if (entries.length === 0) return null;
              return (
                <dl className="mt-3 pt-3 border-t border-[oklch(0.574_0.207_257.4_/_0.2)] space-y-1">
                  {entries.map(([key, value]) => (
                    <div key={key} className="flex items-baseline justify-center gap-1.5">
                      <dt className="text-xs font-medium capitalize" style={{ color: 'oklch(0.497 0.174 256.63)' }}>
                        {key.replace(/_/g, ' ')}
                      </dt>
                      <dd className="text-xs" style={{ color: 'oklch(0.22 0.025 260)' }}>
                        {String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              );
            })()}
          </div>
        )}

        {/* View content */}
        <div className="p-6 relative">
          {view === 'enterFlowId' && (
            <EnterFlowIdView onFlowLoaded={handleFlowLoaded} />
          )}

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

          {/* Exchange attach loading overlay */}
          {isAttachingExchange && (
            <div className="absolute inset-0 bg-card/70 backdrop-blur-sm flex items-center justify-center rounded-2xl">
              <div className="flex flex-col items-center gap-3">
                <Spinner className="size-6 text-[var(--action)]" />
                <p className="text-sm text-muted-foreground">
                  Setting up exchange…
                </p>
              </div>
            </div>
          )}

          {/* Cancel button */}
          {VIEWS_WITH_CANCEL.includes(view) && flow && (
            <Button
              variant="ghost"
              className="w-full mt-4 text-[var(--text-danger)] hover:text-[var(--text-danger)]"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <Spinner className="size-4" />
              ) : (
                <X className="w-4 h-4" />
              )}
              {isCancelling ? 'Cancelling…' : 'Cancel flow'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
