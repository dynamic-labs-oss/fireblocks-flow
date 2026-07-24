/** Right-pointing arrow. CTAs + row affordances. 16px. */
export function ArrowRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="block"
    >
      <path
        d="M3 8h10m0 0L9 4m4 4L9 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Left-pointing arrow. "Back to …" links. 14px. */
export function ArrowLeft() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className="block"
    >
      <path
        d="M11 7H1m0 0l4-4M1 7l4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
