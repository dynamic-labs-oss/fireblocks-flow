'use client';

import type { Flow } from '@dynamic-labs-sdk/client';
import { getFlow } from '@dynamic-labs-sdk/client';
import { Badge, Button } from '@dynamic-labs-sdk/droplet';
import { useQuery } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import type { FC } from 'react';
import { useEffect } from 'react';

import { CopyButton } from './CopyButton';
import { StepIcon } from './StepIcon';
import { getHeaderDisplay } from './helpers/getHeaderDisplay';
import { getSteps } from './helpers/getSteps';
import { isFullyDone } from './helpers/isFullyDone';
import { shouldStopPolling } from './helpers/shouldStopPolling';

type StatusViewProps = {
  flow: Flow;
  onFlowUpdated: (flow: Flow) => void;
  onReset: () => void;
};

export const StatusView: FC<StatusViewProps> = ({ flow, onFlowUpdated, onReset }) => {
  const { data: polledFlow } = useQuery({
    queryFn: () => getFlow({ flowId: flow.id }),
    queryKey: ['flowStatus', flow.id],
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && shouldStopPolling(data) ? false : 3000;
    },
    staleTime: 0,
  });

  useEffect(() => {
    if (polledFlow) onFlowUpdated(polledFlow);
  }, [polledFlow]);

  const displayFlow = polledFlow ?? flow;
  const header = getHeaderDisplay(displayFlow);
  const steps = getSteps(displayFlow);
  const isDone = isFullyDone(displayFlow);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center space-y-1 pt-2">
        <h3 className="text-base font-semibold">{header.title}</h3>
        <p className="text-sm text-muted-foreground">{header.description}</p>
      </div>

      {/* Step progress */}
      <div className="rounded-xl border border-border bg-[var(--bg-bottom)] divide-y divide-border">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <StepIcon state={step.state} />
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm ${
                  step.state === 'active'
                    ? 'font-medium'
                    : step.state === 'pending'
                    ? 'text-muted-foreground'
                    : ''
                }`}
              >
                {step.label}
              </p>
              {step.sublabel && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step.sublabel}
                </p>
              )}
            </div>
            {step.state === 'done' && (
              <Badge variant="success" className="shrink-0 text-xs">
                Done
              </Badge>
            )}
            {step.state === 'failed' && (
              <Badge variant="danger" className="shrink-0 text-xs">
                {step.sublabel ?? 'Failed'}
              </Badge>
            )}
            {step.badge && step.state !== 'done' && step.state !== 'failed' && (
              <Badge variant={step.badge.variant} className="shrink-0 text-xs">
                {step.badge.label}
              </Badge>
            )}
          </div>
        ))}
      </div>

      {/* Details */}
      <div className="rounded-xl border border-border divide-y divide-border">
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-medium">
            {displayFlow.amount} {displayFlow.currency}
          </span>
        </div>
        <div className="px-4 py-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Flow ID</span>
            <CopyButton value={displayFlow.id} label="Flow ID" />
          </div>
          <p className="font-mono text-xs text-foreground break-all leading-relaxed">
            {displayFlow.id}
          </p>
        </div>
        {displayFlow.txHash && (
          <div className="px-4 py-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Tx hash</span>
              <CopyButton value={displayFlow.txHash} label="Tx hash" />
            </div>
            <p className="font-mono text-xs text-foreground break-all leading-relaxed">
              {displayFlow.txHash}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {!isDone && (
          <p className="text-xs text-center text-muted-foreground animate-pulse">
            Checking status every 3 seconds…
          </p>
        )}
        {!isDone && (
          <Button variant="outline" onClick={onReset} className="w-full">
            <RotateCcw className="w-4 h-4" />
            Done
          </Button>
        )}
      </div>
    </div>
  );
};
