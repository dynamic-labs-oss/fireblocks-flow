'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import type { FC } from 'react';
import { Suspense, useCallback, useState } from 'react';
import { Toaster } from 'sonner';

import { BackButton } from './components/BackButton/BackButton';
import { DeviceRegistrationHandler } from './components/DeviceRegistrationHandler/DeviceRegistrationHandler';
import { DynamicClientProvider } from './components/DynamicClientProvider/DynamicClientProvider';
import { FlowWidget } from './components/FlowWidget/FlowWidget';
import { InvalidPaymentLink } from './components/InvalidPaymentLink/InvalidPaymentLink';
import { PaymentLinksInfo } from './components/PaymentLinksInfo/PaymentLinksInfo';
import { ScenarioCard } from './components/ScenarioCard/ScenarioCard';
import { TicketIllustration } from './components/TicketIllustration/TicketIllustration';
import {
  FLOW_QUERY_PARAM,
  decodePaymentLink,
} from './utils/decodePaymentLink/decodePaymentLink';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const PaymentLinkPage: FC = () => {
  const searchParams = useSearchParams();
  const encoded = searchParams.get(FLOW_QUERY_PARAM);
  const decoded = encoded ? decodePaymentLink(encoded) : null;
  const [paying, setPaying] = useState(false);

  // Full page reload so the module-level SDK init flag in dynamicClient.ts
  // resets — an SPA navigation would keep the payment link's environmentId.
  // eslint-disable-next-line no-restricted-globals
  const handleReset = useCallback(() => { window.location.reload(); }, []);

  if (!encoded) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-20 flex flex-col items-center justify-center">
        <PaymentLinksInfo />
      </main>
    );
  }

  if (!decoded) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-20 flex flex-col items-center justify-center">
        <InvalidPaymentLink />
      </main>
    );
  }

  return (
    <DynamicClientProvider environmentId={decoded.environmentId}>
      <DeviceRegistrationHandler />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="w-full max-w-[440px] mx-auto">
          {paying ? (
            <div className="flex flex-col gap-2">
              <BackButton onClick={() => setPaying(false)} label="Back to product" />
              <FlowWidget initialFlowId={decoded.flowId} onReset={handleReset} />
            </div>
          ) : (
            <ScenarioCard
              eyebrow="Demo purchase"
              title="Backstage pass · Sample event"
              body="Tap below to launch the embedded Flow widget and watch the lifecycle in the code panel on the right."
              ctaLabel="Pay with crypto"
              onCta={() => setPaying(true)}
              illustration={<TicketIllustration />}
              trailingHeader={
                <span className="text-base font-semibold text-(--brand-fg) font-mono">
                  $0.10
                </span>
              }
            />
          )}
        </div>
      </main>
    </DynamicClientProvider>
  );
};

const Page = () => {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Suspense boundary required by useSearchParams in PaymentLinkPage */}
      <Suspense>
        <PaymentLinkPage />
      </Suspense>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
};

export default Page;
