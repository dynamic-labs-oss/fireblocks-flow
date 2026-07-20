/**
 * Query param the payment link carries the encoded flow descriptor in.
 *
 * Must match the param the redcoast create-payment-link endpoint emits
 * (`buildPaymentLinkUrl` → `?flow=<base64url>`).
 */
export const FLOW_QUERY_PARAM = 'flow';

/** The flow descriptor packed into a payment link. */
export type DecodedPaymentLink = {
  environmentId: string;
  flowId: string;
};

const base64UrlToBase64 = (value: string): string => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const paddingLength = (4 - (base64.length % 4)) % 4;
  return base64 + '='.repeat(paddingLength);
};

/**
 * Decodes a payment link's `flow` query param into its `{ environmentId, flowId }`.
 *
 * The link is self-describing: the backend base64url-encodes the descriptor so any
 * payer app can decode it and drive the flow against the same environment it was
 * created in. Nothing secret is encoded — the session token is minted later at
 * `/source`. Returns `null` for anything that isn't a well-formed descriptor so the
 * caller can render a "broken link" state instead of throwing.
 *
 * @param encoded - The raw value of the `flow` query param
 * @returns The decoded descriptor, or `null` when malformed
 */
export const decodePaymentLink = (
  encoded: string,
): DecodedPaymentLink | null => {
  try {
    const json = atob(base64UrlToBase64(encoded));
    const parsed: unknown = JSON.parse(json);

    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }

    const { environmentId, flowId } = parsed as Record<string, unknown>;

    if (
      typeof environmentId !== 'string' ||
      environmentId.length === 0 ||
      typeof flowId !== 'string' ||
      flowId.length === 0
    ) {
      return null;
    }

    return { environmentId, flowId };
  } catch {
    return null;
  }
};
