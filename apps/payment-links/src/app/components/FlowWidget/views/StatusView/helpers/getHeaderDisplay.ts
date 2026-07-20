import type { Flow } from '@dynamic-labs-sdk/client';

import type { HeaderDisplay } from '../StatusView.types';
import { SETTLEMENT_STEP_LABELS } from './constants';

export const getHeaderDisplay = (flow: Flow): HeaderDisplay => {
  const exec = String(flow.executionState);
  const settle = String(flow.settlementState);

  if (exec === 'failed' || settle === 'failed') {
    return {
      badgeVariant: 'danger',
      description:
        'Your transaction failed. Please try again or contact support.',
      isFailure: true,
      isSpinning: false,
      statusLabel: 'Failed',
      title: 'Transaction failed',
    };
  }
  if (exec === 'cancelled') {
    return {
      badgeVariant: 'inactive',
      description: 'This flow was cancelled.',
      isFailure: true,
      isSpinning: false,
      statusLabel: 'Cancelled',
      title: 'Cancelled',
    };
  }
  if (exec === 'expired') {
    return {
      badgeVariant: 'inactive',
      description: 'This flow has expired.',
      isFailure: true,
      isSpinning: false,
      statusLabel: 'Expired',
      title: 'Expired',
    };
  }
  if (settle === 'completed') {
    return {
      badgeVariant: 'success',
      description: 'Your payment has been fully settled.',
      isFailure: false,
      isSpinning: false,
      statusLabel: 'Settled',
      title: 'Payment settled',
    };
  }
  if (exec === 'source_confirmed') {
    // Settlement not yet started — transaction is confirmed on-chain, show success
    if (settle === 'none') {
      return {
        badgeVariant: 'success',
        description: 'Your transaction was confirmed on-chain.',
        isFailure: false,
        isSpinning: false,
        statusLabel: 'Confirmed',
        title: 'Transaction confirmed',
      };
    }
    // Settlement in progress
    const label = SETTLEMENT_STEP_LABELS[settle] ?? 'Settling…';
    return {
      badgeVariant: 'process',
      description: `Transaction confirmed. ${label}`,
      isFailure: false,
      isSpinning: true,
      statusLabel: label,
      title: 'Settling…',
    };
  }
  if (exec === 'broadcasted') {
    return {
      badgeVariant: 'process',
      description: 'Transaction broadcast. Waiting for on-chain confirmation.',
      isFailure: false,
      isSpinning: true,
      statusLabel: 'Confirming',
      title: 'Confirming on-chain…',
    };
  }
  return {
    badgeVariant: 'process',
    description: 'Your transaction is being processed.',
    isFailure: false,
    isSpinning: true,
    statusLabel: 'Processing',
    title: 'Processing…',
  };
};
