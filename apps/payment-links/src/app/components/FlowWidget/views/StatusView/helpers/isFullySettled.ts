import type { Flow } from '@dynamic-labs-sdk/client';

export const isFullySettled = (f: Flow) => String(f.settlementState) === 'completed';
