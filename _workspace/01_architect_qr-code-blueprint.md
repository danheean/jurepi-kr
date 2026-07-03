# QR Code Generator — Clean Architecture Blueprint

**Tool:** QR Code Generator  
**Codename/Registry ID/Slug:** `qr-code`  
**Category:** `converter` (sky accent)  
**Status:** `live`  
**Order:** 21 (next free after url-encoder=20)  
**Icon:** `QrCode` (lucide-react)

**Reference sibling:** `src/lib/url-encoder/*` + `src/components/tools/url-encoder/*` + tool route wiring

---

## 1. Layer Decomposition

QR Code Generator follows the **clean-architecture 4-layer model**. Source dependencies point inward only (domain ← usecase ← adapter ← framework).

### Domain Layer (`src/lib/qr-code/`)
**Responsibility:** Pure, deterministic encoding, formatting, and validation. ZERO React/Next/DOM imports.

| Module | Exports | Dependency | Notes |
|--------|---------|----------|-------|
| `types.ts` | `InputMode`, `ECCLevel`, `QROptions`, `QRInput`, `WifiFields`, `VcardFields`, `EmailFields`, `SmsFields`, `QRGenerationResult` | none | Type definitions only; no validation logic here. |
| `schema.ts` | `qrInputSchema`, `qrOptionsSchema`, zod store schema, `STORE_VERSION`, constants | zod | Zod validation + localStorage schema. `qrCodeStore` key = `'jurepi-qr-code'` (v1). No localStorage read/write here; schemas only. |
| `format.ts` | `formatData(mode, fields): string` | none | Pure formatter: text→text, url→url, wifi→WIFI:..., vcard→vCard 3.0, email→mailto:..., sms→smsto:... Each mode exports pure function with exact escaping rules. One dispatcher fn or per-mode functions; decide once, be consistent. |
| `encoder.ts` | `encodeQRMatrix(data: string, eccLevel: ECCLevel): boolean[][]` | qrcode npm | Wraps `qrcode.create()`. Takes validated string + ECC; returns matrix only (boolean[][]). Throws typed error on too-long or empty. NO canvas, NO SVG here. |
| `contrast.ts` | `deltaE(fgHex, bgHex): number`, `isContrastAcceptable(fg, bg, threshold?): boolean` | none | Hex parser + RGB Euclidean ΔE calc. ~20 lines pure logic. Returns number 0–255 (approximate; not full CIE-Lab). |
| `svg-export.ts` | `matrixToSvg(matrix, { size, quietZone, fgColor, bgColor }): string` | none | Hand-rolled SVG XML from matrix. Returns valid `<svg>` string (no dependencies, reproducible). |
| `index.ts` | Re-exports all above | — | Barrel export for clean imports. |

**Invariants:**
- All functions are pure (same input → same output).
- No external I/O (network, localStorage, file system).
- No React hooks, no `useRef`, no browser APIs.
- Error strategy: **throw typed errors** (one decision, applied everywhere). E.g., `throw new QREncodingError('Data too long')`. Domain caller catches and wraps in UI layer.

### Usecase Layer (`src/components/tools/qr-code/useQRCode.ts`)
**Responsibility:** Orchestrate domain, manage client state, persistence, debouncing.

