/** Returns true if the error indicates a gas sponsorship failure. */
export const isSponsorshipError = (err: unknown): boolean => {
  const msg = err instanceof Error ? err.message.toLowerCase() : '';

  return msg.includes('sponsor');
};
