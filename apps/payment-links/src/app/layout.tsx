/* eslint-disable custom-rules/function-name-matches-filename */
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DM_Sans } from 'next/font/google';

import '../styles.css';

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Fireblocks Flow',
  description:
    'Accept any crypto, settle any stablecoin — powered by Fireblocks Flow.',
};

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en" suppressHydrationWarning className={dmSans.variable}>
      <body className={`${dmSans.className} bg-(--brand-page-bg)`}>
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