| Module | Exports | Dependency | Notes |
|--------|---------|----------|-------|
| `useQRCode.ts` | `useQRCode(): { input, setInput, mode, setMode, options, setOptions, logoUrl, setLogoUrl, result, isEncoding, error, clearError }` | lib/qr-code/*, React, localStorage | Manages: input text + mode + ECC/size/colors + logoUrl state. Dynamic import of `qrcode` lib (not domain). Debounced encode(100ms). localStorage persist (key `'jurepi-qr-code'`, zod safe-parse). Returns live result or error. |

**Hook contract:**
```typescript
interface QRCodeHookResult {
  // State
  input: string;
  mode: InputMode;
  options: QROptions;
  logoUrl?: string;

  // Setters (merge/replace as needed)
  setInput: (v: string) => void;
  setMode: (m: InputMode) => void;
  setOptions: (opts: Partial<QROptions>) => void;
  setLogoUrl: (url?: string) => void;

  // Live computation
  result?: QRGenerationResult; // { matrix, dataUrl, svg, contrastAcceptable }
  isEncoding: boolean;
  error?: Error;
  clearError: () => void;
}
```

### Adapter Layer (`src/components/tools/qr-code/*.tsx`)
**Responsibility:** DOM, canvas, clipboard, file I/O, event handling.

| Component | Props | Dependency | Notes |
|-----------|-------|----------|-------|
| `QRCodeGenerator.tsx` | `{ locale: string }` | useQRCode + all child components | "use client" orchestrator. Owns useQRCode() hook, top-level error handling, keyboard shortcuts (Cmd+S/Cmd+C), reduced-motion detection. Renders form + preview layout. |
| `InputModeSelector.tsx` | `{ mode: InputMode, onModeChange: (m: InputMode) => void }` | i18n | Horizontal pill tabs (aria-labelledby, ArrowLeft/Right nav). No data validation. |
| `InputArea.tsx` | `{ mode: InputMode, value: string, onChange: (v: string) => void, maxLength: number, isLoading?: boolean }` | i18n | Textarea (text/url) or structured fields (wifi/vcard/email/sms). Char count display. Placeholder per mode + locale. |
| `ECCSelector.tsx` | `{ value: ECCLevel, onChange: (ecc: ECCLevel) => void }` | i18n | Radio group L/M/Q/H with tooltips. Vertical or horizontal layout (responsive). |
| `SizeControls.tsx` | `{ size: number, quietZone: number, onSizeChange, onQzChange }` | i18n | Two sliders: size 200–500px (step 50), quietZone 4–8 (step 1). Display labels. |
| `ColorPickers.tsx` | `{ fgColor, bgColor, onFgChange, onBgChange, contrast?: number, isContrastAcceptable?: boolean }` | i18n, lib/contrast | Hex text inputs + palette shortcut buttons (6 accents from DESIGN). Contrast indicator (number + colored dot). No color picker UI library; manual hex parsing + validation. |
| `LogoUpload.tsx` | `{ logoUrl?, onLogoUrlChange: (url?: string) => void }` | i18n | File input (accept="image/*"). Preview 100×100px. Remove button. Reads via FileReader → data URL. |
| `QRPreview.tsx` | `{ result?: QRGenerationResult, isLoading?: boolean, error?: Error }` | useRef (canvas) | Canvas render from matrix + logo overlay. Shows loading spinner or empty placeholder. Ref to canvas element (for toBlob download). |
| `DownloadButtons.tsx` | `{ result?: QRGenerationResult, isContrastAcceptable?: boolean, onConfirmLowContrast?: () => void }` | i18n, navigator.clipboard | Three buttons: Download PNG (canvas.toBlob), Download SVG (result.svg blob), Copy to Clipboard (PNG image). If contrast < 50, user must click "Generate Anyway" override before download. Success/failure toast. |
| `ContrastWarning.tsx` | `{ isVisible: boolean, contrastValue: number, onConfirm?: () => void }` | i18n | Toast-style warning. Not a blocking modal; downloadable if user chooses. |
| `QRCodeGenerator.tsx` | — | — | Main SPA layout: 2-col desktop (form left, preview sticky right), stacked mobile. |

**Canvas rendering pattern** (inside QRPreview, not domain):
```typescript
const canvas = canvasRef.current;
const ctx = canvas.getContext('2d');
// For each module in matrix:
//   if module[i][j] === 1: fill fg color
//   else: fill bg color
// Optional: drawImage logo at center (25% of QR size)
canvas.toDataURL('image/png') // for download
canvas.toBlob(blob => /* download */)
```

### Framework Layer (`src/app/[locale]/tools/[slug]/page.tsx`)
**Responsibility:** Route, SSR, metadata, i18n, error boundary.

See platform wiring section below.

---

## 2. Exact Public API Contracts

### `src/lib/qr-code/types.ts`

```typescript
export type InputMode = 'text' | 'url' | 'wifi' | 'vcard' | 'email' | 'sms';

export type ECCLevel = 'L' | 'M' | 'Q' | 'H';

export interface QROptions {
  eccLevel: ECCLevel;        // error correction: L (7%), M (15%), Q (25%), H (30%)
  size: number;              // px, 200–500, default 300
  quietZone: number;         // modules, 4–8, default 4
  fgColor: string;           // hex #RRGGBB, default '#2a2411'
  bgColor: string;           // hex #RRGGBB, default '#ffffff'
  logoUrl?: string;          // data URL (optional)
}

export interface QRInput {
  data: string;
  mode: InputMode;
}

// Mode-specific structured inputs
export interface WifiFields {
  ssid: string;
  password: string;
  encryption: 'WEP' | 'WPA' | 'nopass'; // default 'WPA'
}

export interface VcardFields {
  name: string;
  phone?: string;
  email?: string;
  url?: string;
}

export interface EmailFields {
  email: string;
  subject?: string;
  body?: string;
}

export interface SmsFields {
  phone: string;
  message?: string;
}

export interface QRGenerationResult {
  matrix: boolean[][];     // QR module grid
  dataUrl: string;         // canvas PNG data URL (base64)
  svg: string;             // SVG XML string
  contrastAcceptable: boolean; // deltaE >= 50
}
```

### `src/lib/qr-code/schema.ts`

```typescript
import { z } from 'zod';

