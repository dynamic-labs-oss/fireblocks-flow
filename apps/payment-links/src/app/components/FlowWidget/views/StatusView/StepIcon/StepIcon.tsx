'use client';

import { Spinner } from '@dynamic-labs-sdk/droplet';
import { Check, XCircle } from 'lucide-react';
import type { FC } from 'react';

import type { StepState } from '../StatusView.types';

type StepIconProps = { state: StepState };

export const StepIcon: FC<StepIconProps> = ({ state }) => {
  const base =
    'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all';
  if (state === 'done')
    return (
      <div className={`${base} bg-[var(--action)] text-white`}>
        <Check className="w-3.5 h-3.5" />
      </div>
    );
  if (state === 'active')
    return (
      <div className={`${base} border-2 border-[var(--action)]`}>
        <Spinner className="size-3 text-[var(--action)]" />
      </div>
    );
  if (state === 'failed')
    return (
      <div className={`${base} bg-[var(--danger-default)] text-white`}>
        <XCircle className="w-3.5 h-3.5" />
      </div>
    );
  return <div className={`${base} border-2 border-border bg-muted/40`} />;
};
