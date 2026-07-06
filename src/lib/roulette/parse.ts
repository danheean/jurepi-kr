/**
 * 옵션 일괄 입력 파서 (순수 함수).
 *
 * 사용자가 콤마 또는 줄바꿈(붙여넣은 목록)으로 구분한 여러 옵션을
 * 한 번에 입력할 수 있게 한다 — "자장면, 짬뽕, 치킨" / 메모장 세로 목록.
 */

/** OptionSchema label max(50)와 동일 계약 — 입력 maxLength를 우회하는 붙여넣기 보호 */
const MAX_LABEL_LENGTH = 50;

/**
 * Raw 입력을 옵션 라벨 배열로 분해한다.
 * - 콤마/줄바꿈(CR·LF) 기준 분리
 * - 각 라벨 trim, 빈 조각 제거, 50자 절단
 * - 대소문자 무시 중복 제거(첫 등장 유지)
 */
export function splitOptionLabels(raw: string): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];

  for (const segment of raw.split(/[,\r\n]/)) {
    const label = segment.trim().slice(0, MAX_LABEL_LENGTH);
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(label);
  }

  return labels;
}