export const MAX_INPUT_LENGTH = 2953;
export const CONTRAST_THRESHOLD = 50;
export const DEBOUNCE_MS = 100;
export const SIZE_STEP = 50;
export const STORE_VERSION = 1;

// Input & options validation
export const qrInputSchema = z.object({
  data: z.string().min(1).max(MAX_INPUT_LENGTH),
  mode: z.enum(['text', 'url', 'wifi', 'vcard', 'email', 'sms']),
});

export const qrOptionsSchema = z.object({
  eccLevel: z.enum(['L', 'M', 'Q', 'H']).default('M'),
  size: z.number().int().min(200).max(500).default(300),
  quietZone: z.number().int().min(4).max(8).default(4),
  fgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#2a2411'),
  bgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#ffffff'),
  logoUrl: z.string().optional(),
});

// localStorage store schema
export const qrCodeStoreSchema = z.object({
  version: z.literal(1),
  recentInputs: z.array(z.string().max(100)).max(5).default([]),
  lastMode: z.enum(['text', 'url', 'wifi', 'vcard', 'email', 'sms']).default('text'),
  lastECC: z.enum(['L', 'M', 'Q', 'H']).default('M'),
  lastFgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#2a2411'),
  lastBgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#ffffff'),
});

export type QRCodeStore = z.infer<typeof qrCodeStoreSchema>;
export const STORE_KEY = 'jurepi-qr-code';
```

### `src/lib/qr-code/format.ts`

```typescript
import { InputMode, WifiFields, VcardFields, EmailFields, SmsFields } from './types';

/**
 * Formats structured input data into QR-encodable string per mode.
 * Handles escaping for WIFI, vCard, email, SMS modes.
 * @throws Error if mode requires structured fields but fields are malformed
 */
export function formatData(
  mode: InputMode,
  fields: string | WifiFields | VcardFields | EmailFields | SmsFields
): string {
  if (mode === 'text') {
    return fields as string;
  }
  if (mode === 'url') {
    return fields as string;
  }
  if (mode === 'wifi') {
    return formatWifi(fields as WifiFields);
  }
  if (mode === 'vcard') {
    return formatVcard(fields as VcardFields);
  }
  if (mode === 'email') {
    return formatEmail(fields as EmailFields);
  }
  if (mode === 'sms') {
    return formatSms(fields as SmsFields);
  }
  throw new Error(`Unknown mode: ${mode}`);
}

// Per-mode formatters (internal)
function formatWifi(fields: WifiFields): string {
  // WIFI:T:WPA;S:<SSID>;P:<PASSWORD>;;
  // Escape semicolons, colons, special chars in SSID/password
  const ssid = escapeWifiField(fields.ssid);
  const pwd = escapeWifiField(fields.password);
  const type = fields.encryption === 'WEP' ? 'WEP' : 'WPA';
  return `WIFI:T:${type};S:${ssid};P:${pwd};;`;
}

function formatVcard(fields: VcardFields): string {
  // vCard 3.0 format
  let card = 'BEGIN:VCARD\r\nVERSION:3.0\r\n';
  card += `FN:${escapeVcardField(fields.name)}\r\n`;
  if (fields.phone) card += `TEL:${escapeVcardField(fields.phone)}\r\n`;
  if (fields.email) card += `EMAIL:${escapeVcardField(fields.email)}\r\n`;
  if (fields.url) card += `URL:${escapeVcardField(fields.url)}\r\n`;
  card += 'END:VCARD';
  return card;
}

function formatEmail(fields: EmailFields): string {
  // mailto:email?subject=...&body=...
  const params = new URLSearchParams();
  if (fields.subject) params.append('subject', fields.subject);
  if (fields.body) params.append('body', fields.body);
  const qs = params.toString();
  return qs ? `mailto:${fields.email}?${qs}` : `mailto:${fields.email}`;
}

function formatSms(fields: SmsFields): string {
  // smsto:phone:message
  return `smsto:${fields.phone}:${encodeURIComponent(fields.message || '')}`;
}

