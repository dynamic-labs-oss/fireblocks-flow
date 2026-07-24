'use client';

import type { Flow, WalletAccount } from '@dynamic-labs-sdk/client';
import { getFlowQuote } from '@dynamic-labs-sdk/client';
import { isWaasWalletAccount } from '@dynamic-labs-sdk/client/waas';
import { Button, Spinner } from '@dynamic-labs-sdk/droplet';
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

function TokenCard({
  symbol,
  amount,
  gradient,
}: {
  amount: string;
  gradient: 'to-r' | 'to-l';
  symbol: string;
}) {
  return (
    <div
      className={
        gradient === 'to-r'
          ? 'flex-1 p-3 rounded-lg bg-gradient-to-r from-[var(--brand-card-gradient-start)] to-[var(--brand-card-gradient-end)]'
          : 'flex-1 p-3 rounded-lg bg-gradient-to-l from-[var(--brand-card-gradient-start)] to-[var(--brand-card-gradient-end)]'
      }
    >
      <div className="flex flex-col items-center gap-1.5">
        <div className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center">
          <span className="text-[9px] font-bold text-action leading-none">
            {symbol.slice(0, 4).toUpperCase()}
          </span>
        </div>
        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] text-muted-foreground tracking-[-0.12px] uppercase">{symbol}</span>
          <span className="text-sm font-medium text-foreground tracking-[-0.14px] font-mono">{amount}</span>
        </div>
      </div>
    </div>
  );
}

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

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    if (flow.quote) {
      setQuotedFlow(flow);
      return;
    }
    void doFetchQuote();
  }, [flow.id]);

  const displayFlow = quotedFlow ?? flow;
  const quote = displayFlow.quote;

  const fromAmount = quote
    ? formatQuoteAmount({ decimals: fromTokenDecimals, raw: quote.fromAmount })
    : '—';
  const toAmount = formatQuoteAmount({ raw: displayFlow.amount });

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 py-5 border-b border-border-default">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
            PAYMENT
          </span>
          <h2 className="text-base font-semibold tracking-[-0.01em]">Review your payment</h2>
          {fromTokenSymbol && (
            <p className="text-xs text-muted-foreground tracking-[-0.12px] leading-snug">
              You're paying {displayFlow.amount} {displayFlow.currency} with {fromTokenSymbol}.
            </p>
          )}
        </div>
        <button
          onClick={onBack}
          className="shrink-0 p-1 hover:bg-bg-accented rounded transition-colors cursor-pointer mt-0.5"
          aria-label="Go back"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {isPending ? (
        <div className="px-5 py-12 flex flex-col items-center gap-3">
          <Spinner className="size-6 text-[var(--action)]" />
          <p className="text-sm text-muted-foreground">Fetching quote…</p>
        </div>
      ) : quote ? (
        <>
          {/* Token conversion card */}
          <div className="px-5 py-3 border-b border-border-default">
            <div className="flex items-center gap-3">
              <TokenCard
                symbol={fromTokenSymbol ?? '?'}
                amount={fromAmount}
                gradient="to-r"
              />
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              <TokenCard
                symbol={displayFlow.currency}
                amount={toAmount}
                gradient="to-l"
              />
            </div>
          </div>

          {/* Fee breakdown */}
          <div className="px-5 py-3 border-b border-border-default space-y-2">
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
            <div className="border-t border-dashed border-border-default pt-2 flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span className="font-mono">{fromAmount} {fromTokenSymbol}</span>
            </div>
          </div>

          {/* Expiry + gas toggle */}
          <div className="px-5 py-2.5 border-b border-border-default space-y-2">
            <p className="text-xs text-muted-foreground">
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
                  className="rounded border-border-default accent-[var(--action)]"
                />
                <span className="text-xs text-muted-foreground">
                  Disable gas sponsorship (pay gas yourself)
                </span>
              </label>
            )}
          </div>

          {/* Footer buttons */}
          <div className="px-5 py-3 flex gap-2">
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
        </>
      ) : (
        <div className="px-5 py-10 text-center space-y-3">
          <p className="text-sm text-muted-foreground">No quote available</p>
          <Button variant="outline" onClick={() => void doFetchQuote()}>
            <RefreshCw className="w-4 h-4" />
            Try again
          </Button>
        </div>
      )}
    </div>
  );
};
