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

const STEP_LABELS: Record<SigningStep, string> = {
  approval: 'Approve token spend',
  transaction: 'Sign transaction',
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
      {!isPending && error && (
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-base font-semibold">Transaction failed</h3>
        </div>
      )}

      {isPending && (
        <div>
          <h3 className="text-base font-semibold">Signing transaction</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Please confirm the prompts in your wallet
          </p>
        </div>
      )}

      <div className="space-y-2">
        {steps.map((step, index) => {
          const isDone =
            currentStepIndex > index ||
            (!isPending && !error && hasStartedRef.current);
          const isActive = currentStep === step && isPending;
          const isPast = currentStepIndex > index;

          return (
            <div
              key={step}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-4 py-3 transition-all',
                isActive && 'border-[var(--action)] bg-[var(--brand-light)]',
                isPast && 'border-border bg-[var(--bg-bottom)] opacity-60',
                !isActive && !isPast && currentStepIndex < index && 'opacity-40',
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
                  isDone
                    ? 'bg-[var(--action)] text-white'
                    : isActive
                      ? 'border-2 border-[var(--action)]'
                      : 'border-2 border-border',
                )}
              >
                {isActive ? (
                  <Spinner className="size-3 text-[var(--action)]" />
                ) : isDone ? (
                  '✓'
                ) : (
                  index + 1
                )}
              </div>
              <span className={cn('text-sm', isActive && 'font-medium')}>
                {STEP_LABELS[step]}
              </span>
            </div>
          );
        })}
      </div>

      {isPending && (
        <p className="text-xs text-center text-muted-foreground animate-pulse">
          Waiting for wallet confirmation…
        </p>
      )}

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
