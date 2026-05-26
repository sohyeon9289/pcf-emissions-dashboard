/**
 * 시드의 디젤(Scope 1) 샘플 활동을 다시 넣는 ad-hoc 스크립트.
 * 멱등성을 위해 같은 (회사, 날짜, 디젤) 조합이 이미 존재하면 건너뛴다.
 *
 * 실행: yarn db:restore-diesel
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DIESEL_ROWS: Array<{ date: string; description: string; amount: number; unit: string }> = [
  { date: '2025-01-01', description: 'Diesel - fleet', amount: 1200, unit: 'L' },
  { date: '2025-02-01', description: 'Diesel - fleet', amount: 1100, unit: 'L' },
  { date: '2025-03-01', description: 'Diesel - fleet', amount: 980, unit: 'L' },
];

async function main() {
  const targets = await prisma.company.findMany({
    where: { id: { in: ['cmp_acme', 'cmp_globex'] } },
  });
  if (targets.length === 0) {
    console.log('대상 회사(Acme/Globex)가 없습니다. 먼저 yarn db:seed 를 실행하세요.');
    return;
  }
  let inserted = 0;
  let skipped = 0;
  for (const company of targets) {
    for (const r of DIESEL_ROWS) {
      const amount = company.id === 'cmp_globex' ? r.amount * 0.7 : r.amount;
      const exists = await prisma.activity.findFirst({
        where: {
          companyId: company.id,
          typeKey: 'diesel',
          date: new Date(r.date),
        },
      });
      if (exists) {
        skipped += 1;
        continue;
      }
      await prisma.activity.create({
        data: {
          companyId: company.id,
          typeKey: 'diesel',
          date: new Date(r.date),
          description: r.description,
          amount,
          unit: r.unit,
          source: `restore (Scope 1 demo)`,
        },
      });
      inserted += 1;
    }
  }
  console.log(`✅ 디젤 활동 복원 완료 — 추가 ${inserted}건, 스킵 ${skipped}건`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
