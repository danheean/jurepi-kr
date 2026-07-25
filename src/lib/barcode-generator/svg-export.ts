/**
 * Barcode Generator — SVG Export
 * jsbarcode encode() 결과의 바이너리 data 문자열을 SVG로 변환 (hand-rolled)
 */

/**
 * 바코드 패턴 문자열을 SVG XML로 변환
 * bar pattern: "101010..." (1=검은색, 0=흰색)을 <rect>로 렌더링
 *
 * @param barPattern 이진 bar/space 패턴 (예: "101010110101")
 * @param width 바코드 너비 (px)
 * @param textContent 사람이 읽을 수 있는 텍스트 (선택사항)
 * @returns SVG XML 문자열
 */
export function normalizeBarcodeSVG(
  barPattern: string,
  width: number,
  textContent?: string
): string {
  if (!barPattern) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"></svg>';
  }

  // 바코드의 표준 비율 (가로:세로 = 2:1)
  const barCount = barPattern.length;
  const barWidth = width / barCount;
  const height = width * 0.5; // 표준 비율
  const textHeight = textContent ? 20 : 0;
  const totalHeight = height + textHeight;

  // SVG viewBox 계산
  const viewBoxWidth = barPattern.length;
  const viewBoxHeight = textContent ? height + 15 : height;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" width="${width}" height="${totalHeight}">`;

  // 흰색 배경
  svg += `<rect width="${viewBoxWidth}" height="${height}" fill="white"/>`;

  // bar pattern → rect 엘리먼트
  for (let i = 0; i < barPattern.length; i++) {
    const isBar = barPattern[i] === '1';
    if (isBar) {
      svg += `<rect x="${i}" y="0" width="1" height="${height / (barPattern.length / viewBoxWidth)}" fill="black"/>`;
    }
  }

  // 텍스트 (선택사항)
  if (textContent) {
    svg += `<text x="${viewBoxWidth / 2}" y="${height + 12}" text-anchor="middle" font-size="12" font-family="monospace" fill="black">${escapeXml(textContent)}</text>`;
  }

  svg += '</svg>';

  return svg;
}

/**
 * XML 특수 문자 이스케이프 (XSS 방지)
 * @param text 이스케이프할 텍스트
 * @returns 이스케이프된 텍스트
 */
function escapeXml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] ?? char);
}
