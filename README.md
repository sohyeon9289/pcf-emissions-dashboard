# PCF Emissions Dashboard

탄소 활동 데이터(전기·원소재·운송 등)에 **배출계수(버전 관리)** 를 적용하여 **PCF(Product Carbon Footprint)** 를 자동 계산·시각화하는 인터랙티브 대시보드입니다.


## 실행 방법

```bash
# 1. 의존성 설치
yarn install            # 또는 npm install

# 2. PostgreSQL 실행 (Docker 사용 시)
yarn db:up              # docker compose up -d postgres

# 3. 마이그레이션 + 시드 (data.xlsx 데이터 + 시연용 회사 자동 주입)
yarn db:migrate && yarn db:seed

# 4. 빌드
yarn build

# 5. 실행 (http://localhost:3000)
yarn start
```

개발 모드: `yarn dev` · 한 줄 실행(웹 + DB 포함): `docker compose --profile full up`

OpenAPI/Swagger 문서: <http://localhost:3000/docs>

### 환경 변수 (`.env.example` 참고)

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://pcf:pcf@localhost:5432/pcf` | Postgres 접속 정보 |
| `NEXT_PUBLIC_SIMULATE_LATENCY` | `1` | Fake API 지연 시뮬레이션 on/off |
| `NEXT_PUBLIC_SIMULATE_FAILURE_RATE` | `0.15` | write 요청 무작위 실패 비율 (영문 과제 요구) |
| `NEXT_PUBLIC_SIMULATE_LATENCY_MIN_MS` / `MAX_MS` | `200` / `800` | 지연 범위 |

## 핵심 기능

- **Overview 대시보드** — KPI 카드(총 tCO2e·전월비), Scope 1/2/3 누적 시계열, Scope 도넛, 활동 유형 막대, 회사 랭킹.
- **활동 입력 폼** — 활동 유형 선택 시 단위·배출계수 자동 매핑, **실시간 예상 배출량 미리보기**, Zod 검증 에러 메시지, **낙관적 업데이트 + 실패 시 자동 롤백 + 토스트**.
- **배출계수 버전 관리** — 활동 일자 기준 자동 lookup, 새 버전 등록 시 이전 버전 `validTo` 트랜잭션 자동 갱신, 타임라인 시각화.
- **Excel 임포트** — 한글 헤더 자동 감지 (`일자(원본) / 활동 유형 / 설명 / 량 / 단위`), 미리보기 + 오류 행 하이라이트, 트랜잭션 일괄 저장. **`data.xlsx` 가공 없이 그대로 임포트 가능.**
- **게시물 CRUD** — 회사 + 월(YYYY-MM) 태깅. 영문 과제의 `createOrUpdatePost` 실패 시나리오 시연.
- **OpenAPI/Swagger** — 모든 REST 엔드포인트에 JSDoc 주석 + `/docs` 페이지에서 직접 호출.
- **반응형 + 다크모드 토큰** + 키보드 내비게이션 + ARIA label.

## 아키텍처 개요

```
┌── app/ (App Router)
│   ├── page.tsx                대시보드 Overview
│   ├── activities/             활동 입력 + 목록
│   ├── factors/                배출계수 + 버전 이력
│   ├── imports/                Excel 임포트
│   ├── companies/              회사 카드
│   ├── posts/                  게시물 CRUD
│   ├── docs/                   Swagger UI
│   └── api/
│       ├── companies, activity-types, activities, emission-factors,
│       │   emission-factors/[id]/versions, posts, import/excel, health, docs
│
├── features/
│   ├── pcf/                    calc, types, queries, mutations, api, useEmissions
│   └── filters/                URL search params 동기화 훅
│
├── components/
│   ├── layout/                 AppShell · Sidebar · Topbar · Providers
│   ├── ui/                     Button/Card/Input/Toast/Badge/Table/States/Skeleton
│   ├── charts/                 MonthlyTrend / ScopeDonut / TypeBar / KpiCard / CompanyRanking
│   ├── forms/                  ActivityForm / NewFactorVersionForm
│   ├── factors/                FactorVersionTimeline
│   └── filters/                FilterBar
│
├── lib/                        prisma, units, validation(zod), fake-latency, api-client, api-response, excel-parser, openapi, cn, domain
└── prisma/                     schema + 초기 마이그레이션 + seed
```

