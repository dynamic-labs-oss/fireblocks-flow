'use client';

import type { Flow } from '@dynamic-labs-sdk/client';
import { getFlow } from '@dynamic-labs-sdk/client';
import { Button, Input, Spinner } from '@dynamic-labs-sdk/droplet';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Zap } from 'lucide-react';
import type { FC, FormEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

type EnterFlowIdViewProps = {
  onFlowLoaded: (flow: Flow) => void;
};

export const EnterFlowIdView: FC<EnterFlowIdViewProps> = ({ onFlowLoaded }) => {
  const [flowId, setFlowId] = useState('');

  const { mutate: loadFlow, isPending } = useMutation({
    mutationFn: ({ flowId: id }: { flowId: string }) => getFlow({ flowId: id }),
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Flow not found. Check the ID and try again.'
      );
    },
    onSuccess: onFlowLoaded,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = flowId.trim();
    if (!trimmed) return;
    loadFlow({ flowId: trimmed });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-[var(--brand-light)] flex items-center justify-center">
          <Zap className="w-6 h-6 text-[var(--action)]" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Start a Flow</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your flow ID to begin the payment process
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="flowId">
            Flow ID
          </label>
          <Input
            id="flowId"
            placeholder="e.g. flow_abc123…"
            value={flowId}
            onChange={(e) => setFlowId(e.target.value)}
            disabled={isPending}
            autoFocus
            className="font-mono text-sm"
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={!flowId.trim() || isPending}
        >
          {isPending ? <Spinner className="size-4" /> : <ArrowRight className="w-4 h-4" />}
          {isPending ? 'Loading…' : 'Load Flow'}
        </Button>
      </form>
    </div>
  );
};
