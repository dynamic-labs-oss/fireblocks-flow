'use client';

import { getDefaultClient, waitForClientInitialized } from '@dynamic-labs-sdk/client';
import { DynamicProvider } from '@dynamic-labs-sdk/react-hooks';
import { useQuery } from '@tanstack/react-query';
import type { FC, ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { initializeDynamicClient } from '../../constants/dynamicClient';

type DynamicClientProviderProps = {
  children: ReactNode;
  environmentId: string;
};

export const DynamicClientProvider: FC<DynamicClientProviderProps> = ({
  children,
  environmentId,
}) => {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    initializeDynamicClient({ environmentId });
  }, [environmentId]);

  const { data: isReady } = useQuery({
    queryFn: async () => {
      await waitForClientInitialized();
      return true;
    },
    queryKey: ['clientInitialized'],
    staleTime: Infinity,
  });

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Initializing SDK…</p>
        </div>
      </div>
    );
  }

  return (
    <DynamicProvider client={getDefaultClient()}>{children}</DynamicProvider>
  );
};
