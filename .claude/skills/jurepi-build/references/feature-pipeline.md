# 기능 단위 파이프라인 상세

> `jurepi-build` 오케스트레이터의 부속 참조. 각 단계의 입력→산출, 의존 그래프, 권장 빌드 순서를 정의한다.

## 목차
1. 단계별 입력/산출 계약
2. 의존 그래프(무엇이 무엇을 막는가)
3. 권장 빌드 순서(초기 구축)
4. 도구 추가(후속) 시 축약 파이프라인

---

## 1. 단계별 입력/산출 계약

| 단계 | 담당 | 입력 | 산출물 | 다음 단계 차단? |
|------|------|------|--------|----------------|
| 1 설계 | architect | SPEC/DESIGN, 기존 `_workspace/` | `NN_architect_{feature}-blueprint.md`(계층표·계약·불변식·작업분배) | 예 — 계약이 모든 구현의 전제 |
| 2 도메인 | domain-engineer | 청사진 계약·불변식 | `src/lib/*`, `*.test.ts`, `NN_domain_{module}-contract.md` | 예 — UI/플랫폼이 이 API 소비 |
| 3a UI | ui-engineer | 청사진, domain 계약, DESIGN.md | `components/**`, `hooks/**`, 동작/시각 테스트, i18n 키 목록 | 부분 — QA 입력 |
| 3b 플랫폼 | platform-engineer | 청사진, domain 계약, UI i18n 키 | `app/**`, `i18n/**`, `lib/seo.ts`, 설정, 테스트 | 부분 — QA 입력 |
| 4 점진 QA | qa-integration | 완성 모듈 + 계약 파일 | `NN_qa_{module}-report.md` | CRITICAL이면 반송 |
| 5 통합 | qa-integration | 전체 빌드 | E2E/a11y/CWV 결과, 시각 회귀 | CRITICAL이면 반송 |
| 6 종합 | 리더 | 모든 리포트 | 사용자 요약(완료/미해결/미검증) | — |

## 2. 의존 그래프

```
architect(계약)
   │ (blocks all)
   ▼
domain-engineer(공개 API + 그린 도메인 테스트)
   │ (UI/platform가 계약 소비)
   ├──────────────┬──────────────┐
   ▼              ▼              │
ui-engineer ∥ platform-engineer  │ (3a,3b 병렬; ui→platform로 i18n 키 전달)
   │              │              │
   └──────┬───────┘              │
          ▼                      │
   qa-integration (모듈별 점진) ◄─┘
          │ (CRITICAL 반송 루프)
          ▼
   qa-integration (통합 E2E/a11y/CWV)
          │
          ▼
       리더 종합
```

- 3a·3b는 도메인 계약이 확정되면 **병렬**. 단 ui-engineer는 사용하는 i18n 키 목록을 platform-engineer에게 빨리 보내 카탈로그 누락을 막는다.
- QA는 각 모듈이 끝나는 즉시 시작(전체 대기 금지) — incremental.

## 3. 권장 빌드 순서 (초기 구축, SPEC 반영)

SPEC의 `recommended_implementation_order`를 계층 파이프라인에 맞춘 것:

1. **스캐폴드 + 토큰 + i18n 골격** (platform): Next.js 15 + TS strict + Tailwind v4 + `tokens.css`(↔DESIGN.md) + next-intl(ko/en) 라우팅. → 이후 모든 작업의 토대.
2. **도메인 코어** (domain, TDD): 도구 레지스트리 타입·불변식, 검색 매처, 동의 판정. 각 RED→GREEN.
3. **UI 프리미티브 + 쉘** (ui): Button/Card/Input/Toggle… + Header/Footer/ThemeProvider(flash-free)/LocaleSwitcher.
4. **메인 대시보드** (ui ∥ platform): Hero/SearchBar/CategoryFilter/ToolGrid/ToolCard(모든 상태+empty) ∥ 레지스트리 기반 라우트.
5. **동적 도구 라우트 + Error Boundary** (platform): slug→모듈 마운트.
6. **사다리 도구**: 6-1 엔진(domain, 공정성 chi-square 우선) → 6-2 메시지(ko/en) → 6-3 Setup → 6-4 Board(SVG) → 6-5 trace/칩/flip → 6-6 ResultPanel → 6-7 키보드/reduced-motion → 6-8 SEO(JSON-LD).
7. **동의 + AdSlot + AdSense** (platform): 게이팅, 높이 예약.
8. **SEO 인프라** (platform): sitemap/robots/manifest/hreflang/canonical.
9. **법무 페이지 + GA(옵션)**.
10. **반응형·a11y·Lighthouse 패스** (qa): 320/375/768/1024/1440 양 테마.

각 묶음 완료 직후 qa-integration이 점진 검증한다.

## 4. 도구 추가(후속) 시 축약 파이프라인

새 도구 추가는 메인 화면을 재설계하지 않는다(레지스트리 backbone). 축약 흐름:

1. architect: 새 도구의 계층 분해(도메인 로직 유무 판단) + 자체 SPEC 확인.
2. domain-engineer: 도구에 순수 로직이 있으면 TDD로(없으면 생략).
3. ui-engineer: `components/tools/<id>/` 모듈 + `tools.<id>.*` 키 사용 목록.
4. platform-engineer: ToolMeta 엔트리 + ko/en 메시지 + slug→컴포넌트 분기(+ live면 generateStaticParams 자동 포함).
5. qa-integration: 레지스트리↔라우트↔i18n 교차 + 도구 E2E + CWV 회귀.

coming_soon 도구는 ToolMeta 엔트리만 — 라우트·모듈 불필요.
