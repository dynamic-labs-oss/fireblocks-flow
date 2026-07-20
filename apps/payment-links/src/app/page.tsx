'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import type { FC } from 'react';
import { Suspense, useCallback } from 'react';
import { Toaster } from 'sonner';

import { DeviceRegistrationHandler } from './components/DeviceRegistrationHandler/DeviceRegistrationHandler';
import { DynamicClientProvider } from './components/DynamicClientProvider/DynamicClientProvider';
import { FlowWidget } from './components/FlowWidget/FlowWidget';
import { InvalidPaymentLink } from './components/InvalidPaymentLink/InvalidPaymentLink';
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

  // Full page reload so the module-level SDK init flag in dynamicClient.ts
  // resets — an SPA navigation would keep the payment link's environmentId.
  // eslint-disable-next-line no-restricted-globals
  const handleReset = useCallback(() => { window.location.href = '/'; }, []);

  if (!decoded) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f0f2f5]">
        <InvalidPaymentLink />
      </div>
    );
  }

  return (
    <DynamicClientProvider environmentId={decoded.environmentId}>
      <DeviceRegistrationHandler />
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f0f2f5]">
        <FlowWidget initialFlowId={decoded.flowId} onReset={handleReset} />
      </div>
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
