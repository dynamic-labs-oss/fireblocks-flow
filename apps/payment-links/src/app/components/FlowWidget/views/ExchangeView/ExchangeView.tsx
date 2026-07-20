'use client';

import type { Flow } from '@dynamic-labs-sdk/client';
import { Button, Spinner } from '@dynamic-labs-sdk/droplet';
import { useBroadcastFlow } from '@dynamic-labs-sdk/react-hooks';
import { ArrowUpRight, ChevronLeft } from 'lucide-react';
import type { FC } from 'react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

type ExchangeViewProps = {
  flow: Flow;
  onBack: () => void;
  onCompleted: (flow: Flow) => void;
};

const openExchangePopup = (url: string) =>
  window.open(url, '_blank', 'noopener,noreferrer');

export const ExchangeView: FC<ExchangeViewProps> = ({
  flow,
  onBack,
  onCompleted,
}) => {
  const buyUrl = (
    flow.exchangeSource?.metadata as Record<string, string> | undefined
  )?.url;

  const { mutate: broadcast, isPending } = useBroadcastFlow({
    mutateParams: {
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to record payment. Please try again.'
        );
      },
      onSuccess: onCompleted,
    },
  });

  const popupOpenedRef = useRef(false);

  // Open the exchange URL automatically on mount — the browser allows this
  // because this component is rendered in response to a user gesture.
  useEffect(() => {
    if (!buyUrl || popupOpenedRef.current) return;
    popupOpenedRef.current = true;
    openExchangePopup(buyUrl);
  }, [buyUrl]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h3 className="text-base font-semibold">Complete your transfer</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Finish the payment on the exchange
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/40 p-6 flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--action)]/10 flex items-center justify-center">
          <ArrowUpRight className="w-6 h-6 text-[var(--action)]" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            Complete your transfer on the exchange
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We opened a new window with your exchange. Once the transfer is
            done, come back here and confirm below.
          </p>
        </div>
        {buyUrl && (
          <button
            onClick={() => openExchangePopup(buyUrl)}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--action)] hover:underline font-medium mt-1"
          >
            Reopen exchange
            <ArrowUpRight className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        <Button
          className="w-full"
          size="lg"
          onClick={() => broadcast({ flowId: flow.id })}
          disabled={isPending}
        >
          {isPending && <Spinner className="size-4" />}
          {isPending ? 'Recording payment…' : "I've completed the transfer"}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Click above once the exchange transfer is done
        </p>
      </div>
    </div>
  );
};
