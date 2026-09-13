import { describe, it, expect } from 'vitest';
import { fmtRupiah, fmtRupiahSigned } from './importCalc';

describe('importCalc utility', () => {
  describe('fmtRupiah', () => {
    it('should format numbers to Indonesian Rupiah string correctly', () => {
      expect(fmtRupiah(1250000)).toBe('1.250.000');
      expect(fmtRupiah(0)).toBe('0');
      expect(fmtRupiah(-500)).toBe('-500');
    });

    it('should handle null, undefined, or invalid inputs as 0', () => {
      expect(fmtRupiah(null)).toBe('0');
      expect(fmtRupiah(undefined)).toBe('0');
      expect(fmtRupiah('invalid')).toBe('0');
    });
  });

  describe('fmtRupiahSigned', () => {
    it('should prepend Rp and handle negatives correctly', () => {
      expect(fmtRupiahSigned(1250000)).toBe('Rp 1.250.000');
      expect(fmtRupiahSigned(0)).toBe('Rp 0');
      expect(fmtRupiahSigned(-500)).toBe('Rp 500 (minus)');
    });

    it('should handle invalid inputs as Rp 0', () => {
      expect(fmtRupiahSigned(null)).toBe('Rp 0');
      expect(fmtRupiahSigned('abc')).toBe('Rp 0');
    });
  });


});
