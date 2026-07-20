'use client';

import { Copy } from 'lucide-react';
import type { FC } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

type CopyButtonProps = { label: string; value: string };

export const CopyButton: FC<CopyButtonProps> = ({ value, label }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={() => void handleCopy()}
      className="shrink-0 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
      aria-label={`Copy ${label}`}
    >
      <Copy className={`w-3.5 h-3.5 ${copied ? 'text-emerald-500' : ''}`} />
    </button>
  );
};