function escapeWifiField(s: string): string {
  // Escape special WiFi SSID/password chars
  return s.replace(/([;:,\\"])/g, '\\$1');
}

function escapeVcardField(s: string): string {
  // Escape vCard special chars (semicolon, newline)
  return s.replace(/([;\n\r])/g, '\\$1');
}
```

### `src/lib/qr-code/encoder.ts`

```typescript
import QRCode from 'qrcode';
import { ECCLevel } from './types';

export class QREncodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QREncodingError';
  }
}

/**
 * Encodes data into QR matrix using qrcode library.
 * @param data - QR-encodable string (already formatted per mode)
 * @param eccLevel - Error correction level (L, M, Q, H)
 * @returns boolean[][] matrix (true = black module, false = white)
 * @throws QREncodingError if data is empty or exceeds capacity
 */
export async function encodeQRMatrix(
  data: string,
  eccLevel: ECCLevel = 'M'
): Promise<boolean[][]> {
  if (!data || data.trim().length === 0) {
    throw new QREncodingError('QR data cannot be empty');
  }

  try {
    const qr = QRCode.create(data, {
      errorCorrectionLevel: eccLevel,
    });
    
    // Extract module matrix from qr object
    // qr.modules is a 2D array of numbers (0 = white, 1 = black)
    const modules = qr.modules as number[][];
    
    // Convert to boolean matrix (true = black module)
    const matrix = modules.map(row => row.map(cell => cell === 1));
    
    return matrix;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new QREncodingError(`Failed to encode QR: ${message}`);
  }
}
```

### `src/lib/qr-code/contrast.ts`

```typescript
export class ContrastError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContrastError';
  }
}

/**
 * Parse hex color to RGB triplet.
 * @param hex - hex string like "#2a2411" or "2a2411"
 * @returns [r, g, b] 0–255
 * @throws ContrastError if hex is invalid
 */
