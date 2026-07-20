'use client';

import { LinkIcon } from 'lucide-react';
import type { FC } from 'react';

/**
 * Shown when the `?flow=` param is missing or can't be decoded into a
 * `{ environmentId, flowId }` descriptor — i.e. a broken or tampered link.
 */
export const InvalidPaymentLink: FC = () => {
  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className="rounded-2xl bg-card overflow-hidden border border-[oklch(0.278_0.03_256.85_/_0.10)]"
        style={{
          boxShadow:
            '0 0 0 1px oklch(0.278 0.03 256.85 / 0.06), 0 8px 40px oklch(0.278 0.03 256.85 / 0.18), 0 2px 8px oklch(0.278 0.03 256.85 / 0.10)',
        }}
      >
        <div className="p-8 flex flex-col items-center gap-3 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-[var(--brand-light)] flex items-center justify-center">
            <LinkIcon className="w-6 h-6 text-[var(--action)]" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Invalid payment link
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              This payment link is missing or malformed. Please check the link
              and try again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
