/**
 * 단위 변환 & 호환성 검사
 *
 * 핵심 원칙:
 *  - 모든 활동 단위(activity unit)는 "정규 단위(canonical unit)"로 변환되어
 *    배출계수의 분모(denominator)와 일치해야 한다.
 *  - 정규 단위와 호환되지 않는 경우 `null` 또는 `UnitMismatchError`를 반환한다.
 *
 * 호환 매트릭스 (활동 단위 → 정규 단위, multiplier):
 *  - kWh: kWh(1), MWh(1000)
 *  - kg : kg(1), ton(1000), g(0.001)
 *  - ton-km: ton-km(1)
 *  - L : L(1), kL(1000), mL(0.001)
 *  - kgCO2e: kgCO2e(1), tCO2e(1000), gCO2e(0.001)
 */

export type CanonicalUnit = 'kWh' | 'kg' | 'ton-km' | 'L' | 'kgCO2e';

export const UNIT_FAMILY: Record<string, { canonical: CanonicalUnit; multiplier: number }> = {
  // 에너지
  kWh: { canonical: 'kWh', multiplier: 1 },
  MWh: { canonical: 'kWh', multiplier: 1000 },
  // 질량
  kg: { canonical: 'kg', multiplier: 1 },
  ton: { canonical: 'kg', multiplier: 1000 },
  t: { canonical: 'kg', multiplier: 1000 },
  g: { canonical: 'kg', multiplier: 0.001 },
  // 운송 일량
  'ton-km': { canonical: 'ton-km', multiplier: 1 },
  tkm: { canonical: 'ton-km', multiplier: 1 },
  // 부피
  L: { canonical: 'L', multiplier: 1 },
  l: { canonical: 'L', multiplier: 1 },
  kL: { canonical: 'L', multiplier: 1000 },
  mL: { canonical: 'L', multiplier: 0.001 },
  // CO2e (계산 결과/입력)
  kgCO2e: { canonical: 'kgCO2e', multiplier: 1 },
  tCO2e: { canonical: 'kgCO2e', multiplier: 1000 },
  gCO2e: { canonical: 'kgCO2e', multiplier: 0.001 },
};

export class UnitMismatchError extends Error {
  constructor(
    public readonly activityUnit: string,
    public readonly expectedDenominator: string,
  ) {
    super(
      `단위 불일치: 활동 단위 "${activityUnit}" 는 배출계수 분모 "${expectedDenominator}" 와 호환되지 않습니다.`,
    );
    this.name = 'UnitMismatchError';
  }
}

/**
 * 활동 단위(amount, unit)를 배출계수의 분모 단위로 변환.
 * @returns 변환된 amount (정규 단위 기준), 불가능하면 throw.
 */
export function convertToFactorDenominator(
  amount: number,
  unit: string,
  factorDenominator: string,
): number {
  const family = UNIT_FAMILY[unit];
  const targetFamily = UNIT_FAMILY[factorDenominator];
  if (!family) {
    throw new UnitMismatchError(unit, factorDenominator);
  }
  if (!targetFamily) {
    throw new UnitMismatchError(unit, factorDenominator);
  }
  if (family.canonical !== targetFamily.canonical) {
    throw new UnitMismatchError(unit, factorDenominator);
  }
  // 정규 단위로 변환 후, 다시 분모 단위로 환산.
  const inCanonical = amount * family.multiplier;
  return inCanonical / targetFamily.multiplier;
}

/**
 * kgCO2e -> tCO2e 변환.
 */
export function kgToTonCO2e(kg: number): number {
  return kg / 1000;
}

/**
 * 사람 친화적 표시: 0.001 미만은 g, 1 미만은 kg, 그 이상은 t.
 */
export function formatCO2e(kg: number, opts?: { unit?: 'auto' | 'kgCO2e' | 'tCO2e' }): string {
  const unit = opts?.unit ?? 'auto';
  if (!Number.isFinite(kg)) return '-';
  if (unit === 'tCO2e') return `${(kg / 1000).toFixed(3)} tCO2e`;
  if (unit === 'kgCO2e') return `${kg.toFixed(2)} kgCO2e`;
  if (Math.abs(kg) >= 1000) return `${(kg / 1000).toFixed(2)} tCO2e`;
  if (Math.abs(kg) >= 1) return `${kg.toFixed(2)} kgCO2e`;
  return `${(kg * 1000).toFixed(2)} gCO2e`;
}

export function formatAmount(amount: number, unit: string): string {
  if (!Number.isFinite(amount)) return '-';
  const v = amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return `${v} ${unit}`;
}
