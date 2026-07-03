import type { Sexagenary } from './schema';

/**
 * Sexagenary cycle: 60-year period combining 10 heavenly stems (천간) and 12 earthly branches (지지).
 * Pure computation based on year modulo arithmetic.
 * Stem = (year - 4) % 10, Branch = (year - 4) % 12
 */

// Heavenly Stems: 10 elements
const STEMS = [
  { hanja: '甲', korean: '갑', element: 'Wood' },
  { hanja: '乙', korean: '을', element: 'Wood' },
  { hanja: '丙', korean: '병', element: 'Fire' },
  { hanja: '丁', korean: '정', element: 'Fire' },
  { hanja: '戊', korean: '무', element: 'Earth' },
  { hanja: '己', korean: '기', element: 'Earth' },
  { hanja: '庚', korean: '경', element: 'Metal' },
  { hanja: '辛', korean: '신', element: 'Metal' },
  { hanja: '壬', korean: '임', element: 'Water' },
  { hanja: '癸', korean: '계', element: 'Water' },
] as const;

// Earthly Branches: 12 animals
const BRANCHES = [
  { hanja: '子', korean: '자', animal: 'Rat', emoji: '🐀' },
  { hanja: '丑', korean: '축', animal: 'Ox', emoji: '🐂' },
  { hanja: '寅', korean: '인', animal: 'Tiger', emoji: '🐯' },
  { hanja: '卯', korean: '묘', animal: 'Rabbit', emoji: '🐰' },
  { hanja: '辰', korean: '진', animal: 'Dragon', emoji: '🐉' },
  { hanja: '巳', korean: '사', animal: 'Snake', emoji: '🐍' },
  { hanja: '午', korean: '오', animal: 'Horse', emoji: '🐴' },
  { hanja: '未', korean: '미', animal: 'Goat', emoji: '🐑' },
  { hanja: '申', korean: '신', animal: 'Monkey', emoji: '🐵' },
  { hanja: '酉', korean: '유', animal: 'Rooster', emoji: '🐓' },
  { hanja: '戌', korean: '술', animal: 'Dog', emoji: '🐕' },
  { hanja: '亥', korean: '해', animal: 'Pig', emoji: '🐷' },
] as const;

/**
 * Compute sexagenary (60-cycle) for a given year.
 * Formula: stem = (year - 4) % 10, branch = (year - 4) % 12
 * Returns name (Korean), hanja (Chinese), and English representation.
 */
export function computeSexagenary(year: number): Sexagenary {
  const stemIndex = ((year - 4) % 10 + 10) % 10;
  const branchIndex = ((year - 4) % 12 + 12) % 12;

  const stem = STEMS[stemIndex];
  const branch = BRANCHES[branchIndex];

  const name = stem.korean + branch.korean + '년';
  const hanja = stem.hanja + branch.hanja;
  const english = `${stem.element} ${branch.animal}`;

  return {
    name,
    hanja,
    english,
    stemIndex,
    branchIndex,
  };
}
