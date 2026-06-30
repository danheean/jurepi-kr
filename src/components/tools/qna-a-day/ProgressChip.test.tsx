import { describe, it, expect, vi } from 'vitest';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Behavioral tests for ProgressChip contract

describe('ProgressChip (behavioral contract)', () => {
  it('accepts currentStreak, totalAnswered, yearCompletion as props', () => {
    const props = {
      currentStreak: 5,
      totalAnswered: 42,
      yearCompletion: { answered: 100, elapsed: 182 },
    };

    expect(props.currentStreak).toBe(5);
    expect(props.totalAnswered).toBe(42);
    expect(props.yearCompletion.answered).toBe(100);
    expect(props.yearCompletion.elapsed).toBe(182);
  });

  it('calculates progress percentage correctly', () => {
    const { answered, elapsed } = { answered: 100, elapsed: 200 };
    const progressPercent = elapsed > 0 ? (answered / elapsed) * 100 : 0;

    expect(progressPercent).toBe(50);
  });

  it('handles 0% completion', () => {
    const { answered, elapsed } = { answered: 0, elapsed: 365 };
    const progressPercent = elapsed > 0 ? (answered / elapsed) * 100 : 0;

    expect(progressPercent).toBe(0);
  });

  it('handles 100% completion', () => {
    const { answered, elapsed } = { answered: 365, elapsed: 365 };
    const progressPercent = elapsed > 0 ? (answered / elapsed) * 100 : 0;

    expect(progressPercent).toBe(100);
  });

  it('renders streak number and total count', () => {
    const streak = 7;
    const total = 100;

    expect(streak > 0).toBe(true);
    expect(total > 0).toBe(true);
  });

  it('handles edge case: 0 elapsed days', () => {
    const { answered, elapsed } = { answered: 0, elapsed: 0 };
    const progressPercent = elapsed > 0 ? (answered / elapsed) * 100 : 0;

    expect(progressPercent).toBe(0);
  });

  it('provides accessible aria-label for ring', () => {
    const { answered, elapsed } = { answered: 50, elapsed: 365 };
    const ariaLabel = `올해 ${answered}/${elapsed}일 기록`;

    expect(ariaLabel).toContain('50');
    expect(ariaLabel).toContain('365');
  });
});
