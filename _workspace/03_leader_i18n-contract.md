# barcode-generator i18n 계약 (리더 확정 — ui-engineer/platform-engineer 공통 준수)

네임스페이스: `tools.barcode-generator`. 아래 키 목록을 **그대로** 쓴다 — ui-engineer는 이 키들을 `t('...')`로 소비하고, platform-engineer는 이 정확한 키로 `ko.json`/`en.json`에 삽입한다. 키 이름을 지어내지 말 것(반복 재발 결함).

## 최상위 (필수 — 홈카드/푸터/검색이 소비)
- `title` (ko: "바코드 생성기" / en: "Barcode Generator")
- `description` (ko: "EAN-13, UPC-A, Code 39, Code 128 바코드를 무료로 생성하고 PNG·SVG로 다운로드하세요." / en: "Generate EAN-13, UPC-A, Code 39, and Code 128 barcodes for free. Download as PNG or SVG.")

## meta (SEO)
- `meta.title` (ko: "바코드 생성기 — EAN-13·UPC-A·Code 39·Code 128 | Jurepi" / en: "Barcode Generator — EAN-13, UPC-A, Code 39, Code 128 | Jurepi")
- `meta.description` (ko: "무료 온라인 바코드 생성기. EAN-13, UPC-A, Code 39, Code 128 형식을 지원하며 체크섬 자동계산, PNG·SVG 다운로드를 제공합니다." / en: "Free online barcode generator supporting EAN-13, UPC-A, Code 39, and Code 128 with automatic checksum calculation and PNG/SVG download.")

## format (탭 라벨)
- `format.ean13`: "EAN-13" / "EAN-13"
- `format.upc`: "UPC-A" / "UPC-A"
- `format.code39`: "Code 39" / "Code 39"
- `format.code128`: "Code 128" / "Code 128"

## input
- `input.label`: "인코딩할 값" / "Value to encode"
- `input.placeholder.ean13`: "12자리 입력(체크섬 자동계산)" / "Enter 12 digits (checksum auto-calculated)"
- `input.placeholder.upc`: "11자리 입력(체크섬 자동계산)" / "Enter 11 digits (checksum auto-calculated)"
- `input.placeholder.code39`: "영숫자 + 공백, -, ., $, /, +, %" / "Alphanumeric + space, -, ., $, /, +, %"
- `input.placeholder.code128`: "모든 ASCII 문자 입력 가능" / "Enter any ASCII text"
- `input.charCount`: "{current}/{max}자" / "{current}/{max} characters"

## error (validateInput의 BarcodeErrorCode → 이 키로 매핑, 원시 라이브러리 메시지 노출 금지)
- `error.lengthError.ean13`: "EAN-13은 12자리 또는 13자리 숫자여야 합니다" / "EAN-13 requires 12 or 13 digits"
- `error.lengthError.upc`: "UPC-A는 11자리 또는 12자리 숫자여야 합니다" / "UPC-A requires 11 or 12 digits"
- `error.invalidCharacter`: "허용되지 않는 문자가 포함되어 있습니다" / "Contains characters not allowed for this format"
- `error.checksumError`: "체크섬이 유효하지 않습니다" / "Invalid checksum"
- `error.encodingFailed`: "바코드 생성에 실패했습니다" / "Barcode generation failed"

## size
- `size.label`: "너비: {width}px" / "Width: {width}px"

## humanReadable
- `humanReadable.label`: "가독형 텍스트 표시" / "Show human-readable text"

## buttons
- `buttons.downloadPng`: "PNG 다운로드" / "Download PNG"
- `buttons.downloadSvg`: "SVG 다운로드" / "Download SVG"
- `buttons.copy`: "클립보드에 복사" / "Copy to Clipboard"

## toasts
- `toasts.downloadSuccess`: "바코드가 다운로드되었습니다" / "Barcode downloaded"
- `toasts.copySuccess`: "클립보드에 복사되었습니다" / "Copied to clipboard"
- `toasts.copyFail`: "클립보드 복사에 실패했습니다" / "Failed to copy to clipboard"
- `toasts.downloadFail` (리더 보완 — DownloadButtons.tsx가 소비하는데 원 계약에 누락): "바코드 다운로드에 실패했습니다" / "Failed to download barcode"

