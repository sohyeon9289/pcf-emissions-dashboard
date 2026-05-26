/**
 * Seed data
 *
 * - 한글 과제 data.xlsx 의 33행 활동 데이터 (전기/원소재/운송)
 * - 영문 HanaLoop 과제의 회사 (Acme Corp, Globex) 추가
 * - 배출계수 4종 + 초기 버전(v1) + 시연용 v2 일부
 * - GHG Scope 분류:
 *     전기 → SCOPE_2 (구매 전력, 간접)
 *     원소재 → SCOPE_3 (Cat.1: Purchased goods & services)
 *     운송  → SCOPE_3 (Cat.4: Upstream transportation)
 *     디젤/가솔린/LPG → SCOPE_1 (직접 연소, 영문 과제 시연용)
 */
import { PrismaClient, GhgScope } from '@prisma/client';

const prisma = new PrismaClient();

type ActivityRow = {
  date: string; // YYYY-MM-DD
  typeKey: string;
  description: string;
  amount: number;
  unit: string;
};

type VersionRow = {
  version: number;
  value: number;
  validFrom: string;
  validTo: string | null;
  note?: string;
};

const KR_ACTIVITY_DATA: ActivityRow[] = [
  // 전기 (한국전력)
  { date: '2025-01-01', typeKey: 'electricity_kepco', description: '한국전력', amount: 110, unit: 'kWh' },
  { date: '2025-02-01', typeKey: 'electricity_kepco', description: '한국전력', amount: 112, unit: 'kWh' },
  { date: '2025-03-01', typeKey: 'electricity_kepco', description: '한국전력', amount: 115, unit: 'kWh' },
  { date: '2025-04-01', typeKey: 'electricity_kepco', description: '한국전력', amount: 130, unit: 'kWh' },
  { date: '2025-05-01', typeKey: 'electricity_kepco', description: '한국전력', amount: 120, unit: 'kWh' },
  { date: '2025-06-01', typeKey: 'electricity_kepco', description: '한국전력', amount: 110, unit: 'kWh' },
  { date: '2025-07-01', typeKey: 'electricity_kepco', description: '한국전력', amount: 120, unit: 'kWh' },
  { date: '2025-08-01', typeKey: 'electricity_kepco', description: '한국전력', amount: 111, unit: 'kWh' },
  { date: '2025-05-01', typeKey: 'electricity_kepco', description: '한국전력', amount: 101, unit: 'kWh' },
  // 원소재 플라스틱 1
  { date: '2025-01-01', typeKey: 'material_plastic1', description: '플라스틱 1', amount: 230, unit: 'kg' },
  { date: '2025-02-01', typeKey: 'material_plastic1', description: '플라스틱 1', amount: 340, unit: 'kg' },
  { date: '2025-03-01', typeKey: 'material_plastic1', description: '플라스틱 1', amount: 430, unit: 'kg' },
  { date: '2025-04-01', typeKey: 'material_plastic1', description: '플라스틱 1', amount: 510, unit: 'kg' },
  { date: '2025-05-01', typeKey: 'material_plastic1', description: '플라스틱 1', amount: 424, unit: 'kg' },
  { date: '2025-06-01', typeKey: 'material_plastic1', description: '플라스틱 1', amount: 450, unit: 'kg' },
  { date: '2025-07-01', typeKey: 'material_plastic1', description: '플라스틱 1', amount: 340, unit: 'kg' },
  { date: '2025-08-01', typeKey: 'material_plastic1', description: '플라스틱 1', amount: 230, unit: 'kg' },
  { date: '2025-05-01', typeKey: 'material_plastic1', description: '플라스틱 1', amount: 232, unit: 'kg' },
  // 원소재 플라스틱 2
  { date: '2025-03-01', typeKey: 'material_plastic2', description: '플라스틱 2', amount: 23, unit: 'kg' },
  { date: '2025-05-01', typeKey: 'material_plastic2', description: '플라스틱 2', amount: 40, unit: 'kg' },
  { date: '2025-07-01', typeKey: 'material_plastic2', description: '플라스틱 2', amount: 43, unit: 'kg' },
  // 운송 (트럭)
  { date: '2025-01-01', typeKey: 'transport_truck', description: '트럭', amount: 41, unit: 'ton-km' },
  { date: '2025-02-01', typeKey: 'transport_truck', description: '트럭', amount: 211, unit: 'ton-km' },
  { date: '2025-03-01', typeKey: 'transport_truck', description: '트럭', amount: 123, unit: 'ton-km' },
  { date: '2025-04-01', typeKey: 'transport_truck', description: '트럭', amount: 42, unit: 'ton-km' },
  { date: '2025-05-01', typeKey: 'transport_truck', description: '트럭', amount: 123, unit: 'ton-km' },
  { date: '2025-06-01', typeKey: 'transport_truck', description: '트럭', amount: 123, unit: 'ton-km' },
  { date: '2025-07-01', typeKey: 'transport_truck', description: '트럭', amount: 41, unit: 'ton-km' },
  { date: '2025-08-01', typeKey: 'transport_truck', description: '트럭', amount: 123, unit: 'ton-km' },
  { date: '2025-05-01', typeKey: 'transport_truck', description: '트럭', amount: 12, unit: 'ton-km' },
];

