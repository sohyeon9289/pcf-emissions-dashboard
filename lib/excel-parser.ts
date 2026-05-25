/**
 * Excel(xlsx) 파서. 한글 과제 data.xlsx 형식을 그대로 임포트할 수 있어야 한다 (보너스).
 *
 * 예상 시트:
 *   "과제용 데이터" 또는 첫 번째 시트.
 * 헤더는 한글로 다음을 포함:
 *   "일자(원본)" | "일자" | "date"
 *   "활동 유형"  | "유형" | "type"
 *   "설명"      | "description"
 *   "량"        | "amount"
 *   "단위"      | "unit"
 *
 * 활동 유형(한글) -> typeKey 매핑:
 *   "전기"   + 설명에 "한국전력" -> electricity_kepco
 *   "원소재" + 설명에 "플라스틱 1" -> material_plastic1
 *   "원소재" + 설명에 "플라스틱 2" -> material_plastic2
 *   "운송"   + 설명에 "트럭"      -> transport_truck
 *   "디젤"   or "diesel"          -> diesel
 *   그 외에는 unknown 으로 분류 (사용자에게 표시).
 */
import * as XLSX from 'xlsx';

export type ImportRow = {
  rowIndex: number; // 시트 내 1-based 행 번호 (헤더 제외 후 1부터)
  date: string | null;
  rawType: string | null;
  description: string | null;
  amount: number | null;
  unit: string | null;
  typeKey: string | null;
  errors: string[];
};

export type ImportPreview = {
  sheetName: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  rows: ImportRow[];
};

const HEADER_ALIASES: Record<string, string[]> = {
  date: ['일자(원본)', '일자', 'date'],
  type: ['활동 유형', '유형', 'type'],
  description: ['설명', 'description', '품목'],
  amount: ['량', '수량', '활동량', 'amount', 'quantity'],
  unit: ['단위', 'unit'],
};

function findHeader(headers: string[], aliases: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = (headers[i] ?? '').toString().trim().toLowerCase();
    if (aliases.some((a) => h === a.toLowerCase())) return i;
  }
  return -1;
}

function detectTypeKey(rawType: string, description: string): string | null {
  const t = rawType.trim();
  const d = description.trim();
  if (t === '전기') {
    if (/한국전력|한전|kepco/i.test(d)) return 'electricity_kepco';
    return 'electricity_kepco';
  }
  if (t === '원소재' || t === '원재료') {
    if (/플라스틱\s*1|plastic\s*1/i.test(d)) return 'material_plastic1';
    if (/플라스틱\s*2|plastic\s*2/i.test(d)) return 'material_plastic2';
    return null;
  }
  if (t === '운송' || t === '운수') {
    if (/트럭|truck/i.test(d)) return 'transport_truck';
    return 'transport_truck';
  }
  if (/디젤|diesel/i.test(t) || /디젤|diesel/i.test(d)) return 'diesel';
  return null;
}

function normalizeDate(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    const y = `${parsed.y}`.padStart(4, '0');
    const m = `${parsed.m}`.padStart(2, '0');
    const d = `${parsed.d}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(s)) {
    const [y, m, d] = s.split('/');
    return `${y}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`;
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function parseActivitiesFromXlsx(buffer: ArrayBuffer | Buffer): ImportPreview {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName =
    wb.SheetNames.find((n) => /과제용|활동|activities/i.test(n)) ?? wb.SheetNames[0] ?? 'Sheet1';
  const sheet = wb.Sheets[sheetName];
  if (!sheet) {
    return { sheetName, totalRows: 0, validRows: 0, errorRows: 0, rows: [] };
  }
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: null });

  // 헤더 라인 자동 탐지 (첫 5행 안에서)
  let headerRowIdx = -1;
  let columns: { date: number; type: number; description: number; amount: number; unit: number } = {
    date: -1,
    type: -1,
    description: -1,
    amount: -1,
    unit: -1,
  };
  for (let i = 0; i < Math.min(matrix.length, 10); i++) {
    const row = matrix[i]!.map((c) => (c ?? '').toString());
    const dateIdx = findHeader(row, HEADER_ALIASES.date!);
    const typeIdx = findHeader(row, HEADER_ALIASES.type!);
    const amtIdx = findHeader(row, HEADER_ALIASES.amount!);
    if (dateIdx >= 0 && typeIdx >= 0 && amtIdx >= 0) {
      headerRowIdx = i;
      columns = {
        date: dateIdx,
        type: typeIdx,
        description: findHeader(row, HEADER_ALIASES.description!),
        amount: amtIdx,
        unit: findHeader(row, HEADER_ALIASES.unit!),
      };
      break;
    }
  }
  if (headerRowIdx === -1) {
    return { sheetName, totalRows: 0, validRows: 0, errorRows: 0, rows: [] };
  }

  const rows: ImportRow[] = [];
  for (let i = headerRowIdx + 1; i < matrix.length; i++) {
    const raw = matrix[i]!;
    const errors: string[] = [];
    const date = normalizeDate(raw[columns.date]);
    const rawType = (raw[columns.type] ?? '').toString().trim();
    const description = columns.description >= 0 ? (raw[columns.description] ?? '').toString().trim() : '';
    const amountRaw = raw[columns.amount];
    const amount = typeof amountRaw === 'number' ? amountRaw : Number(amountRaw);
    const unit = columns.unit >= 0 ? (raw[columns.unit] ?? '').toString().trim() : '';

    if (!date && !rawType && !amount) continue; // 완전 빈 행은 무시

    if (!date) errors.push('일자가 비어있거나 형식이 잘못되었습니다.');
    if (!rawType) errors.push('활동 유형이 비어있습니다.');
    if (!Number.isFinite(amount) || amount < 0) errors.push('활동량이 숫자가 아니거나 음수입니다.');
    if (!unit) errors.push('단위가 비어있습니다.');

    const typeKey = rawType ? detectTypeKey(rawType, description) : null;
    if (rawType && !typeKey) {
      errors.push(`알 수 없는 활동 유형: "${rawType}" / "${description}"`);
    }

    rows.push({
      rowIndex: i - headerRowIdx,
      date,
      rawType: rawType || null,
      description: description || null,
      amount: Number.isFinite(amount) ? amount : null,
      unit: unit || null,
      typeKey,
      errors,
    });
  }

  const errorRows = rows.filter((r) => r.errors.length > 0).length;
  return {
    sheetName,
    totalRows: rows.length,
    validRows: rows.length - errorRows,
    errorRows,
    rows,
  };
}
