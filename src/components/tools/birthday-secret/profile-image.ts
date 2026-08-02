import type { BirthProfile } from '@/lib/birthday-secret/schema';
import type { Locale } from '@/lib/birthday-secret/schema';

export interface ProfileImageLabels {
  brand: string; // tool name
  dateText: string; // "N월 N일" / "Month D"
  flowerTitle: string;
  stoneTitle: string;
  colorTitle: string;
  siteUrl: string;
}

/**
 * Render the birth profile to a 1080×1350 (Instagram story-friendly 4:5) PNG
 * and trigger a download. Pure canvas — no dependencies.
 */
export function downloadProfileImage(
  profile: BirthProfile,
  locale: Locale,
  labels: ProfileImageLabels
): boolean {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const flower = profile.flower[locale];
  const stone = profile.stone[locale];
  const color = profile.color;
  const colorLoc = color[locale];

  // Background: soft gradient tinted by the birth color.
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#fffdf8');
  grad.addColorStop(1, color.hex + '22');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2;
  ctx.textAlign = 'center';

  // Brand + date
  ctx.fillStyle = '#6b7280';
  ctx.font = '600 34px sans-serif';
  ctx.fillText(labels.brand, cx, 120);
  ctx.fillStyle = '#1f2430';
  ctx.font = '800 76px sans-serif';
  ctx.fillText(labels.dateText, cx, 210);

  const rows: Array<{ icon: string; title: string; name: string; meaning: string; swatch?: string }> = [
    { icon: '🌸', title: labels.flowerTitle, name: flower.name, meaning: flower.meaning },
    { icon: '💎', title: labels.stoneTitle, name: stone.name, meaning: stone.meaning },
    { icon: '🎨', title: labels.colorTitle, name: colorLoc.name, meaning: colorLoc.keyword, swatch: color.hex },
  ];

  let y = 380;
  const cardW = W - 160;
  const cardX = 80;
  const cardH = 260;
  rows.forEach((row) => {
    // card
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, cardX, y, cardW, cardH, 32);
    ctx.fill();
    ctx.strokeStyle = '#00000010';
    ctx.lineWidth = 2;
    roundRect(ctx, cardX, y, cardW, cardH, 32);
    ctx.stroke();

    ctx.textAlign = 'left';
    // icon + title
    ctx.font = '400 56px sans-serif';
    ctx.fillText(row.icon, cardX + 48, y + 90);
    ctx.fillStyle = '#8a8f98';
    ctx.font = '600 34px sans-serif';
    ctx.fillText(row.title, cardX + 130, y + 78);
    // name
    ctx.fillStyle = '#1f2430';
    ctx.font = '800 56px sans-serif';
    ctx.fillText(row.name, cardX + 130, y + 150);
    // meaning
    if (row.meaning) {
      ctx.fillStyle = '#5b616b';
      ctx.font = '400 38px sans-serif';
      ctx.fillText(row.meaning, cardX + 130, y + 210);
    }
    // color swatch
    if (row.swatch) {
      ctx.fillStyle = row.swatch;
      roundRect(ctx, cardX + cardW - 150, y + 70, 110, 110, 24);
      ctx.fill();
    }
    ctx.textAlign = 'center';
    y += cardH + 28;
  });

  // footer
  ctx.fillStyle = '#9aa0a8';
  ctx.font = '500 30px sans-serif';
  ctx.fillText(labels.siteUrl, cx, H - 60);

  try {
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `birthday-secret-${profile.date}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch {
    return false;
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
