import type { Flow } from '@dynamic-labs-sdk/client';

import { isTerminalExecution } from './isTerminalExecution';

export const shouldStopPolling = (f: Flow) => {
  const exec = String(f.executionState);
  const settle = String(f.settlementState);
  // Stop if execution failed/cancelled/expired
  if (isTerminalExecution(exec)) return true;
  // Stop if settlement reached a terminal state
  if (['completed', 'failed'].includes(settle)) return true;
  // Stop if source confirmed and settlement hasn't started — no more changes expected
  if (exec === 'source_confirmed' && settle === 'none') return true;
  return false;
};