## intro (H1 + 리드, 게이트 밖 SSR)
- `intro.eyebrow`: "변환 도구" / "Converter Tool"
- `intro.title`: "바코드 생성기" / "Barcode Generator"
- `intro.lead`: "EAN-13, UPC-A, Code 39, Code 128 형식의 바코드를 즉시 생성하고 PNG 또는 SVG로 다운로드하세요. 모든 처리는 브라우저 안에서 이뤄집니다." / "Instantly generate EAN-13, UPC-A, Code 39, or Code 128 barcodes and download them as PNG or SVG. Everything happens in your browser."

## howTo (4섹션 — 사이트 전역 컨벤션, 개요는 항상 보임)
- `howTo.title`: "바코드 생성 방법" / "How to Generate a Barcode"
- `howTo.whatIsTitle`: "이 도구란?" / "What is this tool?"
- `howTo.whatIsBody`: "바코드 생성기는 숫자나 텍스트를 EAN-13(소매 표준), UPC-A(북미 소매 표준), Code 39(산업용 영숫자), Code 128(전체 ASCII, 물류) 중 하나의 형식으로 변환해 스캔 가능한 바코드를 만듭니다. 형식을 선택하고 값을 입력한 뒤 크기를 조절하고, 필요하면 가독형 텍스트를 표시한 후 PNG나 SVG로 다운로드하면 됩니다. 모든 생성은 브라우저 안에서 이뤄지며 서버로 전송되는 데이터는 없습니다." / "A barcode generator converts numbers or text into a scannable barcode in one of four formats: EAN-13 (standard retail), UPC-A (North American retail), Code 39 (industrial alphanumeric), or Code 128 (full ASCII, logistics). Choose a format, enter your value, adjust the size, optionally show human-readable text, and download as PNG or SVG. All generation happens in your browser — nothing is sent to a server."
- `howTo.useCasesTitle`: "언제 쓰나요?" / "When to use it"
- `howTo.useCasesBody` (사용자 요청으로 일상 사례 보강): "바코드는 스캐너나 스마트폰 바코드 스캔 앱으로 읽으면 숫자나 문자가 그대로 나타나는 원리라서, 그 코드에 어떤 의미를 붙일지는 직접 정하면 됩니다. 그래서 일상에서도 유용합니다 — 이사할 때 박스마다 고유 번호를 붙이고 스프레드시트에 "박스 1 = 주방용품"처럼 적어두면, 나중에 코드만 스캔해서 바로 확인할 수 있습니다. 집 창고나 냉장고 재고 라벨, 중고거래·플리마켓에서 직접 붙이는 가격표, 책·음반·피규어 같은 개인 소장품 정리에도 좋습니다. 물론 상품·포장 라벨링(EAN/UPC), 내부 추적이나 배송용 바코드 인쇄(Code 128), 소매·이커머스 상품 코드 생성 같은 업무용으로도 그대로 쓸 수 있습니다." / "Since any barcode scanner or phone scanning app simply reads back the exact digits or text you encoded, you decide what each code means. That's what makes it handy for everyday life too — number your moving boxes and jot down "Box 1 = kitchen items" in a spreadsheet, then just scan the code later to check. It also works great for home pantry or storage labels, price tags for garage sales or secondhand marketplaces, and organizing personal collections like books, records, or figures. And it still covers the business use cases: labeling products, packages, or inventory (EAN/UPC), printing barcodes for internal tracking or shipping (Code 128), and creating product codes for retail or e-commerce."

## preview (BarcodePreview 빈 상태·에러 상태)
- `preview.empty`: "바코드가 여기에 표시됩니다" / "Your barcode will appear here"
- `preview.error`: "바코드를 생성할 수 없습니다" / "Unable to generate barcode"
- `howTo.tipsTitle`: "팁" / "Tips"
- `howTo.tipsBody`: "EAN-13과 UPC-A는 유효한 체크섬이 필요한데, 베이스 숫자만 입력해도 이 도구가 자동으로 계산합니다. 스캔이 잘 되려면 바코드 크기를 충분히 크게(100px 이상) 유지하세요. 인쇄하거나 확대할 경우 픽셀이 깨지지 않는 SVG가 유리하고, 웹이나 메신저 공유에는 PNG가 편리합니다. 스캔 신뢰성을 위해 색상 커스터마이즈는 지원하지 않습니다." / "EAN-13 and UPC-A require a valid checksum digit; this tool calculates it automatically if you provide the base digits. Keep the barcode large enough (100px or more) for reliable scanning. SVG is best for printing or enlarging since it won't pixelate; PNG is convenient for the web or messaging. Color customization isn't supported, to keep barcodes reliably scannable."

