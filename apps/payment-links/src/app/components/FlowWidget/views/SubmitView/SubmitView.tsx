'use client';

import type { Flow, WalletAccount } from '@dynamic-labs-sdk/client';
import {
  broadcastFlow,
  executeSwapTransaction,
  getFlow,
  prepareFlowSigning,
} from '@dynamic-labs-sdk/client';
import { Button } from '@dynamic-labs-sdk/droplet';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Check } from 'lucide-react';
import type { FC } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/utils/cn/cn';
import { isQuoteExpiredError } from './helpers/isQuoteExpiredError';
import { isSponsorshipError } from './helpers/isSponsorshipError';

type SponsorshipMode = 'auto' | 'off';
type StepStatus = 'pending' | 'active' | 'completed' | 'failed';

type Step = {
  description: string;
  id: 'approve' | 'authorize' | 'convert' | 'complete';
  label: string;
  status: StepStatus;
};

type SubmitViewProps = {
  flow: Flow;
  fromTokenSymbol?: string;
  onBack: () => void;
  onDone: () => void;
  onRequote: () => void;
  sponsorshipMode: SponsorshipMode;
  walletAccount: WalletAccount;
};

function AnimatedClockIcon() {
  return (
    <svg
      fill="none"
      height="18"
      stroke="#46B463"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="18"
    >
      <circle cx="12" cy="12" r="10" />
      <line
        className="animate-[spin_3s_linear_infinite]"
        style={{ transformOrigin: '12px 12px' }}
        x1="12" x2="12" y1="12" y2="6"
      />
      <line x1="12" x2="16" y1="12" y2="12" />
    </svg>
  );
}

function PendingDot() {
  return (
    <svg fill="none" height="18" viewBox="0 0 19 19" width="18">
      <path
        d="M12.9425 9.24442C12.9425 11.2867 11.2869 12.9422 9.24466 12.9422C7.20243 12.9422 5.54688 11.2867 5.54688 9.24442C5.54688 7.20219 7.20243 5.54663 9.24466 5.54663C11.2869 5.54663 12.9425 7.20219 12.9425 9.24442Z"
        fill="#ACACAC"
      />
      <path
        clipRule="evenodd"
        d="M14.7916 9.24444C14.7916 12.3078 12.3083 14.7911 9.24493 14.7911C6.18158 14.7911 3.69824 12.3078 3.69824 9.24444C3.69824 6.18109 6.18158 3.69775 9.24493 3.69775C12.3083 3.69775 14.7916 6.18109 14.7916 9.24444ZM9.24493 12.9422C11.2872 12.9422 12.9427 11.2867 12.9427 9.24444C12.9427 7.20221 11.2872 5.54665 9.24493 5.54665C7.20269 5.54665 5.54714 7.20221 5.54714 9.24444C5.54714 11.2867 7.20269 12.9422 9.24493 12.9422Z"
        fill="#EDEDED"
        fillRule="evenodd"
      />
    </svg>
  );
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'completed') {
    return (
      <div className="w-[18px] h-[18px] rounded-full bg-[#46B463] flex items-center justify-center shrink-0">
        <Check className="w-3 h-3 text-white" strokeWidth={3} />
      </div>
    );
  }
  if (status === 'active') return <AnimatedClockIcon />;
  if (status === 'failed') {
    return (
      <div className="w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center shrink-0">
        <span className="text-white text-[10px] font-bold">✕</span>
      </div>
    );
  }
  return <PendingDot />;
}

function buildSteps(fromSymbol: string | undefined, settlementSymbol: string | undefined): Step[] {
  const from = fromSymbol ?? 'token';
  const to = settlementSymbol;
  const steps: Step[] = [
    {
      description: `Allow ${from} spending in your wallet`,
      id: 'approve',
      label: 'Approve token',
      status: 'pending',
    },
    {
      description: 'Confirm in your wallet',
      id: 'authorize',
      label: 'Authorize payment',
      status: 'pending',
    },
  ];

  if (to && to !== from) {
    steps.push({
      description: `Your ${from} is swapped to ${to}`,
      id: 'convert',
      label: `Converting to ${to}`,
      status: 'pending',
    });
  }

  steps.push({
    description: `${to ?? from} settled`,
    id: 'complete',
    label: 'Complete payment',
    status: 'pending',
  });

  return steps;
}

