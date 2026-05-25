import { describe, expect, it } from 'vitest';
import {
  ActivityCreateSchema,
  FactorVersionCreateSchema,
  PostUpsertSchema,
  zodToApiError,
} from './validation';

describe('ActivityCreateSchema', () => {
  it('accepts valid input', () => {
    const res = ActivityCreateSchema.safeParse({
      companyId: 'c1',
      typeKey: 'electricity_kepco',
      date: '2025-03-01',
      amount: 100,
      unit: 'kWh',
    });
    expect(res.success).toBe(true);
  });

  it('rejects malformed date', () => {
    const res = ActivityCreateSchema.safeParse({
      companyId: 'c1',
      typeKey: 'electricity_kepco',
      date: '2025/03/01',
      amount: 100,
      unit: 'kWh',
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      const apiErr = zodToApiError(res.error);
      expect(apiErr.fieldErrors?.date?.[0]).toMatch(/YYYY-MM-DD/);
    }
  });

  it('rejects negative amount', () => {
    const res = ActivityCreateSchema.safeParse({
      companyId: 'c1',
      typeKey: 'electricity_kepco',
      date: '2025-03-01',
      amount: -1,
      unit: 'kWh',
    });
    expect(res.success).toBe(false);
  });

  it('rejects missing companyId', () => {
    const res = ActivityCreateSchema.safeParse({
      companyId: '',
      typeKey: 'electricity_kepco',
      date: '2025-03-01',
      amount: 1,
      unit: 'kWh',
    });
    expect(res.success).toBe(false);
  });
});

describe('FactorVersionCreateSchema', () => {
  it('requires positive value', () => {
    const res = FactorVersionCreateSchema.safeParse({
      factorId: 'f1',
      value: 0,
      validFrom: '2025-01-01',
    });
    expect(res.success).toBe(false);
  });
  it('accepts null validTo', () => {
    const res = FactorVersionCreateSchema.safeParse({
      factorId: 'f1',
      value: 0.456,
      validFrom: '2025-01-01',
      validTo: null,
    });
    expect(res.success).toBe(true);
  });
});

describe('PostUpsertSchema', () => {
  it('rejects wrong dateTime format', () => {
    const res = PostUpsertSchema.safeParse({
      title: 'x',
      resourceUid: 'c1',
      dateTime: '2025-3',
      content: '',
    });
    expect(res.success).toBe(false);
  });
  it('accepts YYYY-MM', () => {
    const res = PostUpsertSchema.safeParse({
      title: 'x',
      resourceUid: 'c1',
      dateTime: '2025-03',
      content: '',
    });
    expect(res.success).toBe(true);
  });
});
