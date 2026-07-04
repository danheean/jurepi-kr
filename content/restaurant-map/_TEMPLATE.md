---
# Place-based theme example: Neighborhood cafés
title: "성수동 감성 카페"

# Optional: explicit slug (auto-derived from filename if omitted)
# slug: "seongsu-cafes"

# Required: region enum
region: seoul

# Optional: city/district within region (e.g. "성동구")
city: "성동구"

# Required: ISO date (publication date of this list)
asOfDate: "2026-07-04"

# Required: localized source/provenance (max 200 chars)
sourceNote: "직접 다녀온 곳 위주, 2026년 상반기 기준"

# Optional: clickable source link
sourceUrl: "https://blog.naver.com/example"

# Required: array of ≥3 places
places:
  # Each place MUST have personalNote: curator's first-person opinion
  - name: "카페 하늘"
    lat: 37.5445
    lng: 127.0557
    category: cafe
    address: "서울 성동구 성수이로 1길 10"
    description: "햇빛이 잘 드는 2층 카페, 시그니처 라떼와 자체 로스팅 원두"
    personalNote: "창문 좌석에서 해가 지는 모습이 정말 예쁜데, 웨이팅이 길어요."
    link: "https://map.naver.com/p/entry/place/12345678"
    priceRange: "₩5,000–8,000"
    
  - name: "가든 베이커리"
    lat: 37.5465
    lng: 127.0575
    category: brunch
    address: "서울 성동구 성수이로 2길 15"
    description: "자신 있는 크로와상과 신선한 재료의 브런치 세트"
    personalNote: "버터 냄새가 코를 자극할 정도로 신선해요. 주말에 가면 꼭 웨이팅을 각오해야 합니다."
    priceRange: "₩12,000–18,000"
    
  - name: "로스터즈 숍"
    lat: 37.5480
    lng: 127.0540
    category: cafe
    address: "서울 성동구 성수이로 3길 22"
    description: "싱글오리진 특화점, 옅은 배경음악과 조용한 분위기"
    personalNote: "커피를 정말 좋아하는 사람이 운영하는 느낌이 납니다. 커피 추천도 친절해요."
    imageUrl: "https://example.com/roasters-shop.jpg"
    imageWidth: 400
    imageHeight: 300
---

# Optional: markdown body (intro text, not rendered from this markdown but can be included in future SEO sections)
성수동의 감성 있는 카페들을 모아봤습니다. 햇빛과 자신감 있는 커피의 조합이 특징입니다.
