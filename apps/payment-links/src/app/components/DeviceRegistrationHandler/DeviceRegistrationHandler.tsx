'use client';

import {
  completeDeviceRegistration,
  detectDeviceRegistrationRedirect,
  getDeviceRegistrationTokenFromUrl,
  isDeviceRegistrationRequired,
} from '@dynamic-labs-sdk/client';
import { useUser } from '@dynamic-labs-sdk/react-hooks';
import { useQuery } from '@tanstack/react-query';
import { Mail, X } from 'lucide-react';
import type { FC } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

const DEVICE_REGISTRATION_QUERY_KEY = 'device-registration-redirect';

const DEVICE_REGISTRATION_TOKEN_PARAM = 'deviceRegistrationToken';

const DEVICE_REGISTRATION_MESSAGE =
  'A verification email has been sent to your inbox. Please check your email and follow the link to register this device.';

/**
 * Handles device registration redirects and shows a banner when
 * the user must register the current device before WaaS wallets
 * can sign transactions.
 */
export const DeviceRegistrationHandler: FC = () => {
  const { data: user } = useUser();
  const [dismissed, setDismissed] = useState(false);

  useQuery({
    queryFn: async () => {
      // eslint-disable-next-line no-restricted-globals
      const url = window.location.href;

      if (!detectDeviceRegistrationRedirect({ url })) {
        return true;
      }

      await completeDeviceRegistration({
        deviceToken: getDeviceRegistrationTokenFromUrl({ url }),
      });

      // eslint-disable-next-line no-restricted-globals
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete(DEVICE_REGISTRATION_TOKEN_PARAM);
      // eslint-disable-next-line no-restricted-globals
      window.history.replaceState({}, '', cleanUrl.toString());

      toast.success('Device registration completed successfully');
      setDismissed(true);

      return true;
    },
    queryKey: [DEVICE_REGISTRATION_QUERY_KEY],
    retry: false,
    staleTime: 0,
  });

  const isRequired = user ? isDeviceRegistrationRequired(user) : false;

  if (!isRequired || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-96 rounded-2xl bg-card border border-border/60 shadow-lg px-5 py-4 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
        <Mail className="w-4 h-4 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          Device registration required
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {DEVICE_REGISTRATION_MESSAGE}
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 p-1 rounded-md hover:bg-muted/40 transition-colors cursor-pointer"
      >
        <X className="w-4 h-4 text-muted-foreground/40" />
      </button>
    </div>
  );
};
