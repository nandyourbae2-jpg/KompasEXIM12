import { describe, it, expect } from 'vitest';
import {
  calculateDuration,
  lookupDepoPrice,
  calcDepoCharges,
  validateManualInputs,
  computeDepoFull
} from './depoCalcEngine';

describe('depoCalcEngine Enterprise Business Rules', () => {
  describe('calculateDuration', () => {
    it('uses calendar days and counts Depo Arrival as Day 1 (diffDays + 1)', () => {
      // Same day arrival and depart: 1 day
      const res1 = calculateDuration('2026-09-01T08:00:00Z', '2026-09-01T20:00:00Z');
      expect(res1.error).toBeNull();
      expect(res1.totalDays).toBe(1);
      expect(res1.calcDay).toBe(1);

      // Next day arrival and depart: 2 calendar days
      const res2 = calculateDuration('2026-09-01T23:00:00Z', '2026-09-02T01:00:00Z');
      expect(res2.error).toBeNull();
      expect(res2.totalDays).toBe(2);
      expect(res2.calcDay).toBe(2);

      // 5-day span (e.g. 1st to 5th): 4 diff days + 1 = 5 calendar days
      const res3 = calculateDuration('2026-09-01T10:00:00Z', '2026-09-05T15:00:00Z');
      expect(res3.error).toBeNull();
      expect(res3.totalDays).toBe(5);
      expect(res3.calcDay).toBe(5);
    });

    it('calculates shifts as ceiling of total hours divided by 8', () => {
      // 8 hours: 1 shift
      const res1 = calculateDuration('2026-09-01T00:00:00Z', '2026-09-01T08:00:00Z');
      expect(res1.calcShift).toBe(1);

      // 9 hours: 2 shifts
      const res2 = calculateDuration('2026-09-01T00:00:00Z', '2026-09-01T09:00:00Z');
      expect(res2.calcShift).toBe(2);
    });

    it('returns error when depart is earlier than arrival', () => {
      const res = calculateDuration('2026-09-05T00:00:00Z', '2026-09-01T00:00:00Z');
      expect(res.error).toBe('Depo Depart tidak boleh lebih awal dari Depo Arrival');
      expect(res.calcDay).toBeNull();
    });

    it('returns error when dates are missing', () => {
      const res = calculateDuration(null, '2026-09-01T00:00:00Z');
      expect(res.error).toBe('Depo Arrival atau Depo Depart belum diisi');
    });
  });

  describe('lookupDepoPrice', () => {
    const mockDepoPrices = [
      { id: 1, param: "40' PBN", updatedAt: '2026-01-01', storage: 100000, monitoring: 50000, recooling: 20000, lolo: 250000 },
      { id: 2, param: "40' PBN", updatedAt: '2026-06-01', storage: 120000, monitoring: 60000, recooling: 25000, lolo: 300000 },
      { id: 3, param: "20' PSB", updatedAt: '2026-01-01', storage: 80000, monitoring: 40000, recooling: 15000, lolo: 200000 }
    ];

    it('matches newest effective price record <= arrival date', () => {
      // Arrival in March 2026 should get January 2026 price (id: 1)
      const res1 = lookupDepoPrice(mockDepoPrices, "40' PBN", '2026-03-15');
      expect(res1.error).toBeNull();
      expect(res1.price.id).toBe(1);
      expect(res1.price.storage).toBe(100000);

      // Arrival in July 2026 should get June 2026 price (id: 2)
      const res2 = lookupDepoPrice(mockDepoPrices, "40' PBN", '2026-07-01');
      expect(res2.error).toBeNull();
      expect(res2.price.id).toBe(2);
      expect(res2.price.storage).toBe(120000);
    });

    it('returns error if all prices are in the future', () => {
      const res = lookupDepoPrice(mockDepoPrices, "40' PBN", '2025-12-01');
      expect(res.price).toBeNull();
      expect(res.error).toContain('Semua harga berlaku di masa depan');
    });

    it('returns error if route not found in master data', () => {
      const res = lookupDepoPrice(mockDepoPrices, "45' UNKNOWN", '2026-07-01');
      expect(res.price).toBeNull();
      expect(res.error).toContain('Tambahkan di Master Data');
    });
  });

  describe('calcDepoCharges', () => {
    const priceRecord = { storage: 100000, monitoring: 50000, recooling: 20000, lolo: 250000 };

    it('correctly calculates total DPP from components', () => {
      // 3 days
      const charges = calcDepoCharges(3, 3, priceRecord);
      expect(charges.storage).toBe(300000);
      expect(charges.monitoring).toBe(150000);
      expect(charges.recooling).toBe(60000);
      expect(charges.lolo).toBe(250000); // Fixed
      expect(charges.dpp).toBe(300000 + 150000 + 60000 + 250000);
    });
  });

  describe('validateManualInputs', () => {
    it('flags negative values or non-numeric inputs', () => {
      expect(validateManualInputs(-1, 0)).toContain('Act Day tidak boleh negatif');
      expect(validateManualInputs(1, -2)).toContain('Act Shift tidak boleh negatif');
      expect(validateManualInputs('abc', 0)).toContain('Act Day harus berupa angka');
      expect(validateManualInputs(3, 3)).toEqual([]);
    });
  });
});