function applyPolledState(steps: Step[], polledFlow: Flow): Step[] {
  const exec = String(polledFlow.executionState);
  const settle = String(polledFlow.settlementState);
  const isTerminal = ['cancelled', 'expired', 'failed'].includes(exec);
  const isSettled = settle === 'completed' || (exec === 'source_confirmed' && settle === 'none');

  if (isSettled) {
    return steps.map((s) => ({ ...s, status: 'completed' as const }));
  }

  if (isTerminal || settle === 'failed') {
    return steps.map((s) => ({
      ...s,
      status: s.status === 'active' ? 'failed' : s.status === 'pending' ? 'pending' : s.status,
    }));
  }

  const next = steps.map((s) => ({ ...s }));
  const authorizeIdx = next.findIndex((s) => s.id === 'authorize');
  const convertIdx = next.findIndex((s) => s.id === 'convert');
  const completeIdx = next.findIndex((s) => s.id === 'complete');

  // source confirmed — broadcast done; if settlement pending, "converting" or "complete" is next
  if (exec === 'source_confirmed') {
    if (authorizeIdx >= 0) next[authorizeIdx]!.status = 'completed';
    if (convertIdx >= 0) {
      next[convertIdx]!.status = 'active';
    } else if (completeIdx >= 0) {
      next[completeIdx]!.status = 'active';
    }
    return next;
  }

  return steps;
}

