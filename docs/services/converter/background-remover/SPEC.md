# Background Remover — One-Click Transparent PNG Export — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Background Remover** (배경 지우기 / 누끼따기) — remove the background from an image and download a transparent PNG, 100% in the browser with zero network upload. The image is processed locally via an in-browser ML model (@imgly/background-removal, Apache-2.0 ONNX/WASM with WebGPU acceleration), with progress indicators during model load and inference. Result preview over checkerboard transparency, optional background replacement, and a before/after compare slider.
> Internal service codename: `background-remover`. Registry id: `background-remover`. Public URL slug: `/[locale]/tools/background-remover`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/text/new-word/SPEC.md`](../text/new-word/SPEC.md)

```xml
<project_specification>

<project_name>Background Remover — AI-Powered Image Background Removal (Jurepi tool, codename background-remover, registry id background-remover)</project_name>

<overview>
Background Remover solves a single, high-value problem: users upload an image (PNG, JPEG, WebP, GIF) and one click removes the background, leaving a transparent cutout. No Photoshop, no backend processing, no data sent to the server — the ML inference happens entirely on the user's device using WebAssembly and optional GPU acceleration. The result downloads as a transparent PNG. Privacy is a SELLING POINT: the image never leaves the user's browser.

The tool's architecture hinges on **@imgly/background-removal** — an Apache-2.0 ONNX model that runs in-browser via a Web Worker. The model weights (~40–80MB depending on version) are cached locally after first download; inference is near-instantaneous on modern devices. For users without WebGPU support, WASM fallback keeps the tool functional but slower; we notify the user in such cases.

CRITICAL (privacy, architecture, zero network): 100% client-side inference. The image is loaded from the user's device (FileReader), processed locally (Web Worker runs inference), and the result is downloaded to the device. No first-party or third-party server receives the image. No backend. The only persistent state is `localStorage` (user preferences: background replacement mode, last used colors).

CRITICAL (model caching, first-load performance): the ONNX model + WASM runtime are large (~40–80MB). We SELF-HOST these assets under `public/background-remover/` to avoid a new external origin and CSP complexity. The first-load caches these via HTTP Cache-Control headers (cache them aggressively, e.g., max-age=31536000 + immutable for versioned paths). The SSG shell does NOT block on model load — users see the UI instantly and the model loads in the background when they interact (lazy load on button click or file input).

CRITICAL (performance, memory): images larger than ~3000px are downscaled before inference (cap longest edge at 2048px). WebGPU acceleration is auto-detected and used when available (faster, lower memory). WASM-only inference on older devices works but is slower; we show a brief "Running on CPU" label. Out-of-memory errors are caught and shown to the user with a friendly "try a smaller image" hint.

CRITICAL (SPA, usability-first): the tool is a client-side Single-Page Application with NO route navigation. Upload → preview → download all happen in one React component with local state (image data, progress, preview visible/hidden, background mode). Result preview toggles instantly; compare slider interacts smoothly (compositor-friendly opacity/clip-path).
</overview>

