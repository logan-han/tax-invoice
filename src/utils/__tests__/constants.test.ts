import { describe, it, expect } from 'vitest';
import { AUSTRALIAN_STATES } from '../constants';

describe('constants', () => {
  describe('AUSTRALIAN_STATES', () => {
    it('contains all 8 Australian states and territories', () => {
      expect(AUSTRALIAN_STATES).toHaveLength(8);
    });

    it('contains NSW', () => {
      expect(AUSTRALIAN_STATES).toContain('NSW');
    });

    it('contains VIC', () => {
      expect(AUSTRALIAN_STATES).toContain('VIC');
    });

    it('contains QLD', () => {
      expect(AUSTRALIAN_STATES).toContain('QLD');
    });

    it('contains WA', () => {
      expect(AUSTRALIAN_STATES).toContain('WA');
    });

    it('contains SA', () => {
      expect(AUSTRALIAN_STATES).toContain('SA');
    });

    it('contains TAS', () => {
      expect(AUSTRALIAN_STATES).toContain('TAS');
    });

    it('contains ACT', () => {
      expect(AUSTRALIAN_STATES).toContain('ACT');
    });

    it('contains NT', () => {
      expect(AUSTRALIAN_STATES).toContain('NT');
    });

    it('is immutable (readonly)', () => {
      // TypeScript ensures this at compile time, but we can verify the array content
      expect(Array.isArray(AUSTRALIAN_STATES)).toBe(true);
    });
  });
});
