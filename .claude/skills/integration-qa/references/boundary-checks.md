# 경계면 점검 절차 & 재현 스니펫

> `integration-qa` 스킬의 부속 참조. 각 경계를 실제로 교차 비교할 때 읽고, 스니펫을 재사용한다. (Node/pnpm 환경 가정; 프로젝트 스크립트명에 맞춰 조정.)

## 목차
1. ko/en 메시지 키 집합 차이
2. 레지스트리 ↔ 라우트 ↔ 메시지 키
3. 엔진 path ↔ SVG 보드
4. 공정성 회귀 재실행
5. 동의 ↔ 광고 게이팅
6. 커버리지·E2E·a11y·Lighthouse 실행

---

## 1. ko/en 메시지 키 집합 차이

두 카탈로그의 키 집합이 같은지 *스크립트로* 뽑는다(눈 대조 금지).

```bash
node -e '
const ko=require("./src/i18n/messages/ko.json"), en=require("./src/i18n/messages/en.json");
const flat=(o,p="")=>Object.entries(o).flatMap(([k,v])=>v&&typeof v==="object"?flat(v,p+k+"."):[p+k]);
const K=new Set(flat(ko)), E=new Set(flat(en));
const onlyKo=[...K].filter(x=>!E.has(x)), onlyEn=[...E].filter(x=>!K.has(x));
console.log("ko-only:",onlyKo); console.log("en-only:",onlyEn);
process.exit(onlyKo.length||onlyEn.length?1:0);
'
```
기대: 양쪽 빈 배열. 차이가 있으면 platform-engineer에게 통지.

## 2. 레지스트리 ↔ 라우트 ↔ 메시지 키

- live 도구마다 `tools.<id>.title`/`description`이 ko/en에 있는가:
```bash
node -e '
const {tools}=require("./src/tools/registry.ts"); /* ts면 빌드 산출물 또는 tsx 사용 */
'
```
(레지스트리가 TS면 `tsx`/빌드 후 검사하거나, grep로 교차 확인.)
- grep 교차: 각 live `id`에 대해 `generateStaticParams` 출력과 `messages`에 존재하는지.
- coming_soon 도구가 라우트로 생성되지 않는지(빌드 산출 `.next` 또는 `out/`에서 경로 부재 확인).

## 3. 엔진 path ↔ SVG 보드

핵심: 화면이 그리는 경로 = 엔진이 계산한 경로. `LadderBoard`는 자체 계산 금지, `tracePath` 출력을 좌표로만 변환.
- 단위: 무작위 시드 perm 다수에 대해 `resolveAll(rungs) === perm` 단언(domain 테스트로 이미 존재해야 함).
- E2E: 사다리 빌드 후 한 플레이어 reveal → 도착한 prize 카드의 라벨이 `mapping[playerId]`와 일치하는지 DOM에서 확인.
```ts
// playwright 예시 (결정적 대기)
await page.getByRole('button', { name: /영희 결과 보기/ }).click();
await expect(page.getByTestId('prize-revealed')).toBeVisible();      // 타임아웃 대기 금지
// 그리고 aria-live 영역 텍스트가 엔진 매핑과 일치하는지 단언
```

## 4. 공정성 회귀 재실행

```bash
pnpm vitest run src/lib/ladder.test.ts -t "공정|fairness|uniform"
```
확인: N∈{2..10} 각 셀 ≈ RUNS/N ±1%, chi-square p>0.01, 전 컬럼 도달, `resolveAll===perm`. 실패 = CRITICAL.

## 5. 동의 ↔ 광고 게이팅

- 순수 판정 단위 테스트: `shouldLoadAds({ads:false})===false` 등.
- E2E: 스토리지 비운 첫 방문 → DOM에 AdSense/GA 스크립트 부재 + AdSlot 높이 예약 존재 확인. "거부" → 스크립트 없음. "수락" → lazy 로드.
```ts
const reqs = [];
page.on('request', r => reqs.push(r.url()));
// 거부 후
expect(reqs.some(u => u.includes('googlesyndication') || u.includes('googletagmanager'))).toBe(false);
```

## 6. 커버리지·E2E·a11y·Lighthouse 실행

```bash
pnpm vitest run --coverage          # 전체 ≥80%, 도메인 ≥90%
pnpm playwright test                # SPEC 시나리오 + 시각 회귀
pnpm playwright test --grep @a11y   # axe 통합 스펙(있으면)
pnpm build && npx lighthouse http://localhost:3000/ko --only-categories=performance --form-factor=mobile
```
CWV 판정: LCP<2.5s, CLS<0.1, INP<200ms, FCP<1.5s, TBT<200ms. 광고 슬롯 높이 예약으로 CLS 보호되는지 홈에서 확인.

> 위 명령들은 환경/스크립트명에 맞춰 조정. 반복적으로 쓰는 검사는 이 파일 옆 `scripts/`로 번들링을 제안(하네스 진화).
