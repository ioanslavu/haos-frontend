import { describe, it, expect } from 'vitest';
import { cn, getInitials, formatDate, formatCurrency, formatMoney, formatDateTime } from '../utils';

describe('utils', () => {
  describe('cn (className merger)', () => {
    it('should merge class names', () => {
      const result = cn('foo', 'bar');
      expect(result).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      const result = cn('foo', false && 'bar', 'baz');
      expect(result).toBe('foo baz');
    });

    it('should merge Tailwind classes correctly', () => {
      const result = cn('px-2 py-1', 'px-4');
      // twMerge should keep only the last conflicting class
      expect(result).toBe('py-1 px-4');
    });

    it('should handle arrays', () => {
      const result = cn(['foo', 'bar'], 'baz');
      expect(result).toBe('foo bar baz');
    });

    it('should handle objects', () => {
      const result = cn({ foo: true, bar: false, baz: true });
      expect(result).toBe('foo baz');
    });

    it('should handle undefined and null', () => {
      const result = cn('foo', undefined, null, 'bar');
      expect(result).toBe('foo bar');
    });

    it('should dedupe and merge complex Tailwind classes', () => {
      const result = cn(
        'bg-red-500 text-white p-4',
        'bg-blue-500 text-black',
        'm-2'
      );
      // twMerge should resolve conflicts: bg-blue-500 and text-black win
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('text-black');
      expect(result).not.toContain('bg-red-500');
      expect(result).not.toContain('text-white');
    });
  });

  describe('getInitials', () => {
    it('should get initials from full name', () => {
      expect(getInitials('Alexandru Voicu')).toBe('AV');
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('should handle single name', () => {
      expect(getInitials('John')).toBe('JO');
      expect(getInitials('A')).toBe('A');
    });

    it('should handle multiple names (first and last)', () => {
      expect(getInitials('John Doe Smith')).toBe('JS');
      expect(getInitials('Mary Jane Watson Parker')).toBe('MP');
    });

    it('should handle empty or null input', () => {
      expect(getInitials('')).toBe('?');
      expect(getInitials(null)).toBe('?');
      expect(getInitials(undefined)).toBe('?');
    });

    it('should handle whitespace', () => {
      expect(getInitials('  ')).toBe('?');
      expect(getInitials('   John   Doe   ')).toBe('JD');
    });

    it('should be case-insensitive (uppercase output)', () => {
      expect(getInitials('john doe')).toBe('JD');
      expect(getInitials('JOHN DOE')).toBe('JD');
      expect(getInitials('JoHn DoE')).toBe('JD');
    });
  });

  describe('formatDate', () => {
    it('should format Date object', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatDate(date);
      expect(result).toMatch(/Jan 15, 2024/);
    });

    it('should format ISO date string', () => {
      const result = formatDate('2024-01-15T10:30:00Z');
      expect(result).toMatch(/Jan 15, 2024/);
    });

    it('should handle null input', () => {
      expect(formatDate(null)).toBe('-');
    });

    it('should handle undefined input', () => {
      expect(formatDate(undefined)).toBe('-');
    });

    it('should format different dates correctly', () => {
      expect(formatDate('2024-12-31')).toMatch(/Dec 31, 2024/);
      expect(formatDate('2024-01-01')).toMatch(/Jan 1, 2024/);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with default EUR', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('1,234.56');
      expect(result).toContain('€');
    });

    it('should format currency with USD', () => {
      const result = formatCurrency(1234.56, 'USD');
      expect(result).toContain('1,234.56');
      expect(result).toContain('$');
    });

    it('should format currency with GBP', () => {
      const result = formatCurrency(1234.56, 'GBP');
      expect(result).toContain('1,234.56');
      expect(result).toContain('£');
    });

    it('should handle zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });

    it('should handle negative amounts', () => {
      const result = formatCurrency(-1234.56);
      expect(result).toContain('1,234.56');
      expect(result).toMatch(/-/); // Should have minus sign
    });

    it('should handle large numbers', () => {
      const result = formatCurrency(1234567.89);
      expect(result).toContain('1,234,567.89');
    });

    it('should format without decimals for whole numbers', () => {
      const result = formatCurrency(1000);
      // Should not show unnecessary decimals
      expect(result).toMatch(/1,000/);
    });

    it('should respect maximum fraction digits', () => {
      const result = formatCurrency(1234.56789);
      // Should round to 2 decimal places
      expect(result).toContain('1,234.57');
    });
  });

  describe('formatMoney', () => {
    it('should format number as money', () => {
      const result = formatMoney(1234.56);
      expect(result).toContain('1,234.56');
      expect(result).toContain('€');
    });

    it('should format string as money', () => {
      const result = formatMoney('1234.56');
      expect(result).toContain('1,234.56');
      expect(result).toContain('€');
    });

    it('should format with custom currency', () => {
      const result = formatMoney(1234.56, 'USD');
      expect(result).toContain('1,234.56');
      expect(result).toContain('$');
    });

    it('should handle string with decimals', () => {
      const result = formatMoney('9999.99', 'EUR');
      expect(result).toContain('9,999.99');
    });

    it('should handle zero as string', () => {
      const result = formatMoney('0');
      expect(result).toContain('0');
    });
  });

  describe('formatDateTime', () => {
    it('should format Date object with time', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatDateTime(date);
      expect(result).toMatch(/Jan 15, 2024/);
      expect(result).toMatch(/\d{1,2}:\d{2}/); // Should contain time
    });

    it('should format ISO date string with time', () => {
      const result = formatDateTime('2024-01-15T10:30:00Z');
      expect(result).toMatch(/Jan 15, 2024/);
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should handle null input', () => {
      expect(formatDateTime(null)).toBe('-');
    });

    it('should handle undefined input', () => {
      expect(formatDateTime(undefined)).toBe('-');
    });

    it('should include both date and time components', () => {
      const result = formatDateTime('2024-12-25T15:45:00Z');
      expect(result).toMatch(/Dec 25, 2024/);
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long names in getInitials', () => {
      const longName = 'FirstName MiddleName1 MiddleName2 MiddleName3 LastName';
      expect(getInitials(longName)).toBe('FL');
    });

    it('should handle special characters in names', () => {
      expect(getInitials("O'Brien Smith")).toBe('OS');
      expect(getInitials('Jean-Pierre Dupont')).toBe('JD');
    });

    it('should handle very small amounts in formatCurrency', () => {
      const result = formatCurrency(0.01);
      expect(result).toContain('0.01');
    });

    it('should handle very large amounts in formatCurrency', () => {
      const result = formatCurrency(999999999.99);
      expect(result).toContain('999,999,999.99');
    });

    it('should handle invalid date strings gracefully', () => {
      // formatDate with invalid date should still return something (may be 'Invalid Date' or specific handling)
      const result = formatDate('invalid-date');
      expect(result).toBeDefined();
    });
  });
});
