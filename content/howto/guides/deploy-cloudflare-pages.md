---
title: Cloudflare Pages로 배포하는 법
slug: deploy-cloudflare-pages
summary: |
  Next.js 애플리케이션을 Cloudflare Pages에 배포하고, 자동 빌드 파이프라인을 설정하는 단계별 가이드.
topic: deploy
tags: [cloudflare, 배포, 호스팅]
order: 1
updated: 2026-07-06
difficulty: intermediate
related: [install-claude-code]
---

## 준비물

- Cloudflare 계정 (무료)
- GitHub 저장소
- Next.js 프로젝트

## 1단계: Cloudflare에 로그인

[Cloudflare 대시보드](https://dash.cloudflare.com)에 로그인합니다.

## 2단계: Pages 프로젝트 생성

왼쪽 사이드바에서 "Pages"를 선택합니다.

![Pages 대시보드](/images/howto/deploy-cloudflare-pages/step-1.png)

"GitHub에 연결" 버튼을 클릭합니다.

## 3단계: 저장소 권한 설정

GitHub 계정으로 인증하고 배포할 저장소를 선택합니다.

```bash
# 저장소에 다음 파일이 필요합니다
wrangler.toml
package.json
```

## 4단계: 빌드 설정

Pages 설정 페이지에서:

- **프로젝트 명**: howto-guides
- **프레임워크**: Next.js
- **빌드 명령**: npm run build
- **빌드 출력 디렉토리**: out

## 5단계: 환경변수 설정 (선택)

민감한 정보는 환경변수로 설정합니다:

```
NEXT_PUBLIC_SITE_URL=https://your-domain.pages.dev
```

## 배포 확인

첫 푸시 후 Cloudflare는 자동으로 빌드를 시작합니다:

```bash
git add .
git commit -m "Deploy to Cloudflare Pages"
git push origin main
```

Pages 대시보드에서 배포 진행 상황을 확인할 수 있습니다.

## 커스텀 도메인 설정

1. Pages 프로젝트 설정으로 이동
2. "커스텀 도메인" 섹션에서 도메인 추가
3. DNS 레코드 확인 후 대기

배포 완료!
