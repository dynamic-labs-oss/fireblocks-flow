'use client';

import type { Flow, WalletAccount } from '@dynamic-labs-sdk/client';
import { getFlowQuote } from '@dynamic-labs-sdk/client';
import { isWaasWalletAccount } from '@dynamic-labs-sdk/client/waas';
import { Button, Spinner } from '@dynamic-labs-sdk/droplet';
import { ChevronLeft, Clock, RefreshCw } from 'lucide-react';
import type { FC } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { formatQuoteAmount } from './helpers/formatQuoteAmount';
import { formatSeconds } from './helpers/formatSeconds';

type SponsorshipMode = 'auto' | 'off';

type ReviewQuoteViewProps = {
  flow: Flow;
  fromChainId?: string;
  fromTokenAddress?: string;
  fromTokenDecimals?: number;
  fromTokenSymbol?: string;
  onBack: () => void;
  onConfirm: (updatedFlow: Flow, sponsorshipMode: SponsorshipMode) => void;
  walletAccount: WalletAccount;
};

export const ReviewQuoteView: FC<ReviewQuoteViewProps> = ({
  flow,
  fromChainId,
  fromTokenAddress,
  fromTokenDecimals,
  fromTokenSymbol,
  onBack,
  onConfirm,
  walletAccount,
}) => {
  const [isPending, setIsPending] = useState(false);
  const [quotedFlow, setQuotedFlow] = useState<Flow | null>(null);
  const [disableSponsorship, setDisableSponsorship] = useState(false);

  const isEmbedded = isWaasWalletAccount({ walletAccount });

  const doFetchQuote = useCallback(async () => {
    setIsPending(true);
    try {
      const result = await getFlowQuote({ flowId: flow.id, fromChainId, fromTokenAddress });
      setQuotedFlow(result);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to fetch quote. Please try again.'
      );
    } finally {
      setIsPending(false);
    }
  }, [flow.id, fromChainId, fromTokenAddress]);

  // hasFetchedRef prevents React StrictMode's double-invoke from calling the
  // API twice, while still allowing a fresh fetch on genuine re-entry (new
  // component instance = new ref initialised to false).
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    // Flow already has a pre-fetched quote from AttachWalletView — use it directly
    if (flow.quote) {
      setQuotedFlow(flow);
      return;
    }
    void doFetchQuote();
  }, [flow.id]);

  const displayFlow = quotedFlow ?? flow;
  const quote = displayFlow.quote;

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
          <h3 className="text-base font-semibold">Review quote</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Confirm the details before signing
          </p>
        </div>
      </div>

      {isPending ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <Spinner className="size-6 text-[var(--action)]" />
          <p className="text-sm text-muted-foreground">Fetching quote…</p>
        </div>
      ) : quote ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-[var(--bg-bottom)] divide-y divide-border">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-muted-foreground">You send</span>
              <span className="text-sm font-semibold font-mono">
                {formatQuoteAmount({ decimals: fromTokenDecimals, raw: quote.fromAmount })}
                {fromTokenSymbol && ` ${fromTokenSymbol}`}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-muted-foreground">They receive</span>
              <span className="text-sm font-semibold font-mono text-[var(--action)]">
                {formatQuoteAmount({ raw: displayFlow.amount })}{' '}
                {displayFlow.currency}
              </span>
            </div>
            {quote.fees?.totalFeeUsd && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">Est. fees</span>
                <span className="text-sm font-mono">
                  ${quote.fees.totalFeeUsd}
                </span>
              </div>
            )}
            {quote.estimatedTimeSec && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Est. time
                </span>
                <span className="text-sm">
                  {formatSeconds(quote.estimatedTimeSec)}
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Quote expires at {new Date(quote.expiresAt).toLocaleTimeString()}
          </p>

          {isEmbedded && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={disableSponsorship}
                onChange={(e) => setDisableSponsorship(e.target.checked)}
                className="rounded border-border accent-[var(--action)]"
              />
              <span className="text-sm text-muted-foreground">
                Disable gas sponsorship (pay gas yourself)
              </span>
            </label>
          )}

          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              size="lg"
              onClick={() => onConfirm(displayFlow, disableSponsorship ? 'off' : 'auto')}
              disabled={isPending}
            >
              Confirm & Sign
            </Button>
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => void doFetchQuote()}
              disabled={isPending}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh quote
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 space-y-3">
          <p className="text-sm text-muted-foreground">No quote available</p>
          <Button
            variant="outline"
            onClick={() => void doFetchQuote()}
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </Button>
        </div>
      )}
    </div>
  );
};
