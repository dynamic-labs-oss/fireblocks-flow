import type { Flow } from '@dynamic-labs-sdk/client';

import type { StepItem } from '../StatusView.types';
import { SETTLEMENT_STEP_LABELS } from './constants';

// Derive the three milestone steps from the flow's current state
export const getSteps = (flow: Flow): StepItem[] => {
  const exec = String(flow.executionState);
  const settle = String(flow.settlementState);
  const isFailed = exec === 'failed' || settle === 'failed';
  const isCancelledOrExpired = ['cancelled', 'expired'].includes(exec);

  // Step 1: Payment submitted (broadcasted or beyond)
  const step1Done =
    ['broadcasted', 'source_confirmed'].includes(exec) || isFailed;
  const step1Active = exec === 'signing' || exec === 'broadcasted';

  // Step 2: Source confirmed (on-chain confirmation)
  const step2Done =
    exec === 'source_confirmed' ||
    (isFailed && ['source_confirmed'].includes(exec));
  const sourceConfirmedReached = exec === 'source_confirmed';

  // Step 3: Settlement completed
  const step3Done = settle === 'completed';
  const step3Active =
    sourceConfirmedReached && !step3Done && settle !== 'failed';
  const settlementSubLabel =
    SETTLEMENT_STEP_LABELS[settle] ?? (step3Active ? 'Waiting…' : undefined);

  if (isCancelledOrExpired) {
    const notStarted = { label: 'Not started', variant: 'inactive' as const };
    return [
      { badge: notStarted, label: 'Payment submitted', state: 'pending' },
      { badge: notStarted, label: 'Source confirmed', state: 'pending' },
      { badge: notStarted, label: 'Settlement', state: 'pending' },
    ];
  }

  if (isFailed) {
    return [
      { label: 'Payment submitted', state: step1Done ? 'done' : 'failed' },
      { label: 'Source confirmed', state: step2Done ? 'done' : 'failed' },
      {
        label: 'Settlement',
        state: settle === 'failed' ? 'failed' : 'pending',
        sublabel: settle === 'failed' ? 'Failed' : undefined,
      },
    ];
  }

  return [
    {
      label: 'Payment submitted',
      state: step1Done ? 'done' : step1Active ? 'active' : 'pending',
      sublabel: exec === 'broadcasted' ? 'Confirming on-chain…' : undefined,
    },
    {
      label: 'Source confirmed',
      state: step2Done ? 'done' : sourceConfirmedReached ? 'active' : 'pending',
    },
    {
      label: 'Settlement',
      state: step3Done ? 'done' : step3Active ? 'active' : 'pending',
      sublabel: settlementSubLabel,
    },
  ];
};
