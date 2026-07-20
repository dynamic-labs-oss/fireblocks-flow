const MAX_DECIMAL_PLACES = 6;

const TRAILING_DECIMAL_ZEROS_REGEX = /0+$/;

type FormatQuoteAmountParams = {
  decimals?: number;
  raw: string;
};

/**
 * Formats a raw quote amount string for display.
 * When `decimals` is provided, divides the raw integer value by
 * 10^decimals to convert from smallest token units to human-readable
 * form. Rounds to a sensible number of decimal places and adds
 * thousand separators for readability.
 */
export const formatQuoteAmount = ({
  raw,
  decimals,
}: FormatQuoteAmountParams): string => {
  const num = parseFloat(raw);

  if (Number.isNaN(num)) return raw;

  const adjusted = decimals !== undefined ? num / 10 ** decimals : num;

  const leadingDecimalZeros =
    adjusted > 0 && adjusted < 1
      ? Math.max(0, Math.ceil(-Math.log10(adjusted)) - 1)
      : 0;
  const decimalPlaces = Math.min(
    decimals ?? MAX_DECIMAL_PLACES,
    leadingDecimalZeros + MAX_DECIMAL_PLACES
  );
  const fixed = adjusted.toFixed(decimalPlaces);
  const [intPart, decimalPart] = fixed.split('.');
  const decPart = decimalPart?.replace(TRAILING_DECIMAL_ZEROS_REGEX, '');

  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return decPart ? `${withCommas}.${decPart}` : withCommas;
};
