'use client';

import type { Flow, WalletAccount } from '@dynamic-labs-sdk/client';
import { getFlowQuote } from '@dynamic-labs-sdk/client';
import { isWaasWalletAccount } from '@dynamic-labs-sdk/client/waas';
import { Button, Checkbox, Spinner } from '@dynamic-labs-sdk/droplet';
import { ArrowRight, Clock, RefreshCw, X } from 'lucide-react';
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-0.5">
            Payment
          </p>
          <h2 className="text-xl font-bold">Review your payment</h2>
        </div>
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors mt-1"
          aria-label="Go back"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {isPending ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <Spinner className="size-6 text-[var(--action)]" />
          <p className="text-sm text-muted-foreground">Fetching quote…</p>
        </div>
      ) : quote ? (
        <div className="space-y-4">
          {/* Subtitle */}
          {fromTokenSymbol && (
            <p className="text-sm text-muted-foreground">
              You're paying {displayFlow.amount} {displayFlow.currency} with {fromTokenSymbol}.
            </p>
          )}

          {/* From → To visualization */}
          <div className="rounded-xl bg-[var(--brand-light)] p-4 flex items-center gap-3">
            <div className="flex-1 text-center space-y-1.5">
              <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center mx-auto">
                <span className="text-[10px] font-bold text-[var(--action)]">
                  {fromTokenSymbol?.slice(0, 4) ?? '?'}
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {fromTokenSymbol}
              </p>
              <p className="text-xs font-bold font-mono">
                {formatQuoteAmount({ decimals: fromTokenDecimals, raw: quote.fromAmount })}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 text-center space-y-1.5">
              <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center mx-auto">
                <span className="text-[10px] font-bold text-[var(--action)]">
                  {displayFlow.currency.slice(0, 4)}
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {displayFlow.currency}
              </p>
              <p className="text-xs font-bold font-mono">
                {formatQuoteAmount({ raw: displayFlow.amount })}
              </p>
            </div>
          </div>

          {/* Fee breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Item total</span>
              <span>{displayFlow.amount} {displayFlow.currency}</span>
            </div>
            {quote.fees?.totalFeeUsd && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fee</span>
                <span>${quote.fees.totalFeeUsd}</span>
              </div>
            )}
            {quote.estimatedTimeSec && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Est. time
                </span>
                <span>{formatSeconds(quote.estimatedTimeSec)}</span>
              </div>
            )}
            <div className="border-t border-dashed border-border pt-2 flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span className="font-mono">
                {formatQuoteAmount({ decimals: fromTokenDecimals, raw: quote.fromAmount })}{' '}
                {fromTokenSymbol}
              </span>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Quote expires at {new Date(quote.expiresAt).toLocaleTimeString()}
            {' · '}
            <button
              onClick={() => void doFetchQuote()}
              disabled={isPending}
              className="underline hover:text-foreground transition-colors"
            >
              Refresh
            </button>
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

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              size="lg"
              onClick={onBack}
              disabled={isPending}
            >
              Back
            </Button>
            <Button
              className="flex-1"
              size="lg"
              onClick={() => onConfirm(displayFlow, disableSponsorship ? 'off' : 'auto')}
              disabled={isPending}
            >
              Confirm Payment
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
