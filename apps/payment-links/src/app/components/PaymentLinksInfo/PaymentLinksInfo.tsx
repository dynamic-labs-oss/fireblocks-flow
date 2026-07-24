'use client';

import { LinkIcon } from 'lucide-react';
import type { FC } from 'react';

export const PaymentLinksInfo: FC = () => {
  return (
    <div className="w-full max-w-sm mx-auto rounded-2xl bg-(--brand-surface) border border-(--brand-border) shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-8 flex flex-col items-center gap-5 text-center">
      <div className="w-12 h-12 rounded-full bg-(--brand-row-bg) border border-(--brand-border) flex items-center justify-center">
        <LinkIcon className="w-5 h-5 text-(--brand-primary)" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold text-(--brand-fg)">
          Fireblocks Flow
        </h2>
        <p className="text-sm text-(--brand-fg-secondary) leading-relaxed">
          Visit a payment link URL to make a payment.
        </p>
      </div>
    </div>
  );
};
