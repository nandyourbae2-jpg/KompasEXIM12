import { describe, it, expect } from 'vitest';
import {
  sortAndGroupAEJobs,
  normalizeVesselForSort,
  markVesselGrouping,
  getWeekSegment,
  getUrgencyLevel
} from './aeWorkboardSort';

describe('aeWorkboardSort Business Rules', () => {
  describe('normalizeVesselForSort', () => {
    it('normalizes vessel name by trimming and removing whitespace', () => {
      expect(normalizeVesselForSort('  Ever  Given ')).toBe('EVERGIVEN');
      expect(normalizeVesselForSort('')).toBe('');
      expect(normalizeVesselForSort(null)).toBe('');
    });
  });

  describe('getWeekSegment', () => {
    it('correctly classifies Monday to Thursday as midweek', () => {
      // 2026-09-07 is Monday
      expect(getWeekSegment('2026-09-07')).toBe('midweek');
      // 2026-09-08 is Tuesday
      expect(getWeekSegment('2026-09-08')).toBe('midweek');
      // 2026-09-09 is Wednesday
      expect(getWeekSegment('2026-09-09')).toBe('midweek');
      // 2026-09-10 is Thursday
      expect(getWeekSegment('2026-09-10')).toBe('midweek');
    });

    it('correctly classifies Friday to Sunday as endweek', () => {
      // 2026-09-11 is Friday
      expect(getWeekSegment('2026-09-11')).toBe('endweek');
      // 2026-09-12 is Saturday
      expect(getWeekSegment('2026-09-12')).toBe('endweek');
      // 2026-09-13 is Sunday
      expect(getWeekSegment('2026-09-13')).toBe('endweek');
    });

    it('returns incomplete when date is missing', () => {
      expect(getWeekSegment(null)).toBe('incomplete');
      expect(getWeekSegment(undefined)).toBe('incomplete');
    });
  });

  describe('getUrgencyLevel', () => {
    it('identifies overdue jobs correctly', () => {
      const now = new Date('2026-09-09T10:00:00');
      const job = { closing_docs: '2026-09-08', closing_docs_time: '12:00:00' };
      expect(getUrgencyLevel(job, now)).toBe('overdue');
    });

    it('identifies today jobs (<= 24 hours remaining)', () => {
      const now = new Date('2026-09-09T10:00:00');
      const job = { closing_docs: '2026-09-09', closing_docs_time: '18:00:00' };
      expect(getUrgencyLevel(job, now)).toBe('today');
    });

    it('identifies tomorrow jobs (<= 48 hours remaining)', () => {
      const now = new Date('2026-09-09T10:00:00');
      const job = { closing_docs: '2026-09-10', closing_docs_time: '18:00:00' };
      expect(getUrgencyLevel(job, now)).toBe('tomorrow');
    });

    it('identifies upcoming jobs (> 48 hours remaining)', () => {
      const now = new Date('2026-09-09T10:00:00');
      const job = { closing_docs: '2026-09-15', closing_docs_time: '12:00:00' };
      expect(getUrgencyLevel(job, now)).toBe('upcoming');
    });

    it('returns incomplete if closing_docs or closing_docs_time is missing', () => {
      expect(getUrgencyLevel({ closing_docs: '2026-09-09' })).toBe('incomplete');
      expect(getUrgencyLevel({ closing_docs_time: '12:00:00' })).toBe('incomplete');
    });
  });

  describe('sortAndGroupAEJobs', () => {
    it('separates complete and incomplete jobs', () => {
      const jobs = [
        { id: 1, invoice_no: 'INV-1', closing_docs: '2026-09-10', closing_docs_time: '12:00:00' },
        { id: 2, invoice_no: 'INV-2', closing_docs: null, closing_docs_time: '12:00:00' },
        { id: 3, invoice_no: 'INV-3', closing_docs: '2026-09-08', closing_docs_time: '10:00:00' }
      ];

      const { complete, incomplete } = sortAndGroupAEJobs(jobs);
      expect(complete.length).toBe(2);
      expect(incomplete.length).toBe(1);
      expect(incomplete[0].id).toBe(2);
      expect(complete[0].id).toBe(3); // Earlier closing date
      expect(complete[1].id).toBe(1);
    });
  });

  describe('markVesselGrouping', () => {
    it('marks consecutive jobs with identical normalized vessel and ETA', () => {
      const jobs = [
        { id: 1, vessel: 'COSCO SHIPPING', eta: '2026-09-20' },
        { id: 2, vessel: 'Cosco   Shipping', eta: '2026-09-20' },
        { id: 3, vessel: 'EVERGREEN', eta: '2026-09-20' }
      ];

      const marked = markVesselGrouping(jobs);
      expect(marked[0].isGroupedWithPrevious).toBe(false);
      expect(marked[1].isGroupedWithPrevious).toBe(true);
      expect(marked[2].isGroupedWithPrevious).toBe(false);
    });
  });
});
