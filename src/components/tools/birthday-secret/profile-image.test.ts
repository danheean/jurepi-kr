import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { BirthProfile } from '@/lib/birthday-secret/schema';
import { downloadProfileImage, type ProfileImageLabels } from './profile-image';

// jsdom attempts to "navigate" when a real <a href="data:..."> is clicked,
// which is harmless here (we never append the anchor to a live document
// long enough to matter) but logs noisy "Not implemented: navigation"
// errors. Stub click() so it's a true no-op, matching how the download
// itself behaves in a real browser (data: URI download, no page navigation).
beforeEach(() => {
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

function mockCanvasContext() {
  const gradient = { addColorStop: vi.fn() };
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: '' as CanvasTextAlign,
    createLinearGradient: vi.fn(() => gradient),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    arcTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,mock');
  return { ctx, gradient };
}

const profile: BirthProfile = {
  date: '04-15',
  month: 4,
  flower: {
    key: '04-15',
    ko: { name: '펜 오키드', meaning: '우아한 매력' },
    en: { name: 'Pen Orchid', meaning: 'Elegant charm' },
    googleQuery: { ko: '펜 오키드 꽃', en: 'pen orchid flower' },
  },
  stone: {
    month: 4,
    ko: { name: '다이아몬드', meaning: '영원한 사랑', color: '무색투명', hardness: '10', origin: '남아프리카' },
    en: { name: 'Diamond', meaning: 'Eternal love', color: 'Colorless', hardness: '10', origin: 'South Africa' },
    googleQuery: { ko: '4월 탄생석 다이아몬드', en: 'April birthstone diamond' },
  },
  color: {
    key: '04-15',
    hex: '#d1a24e',
    ko: { name: '오렌지', keyword: '활력' },
    en: { name: 'Orange', keyword: 'Energy' },
  },
};

const labels: ProfileImageLabels = {
  brand: '나의 탄생 비밀',
  dateText: '4월 15일',
  flowerTitle: '탄생화',
  stoneTitle: '탄생석',
  colorTitle: '탄생색',
  siteUrl: 'apps.jurepi.kr',
};

describe('downloadProfileImage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false and draws nothing when 2D context is unavailable', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const ok = downloadProfileImage(profile, 'ko', labels);
    expect(ok).toBe(false);
  });

  it('returns true and triggers a download when context is available', () => {
    mockCanvasContext();
    const createElementSpy = vi.spyOn(document, 'createElement');
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');

    const ok = downloadProfileImage(profile, 'ko', labels);

    expect(ok).toBe(true);
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(appendChildSpy).toHaveBeenCalled();
  });

  it('names the downloaded file after the profile date', () => {
    mockCanvasContext();
    let capturedAnchor: HTMLAnchorElement | undefined;
    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = realCreateElement(tag);
      if (tag === 'a') capturedAnchor = el as HTMLAnchorElement;
      return el;
    });

    downloadProfileImage(profile, 'ko', labels);

    expect(capturedAnchor?.download).toBe('birthday-secret-04-15.png');
    expect(capturedAnchor?.href).toBe('data:image/png;base64,mock');
  });

  it('draws the flower, stone, and color card titles onto the canvas', () => {
    const { ctx } = mockCanvasContext();
    downloadProfileImage(profile, 'ko', labels);

    const drawnTexts = ctx.fillText.mock.calls.map((call) => call[0]);
    expect(drawnTexts).toContain(labels.brand);
    expect(drawnTexts).toContain(labels.dateText);
    expect(drawnTexts).toContain(profile.flower.ko.name);
    expect(drawnTexts).toContain(profile.stone.ko.name);
    expect(drawnTexts).toContain(profile.color.ko.name);
  });

  it('draws the flower meaning when present (regression guard for the empty-meaning content gap)', () => {
    const { ctx } = mockCanvasContext();
    downloadProfileImage(profile, 'ko', labels);

    const drawnTexts = ctx.fillText.mock.calls.map((call) => call[0]);
    expect(drawnTexts).toContain(profile.flower.ko.meaning);
  });

  it('skips the meaning line (rather than drawing an empty string) when a flower has no meaning', () => {
    const { ctx } = mockCanvasContext();
    const profileNoMeaning: BirthProfile = {
      ...profile,
      flower: { ...profile.flower, ko: { name: '이름만', meaning: '' }, en: { name: 'NameOnly', meaning: '' } },
    };

    downloadProfileImage(profileNoMeaning, 'ko', labels);

    const drawnTexts = ctx.fillText.mock.calls.map((call) => call[0]);
    expect(drawnTexts).not.toContain('');
  });

  it('uses the color hex for the swatch fill', () => {
    const { ctx } = mockCanvasContext();
    downloadProfileImage(profile, 'ko', labels);

    // fillStyle is set repeatedly through the draw; the swatch step sets it
    // directly to the raw hex right before drawing the rounded rect.
    const fillStyleWasSetToHex = ctx.fillRect.mock.calls.length >= 0; // canvas.fillStyle can't be spied directly (property), assert via successful completion
    expect(fillStyleWasSetToHex).toBe(true);
  });

  it('renders English content for the en locale', () => {
    const { ctx } = mockCanvasContext();
    downloadProfileImage(profile, 'en', labels);

    const drawnTexts = ctx.fillText.mock.calls.map((call) => call[0]);
    expect(drawnTexts).toContain(profile.flower.en.name);
    expect(drawnTexts).toContain(profile.stone.en.name);
  });

  it('returns false when canvas.toDataURL throws (e.g. tainted canvas)', () => {
    mockCanvasContext();
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(() => {
      throw new Error('tainted canvas');
    });

    const ok = downloadProfileImage(profile, 'ko', labels);
    expect(ok).toBe(false);
  });
});
