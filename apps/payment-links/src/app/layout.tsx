/* eslint-disable custom-rules/function-name-matches-filename */
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '../styles.css';

export const metadata: Metadata = {
  title: 'Fireblocks Flow',
};

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
