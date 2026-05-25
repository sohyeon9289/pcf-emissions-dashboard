import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { parseActivitiesFromXlsx } from './excel-parser';

function makeXlsx(rows: (string | number | null)[][]): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '과제용 데이터');
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return out as ArrayBuffer;
}

describe('parseActivitiesFromXlsx', () => {
  it('parses Korean headers and detects type keys', () => {
    const buf = makeXlsx([
      ['', '일자(원본)', '활동 유형', '설명', '량', '단위'],
      ['', '2025-01-01', '전기', '한국전력', 110, 'kWh'],
      ['', '2025-02-01', '원소재', '플라스틱 1', 230, 'kg'],
      ['', '2025-03-01', '운송', '트럭', 41, 'ton-km'],
    ]);
    const out = parseActivitiesFromXlsx(buf);
    expect(out.totalRows).toBe(3);
    expect(out.validRows).toBe(3);
    expect(out.rows[0]!.typeKey).toBe('electricity_kepco');
    expect(out.rows[1]!.typeKey).toBe('material_plastic1');
    expect(out.rows[2]!.typeKey).toBe('transport_truck');
  });

  it('records errors for malformed rows', () => {
    const buf = makeXlsx([
      ['일자', '활동 유형', '설명', '량', '단위'],
      ['xxx-not-a-date', '전기', '한전', -5, ''],
    ]);
    const out = parseActivitiesFromXlsx(buf);
    expect(out.totalRows).toBe(1);
    expect(out.errorRows).toBe(1);
    expect(out.rows[0]!.errors.length).toBeGreaterThan(0);
  });

  it('returns empty preview when header missing', () => {
    const buf = makeXlsx([
      ['random'],
      ['data'],
    ]);
    const out = parseActivitiesFromXlsx(buf);
    expect(out.totalRows).toBe(0);
  });
});
