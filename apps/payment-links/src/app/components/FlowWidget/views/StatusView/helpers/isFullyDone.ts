import type { Flow } from '@dynamic-labs-sdk/client';

import { isFullySettled } from './isFullySettled';
import { isTerminalExecution } from './isTerminalExecution';

export const isFullyDone = (f: Flow) => {
  const exec = String(f.executionState);
  const settle = String(f.settlementState);
  return (
    isTerminalExecution(exec) ||
    isFullySettled(f) ||
    settle === 'failed' ||
    (exec === 'source_confirmed' && settle === 'none')
  );
};
