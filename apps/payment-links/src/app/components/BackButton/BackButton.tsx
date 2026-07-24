'use client';

import { ArrowLeft } from '../../icons';

export function BackButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 self-start text-[11px] font-medium text-(--brand-muted) transition-colors hover:text-(--brand-fg)"
    >
      <ArrowLeft />
      {label}
    </button>
  );
}
