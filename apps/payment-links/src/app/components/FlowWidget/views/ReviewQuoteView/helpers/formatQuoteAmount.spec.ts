import { formatQuoteAmount } from './formatQuoteAmount';

describe('formatQuoteAmount', () => {
  it('formats a whole number with thousand separators', () => {
    expect(formatQuoteAmount({ raw: '1500000' })).toBe('1,500,000');
  });

  it('truncates to 6 decimal places and strips trailing zeros', () => {
    expect(formatQuoteAmount({ raw: '0.001234567890123' })).toBe('0.001235');
  });

  it('strips trailing zeros after truncation', () => {
    expect(formatQuoteAmount({ raw: '1.500000000' })).toBe('1.5');
  });

  it('formats a small decimal value', () => {
    expect(formatQuoteAmount({ raw: '0.1' })).toBe('0.1');
  });

  it('formats a large number with decimals', () => {
    expect(formatQuoteAmount({ raw: '12345678.123' })).toBe('12,345,678.123');
  });

  it('returns the raw string when it cannot be parsed', () => {
    expect(formatQuoteAmount({ raw: 'not-a-number' })).toBe('not-a-number');
  });

  it('formats zero as "0"', () => {
    expect(formatQuoteAmount({ raw: '0' })).toBe('0');
  });

  it('handles a value with exactly 6 decimals', () => {
    expect(formatQuoteAmount({ raw: '1.123456' })).toBe('1.123456');
  });

  describe('with decimals', () => {
    it('divides raw token units by 10^decimals for USDC (6 decimals)', () => {
      expect(formatQuoteAmount({ decimals: 6, raw: '100020' })).toBe('0.10002');
    });

    it('divides raw token units by 10^decimals for an EVM native token', () => {
      expect(
        formatQuoteAmount({ decimals: 18, raw: '1000000000000000000' })
      ).toBe('1');
    });

    it('formats a large raw amount with decimals and thousand separators', () => {
      expect(formatQuoteAmount({ decimals: 6, raw: '1500000000' })).toBe(
        '1,500'
      );
    });

    it('handles zero decimals (no division)', () => {
      expect(formatQuoteAmount({ decimals: 0, raw: '42' })).toBe('42');
    });

    it('preserves trailing zeros in zero-decimal token amounts', () => {
      expect(formatQuoteAmount({ decimals: 0, raw: '100' })).toBe('100');
    });

    it('formats zero for zero-decimal token amounts', () => {
      expect(formatQuoteAmount({ decimals: 0, raw: '0' })).toBe('0');
    });

    it('preserves meaningful decimal places after division', () => {
      expect(formatQuoteAmount({ decimals: 6, raw: '123456789' })).toBe(
        '123.456789'
      );
    });

    it('formats the source amount from the reported flow quote', () => {
      expect(formatQuoteAmount({ decimals: 18, raw: '59004017576747' })).toBe(
        '0.000059004'
      );
    });

    it('formats the destination amount from the reported flow quote', () => {
      expect(formatQuoteAmount({ decimals: 6, raw: '103813' })).toBe(
        '0.103813'
      );
    });
  });
});