function parseHex(hex: string): [number, number, number] {
  const cleaned = hex.replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    throw new ContrastError(`Invalid hex color: ${hex}`);
  }
  const num = parseInt(cleaned, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Calculate ΔE (delta-E) using simple RGB Euclidean distance.
 * Approximate WCAG AA; not full CIE-Lab.
 * @param fgHex - foreground hex color
 * @param bgHex - background hex color
 * @returns ΔE value (0–~442)
 */
export function deltaE(fgHex: string, bgHex: string): number {
  const [fgR, fgG, fgB] = parseHex(fgHex);
  const [bgR, bgG, bgB] = parseHex(bgHex);

  const dR = fgR - bgR;
  const dG = fgG - bgG;
  const dB = fgB - bgB;

  return Math.sqrt(dR * dR + dG * dG + dB * dB);
}

/**
 * Check if contrast is acceptable (ΔE >= threshold).
 * @param fgHex - foreground hex color
 * @param bgHex - background hex color
 * @param threshold - minimum acceptable ΔE (default 50, approximate WCAG AA)
 * @returns true if contrast >= threshold
 */
export function isContrastAcceptable(
  fgHex: string,
  bgHex: string,
  threshold: number = 50
): boolean {
  try {
    return deltaE(fgHex, bgHex) >= threshold;
  } catch {
    // If parsing fails, assume acceptable (user's problem)
    return true;
  }
}
```

### `src/lib/qr-code/svg-export.ts`

```typescript
export interface SvgExportOptions {
  size: number;           // px (total canvas size)
  quietZone: number;      // modules
  fgColor: string;        // hex
  bgColor: string;        // hex
}

/**
 * Generate SVG XML from QR module matrix.
 * Hand-rolled, no external SVG libraries.
 * @param matrix - boolean[][] from encoder
 * @param options - size, quietZone, colors
 * @returns valid SVG XML string
 */
export function matrixToSvg(
  matrix: boolean[][],
  options: SvgExportOptions
): string {
  const { size, quietZone, fgColor, bgColor } = options;
  
  const moduleCount = matrix.length + quietZone * 2;
  const moduleSize = size / moduleCount;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`;
  
  // Background
  svg += `<rect width="${size}" height="${size}" fill="${bgColor}"/>`;
  
  // Modules (black = foreground)
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col]) {
        const x = (col + quietZone) * moduleSize;
        const y = (row + quietZone) * moduleSize;
        svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${fgColor}"/>`;
      }
    }
  }
  
  svg += '</svg>';
  return svg;
}
```

---

## 3. i18n Key Contract

All UI chrome comes from `tools.qr-code.*` namespace (ko + en).

### Key Structure

```
tools.qr-code:
  title: "QR 코드 생성기" / "QR Code Generator"
  description: "텍스트, URL, Wi-Fi 정보를 QR 코드로 변환하세요." / "Convert text, URLs, Wi-Fi credentials into scannable QR codes."
  
  meta:
    title: "QR 코드 생성 도구 | Jurepi" / "QR Code Generator | Jurepi"
    description: "무료 QR 코드 생성 도구. 색상 조정, 오류 수정 레벨 선택, PNG/SVG 다운로드 가능." / "Free QR code generator. Adjust colors, error correction level, download as PNG or SVG."
  
  modes:
    text: "텍스트" / "Text"
    url: "URL"
    wifi: "Wi-Fi"
    vcard: "명함" / "vCard"
    email: "이메일" / "Email"
    sms: "문자" / "SMS"
  
  inputArea:
    placeholder:
      text: "텍스트를 입력하세요." / "Enter text"
      url: "URL을 입력하세요. (예: https://jurepi.kr)" / "Enter URL (e.g., https://jurepi.kr)"
      wifi: "Wi-Fi 정보를 입력하세요." / "Enter Wi-Fi details"
      vcard: "연락처 정보를 입력하세요." / "Enter contact information"
      email: "이메일 주소를 입력하세요." / "Enter email address"
      sms: "전화번호와 메시지를 입력하세요." / "Enter phone number and message"
    charCount: "{current} / {max}" (same in both)
    tooLong: "최대 {max}자입니다." / "Max {max} characters"
  
  wifi:
    ssidLabel: "네트워크명 (SSID)" / "Network Name (SSID)"
    passwordLabel: "비밀번호" / "Password"
    encryptionLabel: "보안 방식" / "Security Type"
    wep: "WEP"
    wpa: "WPA"
    nopass: "보안 없음" / "No Security"
  
  vcard:
    nameLabel: "이름 *" / "Name *"
    phoneLabel: "전화번호" / "Phone Number"
    emailLabel: "이메일" / "Email"
    urlLabel: "웹사이트" / "Website"
  
  email:
    emailLabel: "이메일 주소 *" / "Email Address *"
    subjectLabel: "제목" / "Subject"
    bodyLabel: "본문" / "Body"
  
  sms:
    phoneLabel: "전화번호 *" / "Phone Number *"
    messageLabel: "메시지" / "Message"
  
  ecc:
    label: "오류 수정 레벨" / "Error Correction Level"
    l: "L (7% 복구율)" / "L (7% recovery)"
    m: "M (15% 복구율)" / "M (15% recovery)"
    q: "Q (25% 복구율)" / "Q (25% recovery)"
    h: "H (30% 복구율)" / "H (30% recovery)"
  
  size:
    label: "크기: {size}px" / "Size: {size}px"
    quietZoneLabel: "조용한 영역: {qz}px" / "Quiet Zone: {qz}px"
  
  colors:
    fgLabel: "전경색 (어두운색)" / "Foreground (Dark)"
    bgLabel: "배경색 (밝은색)" / "Background (Light)"
    contrast: "명도차: {value}" / "Contrast: {value}"
    contrastGood: "좋음" / "Good"
    contrastWarn: "주의" / "Warning"
    contrastPoor: "낮음" / "Poor"
  
  logo:
    label: "로고 (선택)" / "Logo (Optional)"
    upload: "이미지 선택" / "Choose Image"
    remove: "제거" / "Remove"
  
  buttons:
    downloadPng: "PNG 다운로드" / "Download PNG"
    downloadSvg: "SVG 다운로드" / "Download SVG"
    copyClipboard: "클립보드 복사" / "Copy to Clipboard"
    confirmLowContrast: "어쨌든 생성" / "Generate Anyway"
  
  warnings:
    lowContrast: "낮은 명도차로 인해 스캔이 어려울 수 있습니다. 색상을 조정하거나 계속 진행하세요." / "Low contrast may reduce scannability. Adjust colors or confirm to proceed."
    invalidUrl: "유효하지 않은 URL입니다." / "Invalid URL"
  
  toasts:
    downloadSuccess: "QR 코드가 다운로드되었습니다." / "QR code downloaded"
    copySuccess: "클립보드에 복사되었습니다." / "Copied to clipboard"
    copyFail: "클립보드 복사에 실패했습니다." / "Failed to copy to clipboard"
  
  intro:
    headline: "QR 코드 생성기" / "QR Code Generator"
    lead: "텍스트, URL, Wi-Fi, 연락처 정보를 QR 코드로 변환하세요. 색상을 조정하고 PNG 또는 SVG로 다운로드하세요." / "Convert text, URLs, Wi-Fi credentials, and contact info into QR codes. Customize colors and download as PNG or SVG."
  
  howTo:
    title: "QR 코드를 생성하는 방법" / "How to Generate a QR Code"
    content: "1. 모드를 선택합니다... (long-form SSR, no key interpolation)" / "1. Select a mode... (long-form SSR, no key interpolation)"
  
  faq:
    q1: "QR 코드란 무엇인가요?" / "What is a QR code?"
    a1: "QR 코드는... (full answer)" / "A QR code is... (full answer)"
    q2: "...더 많은 Q&A" / "...more Q&As"
