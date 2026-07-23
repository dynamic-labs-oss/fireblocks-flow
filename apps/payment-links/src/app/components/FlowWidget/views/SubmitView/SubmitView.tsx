'use client';

import type { Flow, WalletAccount } from '@dynamic-labs-sdk/client';
import {
  broadcastFlow,
  executeSwapTransaction,
  prepareFlowSigning,
} from '@dynamic-labs-sdk/client';
import { Button, Spinner } from '@dynamic-labs-sdk/droplet';
import { AlertTriangle, ChevronLeft } from 'lucide-react';
import type { FC } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/utils/cn/cn';
import { isQuoteExpiredError } from './helpers/isQuoteExpiredError';
import { isSponsorshipError } from './helpers/isSponsorshipError';

type SponsorshipMode = 'auto' | 'off';

type SubmitViewProps = {
  flow: Flow;
  onBack: () => void;
  onRequote: () => void;
  onSubmitted: (flow: Flow) => void;
  sponsorshipMode: SponsorshipMode;
  walletAccount: WalletAccount;
};

type SigningStep = 'approval' | 'transaction';

const STEP_CONFIG: Record<SigningStep, { label: string; description: string }> = {
  approval: { label: 'Approve token', description: 'Allow spending in your wallet' },
  transaction: { label: 'Authorize payment', description: 'Confirm in your wallet' },
};

export const SubmitView: FC<SubmitViewProps> = ({
  flow,
  sponsorshipMode,
  walletAccount,
  onBack,
  onRequote,
  onSubmitted,
}) => {
  const [currentStep, setCurrentStep] = useState<SigningStep | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [sponsorshipFailed, setSponsorshipFailed] = useState(false);

  const hasStartedRef = useRef(false);
  const submittedRef = useRef(false);

  const submit = useCallback(async () => {
    setIsPending(true);
    setError(null);
    setCurrentStep(null);

    try {
      const prepared = await prepareFlowSigning({ flowId: flow.id });

      const signingPayload = prepared.quote?.signingPayload;

      if (!signingPayload) {
        // eslint-disable-next-line no-restricted-syntax
        throw new Error(
          'No signing payload returned — quote may be missing transaction data',
        );
      }

      const { transactionHash } = await executeSwapTransaction({
        onStepChange: setCurrentStep,
        signingPayload,
        sponsorshipMode,
        walletAccount,
      });

      const completedFlow = await broadcastFlow({
        flowId: flow.id,
        txHash: transactionHash,
      });

      if (!submittedRef.current) {
        submittedRef.current = true;
        onSubmitted(completedFlow);
      }
    } catch (err) {
      // eslint-disable-next-line no-restricted-syntax
      const wrapped = err instanceof Error ? err : new Error('Transaction failed.');

      setError(wrapped);

      if (isSponsorshipError(wrapped)) {
        setSponsorshipFailed(true);
      }

      // no-op: error is displayed persistently in the UI below
    } finally {
      setIsPending(false);
    }
  }, [flow.id, sponsorshipMode, walletAccount, onSubmitted]);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    void submit();
  }, []);

  const steps: SigningStep[] = ['approval', 'transaction'];
  const currentStepIndex = currentStep ? steps.indexOf(currentStep) : -1;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-0.5">Payment</p>
          {!isPending && error ? (
            <h2 className="text-xl font-bold">Payment failed</h2>
          ) : (
            <h2 className="text-xl font-bold">Processing payment</h2>
          )}
        </div>
        {!isPending && error && (
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground transition-colors mt-1"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Timeline steps */}
      <div className="space-y-0">
        {steps.map((step, index) => {
          const isDone =
            currentStepIndex > index ||
            (!isPending && !error && hasStartedRef.current);
          const isActive = currentStep === step && isPending;
          const isUpcoming = !isDone && !isActive;
          const isLast = index === steps.length - 1;

          return (
            <div key={step} className="flex gap-3">
              {/* Icon + connector line */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all',
                    isDone && 'bg-[var(--action)] text-white',
                    isActive && 'border-2 border-[var(--action)] bg-white',
                    isUpcoming && 'border-2 border-border bg-white',
                  )}
                >
                  {isActive ? (
                    <Spinner className="size-3 text-[var(--action)]" />
                  ) : isDone ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </div>
                {!isLast && (
                  <div className={cn('w-px flex-1 my-1', isDone ? 'bg-[var(--action)]' : 'bg-border')} />
                )}
              </div>

              {/* Label + description */}
              <div className={cn('pb-4 pt-0.5', isLast && 'pb-0')}>
                <p className={cn('text-sm font-semibold', isUpcoming && 'text-muted-foreground')}>
                  {STEP_CONFIG[step].label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {STEP_CONFIG[step].description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {error && !isPending && (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />

            <div className="text-sm text-red-700 space-y-1">
              <p className="font-medium">
                {isQuoteExpiredError(error)
                  ? 'Quote expired'
                  : sponsorshipFailed
                    ? 'Gas sponsorship failed'
                    : 'Transaction failed'}
              </p>

              <p className="text-red-600">
                {sponsorshipFailed
                  ? 'Please create a new flow and disable sponsorship in the quote view to pay gas yourself.'
                  : error.message}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {isQuoteExpiredError(error) ? (
              <Button className="w-full" size="lg" onClick={onRequote}>
                Get a new quote
              </Button>
            ) : !sponsorshipFailed && (
              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  submittedRef.current = false;
                  hasStartedRef.current = true;
                  void submit();
                }}
              >
                Try again
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={onBack}
            >
              Go back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
