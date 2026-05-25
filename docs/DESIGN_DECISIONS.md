# Design Decisions

본 문서는 채용과제 평가의 **논리적 설명(20%)** 항목을 위해 주요 설계 결정과 그 trade-off 를 정리한 것입니다.

---

## 결정 1 — 두 채용과제를 단일 앱으로 통합

**왜:** 한글 과제는 PCF 활동 데이터(전기·원소재·운송) × 배출계수 → 시각화, 영문 과제는 회사·게시물·Fake API. 두 도메인은 거의 동일한 GHG 회계 모델을 다른 입장에서 다루므로 한 앱에서 자연스럽게 흡수할 수 있다.

**적용:** 한글 과제의 `Activity / EmissionFactor` 를 메인 데이터로 두고, 영문 과제의 `Company / Country / Post` 를 회사 시나리오 + 운영 메모로 추가했다. 영문 과제가 요구하는 **Fake API의 지연·실패 시뮬레이션** 은 클라이언트 mutation 훅 레벨에서 흡수하여 두 과제 모두 충족.

**Trade-off:** 한 가지 도메인에 집중하지 않아 폭이 넓어지고 깊이가 얕아질 위험. 이를 보완하기 위해 PCF 계산 정확성·단위 호환성·배출계수 버전 관리·트랜잭션 임포트 같은 코어 도메인에 단위 테스트를 집중 배치했다.

---

## 결정 2 — Postgres + Prisma + Docker (in-memory fake API 대신)

**왜:** 한글 과제 보너스 가점(Excel 임포트·배출계수 버전 관리)과 영문 과제 평가(데이터 무결성·트랜잭션·실패 복구)를 동시에 잡으려면 실제 DB 가 필요하다.

**적용:** `docker compose up -d postgres` 한 줄로 시작 가능. `prisma migrate deploy` 로 초기 마이그레이션, `prisma db seed` 로 한글 data.xlsx 33행 + 영문 회사·게시물을 자동 주입.

**Trade-off:** 평가자 환경에 Docker 설치를 요구한다. 이를 보완하기 위해 README 5단계 안에 `yarn db:up` 을 명시하고, `docker compose --profile full up` 으로 웹 컨테이너까지 한 줄 실행 옵션 제공.

---

## 결정 3 — URL search params 를 필터 SSOT 로 사용 (Zustand store 대신)

**왜:** 영문 과제 평가 항목인 **layout/filter/data 상태 분리** 를 가장 단순하고 명확하게 표현하는 방법. URL 자체가 단일 진실 공급원이면 새로고침·공유 링크·뒤로가기가 자연스럽게 작동한다.

**적용:** `features/filters/useFilterUrl.ts` 가 `useSearchParams + router.replace` 로 다섯 가지 필터(`companyId / typeKey / scope / from / to`)를 양방향 동기화. 대시보드·활동·게시물 페이지가 모두 같은 훅을 사용.

**Trade-off:** 매우 자주 변하는 필터를 URL 에 두면 history 노이즈. `router.replace` 와 `scroll: false` 로 완화. 추후 슬라이더 같은 high-frequency 컨트롤이 필요하면 debounce 또는 로컬 ephemeral state 를 도입해야 할 수 있다.

---

## 결정 4 — 단위 변환을 fail-fast 로 강제 (느슨한 자동 추정 대신)

**왜:** PCF 도메인에서 가장 잦은 버그는 단위 혼동 (kg ↔ ton, kWh ↔ MWh) 으로 1000배 오차가 발생하는 것이다. 실수 시 무음으로 0이 되거나 잘못된 값을 보여주면 의사결정에 치명적.

**적용:** `lib/units.ts` 의 `convertToFactorDenominator()` 는 활동 단위와 배출계수 분모가 같은 canonical family 가 아니면 `UnitMismatchError` 를 throw. UI 측은 이를 사용자에게 경고로 표시하고 해당 행의 배출량을 0 으로 처리하되 명시적으로 빨간색 메시지로 표시. 13개의 단위 테스트로 행동을 잠금.

**Trade-off:** "kg 입력했는데 factor 가 ton 분모라면 자동으로 변환" 같은 친절한 기능을 일부 포기. 대신 입력 폼에서 활동 유형 선택 시 단위 후보를 자동으로 제공하고, factor 분모를 라벨에 노출함으로써 실무자가 미리 알 수 있다.

---

## 결정 5 — TanStack Query + 낙관적 업데이트 (RSC fetch + revalidate 대신)

**왜:** 활동 입력·게시물 작성 같은 write 작업이 빈번하고 영문 과제는 Fake API 의 부분 실패에 대한 UX 시연을 요구한다. RSC + revalidatePath 만으로는 낙관적 업데이트와 정밀한 롤백을 만들기 번거롭다.

**적용:** 모든 write mutation 은 `onMutate` 에서 query data snapshot 을 만들고 캐시를 낙관적으로 갱신, `onError` 에서 snapshot 으로 복원 + 토스트, `onSettled` 에서 invalidate 한다.

**Trade-off:** 클라이언트 컴포넌트 비중 증가 + RSC streaming의 일부 이점을 포기. 대시보드는 어차피 인터랙티브하므로 (필터·시뮬레이션·낙관적 업데이트) 클라이언트 컴포넌트가 자연스러운 선택.

---

## 결정 6 — 차트는 dynamic import + memo

**왜:** Recharts 는 무겁다 (~50KB+ gzip). Overview 가 아닌 페이지에서는 불필요.

**적용:** `app/page.tsx` 에서 `next/dynamic` 으로 ssr:false 로딩 + 컴포넌트 자체는 `memo()` 로 감싸 동일 props 일 때 재렌더 차단.

**Trade-off:** 첫 페이지 진입 시 차트 영역이 잠깐 스켈레톤으로 표시되는 미세한 LCP 영향. 대신 활동/임포트 페이지의 초기 JS payload 가 줄어든다.

---

## 결정 7 — Excel 파싱은 서버 측에서

**왜:** SheetJS 는 클라이언트에서도 가능하지만 (a) 4MB 제한 + 일관된 검증 로직 (b) 트랜잭션 일괄 저장과 한 번에 처리 (c) 보안: 파일 검증 책임을 서버에 집중.

**적용:** `lib/excel-parser.ts` 가 헤더 자동 인식 + 행 단위 오류 수집 + 활동 유형 한국어 매핑까지 모두 처리. 클라이언트는 미리보기 결과를 표시하고 사용자가 확인하면 commit 모드로 다시 전송.

**Trade-off:** 큰 파일은 서버 메모리 사용. 4MB 제한으로 가드.