```

**Key naming rules:**
- Localized UI chrome must have keys (no literal strings in components).
- Mode labels, ECC labels, button labels, placeholders, tooltips, toasts → all keyed.
- Long-form Intro/HowTo/FAQ → single `howTo.content` + `faq.content` keys (or separate per question; ui-engineer decides).
- Top-level `title` and `description` (consumed by home card grid + footer + searchable-tools) MUST exist.
- Top-level `meta.title` and `meta.description` (consumed by generateMetadata + StructuredData) MUST exist.
- **NO interpolation in keys themselves.** Use `{current}/{max}` in messages, not `tools.qr-code.charCount.{max}`.

---

## 4. Platform Wiring Diffs

### A. Registry Entry in `src/tools/registry.ts`

Add to `tools` array:

```typescript
{
  id: 'qr-code',
  slug: 'qr-code',
  category: 'converter',
  icon: 'QrCode',
  accent: 'sky',
  status: 'live',
  isNew: true,
  order: 21,
  keywords: [
    'QR', 'QR코드', 'QR코드생성', '큐알코드', 'QR generator', 'QR code',
    'Wi-Fi', 'vCard', 'URL', '이메일', '문자', 'email', 'SMS',
    '변환', 'converter', 'scan', '스캔'
  ],
},
```

### B. Page Component Wiring in `src/app/[locale]/tools/[slug]/page.tsx`

**1. Dynamic import (after SpeedQuiz import):**

```typescript
const QRCodeGenerator = dynamic(() =>
  import('@/components/tools/qr-code/QRCodeGenerator').then((m) => ({
    default: m.QRCodeGenerator,
  }))
);
```

**2. generateMetadata branch (add to slug===... chain):**

```typescript
} else if (slug === 'qr-code') {
  title = t('meta.title');
  description = t('meta.description');
```

**3. ToolContent slug branch (add alongside other tools):**

```typescript
if (slug === 'qr-code') {
  return (
    <>
      <QRCodeStructuredData />
      <QRCodeIntro />
      <QRCodeGenerator locale={locale} />
      <QRCodeHowTo />
      <QRCodeFaq />
    </>
  );
}
```

### C. i18n Keys Registration

Add `tools.qr-code.*` to `src/i18n/messages/ko.json` and `src/i18n/messages/en.json` with the complete key tree above.

---

## 5. Component Inventory & Ownership

### UI Components (`src/components/tools/qr-code/`)

| Component | File | Props Signature | Owner | SSR Safe? |
|-----------|------|-----|-------|---------|
| `QRCodeGenerator` | `QRCodeGenerator.tsx` | `{ locale: string }` | UI Engineer | ✓ (use client) |
| `QRCodeIntro` | `QRCodeIntro.tsx` | none | UI Engineer | ✓ (Server) |
| `QRCodeHowTo` | `QRCodeHowTo.tsx` | none | UI Engineer | ✓ (Server) |
| `QRCodeFaq` | `QRCodeFaq.tsx` | none | UI Engineer | ✓ (Server) |
| `QRCodeStructuredData` | `QRCodeStructuredData.tsx` | none | SEO Engineer | ✓ (Server) |
| `InputModeSelector` | `InputModeSelector.tsx` | `{ mode: InputMode, onModeChange: (m: InputMode) => void }` | UI Engineer | Client |
| `InputArea` | `InputArea.tsx` | `{ mode: InputMode, value: string, onChange: (v: string) => void, maxLength: number, isLoading?: boolean }` | UI Engineer | Client |
| `ECCSelector` | `ECCSelector.tsx` | `{ value: ECCLevel, onChange: (ecc: ECCLevel) => void }` | UI Engineer | Client |
| `SizeControls` | `SizeControls.tsx` | `{ size: number, quietZone: number, onSizeChange: (n) => void, onQzChange: (n) => void }` | UI Engineer | Client |
| `ColorPickers` | `ColorPickers.tsx` | `{ fgColor: string, bgColor: string, onFgChange: (hex) => void, onBgChange: (hex) => void, contrast?: number, isContrastAcceptable?: boolean }` | UI Engineer | Client |
| `LogoUpload` | `LogoUpload.tsx` | `{ logoUrl?: string, onLogoUrlChange: (url?: string) => void }` | UI Engineer | Client |
| `QRPreview` | `QRPreview.tsx` | `{ result?: QRGenerationResult, isLoading?: boolean, error?: Error }` | UI Engineer | Client |
| `DownloadButtons` | `DownloadButtons.tsx` | `{ result?: QRGenerationResult, isContrastAcceptable?: boolean, onConfirmLowContrast?: () => void }` | UI Engineer | Client |
| `ContrastWarning` | `ContrastWarning.tsx` | `{ isVisible: boolean, contrastValue: number, onConfirm?: () => void }` | UI Engineer | Client |

**QRCodeGenerator Internal State & Hooks:**

The `QRCodeGenerator` (use client) owns:
- `useQRCode()` hook (mode, input, options, logoUrl state + debounced encode).
- Top-level error boundary / error toast.
- Keyboard shortcuts (Cmd+S download, Cmd+C copy).
- Layout (2-col desktop, stacked mobile).
- Form panel (inputs, selectors, controls).
- Preview panel (sticky right on desktop).
- Reduced-motion gate (instant color transitions).

All child components are dumb props-only; parents wire callbacks.

---

## 6. Build Order & Parallelization

### Phase 1: Domain (Blocking)
Must complete before UI/Usecase.

- [ ] domain-engineer: `src/lib/qr-code/{types,schema,format,encoder,contrast,svg-export,index}.ts`
  - TDD Red→Green→Refactor.
  - Vitest ≥80% coverage (`vitest run`).
  - No React/Next imports.
  - Target: 200–300 lines total.

**Unblocks:** usecase, UI tests, E2E.

### Phase 2: Usecase & Platform (Parallel after Phase 1)

**Path A: Usecase**
- [ ] domain-engineer: `src/components/tools/qr-code/useQRCode.ts`
  - Vitest unit tests (debounce, localStorage, error handling).
  - Dynamic import qrcode.
  - Debounced encode (100ms).
  - localStorage schema + safe-parse.

**Path B: Platform**
- [ ] platform-engineer:
  - Add registry entry (`src/tools/registry.ts`).
  - Add page.tsx branches (dynamic import, generateMetadata, ToolContent slug).
  - Add `tools.qr-code.*` i18n keys to ko.json + en.json (placeholder values ok; ui-engineer rewrites).

Both finish in parallel; no ordering.

### Phase 3: UI Components (Parallel after usecase ready)

- [ ] ui-engineer (team of 2–3, divide by component):
  - **Batch A:** InputModeSelector, InputArea, ECCSelector, SizeControls → form controls.
  - **Batch B:** ColorPickers, LogoUpload → advanced options.
  - **Batch C:** QRPreview, DownloadButtons, ContrastWarning → preview & actions.
  - **Batch D:** QRCodeGenerator (main SPA orchestrator).
  - Vitest unit + component (catalog-injected useQRCode mock).
  - i18n keys finalized.
  - Responsive (320, 768, 1024) verified via Tailwind tokens (no phantom tokens).

**Unblocks:** SEO, E2E, integration.

### Phase 4: SEO & Intro/HowTo/FAQ (Parallel after Phase 3 starts)

- [ ] seo-geo-engineer:
  - `QRCodeStructuredData.tsx` (SoftwareApplication + FAQPage JSON-LD, url==canonical, prerirender, no mounted gate).
  - `QRCodeIntro.tsx` (H1 + lead, SSR outside mounted gate).
  - `QRCodeHowTo.tsx` (long-form, SSR).
  - `QRCodeFaq.tsx` (FAQPage JSON-LD).
  - `src/lib/seo.ts`: add `qr-code` branch (if needed for custom meta).
  - Verify i18n keys complete.

### Phase 5: Integration QA & E2E (After Phase 3 + Phase 4)

- [ ] qa-integration:
  - Vitest: all modules ≥80% (domain 100%, ui ≥70%).
  - `tsc --noEmit` 0 errors.
  - `pnpm build` 1x SSG route.
  - E2E Playwright scenarios (6):
    1. Text input → preview → download PNG.
    2. URL mode → contrast warning → override → download SVG.
    3. Wi-Fi mode → contrast check.
    4. vCard mode → download PNG.
    5. Email + SMS modes.
    6. Logo upload → preview → download.
    7. Keyboard shortcuts (Cmd+S, Cmd+C).
    8. Mobile 320px responsive, no overflow.
    9. Reduced-motion off/on → instant / fade.
    10. ko/en locale switch → labels persist.
  - Visual regression (Playwright screenshots) 320 / 768 / 1024px.
  - a11y (axe) automated scan.
  - Canvas/SVG PNG content spot-check (data matches input).

### Phase 6: Deployment (After Phase 5 passes)

- [ ] deploy-engineer:
  - `git push` to `main`.
  - CF Pages build complete.
  - Verify `curl -I https://apps.jurepi.kr/[ko|en]/tools/qr-code` → 200, canonical/hreflang, JSON-LD present.
  - Live ✓.

**Total parallelization:** Domain → (Usecase + Platform) → UI → (SEO + E2E in parallel) → Deploy.

---

## 7. Key Design Decisions & Rationale

### Error Strategy
**Decision:** Throw typed errors in domain, catch + toast in UI.

**Rationale:** Domain layer cannot know about UI notifications (Toast, modal). Usecase layer translates domain errors to user-friendly messages.

### Color Picker UI
**Decision:** Manual hex text input + palette shortcut buttons; NO color picker library (e.g., react-color).

**Rationale:** SPEC avoids dependencies; Jurepi is lightweight. Hex input + 6 accent buttons (from DESIGN) are sufficient. Palette shortcut buttons apply to fg or bg (decided by component state, not complex).

### Canvas vs. SVG
**Decision:** Canvas for PNG download (faster), SVG hand-rolled from matrix (no dep).

**Rationale:** Both deterministic. Canvas leverages browser's native PNG export. SVG is pure XML, no external library, reproducible.

### Persistence Strategy
**Decision:** useQRCode hook owns localStorage, zod-validated on read, silent fallback on error.

**Rationale:** No backend. Stores recent inputs (max 5, 100 chars each) + last mode/ECC/colors for UX convenience. Fail-silent (no throw) because storage unavailable is not a tool blocker (fallback to defaults).

### Debounce Rate
**Decision:** 100ms debounce on encode (SPEC constant DEBOUNCE_MS).

**Rationale:** Live preview responsive to keystroke without thrashing canvas render. Modern browsers can handle 100ms intervals without lag.

### Quiet Zone
**Decision:** User controls 4–8 modules, default 4.

**Rationale:** SPEC; quiet zone (margin around QR) is optional in ISO 18004 but improves scannability. User choice adds professional touch.

---

## 8. SPEC Ambiguities Resolved

1. **Mode-specific structured inputs (wifi/vcard/email/sms):** Decided each mode exports a `Format*Fields` interface + single `formatData(mode, fields): string` dispatcher. Alternative: per-mode hook (too verbose). Chosen: dispatcher.

2. **Error handling in domain:** Decided throw typed errors (`QREncodingError`, `ContrastError`) rather than Result type (which adds ceremony). Async encoder OK since usecase can await.

3. **Logo rendering:** Spec says "25% of QR size, centered". Decided: scale logo image to fit in 25% center square, no cropping (preserve aspect ratio). If logo too large, it obscures QR center; user's responsibility to provide appropriately-sized logo.

4. **Keyboard shortcuts:** Cmd+S / Ctrl+S → Download PNG. Cmd+C / Ctrl+C → Copy to Clipboard. Decided: orchestrator hook captures globally, prevents default (browser Save/Copy). Accessibility: focus on download button → Enter also triggers download.

5. **Reduced-motion:** All color/size transitions instant when `prefers-reduced-motion: reduce`. Canvas render always instant (no animation).

6. **i18n for QR data:** QR data (Wi-Fi SSID, vCard fields, etc.) is locale-agnostic. Placeholders + labels localized, but data itself is user-provided.

---

## 9. Testing Strategy Pointers

### Unit Tests (Vitest)
- **Domain:** encoder + matrix shape, contrast deltaE, SVG XML validity, format escaping (wifi/vcard/email/sms), schema validation.
- **Usecase:** debounce timing, localStorage round-trip, error propagation.
- **UI:** component props, callback firing, conditional rendering (loading/error/empty).

### E2E Tests (Playwright)
- **Scenario 1:** Text "Hello" → live preview → download PNG → PNG binary contains QR data.
- **Scenario 2:** URL "jurepi.kr" → low contrast warning → override → SVG download valid.
- **Scenario 3:** Wi-Fi SSID + password → WIFI:... format in QR.
- **Scenario 4:** Mobile 320px → no overflow, form + preview stack vertically.
- **Scenario 5:** Reduced-motion ON → instant transitions, no 150ms fade.
- **Scenario 6:** Ko/En switch → labels localized, QR data unchanged, localStorage intact.

### Visual Regression
- Playwright screenshots at 320, 768, 1024px.
- Both light (default) and dark theme (if toggled on during session; dark is Phase 2 opt-in, not default).
- Contrast indicator colors (good/warn/poor dots).
- Logo preview 100×100px.

### Code Coverage
- Domain: **100%** (encoder, contrast, svg-export, format).
- Usecase: **≥80%** (debounce edge cases, localStorage fail fallback).
- UI: **≥70%** (component render, callbacks; canvas/file I/O partially mocked in vitest, fully tested in E2E).

---

## Checklist: Architect Deliverable

- [x] Layer decomposition (domain ← usecase ← adapter ← framework).
- [x] Exact TypeScript signatures for all domain modules.
- [x] zod schemas + defaults.
- [x] Error strategy (throw typed) declared once.
- [x] i18n key tree (no phantom keys, top-level title/description/meta.title/meta.description required).
- [x] Platform diffs: registry, page.tsx branches, i18n registration.
- [x] Component inventory: props, ownership, SSR safety.
- [x] Build order + parallelization graph.
- [x] SPEC ambiguities resolved.
- [x] Testing strategy pointers.

**Total lines of domain:** ~400 lines (encoder + contrast + svg-export + format + schema).  
**Total lines of usecase:** ~150 lines (useQRCode hook).  
**Total lines of UI (all components):** ~800 lines (split across 13 components).  
**Total lines of platform/wiring:** ~20 lines diffs.

---

**Blueprint Author:** Architect  
**Status:** Ready for team implementation  
**Next Step:** Team lead assigns domain-engineer Phase 1; all teams await Phase 1 completion before their work begins.
