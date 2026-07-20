/** Returns true if the error message indicates a quote has expired. */
export const isQuoteExpiredError = (err: unknown): boolean => {
  const msg = err instanceof Error ? err.message.toLowerCase() : '';
  return msg.includes('expired') || msg.includes('quote');
};
