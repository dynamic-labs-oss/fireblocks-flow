import type { FlowWidgetView } from './FlowWidget.types';

export const TERMINAL_STATES = new Set([
  'broadcasted',
  'source_confirmed',
  'cancelled',
  'expired',
  'failed',
]);

export const VIEWS_WITH_CANCEL: FlowWidgetView[] = [
  'selectSource',
  'emailLogin',
  'attachWallet',
  'reviewQuote',
  'exchange',
  'depositAddress',
];

export const FLOW_ID_STORAGE_KEY = 'fireblocks-flow-id';

export const SLIPPAGE_OPTIONS: { label: string; value: number }[] = [
  { label: '0.5%', value: 0.005 },
  { label: '1%', value: 0.01 },
  { label: '3%', value: 0.03 },
];

export type StateConfig = { label: string; dot: string };

export const STATE_CONFIG: Record<string, StateConfig> = {
  broadcasted: { dot: 'bg-purple-400', label: 'Broadcasting' },
  cancelled: { dot: 'bg-gray-400', label: 'Cancelled' },
  expired: { dot: 'bg-gray-400', label: 'Expired' },
  failed: { dot: 'bg-red-500', label: 'Failed' },
  initiated: { dot: 'bg-gray-400', label: 'Initiated' },
  quoted: { dot: 'bg-amber-400', label: 'Quoted' },
  signing: { dot: 'bg-blue-500', label: 'Signing' },
  source_attached: { dot: 'bg-blue-500', label: 'Source Attached' },
  source_confirmed: { dot: 'bg-emerald-500', label: 'Confirmed' },
};
