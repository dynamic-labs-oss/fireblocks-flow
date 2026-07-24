'use client';

import type { ReactNode } from 'react';
import { ArrowRight } from '../../icons';

export interface ScenarioCardProps {
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  onCta: () => void;
  illustration: ReactNode;
  trailingHeader?: ReactNode;
}

export function ScenarioCard({
  eyebrow,
  title,
  body,
  ctaLabel,
  onCta,
  illustration,
  trailingHeader,
}: ScenarioCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-(--brand-border) bg-(--brand-surface) shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div
        className="relative h-44"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 14%, var(--brand-surface)) 0%, var(--brand-surface) 100%)',
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--brand-fg) 6%, transparent) 1px, transparent 1px)',
            backgroundSize: '14px 14px',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          {illustration}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.18em] text-(--brand-muted) font-medium">
              {eyebrow}
            </span>
            <h3 className="text-base font-semibold text-(--brand-fg) tracking-[-0.01em]">
              {title}
            </h3>
          </div>
          {trailingHeader && <div className="shrink-0">{trailingHeader}</div>}
        </div>

        <p className="text-xs leading-relaxed text-(--brand-fg-secondary)">
          {body}
        </p>

        <button
          type="button"
          onClick={onCta}
          className="group mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-(--brand-primary) px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-(--brand-primary-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--brand-primary) focus-visible:ring-offset-2"
        >
          {ctaLabel}
          <span className="transition-transform group-hover:translate-x-0.5">
            <ArrowRight />
          </span>
        </button>
      </div>
    </article>
  );
}