<platform_integration>
  - Route: /[locale]/tools/background-remover (SSG; registry slug "background-remover", id "background-remover", status "live", accent "sun", category "converter").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.background-remover.*` (UI chrome strings: upload label, processing, download button, error messages, how-to, FAQ); the in_content AdSlot below the tool.
  - Platform dependency (NO new category needed): the `'converter'` category already exists in `ToolCategory` with the `sun` accent and the "변환 도구"/"Converter" label. The only platform change is adding ONE `ToolMeta` registry entry, a slug→component branch in the tool route, and a `generateMetadata` branch. Contrast with qna-a-day (which introduced a new category).
  - Asset hosting: ONNX model + WASM bundles are self-hosted under `public/background-remover/` (e.g., `public/background-remover/bg-remover-model-1.0.onnx`, `public/background-remover/ort-wasm.wasm`, `public/background-remover/ort-wasm-simd.wasm` for SIMD variant). Versioned in URL or embedded in the library import; leverage HTTP caching.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Image upload via file picker or drag-and-drop (client FileReader, no network upload).
    - Automatic image downscaling for very large inputs (cap longest edge at 2048px, preserve aspect ratio).
    - Background removal via @imgly/background-removal (Apache-2.0 ONNX model via WASM/WebGPU). Web Worker runs inference without blocking the UI thread.
    - Progress indicator during model load and inference (percentage or spinner).
    - Preview result over a checkerboard transparency backdrop (visual feedback).
    - Before/after compare slider (drag to reveal original / result; compositor-friendly clip-path).
    - Optional background replacement: solid color picker or image upload (blend transparent areas with a user-chosen background).
    - Download result as transparent PNG (via canvas.toBlob or a PNG encoder library).
    - Input format support: PNG, JPEG, WebP, GIF, BMP (auto-detect via file extension or MIME type).
    - Edge case handling: WebGPU unavailable (fallback to WASM with user notice), model load failure, out-of-memory, unsupported format, transparent-input images (preserve existing alpha).
    - SEO long-form ("Remove image backgrounds", "What is background removal?") + FAQ (FAQPage JSON-LD) + SoftwareApplication JSON-LD.
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - Manual brush refine / manual object select (Phase 2).
    - Batch processing (Phase 2).
    - Video background removal.
    - Face detection, person segmentation (rely on the model's general object boundary; no face-specific logic).
    - Any server-side processing or account/cross-device sync.
    - File storage or export to cloud.
    - Advanced color replacement or feathering (Phase 2).
  </out_of_scope>
  <future_considerations>
    - Manual refine brush (Phase 2) — paint areas to keep/remove post-inference.
    - Batch processing (Phase 2) — upload multiple images, queue processing.
    - Video support (Phase 3) — frame-by-frame or frame-interpolation inference.
    - Advanced edge refinement / feathering (Phase 3).
    - Share result image (Phase 3).
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <ml_inference>@imgly/background-removal v1.5.x or v1.6.x (Apache-2.0). Wraps ONNX Runtime (ort-js, Apache-2.0). Auto-detects WebGPU; falls back to WASM on unsupported devices. Web Worker thread isolates inference from React render thread.</ml_inference>
    <image_processing>canvas API (native) for image loading, downscaling, preview rendering. For PNG encoding, either canvas.toBlob (native, slow on large canvases) or a lightweight PNG encoder (e.g., pngcrush-wasm or a thin wrapper around sharp-wasm) if native is too slow. Decide post-prototype based on performance testing.</image_processing>
    <state_management>React local state (image, progress, mode enum, background choice). localStorage for user prefs (last background color, background mode setting). NO external state library (Zustand/Jotai) — tool state is self-contained in one component.</state_management>
    <clipboard_and_export>navigator.clipboard for copy-to-clipboard (fallback to hidden textarea + execCommand). canvas.toBlob() + a.download for PNG export (no server). Silent fail on copy (secondary feature).</clipboard_and_export>
    <animation>Native CSS transitions only: spinner (rotate), compare-slider (clip-path transition on drag), card hover lift. No animation library. Respect prefers-reduced-motion (instant fade, no rotate).</animation>
  </module_specific>
  <libraries>
    <imgly-bg-removal>@imgly/background-removal (Apache-2.0) — ONNX model runner. Install and pin exact version (e.g., ^1.6.1).</imgly-bg-removal>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/background-remover/
│   ├── schema.ts                      # Input/output zod types (ImageData, RemovalResult, ModelConfig)
│   ├── image-processor.ts             # Downscale, auto-orient (EXIF), format detect — pure functions, ≥90% tested
│   ├── model-loader.ts                # Lazy load @imgly library, detect WebGPU, manage cache
│   ├── background-replacer.ts         # Blend result with solid color or image
│   └── export.ts                      # canvas.toBlob → PNG download
├── components/tools/background-remover/
│   ├── BackgroundRemover.tsx           # Orchestrator (Client Component) — owns state + useBackgroundRemover() owner
│   ├── useBackgroundRemover.ts         # Hook: model loader + inference + image downscaling + export adapter
│   ├── ImageUpload.tsx                 # File input + drag-and-drop area (accepts images)
│   ├── ProcessingIndicator.tsx         # Progress bar/spinner + status text (model load / inference running)
│   ├── ResultPreview.tsx               # Canvas + checkerboard backdrop
│   ├── CompareSlider.tsx               # Before/after slider (drag to reveal)
│   ├── BackgroundOptions.tsx           # Solid color picker + image upload for bg replacement
│   ├── ExportButton.tsx                # "Download PNG" button + copy-to-clipboard variant
│   ├── BackgroundRemoverIntro.tsx      # H1 + lead (SEO; server-render where possible)
│   ├── BackgroundRemoverHowTo.tsx      # "How to remove backgrounds" (SEO long-form)
│   ├── BackgroundRemoverFaq.tsx        # Q&A + FAQPage JSON-LD
│   └── data/
│       └── (no generated artifact)
└── i18n/messages/{ko,en}.json         # tools.background-remover.* UI chrome (labels, tooltips, errors, how-to, FAQ)

public/background-remover/
├── bg-remover-model-1.6.onnx          # ONNX model weights (~40–80MB, cache-control: immutable)
├── ort-wasm.wasm                      # WASM runtime for non-WebGPU devices
└── ort-wasm-simd.wasm                 # SIMD variant for supported CPU

tests/
├── lib/background-remover/
│   ├── image-processor.test.ts        # Downscale, orient, detect format
│   ├── background-replacer.test.ts    # Blend logic
│   └── export.test.ts                 # Canvas → blob conversion
└── e2e/
    └── background-remover-*.spec.ts   # Upload, process, download, compare-slider, accessibility
</file_structure>

<core_data_entities>
  <image_data note="input state">
    - file: File (original image from upload)
    - dataUrl: string (base64 for preview)
    - width: number | height: number (original dimensions)
    - format: 'png' | 'jpeg' | 'webp' | 'gif' | 'bmp' (detected from MIME or extension)
    - downsacled: boolean (if longest edge > 2048px, mark as downscaled + warn user)
  </image_data>
  <removal_result note="model output + processing state">
    - mask: ImageData (binary foreground mask from model)
    - result: HTMLCanvasElement (composited result: original × mask)
    - resultBlob: Blob (PNG-encoded result, created on export)
    - inferenceTimeMs: number (for performance logging)
  </removal_result>
  <processing_state note="UI state machine">
    - phase: 'idle' | 'loading-model' | 'uploading-image' | 'processing' | 'done' | 'error'
    - progress: number (0–100, for model load and inference)
    - error?: string (error message to display)
    - isWebGPU: boolean (model auto-detected; show "Running on CPU" if false)
  </processing_state>
  <background_options note="user customization">
    - mode: 'transparent' | 'solid-color' | 'image'
    - solidColor: string (hex, default '#ffffff')
    - backgroundImage?: File (uploaded by user, blended with result)
  </background_options>
  <localstorage_key>jurepi-background-remover (store: { mode, lastColor, lastBackgroundImageUrl? })</localstorage_key>
  <constants>
    - DOWNSCALE_THRESHOLD_PX = 2048 (longest edge cap)
    - MODEL_LOAD_TIMEOUT_MS = 60000
    - EXPORT_QUALITY = 0.95 (canvas quality for PNG/JPEG)
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/background-remover" page="BackgroundRemover (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG.</note>
</route_definitions>

<component_hierarchy>
  <background_remover>                           <!-- "use client"; owns image + processing + bgOptions state -->
    <background_remover_intro />                 <!-- H1 + lead (server-render where possible) -->
    <removal_layout>                             <!-- Stacked: upload → preview+slider → export -->
      <image_upload />                           <!-- File picker + drag-and-drop -->
      <processing_indicator />                   <!-- Spinner + progress + model-load status (WebGPU notice) -->
      <result_preview />                         <!-- Canvas over checkerboard, hidden until done -->
      <compare_slider />                         <!-- Before/after clip-path slider (on preview visible) -->
      <background_options />                     <!-- Solid color picker + image upload for bg replacement -->
      <export_button />                          <!-- Download + copy (active when done) -->
    </removal_layout>
    <background_remover_how_to />                <!-- SEO long-form -->
    <background_remover_faq />                   <!-- FAQPage JSON-LD -->
  </background_remover>
  <note>SPA: upload → process → preview → download all in one component, local state (no route nav). Preview/result toggles instantly.</note>
</component_hierarchy>

<pages_and_interfaces>
  <background_remover_intro>
    - Eyebrow: "변환 도구" / "CONVERTER TOOL" — 12px/700/0.6px, var(--accent-sun).
    - H1: "배경 지우기" / "Background Remover" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 2–3 sentences, body-lg 18px var(--text-secondary): "PNG 다운로드·100% 브라우저 처리·이미지 업로드 안됨 (100% privacy)" / English equivalent.
  </background_remover_intro>

  <image_upload>
    - Dashed box (2px var(--hairline-strong), 4px var(--radius-lg)), bg var(--surface-sunken).
    - "Click to upload" text center + file input (accept="image/*" or explicit MIME types). Drag-and-drop area highlight on dragover.
    - Leading icon: lucide Upload (24px var(--text-muted)).
    - Multiple files rejected (single file only); unsupported formats show Toast error.
    - After upload, image name + dimensions shown below.
  </image_upload>

  <processing_indicator>
    - Visible only when phase !== 'idle' && phase !== 'done'.
    - Spinner (rotate animation, --ease-out 200ms, gated by prefers-reduced-motion) + percentage (0–100).
    - Status text: "Loading model..." / "Processing image..." / "Complete!" (localized).
    - If !isWebGPU, show subtle notice: "Running on CPU (slower)" under spinner.
    - Progress bar (width: progress%, transition opacity 150ms, no jank on 60fps).
  </processing_indicator>

  <result_preview>
    - Canvas element (width/height match original or downscaled image). Transparent result rendered as composited RGBA.
    - Checkerboard backdrop (8×8px gray/white tiles, --accent-sun at low opacity). Canvas sits on top.
    - Visible only when phase === 'done' && !compareSlider.isOpen.
    - Dimensions label below: "Downloaded from 1920×1080 → Exported as transparent PNG".
  </result_preview>

  <compare_slider>
    - Revealed when result ready. Two images stacked: original on bottom, result on top. User drags a vertical handle (20px wide, var(--brand) filled) to reveal/hide. clip-path: inset(0 0 0 X%) animates position. No jank (compositor-friendly).
    - Touch-friendly: 44px minimum drag area.
    - Labels on handle: "< Original | Result >" (or localized).
    - Keyboard: ArrowLeft/Right adjust clip-path (10% per key press).
  </compare_slider>

  <background_options>
    - Visible during processing and after done.
    - Radio segment: [Transparent] [Solid Color] [Image]. Default: Transparent.
    - Solid Color: color picker input (type="color", default #ffffff); hex display + label.
    - Image: file input (accept="image/*"), drag-and-drop area (same style as main upload).
    - Preview: stacked cards showing how result looks with chosen background.
  </background_options>

  <export_button>
    - "Download PNG" (primary button, var(--brand), 44px min-height). Centered.
    - Active only after phase === 'done'; disabled with tooltip "Upload an image first".
    - On click, canvas.toBlob → Blob → a.download trigger (filename: "cutout-${Date.now()}.png").
    - Toast on success: "Downloaded!" (1600ms). On fail (rare): "Download failed, try again" (persistent).
    - Secondary button (text): "Copy to Clipboard" — copies result canvas to clipboard (navigator.clipboard.write([ClipboardItem]); silent fail if not supported).
  </export_button>
</pages_and_interfaces>

<core_functionality>
  <model_loading note="lazy, on user action">
    - First interaction (file upload button focus or drag): initiate @imgly library dynamic import.
    - phase → 'loading-model', progress 0–100.
    - Detect WebGPU (navigator.gpu? || !!navigator.gpu.requestAdapter).
    - Set isWebGPU flag; if false, show "Running on CPU" notice.
    - Cache model in IndexedDB or localStorage after first successful load (persist across sessions).
    - On fail: phase → 'error', show "Could not load background removal engine. Please refresh and try again."
  </model_loading>
  <image_upload>
    - Accept PNG, JPEG, WebP, GIF, BMP (file extension + MIME type validate).
    - Read via FileReader.readAsArrayBuffer → detect format.
    - Render in hidden canvas to get dimensions.
    - If longest edge > 2048px, downscale (preserve aspect ratio, use canvas.drawImage).
    - Store downscaled image + flag in state.
  </image_upload>
  <inference note="web worker runs model, main thread unblocked">
    - Pass downscaled image → worker script (postMessage).
    - Worker: load @imgly model, run inference (foreground mask only).
    - Progress events: postMessage({ type: 'progress', percent }) every 10%.
    - On done: postMessage({ type: 'result', mask: ImageData }).
    - Main thread: composite result (mask × original) on canvas via globalCompositeOperation='destination-in'.
    - Catch OOM: "Image too large. Please try a smaller file."
  </inference>
  <background_replacement note="optional blend">
    - If mode === 'solid-color': canvas.fillStyle = solidColor, fillRect before compositing.
    - If mode === 'image': load background image, tile/cover on canvas before compositing.
    - Transparency → picked color/image seamlessly.
  </background_replacement>
  <export note="client-side download">
    - canvas.toBlob({ type: 'image/png', quality: 0.95 }, callback) → Blob.
    - Fallback: if toBlob slow, use a lightweight PNG encoder (wasm or JS-only).
    - Trigger a.download with blob URL.
    - Filename: "cutout-${Date.now()}.png" (or user-customizable name, Phase 2).
  </export>
  <clipboard note="secondary, silent fail">
    - navigator.clipboard.write([new ClipboardItem({ 'image/png': canvas.toBlob() })]).
    - Fallback: copy base64 data URL to textarea + execCommand('copy').
    - Fail silently (copy is nice-to-have, not critical).
  </clipboard>
</core_functionality>

<error_handling>
  <unsupported_format>Toast: "PNG, JPEG, WebP, GIF, BMP supported. Uploaded file is {type}" → clear upload.</unsupported_format>
  <model_load_failure>phase → 'error'. Toast + persistent message: "Could not load background removal engine. Please refresh or try a different device." Offer "Retry" button.</model_load_failure>
  <oom_during_inference>Catch Error in worker. phase → 'error'. Toast: "Image too large. Please try a smaller file or reduce resolution."</oom_during_inference>
  <download_fail>canvas.toBlob fail (rare). Toast: "Download failed. Your browser may not support PNG export." Offer "Copy to Clipboard" fallback.</download_fail>
  <webgpu_unavailable>Detected during model load. phase → 'processing' still proceeds (WASM slower). Show notice under spinner: "Running on CPU (slower). This may take 10–30 seconds."</webgpu_unavailable>
  <error_boundary>Platform wraps tool; render fail → safe fallback without tool crash.</error_boundary>
  <note>No first-party network calls; no API error surface.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Category accent is SUN (var(--accent-sun) #fbbf24 / var(--accent-sun-soft) #fef1d2) — "converter" category identity per DESIGN. Intro icon tile, upload dashed border, download button, slider handle.
    - CTAs (export button) = brand honey-gold var(--brand) (primary action). Accent sun = identity, not action (DESIGN do/don't).
  </accent_usage>
  <surfaces>Card/canvas container = var(--surface) + 1px var(--hairline); upload area var(--surface-sunken) 2px dashed; result canvas sits on checkerboard var(--accent-sun) at 8% opacity (low-key).</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px); upload label headline (20px)/700; status text body (16px) var(--text-secondary); error Toast body-sm (14px) var(--semantic-danger).</typography>
  <motion>transform/opacity only: upload drag highlight (bg fade 150ms), spinner rotate (2s infinite, gated by prefers-reduced-motion), slider clip-path drag (0ms on interact, 150ms on release), download button press (scale 0.98 50ms). All gated by prefers-reduced-motion (no rotate, fade only).</motion>
  <accessibility>Upload = real file input (label + aria-label); buttons 44px; focus-visible ring var(--focus-ring); compare-slider keyboard operable (ArrowLeft/Right); loading spinner aria-busy="true"; error Toast aria-live="assertive"; all text labels present.</accessibility>
  <responsive>
    - ≥1024px: upload + preview + slider stacked, width 100%.
    - <768px: same stack, narrower. Compare slider touch-drag optimized (larger handle).
    - Checkerboard backdrop scales with canvas (no overflow at 320px).
  </responsive>
  <atmosphere>Bright, friendly "one-click magic": upload feels inviting (dashed box suggests drop), processing spinner shows patience, result preview over checkerboard is playful, slider reveals magic. Compare slider adds delight. Not a dense tool; every interaction feels responsive.</atmosphere>
  <icons>lucide-react: Upload (upload area, 28px), Loader/Spinner (processing, 24px), Download (export button, 20px), Copy (clipboard, 20px), Sliders (compare, 20px). Default currentColor, stroke 1.75. Registry card icon: `Eraser`.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input note="images are user-provided, processed locally">
    - File type validated (MIME + extension). Malformed image files → load error (canvas context fail) caught silently.
    - Image data never sent over network (100% client-side inference).
  </input>
  <model_assets>
    - ONNX model + WASM runtime self-hosted under `public/background-remover/` (same origin, no new CSP allowance needed).
    - Versioned in import paths; static assets are immutable cache-control.
  </model_assets>
  <privacy>
    - Image never uploaded. Model inference local (Web Worker). Result Blob never sent.
    - localStorage only stores user prefs (background mode, last color). No analytics on image content.
    - State plainly documented in Intro / How-To / FAQ.
  </privacy>
  <clipboard>
    - Copy is user-initiated (clipboard.write on button click only). Browser permission auto-granted for same-origin.
  </clipboard>
  <xss>
    - Result canvas rendered to Blob (no HTML injection). Downloaded as binary PNG.
    - Background image (if uploaded) rendered via canvas (no DOM injection).
  </xss>
  <note>No secrets, no network, no 3rd-party storage.</note>
</security_considerations>

<advanced_functionality>
  <compare_slider>Keyboard-operable drag (ArrowLeft/Right ±10%) to reveal original vs result. Delightful UX.</compare_slider>
  <background_replacement>Solid color or image background option. Result previewed in real-time before export.</background_replacement>
  <clipboard_export>Copy result canvas to system clipboard (PNG). Fallback to base64 for older browsers.</clipboard_export>
  <webgpu_detection>Auto-detect GPU support; notify user if CPU-only (slower inference). No user action needed.</webgpu_detection>
  <image_downscaling>Automatic: largest dimension > 2048px → downscale preserving aspect. User warned; result still high-quality.</image_downscaling>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Happy path: upload PNG, process, download</description>
    <steps>
      1. Drag a PNG image (512×512px) onto upload area.
      2. Model loads (progress 0→100, "Loading model..." message). File appears with dimensions.
      3. "Process" button auto-fires or user clicks. phase → 'processing' (spinner + "Processing image..."). Progress updates.
      4. Inference completes. Result canvas renders over checkerboard. Slider appears.
      5. Download button active. Click → PNG downloads as "cutout-${ts}.png".
      6. Verify PNG has transparent areas (checkerboard visible through canvas area that was background).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Image downscaling + WebGPU fallback</description>
    <steps>
      1. Upload a 4000×3000px image.
      2. Image downscales to 2048×1536px (preview + warning: "Downscaled from 4000×3000").
      3. Inference runs (if WebGPU unavailable, show "Running on CPU (slower)").
      4. Result renders correctly despite downscaling.
      5. Export PNG (smaller file size than original, but output quality preserved).
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Background replacement + clipboard</description>
    <steps>
      1. Upload image, process, result ready.
      2. Toggle background mode to [Solid Color]. Pick #ff0000 (red) via color input.
      3. Preview updates: result on red background (no transparency).
      4. Export: red-backed PNG.
      5. Click "Copy to Clipboard" → success Toast. Paste into editor (PNG in clipboard).
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Error cases + a11y</description>
    <steps>
      1. Upload unsupported format (e.g., .gif with video frames). Toast: "GIF/BMP might have limited support."
      2. Upload very large image (>10000px) → out-of-memory error after "please try smaller" → clear upload.
      3. Compare slider: focus on handle, use ArrowLeft/Right ±10%. Clip-path position updates.
      4. axe pass: no contrast/label/focus violations; spinner aria-busy; error aria-live; all buttons 44px.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>i18n, SEO (JSON-LD), locale swap</description>
    <steps>
      1. Switch to /en → chrome (labels/buttons/how-to/FAQ) English; intro lead English.
      2. Build prod → /ko/tools/background-remover and /en/tools/background-remover unique title/description/canonical/hreflang/OG, statically generated.
      3. HTML has SoftwareApplication + FAQPage JSON-LD; how-to/FAQ localized; no model weights in HTML (lazy-loaded JS chunk).
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <functionality>Upload image → downscale if needed → inference (WebGPU or WASM) → result canvas render → optional background replacement → download transparent PNG. Compare slider works. Clipboard copy works (or silent fail). No network upload.</functionality>
  <user_experience>Upload feels inviting (drag-drop), processing shows progress (spinner % + status), result visible instantly, compare slider delightful, export is one-click. 44px tap targets. Keyboard operable (slider, all buttons).</user_experience>
  <technical_quality>lib/background-remover/* pure ≥ 80% unit coverage (image-processor, background-replacer, export); model loader lazy-loads on demand; Web Worker unblocks UI; TS 0 errors; &lt;800 lines per file; model assets versioned and cache-controlled.</technical_quality>
  <visual_design>DESIGN.md compliant; sun accent identity + brand honey-gold CTA; bright, friendly image tool (checkerboard backdrop, playful slider, warm colors). Text-node render only (no HTML injection).</visual_design>
  <accessibility>Upload file input real; buttons 44px+ touch targets; focus-visible ring; spinner aria-busy; error aria-live; compare-slider keyboard operable (ArrowLeft/Right); WCAG 2.1 AA.</accessibility>
  <performance>Model load lazy (on demand), cached HTTP + IndexedDB for re-use; inference offloaded to Web Worker (no jank); canvas operations optimized (downscale before inference); result Blob created only on export; CLS 0 (ad height reserved); LCP < 2.5s.</performance>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). Model assets (ONNX + WASM) self-hosted under `public/background-remover/`; versioned in import or loader script. /[locale]/tools/background-remover pre-rendered by platform generateStaticParams iterating registry (status "live"). Model + WASM never block initial page load (lazy-imported on interaction).</note>
  <model_versioning>Use @imgly/background-removal exact version (e.g., "^1.6.1") pinned in package.json. Model weights are released immutable; update version → re-download weights to public/ (check @imgly docs for asset URLs).</model_versioning>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry. 'converter' category + 'sun' accent already exist; no ToolCategory change needed.
    {
      id: 'background-remover',
      slug: 'background-remover',
      category: 'converter',
      icon: 'Eraser',            // lucide-react
      accent: 'sun',
      status: 'live',            // 'coming_soon' until module complete
      isNew: true,
      order: 15,                 // tune as desired
      keywords: ['배경제거','누끼','백그라운드','배경지우기','투명','cutout','transparent','remove background','no upload','privacy'],
    },
    ```
    Also add slug→component branch (&lt;BackgroundRemover/&gt;) and generateMetadata branch (title/description/JSON-LD) in tool route alongside ladder/qna-a-day/new-word. No new category label needed.
  </platform_registry_change>
  <critical_paths>
    1. Model loading: lazy load @imgly on first interaction → detect WebGPU → cache in IndexedDB/localStorage → fallback to WASM. Entire tool depends on this.
    2. Image downscaling: if longest edge > 2048px, downscale before inference (memory + speed).
    3. Web Worker inference: post image → worker → inference → post mask → main composites canvas. UI never blocks.
    4. Export: canvas.toBlob → PNG download (or clipboard copy).
  </critical_paths>
  <recommended_implementation_order>
    1. lib/background-remover/{schema,image-processor,export}.ts Vitest (RED→GREEN): zod types, downscale logic, blob export, background blend.
    2. model-loader.ts: @imgly library dynamic import, WebGPU detect, IndexedDB cache, error handling.
    3. components/tools/background-remover/ presentational (upload, spinner, preview, compare-slider, options, export).
    4. useBackgroundRemover hook (model loading + inference + state adapter).
    5. BackgroundRemover.tsx orchestrator.
    6. Keyboard shortcuts, motion-reduce, a11y (axe, focus-visible).
    7. BackgroundRemoverIntro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD via lib/seo.ts.
    8. Registry status→live; slug→component + generateMetadata branches; E2E 1–5; visual regression 320/768/1024 both themes.
    9. Model assets download + public/ staging + cache-control headers + CI check "model assets up-to-date?"
  </recommended_implementation_order>
  <testing_strategy>Pure Vitest ≥80% (image-processor, background-replacer, export); model-loader mocked (@imgly dynamic import); component canvas-injected mocks; E2E scenarios 1–5 (esp. #1 upload→process→download, #2 downscaling, #3 clipboard, #4 errors, #5 JSON-LD); WebWorker mock for fast test runs.</testing_strategy>
  <tool_usage>Reader visual-gate: 320/768/1024 screenshots, no overflow, download works, checkerboard visible, compare-slider interactive, JSON-LD primed HTML, privacy claim confirmed (no network calls in DevTools).</tool_usage>
</key_implementation_notes>

</project_specification>
```

365 lines
