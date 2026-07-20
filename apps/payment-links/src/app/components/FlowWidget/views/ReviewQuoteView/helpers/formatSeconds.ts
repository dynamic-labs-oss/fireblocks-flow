/** Formats seconds into a human-readable approximate duration. */
export const formatSeconds = (sec: number): string => {
  if (sec < 60) return `~${sec}s`;
  return `~${Math.round(sec / 60)}min`;
};