// 영문 과제 시연용 추가 활동 (Acme Corp - US, Globex - DE)
const EN_ACTIVITY_SAMPLES: ActivityRow[] = [
  { date: '2025-01-01', typeKey: 'diesel', description: 'Diesel - fleet', amount: 1200, unit: 'L' },
  { date: '2025-02-01', typeKey: 'diesel', description: 'Diesel - fleet', amount: 1100, unit: 'L' },
  { date: '2025-03-01', typeKey: 'diesel', description: 'Diesel - fleet', amount: 980, unit: 'L' },
  { date: '2025-04-01', typeKey: 'electricity_kepco', description: '구매 전력', amount: 5400, unit: 'kWh' },
  { date: '2025-05-01', typeKey: 'electricity_kepco', description: '구매 전력', amount: 5100, unit: 'kWh' },
  { date: '2025-06-01', typeKey: 'electricity_kepco', description: '구매 전력', amount: 5300, unit: 'kWh' },
  { date: '2025-07-01', typeKey: 'transport_truck', description: 'Outbound logistics', amount: 820, unit: 'ton-km' },
];

async function main() {
  console.log('🌱 Seeding database...');

  // 1) Countries
  const countries = [
    { code: 'KR', name: '대한민국' },
    { code: 'US', name: 'United States' },
    { code: 'DE', name: 'Germany' },
  ];
  for (const c of countries) {
    await prisma.country.upsert({ where: { code: c.code }, create: c, update: c });
  }

  // 2) ActivityTypes
  const activityTypes = [
    {
      key: 'electricity_kepco',
      label: '전기 (한국전력)',
      scope: GhgScope.SCOPE_2,
      category: 'Purchased electricity',
      defaultUnit: 'kWh',
      description: '한전 전력 사용 (간접 배출 - Scope 2)',
    },
    {
      key: 'material_plastic1',
      label: '원소재 - 플라스틱 1',
      scope: GhgScope.SCOPE_3,
      category: 'Cat.1 Purchased goods & services',
      defaultUnit: 'kg',
      description: '플라스틱 원재료 1종 (가치사슬 업스트림 - Scope 3)',
    },
    {
      key: 'material_plastic2',
      label: '원소재 - 플라스틱 2',
      scope: GhgScope.SCOPE_3,
      category: 'Cat.1 Purchased goods & services',
      defaultUnit: 'kg',
      description: '플라스틱 원재료 2종',
    },
    {
      key: 'transport_truck',
      label: '운송 - 트럭',
      scope: GhgScope.SCOPE_3,
      category: 'Cat.4 Upstream transportation',
      defaultUnit: 'ton-km',
      description: '외주 화물 트럭 운송',
    },
    {
      key: 'diesel',
      label: '디젤 (직접 연소)',
      scope: GhgScope.SCOPE_1,
      category: 'Mobile combustion',
      defaultUnit: 'L',
      description: '자체 보유 차량 디젤 연료 (직접 배출 - Scope 1)',
    },
  ];
  for (const t of activityTypes) {
    await prisma.activityType.upsert({ where: { key: t.key }, create: t, update: t });
  }

  // 3) Emission Factors + initial versions
  // factor 단위는 kgCO2e / <denominator>
  const factors: Array<{
    typeKey: string;
    description: string;
    unit: string;
    numerator: string;
    denominator: string;
    source: string;
    versions: VersionRow[];
  }> = [
    {
      typeKey: 'electricity_kepco',
      description: '전기 (한국전력 기본값)',
      unit: 'kgCO2e/kWh',
      numerator: 'kgCO2e',
      denominator: 'kWh',
      source: '한국전력 / 환경부 (기본값)',
      versions: [
        { version: 1, value: 0.459, validFrom: '2023-01-01', validTo: '2024-12-31', note: '구버전 (2023~2024)' },
        { version: 2, value: 0.456, validFrom: '2025-01-01', validTo: null, note: '현행 (2025~)' },
      ],
    },
    {
      typeKey: 'material_plastic1',
      description: '원소재 (플라스틱 1)',
      unit: 'kgCO2e/kg',
      numerator: 'kgCO2e',
      denominator: 'kg',
      source: 'IPCC AR6 (가공)',
      versions: [{ version: 1, value: 2.3, validFrom: '2023-01-01', validTo: null }],
    },
    {
      typeKey: 'material_plastic2',
      description: '원소재 (플라스틱 2)',
      unit: 'kgCO2e/kg',
      numerator: 'kgCO2e',
      denominator: 'kg',
      source: 'IPCC AR6 (가공)',
      versions: [{ version: 1, value: 3.2, validFrom: '2023-01-01', validTo: null }],
    },
    {
      typeKey: 'transport_truck',
      description: '운송 (트럭)',
      unit: 'kgCO2e/ton-km',
      numerator: 'kgCO2e',
      denominator: 'ton-km',
      source: 'DEFRA',
      versions: [{ version: 1, value: 3.5, validFrom: '2023-01-01', validTo: null }],
    },
    {
      typeKey: 'diesel',
      description: '디젤 연료 연소',
      unit: 'kgCO2e/L',
      numerator: 'kgCO2e',
      denominator: 'L',
      source: 'IPCC AR6',
      versions: [{ version: 1, value: 2.68, validFrom: '2023-01-01', validTo: null }],
    },
  ];

  for (const f of factors) {
    const created = await prisma.emissionFactor.upsert({
      where: { typeKey: f.typeKey },
      create: {
        typeKey: f.typeKey,
        description: f.description,
        unit: f.unit,
        numerator: f.numerator,
        denominator: f.denominator,
        source: f.source,
      },
      update: {
        description: f.description,
        unit: f.unit,
        numerator: f.numerator,
        denominator: f.denominator,
        source: f.source,
      },
    });
    for (const v of f.versions) {
      await prisma.factorVersion.upsert({
        where: { factorId_version: { factorId: created.id, version: v.version } },
        create: {
          factorId: created.id,
          version: v.version,
          value: v.value,
          validFrom: new Date(v.validFrom),
          validTo: v.validTo ? new Date(v.validTo) : null,
          note: v.note,
        },
        update: {
          value: v.value,
          validFrom: new Date(v.validFrom),
          validTo: v.validTo ? new Date(v.validTo) : null,
          note: v.note,
        },
      });
    }
  }

  // 4) Companies
  const hanaCorp = await prisma.company.upsert({
    where: { id: 'cmp_hana' },
    create: {
      id: 'cmp_hana',
      name: '하나전자',
      countryCode: 'KR',
      description: ' ',
    },
    update: {},
  });
  const acme = await prisma.company.upsert({
    where: { id: 'cmp_acme' },
    create: {
      id: 'cmp_acme',
      name: 'Acme Corp',
      countryCode: 'US',
      description: ' ',
    },
    update: {},
  });
  const globex = await prisma.company.upsert({
    where: { id: 'cmp_globex' },
    create: {
      id: 'cmp_globex',
      name: 'Globex',
      countryCode: 'DE',
      description: ' ',
    },
    update: {},
  });

  // 5) Activities — 멱등성을 위해 회사별로 한 번 비우고 다시 채움
  await prisma.activity.deleteMany({ where: { companyId: { in: [hanaCorp.id, acme.id, globex.id] } } });

  for (const a of KR_ACTIVITY_DATA) {
    await prisma.activity.create({
      data: {
        companyId: hanaCorp.id,
        typeKey: a.typeKey,
        date: new Date(a.date),
        description: a.description,
        amount: a.amount,
        unit: a.unit,
        source: 'data.xlsx (CT-045)',
      },
    });
  }
  for (const a of EN_ACTIVITY_SAMPLES) {
    await prisma.activity.create({
      data: {
        companyId: acme.id,
        typeKey: a.typeKey,
        date: new Date(a.date),
        description: a.description,
        amount: a.amount,
        unit: a.unit,
        source: 'seed (Acme demo)',
      },
    });
  }
  // Globex - 살짝 변형된 데이터
  for (const a of EN_ACTIVITY_SAMPLES) {
    await prisma.activity.create({
      data: {
        companyId: globex.id,
        typeKey: a.typeKey,
        date: new Date(a.date),
        description: a.description,
        amount: a.amount * 0.7,
        unit: a.unit,
        source: 'seed (Globex demo)',
      },
    });
  }

  // 6) Posts
  await prisma.post.deleteMany({});
  await prisma.post.createMany({
    data: [
      {
        id: 'post_1',
        title: '2025년 1분기 지속가능성 리포트',
        resourceUid: hanaCorp.id,
        dateTime: '2025-03',
        content:
          '1분기 누적 배출량과 전년 동기 대비 변화를 정리했습니다. 원소재 사용량 증가로 Scope 3가 소폭 상승했습니다.',
      },
      {
        id: 'post_2',
        title: '운송 배출 절감 계획',
        resourceUid: hanaCorp.id,
        dateTime: '2025-05',
        content: '외주 트럭 적재율 개선과 통합 배차로 ton-km 기준 8% 절감 목표.',
      },
      {
        id: 'post_3',
        title: 'Quarterly CO2 update',
        resourceUid: acme.id,
        dateTime: '2025-02',
        content: 'Acme Corp Q1 emission summary and reduction roadmap.',
      },
    ],
  });

  console.log('✅ Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