## faq (6~8문항, FAQPage는 Faq 컴포넌트 단일 소유)
- `faq.title`: "자주 묻는 질문" / "Frequently Asked Questions"
- `faq.items[0].q` / `.a`: "바코드란 무엇인가요?" / "숫자나 텍스트를 세로줄 패턴으로 시각화한 것으로, 스캐너가 이 패턴을 읽어 인코딩된 정보를 복원합니다. 이 도구는 4가지 표준 형식으로 바코드를 생성합니다." — "What is a barcode?" / "A barcode is a visual encoding of data as vertical bars of varying widths. Scanners read the pattern to retrieve the encoded information. This tool creates barcodes in four standard formats."
- `faq.items[1].q` / `.a`: "EAN-13, UPC-A, Code 39, Code 128의 차이는 무엇인가요?" / "EAN-13은 유럽·아시아의 소매 표준(13자리)이고, UPC-A는 북미의 대응 표준(12자리)입니다. Code 39는 영숫자를 인코딩하며 창고·산업 현장에서 쓰이고, Code 128은 전체 ASCII를 인코딩해 물류·배송에 널리 쓰입니다." — "What's the difference between EAN-13, UPC-A, Code 39, and Code 128?" / "EAN-13 is the retail standard in Europe and Asia (13 digits). UPC-A is its North American counterpart (12 digits). Code 39 encodes alphanumeric characters and is common in warehousing and industrial settings. Code 128 encodes the full ASCII set and is widely used in logistics and shipping."
- `faq.items[2].q` / `.a`: "체크섬을 직접 계산해야 하나요?" / "아니요. EAN-13과 UPC-A는 베이스 숫자(각각 12자리, 11자리)만 입력하면 이 도구가 체크섬 자리를 자동으로 계산해 붙입니다." — "Do I need to calculate the checksum myself?" / "No. For EAN-13 and UPC-A, this tool automatically calculates and appends the checksum digit if you enter just the base digits (12 for EAN-13, 11 for UPC-A)."
- `faq.items[3].q` / `.a`: "생성한 바코드는 어디에 저장되나요?" / "바코드는 브라우저 안에서만 생성되며 서버로 전송되지 않습니다. 최근 입력값은 사용 편의를 위해 이 브라우저의 localStorage에만 저장됩니다." — "Where is my generated barcode stored?" / "Your barcode is generated entirely in your browser and is never sent to a server. Recent inputs are stored only in this browser's localStorage for convenience."
- `faq.items[4].q` / `.a`: "PNG와 SVG 중 어떤 걸 다운로드해야 하나요?" / "PNG는 파일 크기가 작지만 확대하면 흐려질 수 있습니다. SVG는 벡터 이미지라 아무리 확대해도 선명합니다. 인쇄나 큰 화면 표시에는 SVG를, 웹이나 메신저 공유에는 PNG를 권장합니다." — "Should I download PNG or SVG?" / "PNG is smaller but may blur when enlarged. SVG is a vector format that stays sharp at any size. Use SVG for printing or large displays, and PNG for the web or messaging."
- `faq.items[5].q` / `.a`: "바코드 색상을 바꿀 수 있나요?" / "현재는 지원하지 않습니다. 스캐너 인식 신뢰성을 위해 흑백으로 고정되어 있습니다." — "Can I customize the barcode color?" / "Not currently. Barcodes are fixed to black on white to ensure reliable scanning."
- `faq.items[6].q` / `.a`: "Code 39와 Code 128 중 어느 것을 선택해야 하나요?" / "짧은 대문자·숫자·일부 특수문자만 필요하고 구형 스캐너와의 호환성이 중요하면 Code 39를, 소문자를 포함한 임의의 텍스트를 더 조밀하게 인코딩하고 싶다면 Code 128을 선택하세요." — "Should I choose Code 39 or Code 128?" / "Choose Code 39 if you only need uppercase letters, digits, and a few special characters and need compatibility with older scanners. Choose Code 128 for denser encoding of arbitrary text, including lowercase letters."

## localStorage(참고용, UI 문자열 아님)
`useBarcodeGenerator`는 `BarcodeStoreSchema`(도메인 `schema.ts`)로 `jurepi-barcode-generator` 키를 파싱한다 — i18n과 무관.
