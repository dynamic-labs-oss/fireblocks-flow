export type BadgeVariant = 'success' | 'danger' | 'inactive' | 'process';
export type StepState = 'done' | 'active' | 'pending' | 'failed';

export type HeaderDisplay = {
  badgeVariant: BadgeVariant;
  description: string;
  isFailure: boolean;
  isSpinning: boolean;
  statusLabel: string;
  title: string;
};

export type StepItem = {
  badge?: { label: string; variant: BadgeVariant };
  label: string;
  state: StepState;
  sublabel?: string;
};
