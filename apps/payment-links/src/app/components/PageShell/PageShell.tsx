'use client';

import type { FC, ReactNode } from 'react';

import { BrandPanel } from '../BrandPanel/BrandPanel';

type PageShellProps = {
  children: ReactNode;
};

const PAGE_BACKGROUND = `
  radial-gradient(ellipse 55% 80% at 95% 55%, oklch(0.60 0.18 258 / 0.45) 0%, transparent 60%),
  radial-gradient(ellipse 35% 45% at 100% 30%, oklch(0.88 0.06 260 / 0.80) 0%, transparent 55%),
  radial-gradient(ellipse 40% 55% at 88% 85%, oklch(0.55 0.22 278 / 0.38) 0%, transparent 58%),
  radial-gradient(ellipse 60% 50% at 78% 65%, oklch(0.72 0.12 260 / 0.28) 0%, transparent 65%),
  oklch(0.968 0.010 262)
`;

/**
 * Shared page chrome for the demo: the Fireblocks gradient background plus the
 * brand panel, with the routed content rendered in the right-hand panel. Used by
 * both the manual flow-entry page and the payment-link page so they stay visually
 * identical.
 */
export const PageShell: FC<PageShellProps> = ({ children }) => {
  return (
    <div
      className="min-h-screen flex relative overflow-hidden"
      style={{ background: PAGE_BACKGROUND }}
    >
      <BrandPanel />

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {children}
      </div>
    </div>
  );
};
