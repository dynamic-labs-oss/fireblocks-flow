import {
  BitcoinIcon,
  EthereumIcon,
  FlowIcon,
  SolanaIcon,
  SuiIcon,
  TronIcon,
} from '@dynamic-labs/iconic';
import type { Iconic } from '@dynamic-labs/iconic';

/** Maps Chain string values to their Iconic icon component. */
export const CHAIN_ICON_MAP: Partial<Record<string, Iconic>> = {
  BTC: BitcoinIcon,
  EVM: EthereumIcon,
  FLOW: FlowIcon,
  SOL: SolanaIcon,
  SUI: SuiIcon,
  TRON: TronIcon,
};