자세한 데이터 흐름/ERD/렌더 효율 노트는 [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) 참고.

## 도메인 모델링 (GHG Scope)

| 활동 유형 | Scope | 카테고리 |
| --- | --- | --- |
| 전기 (한국전력) | **Scope 2** | Purchased electricity (간접) |
| 원소재 (플라스틱 1·2) | **Scope 3** | Cat.1 Purchased goods & services |
| 운송 (트럭, 외주) | **Scope 3** | Cat.4 Upstream transportation |
| 디젤 (자체 차량) | **Scope 1** | Mobile combustion |

PCF 산식:

```
emissionsKg = convertToFactorDenominator(activity.amount, activity.unit, factor.denominator)
            × pickFactorVersion(factor, activity.date).value
```

단위 변환 매트릭스는 `lib/units.ts`에 격리되어 있고 13개의 Vitest 테스트로 보호됩니다. 단위가 호환되지 않으면 `UnitMismatchError`로 fail-fast 합니다.

## 평가 기준 충족 매핑

| 영역 | 비중 | 충족 방식 |
| --- | --- | --- |
| 도메인 이해 | 25% (한글) | Scope 1·2·3 분류, 단위 호환성 검사, 배출계수 버전 lookup, README 산식 명시 |
| 시스템 설계 | 30% (한글) | 모듈 경계(`features/*`), REST + OpenAPI, Prisma + 트랜잭션 임포트, Docker Compose, 환경 변수 |
| UX | 25% (양쪽) | 직관적 라벨·툴팁·단위 자동 표시·실시간 미리보기, 로딩·에러·empty 상태, 반응형, 키보드 내비게이션 |
| 논리적 설명 | 20% (한글) | README + `docs/DESIGN_DECISIONS.md` + `docs/AI_USAGE.md` |
| UI 엔지니어링 | 20% (영문) | layout/filter/data 상태 분리, 차트 메모이즈 + dynamic import, URL search params 동기화 |
| SW 엔지니어링 | 20% (영문) | 모듈성, 48개 단위/RTL 테스트, Postgres 트랜잭션, Zod 런타임 타입 안전성 |
| 코드 품질 | 10% (영문) | TS strict, ESLint 통과, phase별 의미 있는 커밋 히스토리 |

## 테스트

```bash
yarn test          # 48 tests (단위 + RTL)
yarn typecheck     # tsc --noEmit
yarn lint          # next lint
```

테스트 범위:
- `lib/units.test.ts` (13) — 단위 변환·호환성·포맷
- `features/pcf/calc.test.ts` (17) — factor 버전 선택·계산·집계·전월비
- `lib/validation.test.ts` (8) — Zod 스키마
- `lib/excel-parser.test.ts` (3) — 한글 헤더 자동 인식·오류 검출
- `components/ui/Button.test.tsx` (3) — 로딩/disabled/aria-busy
- `components/ui/States.test.tsx` (4) — Empty/Error/role=alert/재시도

## AI 사용 내역 / 작업 시간

- [`docs/AI_USAGE.md`](./docs/AI_USAGE.md) — 사용한 AI 도구·프롬프트·반영 결정.
- [`docs/DESIGN_DECISIONS.md`](./docs/DESIGN_DECISIONS.md) — 설계 근거 4개 + Trade-off 4개.
- **작업 소요 시간:** 약 8~10시간 (분석 1h · Bootstrap 1h · 도메인/시드 1h · 테스트 1h · API 1.5h · 디자인시스템 1h · 대시보드 1.5h · 업데이트 1h · 임포트/버전관리 1h · 문서·테스트 1h).

