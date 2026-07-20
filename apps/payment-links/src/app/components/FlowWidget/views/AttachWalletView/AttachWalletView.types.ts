import type { Flow, WalletAccount } from '@dynamic-labs-sdk/client';

export type AttachWalletViewProps = {
  flow: Flow;
  /**
   * When true the view skips the provider list and shows the user's existing
   * wallets directly (e.g. WaaS wallets created after email login).
   */
  initiallyConnected?: boolean;
  onAttached: ({
    walletAccount,
    fromChainId,
    fromTokenAddress,
    fromTokenDecimals,
    fromTokenSymbol,
    quotedFlow,
  }: {
    fromChainId: string | undefined;
    fromTokenAddress: string | undefined;
    fromTokenDecimals: number | undefined;
    fromTokenSymbol: string | undefined;
    quotedFlow: Flow;
    walletAccount: WalletAccount;
  }) => void;
  onBack: () => void;
  /** Called whenever the flow transitions to a new state (e.g. source_attached). */
  onFlowUpdated: (flow: Flow) => void;
  /** Called when the user logs out from the embedded wallet flow. */
  onLogout?: () => void;
};
