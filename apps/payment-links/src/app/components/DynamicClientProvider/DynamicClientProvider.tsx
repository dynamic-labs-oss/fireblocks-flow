'use client';

import { getDefaultClient, waitForClientInitialized } from '@dynamic-labs-sdk/client';
import { Skeleton } from '@dynamic-labs-sdk/droplet';
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
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    );
  }

  return (
    <DynamicProvider client={getDefaultClient()}>{children}</DynamicProvider>
  );
};
