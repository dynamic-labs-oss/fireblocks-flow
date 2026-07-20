/** Shortens a wallet address to first 6 and last 4 characters. */
export const truncateAddress = (address: string) =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;