export const SubmitView: FC<SubmitViewProps> = ({
  flow,
  fromTokenSymbol,
  sponsorshipMode,
  walletAccount,
  onBack,
  onRequote,
  onDone,
}) => {
  const settlementSymbol = flow.settlementConfig?.settlements?.[0]?.symbol;
  const [steps, setSteps] = useState<Step[]>(() =>
    buildSteps(fromTokenSymbol, settlementSymbol)
  );
  const [error, setError] = useState<Error | null>(null);
  const [sponsorshipFailed, setSponsorshipFailed] = useState(false);
  const [broadcastedFlowId, setBroadcastedFlowId] = useState<string | null>(null);

  const hasStartedRef = useRef(false);
  const approveActivatedRef = useRef(false);

  const isAllCompleted = steps.every((s) => s.status === 'completed');
  const hasFailed = steps.some((s) => s.status === 'failed') || !!error;
  const isPending = !isAllCompleted && !hasFailed;

  // Poll for on-chain status after broadcast
  const { data: polledFlow } = useQuery({
    enabled: !!broadcastedFlowId,
    queryFn: () => getFlow({ flowId: flow.id }),
    queryKey: ['submitProgress', flow.id],
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 3000;
      const exec = String(data.executionState);
      const settle = String(data.settlementState);
      const done =
        settle === 'completed' ||
        (exec === 'source_confirmed' && settle === 'none') ||
        ['cancelled', 'expired', 'failed'].includes(exec) ||
        settle === 'failed';
      return done ? false : 3000;
    },
    staleTime: 0,
  });

  useEffect(() => {
    if (!polledFlow) return;
    setSteps((prev) => applyPolledState(prev, polledFlow));
  }, [polledFlow]);

  const updateStep = useCallback((id: Step['id'], status: StepStatus) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  }, []);

  const submit = useCallback(async () => {
    setError(null);
    setSteps(buildSteps(fromTokenSymbol, settlementSymbol));

    try {
      const prepared = await prepareFlowSigning({ flowId: flow.id });
      const signingPayload = prepared.quote?.signingPayload;
      if (!signingPayload) {
        // eslint-disable-next-line no-restricted-syntax
        throw new Error('No signing payload — quote may be missing transaction data.');
      }

      const { transactionHash } = await executeSwapTransaction({
        onStepChange: (step) => {
          if (step === 'approval') {
            approveActivatedRef.current = true;
            updateStep('approve', 'active');
          } else if (step === 'transaction') {
            updateStep('approve', 'completed');
            updateStep('authorize', 'active');
          }
        },
        signingPayload,
        sponsorshipMode,
        walletAccount,
      });

      updateStep('authorize', 'completed');

      // Activate convert or complete while broadcast is in-flight
      const hasConvert = !!settlementSymbol && settlementSymbol !== fromTokenSymbol;
      updateStep(hasConvert ? 'convert' : 'complete', 'active');

      await broadcastFlow({ flowId: flow.id, txHash: transactionHash });
      setBroadcastedFlowId(flow.id);
    } catch (err) {
      // eslint-disable-next-line no-restricted-syntax
      const wrapped = err instanceof Error ? err : new Error('Transaction failed.');
      setError(wrapped);
      if (isSponsorshipError(wrapped)) setSponsorshipFailed(true);
      setSteps((prev) =>
        prev.map((s) =>
          s.status === 'active' ? { ...s, status: 'failed' } : s
        )
      );
    }
  }, [flow.id, fromTokenSymbol, settlementSymbol, sponsorshipMode, walletAccount, updateStep]);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    void submit();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="px-5 py-5 border-b border-border-default">
        <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium mb-1">
          PAYMENT
        </span>
        <h2 className="text-base font-semibold tracking-[-0.01em]">
          {isAllCompleted ? 'Payment complete' : hasFailed ? 'Payment failed' : 'Processing payment'}
        </h2>
      </div>

      {/* Content */}
      <div className="px-5 py-5 space-y-5">
        {/* Success state */}
        {isAllCompleted && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-[var(--brand-light)] flex items-center justify-center">
                <Check className="w-7 h-7 text-[var(--action)]" strokeWidth={2.5} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#46B463] flex items-center justify-center">
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-px w-6 bg-border-default" />
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Payment settled
              </span>
              <span className="h-px w-6 bg-border-default" />
            </div>
            <Button className="w-full" size="lg" onClick={onDone}>
              Done
            </Button>
          </div>
        )}

        {/* Step timeline */}
        {!isAllCompleted && (
          <div className="flex flex-col">
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;
              return (
                <div key={step.id} className="flex items-stretch gap-2.5">
                  <div className="flex flex-col items-center">
                    <div className="pt-0.5">
                      <StepIcon status={step.status} />
                    </div>
                    {!isLast && (
                      <div
                        className={cn(
                          'w-0.5 flex-1 my-1 min-h-[16px] rounded-full',
                          step.status === 'completed' ? 'bg-[#46B463]' : 'bg-border-default',
                        )}
                      />
                    )}
                  </div>
                  <div className={cn('flex flex-col', !isLast && 'pb-4')}>
                    <span className="text-sm font-medium tracking-[-0.14px] leading-5">
                      {step.label}
                    </span>
                    <span className="text-xs text-muted-foreground tracking-[-0.12px] leading-4">
                      {step.description}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Error section */}
        {error && !isAllCompleted && (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-sm text-red-700 space-y-1">
                <p className="font-medium">
                  {isQuoteExpiredError(error)
                    ? 'Quote expired'
                    : sponsorshipFailed
                      ? 'Gas sponsorship failed'
                      : 'Payment failed'}
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
                    hasStartedRef.current = true;
                    approveActivatedRef.current = false;
                    void submit();
                  }}
                >
                  Try again
                </Button>
              )}
              <Button variant="outline" className="w-full" size="lg" onClick={onBack}>
                Go back
              </Button>
            </div>
          </div>
        )}

        {/* Polling hint */}
        {isPending && broadcastedFlowId && !error && (
          <p className="text-xs text-center text-muted-foreground animate-pulse">
            Confirming on-chain…
          </p>
        )}
      </div>
    </div>
  );
};
