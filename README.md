# PCF Emissions Dashboard

탄소 활동 데이터(전기·원소재·운송 등)에 배출계수를 적용하여 **PCF(Product Carbon Footprint)** 를 계산·시각화하는 인터랙티브 대시보드입니다.

> 본 저장소는 두 채용과제(HanaLoop 영문 Carbon Emissions Dashboard, 2026 한글 탄소관리 플랫폼)를 통합하여 구현한 풀스택 Next.js 애플리케이션입니다.

## 빠른 시작 (5단계 이내)

```bash
# 1. 의존성 설치
yarn install

# 2. PostgreSQL 실행 (Docker)
yarn db:up

# 3. DB 마이그레이션 + 시드
yarn db:migrate && yarn db:seed

# 4. 빌드 & 실행
yarn build && yarn start
```

또는 한 줄 실행:

```bash
docker compose --profile full up
```

자세한 사용법, 아키텍처, 설계 결정, AI 활용 내역은 Phase 11 에서 채워집니다.
