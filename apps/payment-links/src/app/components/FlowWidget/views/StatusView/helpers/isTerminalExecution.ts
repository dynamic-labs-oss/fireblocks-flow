export const isTerminalExecution = (exec: string) =>
  ['cancelled', 'expired', 'failed'].includes(exec);
