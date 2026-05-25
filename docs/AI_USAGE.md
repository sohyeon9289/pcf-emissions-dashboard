# AI 사용 내역

본 과제는 한글 채용과제의 AI 사용 정책에 따라 사용한 AI 도구·프롬프트·반영 결정을 구분하여 기록합니다.

## 사용 도구

- **Cursor IDE + Claude (Opus 계열)** — 본 저장소 전반의 코드 생성·리팩터링·문서화에 사용.

## 단계별 활용 방식

### 1) 과제 분석 단계 (Plan Mode)

- 채용과제 PDF/XLSX 2종을 읽고 영문/한글 요구사항의 공통점과 차이를 분리.
- 두 과제 통합 가능성, 보너스 가점 항목, 시스템 설계 옵션을 정리한 plan 을 먼저 만들고 사용자 승인 후 Agent Mode 로 전환.

### 2) 도메인 모델링

- "전기·원소재·운송 활동을 GHG Scope 1·2·3 어디로 분류해야 하는가" 를 AI 와 검토.
- 결과: 전기→Scope 2, 원소재→Scope 3 Cat.1, 운송→Scope 3 Cat.4, 디젤→Scope 1.
- 단위 변환 family (kWh/kg/ton-km/L/CO2e) 매트릭스 초안을 AI 가 제시 → 사람이 검토 후 multiplier 단위 검산.

### 3) 코드 생성

- 디렉토리 구조 / Prisma schema / Route Handler 들 / React 컴포넌트의 초기 구현을 AI 가 작성.
- 사람이 다음을 직접 결정:
  - 폴더 경계 (`features/pcf` vs `lib` vs `components`).
  - 상태 경계 (URL params SSOT, Zustand 미사용).
  - **단위 변환의 fail-fast 정책** (자동 추정 금지) — AI 가 처음에는 누락된 단위에 대해 자동 추정 코드를 제안했지만 도메인 안전성을 위해 명시적 throw 로 강제.
  - 배출계수 버전 lookup 의 경계 조건 (`validFrom <= date < validTo`) — exclusive vs inclusive 결정.

### 4) 테스트

- 핵심 비즈니스 로직 (`units`, `calc`, `validation`, `excel-parser`) 의 테스트 케이스를 AI 가 제안.
- 사람이 추가한 케이스: "factor 없을 때 warning 으로 fail-soft", "MWh→kWh 자동 변환", "한글 헤더 자동 인식 실패 시 빈 preview".

### 5) 문서

- README · ARCHITECTURE · DESIGN_DECISIONS · 본 문서의 초안을 AI 가 작성.
- 사람이 다음을 보강:
  - 평가 기준 매핑 표의 비중·근거.
  - 실제 빌드/테스트 검증 결과 수치 (48 tests, ~10시간 등).

## AI 의 결정과 사람의 결정 구분

| 결정 | 주체 |
| --- | --- |
| Next.js 14 + Postgres + Prisma 스택 선택 | 사람 (사용자 질문에 응답) |
| GHG Scope 분류 매핑 | AI 제안 → 사람 검토 |
| 단위 변환 fail-fast 정책 | 사람 |
| URL search params 를 필터 SSOT 로 | 사람 |
| 낙관적 업데이트 + 롤백 패턴 구현 | AI 작성 → 사람 검토 |
| 디자인 토큰 (HSL CSS variables) | AI 제안 → 사람이 Scope 색상 조정 |
| Excel 파서의 한글 헤더 자동 인식 | 사람 (요구사항) → AI 가 구현 |
| 두 과제 통합 여부 | 사람 (사용자 질문에 응답) |
| 커밋 메시지 형태 (한국어 짧게) | 사람 (사용자 지시) |

## 활용한 주요 프롬프트 예시

1. "두 채용과제 PDF/XLSX 를 분석해서 개발 계획 세워줘. 지켜야하는 부분, 구조, 중요한 부분, 개발 목표 포함."
2. "Next.js 14 App Router + Prisma + Postgres 환경에서 활동 데이터에 배출계수 버전을 적용하는 PCF 계산 코어를 작성. 단위 호환성 검사 필수, fail-fast."
3. "data.xlsx 의 한글 헤더 (일자/활동 유형/설명/량/단위) 를 자동 인식하는 SheetJS 파서. 활동 유형 → typeKey 자동 매핑. 오류 행은 별도로 수집."
4. "TanStack Query 로 낙관적 업데이트 + 롤백 + 토스트 패턴을 활동 생성/수정/삭제에 적용."

## 결과적으로 사람이 한 일

- 두 과제의 요구를 통합한 단일 솔루션 설계.
- 도메인 안전성 (단위 fail-fast, 배출계수 버전 경계 조건) 의 정책 결정.
- 평가 기준에 따른 산출물 구성 (스크린샷·비디오·README 5단계).
- 커밋 히스토리 흐름 (phase 0~11) 디자인.
