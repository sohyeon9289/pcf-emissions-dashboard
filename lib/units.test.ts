import { describe, expect, it } from 'vitest';
import {
  UnitMismatchError,
  convertToFactorDenominator,
  formatCO2e,
  kgToTonCO2e,
} from './units';

describe('convertToFactorDenominator', () => {
  it('returns same amount for identical units', () => {
    expect(convertToFactorDenominator(100, 'kWh', 'kWh')).toBe(100);
    expect(convertToFactorDenominator(500, 'kg', 'kg')).toBe(500);
    expect(convertToFactorDenominator(42, 'ton-km', 'ton-km')).toBe(42);
  });

  it('converts MWh to kWh', () => {
    expect(convertToFactorDenominator(2, 'MWh', 'kWh')).toBe(2000);
  });

  it('converts ton to kg', () => {
    expect(convertToFactorDenominator(1, 'ton', 'kg')).toBe(1000);
  });

  it('converts g to kg', () => {
    expect(convertToFactorDenominator(2500, 'g', 'kg')).toBeCloseTo(2.5, 6);
  });

  it('converts kg to ton when factor denominator is ton', () => {
    expect(convertToFactorDenominator(500, 'kg', 'ton')).toBeCloseTo(0.5, 6);
  });

  it('converts kL to L', () => {
    expect(convertToFactorDenominator(0.5, 'kL', 'L')).toBe(500);
  });

  it('throws when units are incompatible (kg -> kWh)', () => {
    expect(() => convertToFactorDenominator(10, 'kg', 'kWh')).toThrow(UnitMismatchError);
  });

  it('throws on unknown unit', () => {
    expect(() => convertToFactorDenominator(10, 'lightyear', 'kWh')).toThrow(UnitMismatchError);
  });
});

describe('kgToTonCO2e', () => {
  it('divides by 1000', () => {
    expect(kgToTonCO2e(2500)).toBe(2.5);
  });
});

describe('formatCO2e', () => {
  it('auto picks tCO2e for large values', () => {
    expect(formatCO2e(2500)).toContain('tCO2e');
  });
  it('auto picks kgCO2e for mid values', () => {
    expect(formatCO2e(2.5)).toContain('kgCO2e');
  });
  it('auto picks gCO2e for tiny values', () => {
    expect(formatCO2e(0.0005)).toContain('gCO2e');
  });
  it('forces unit when requested', () => {
    expect(formatCO2e(2500, { unit: 'kgCO2e' })).toContain('kgCO2e');
    expect(formatCO2e(2.5, { unit: 'tCO2e' })).toContain('tCO2e');
  });
});
