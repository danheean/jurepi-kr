import { resolveQuestionKey, toQuestionKey, type QuestionKey, daysInMonth } from './date';

export interface QuestionRecord {
  date: string; // "MM-DD"
  month: number; // 1-12
  day: number; // 1-31
  question: string; // Korean
  questionEn: string; // English
}

export type QuestionBank = Record<QuestionKey, QuestionRecord>;

/**
 * Retrieve a question from the bank by MM-DD and locale.
 * Maps "02-29" to "02-28" if needed.
 * Throws if question key not found.
 */
export function getQuestion(bank: QuestionBank, mmdd: QuestionKey, locale: 'ko' | 'en'): string {
  const resolved = resolveQuestionKey(mmdd);
  const record = bank[resolved];

  if (!record) {
    throw new Error(`Question not found for ${mmdd} (resolved: ${resolved})`);
  }

  return locale === 'ko' ? record.question : record.questionEn;
}

/**
 * Retrieve a question by full dateKey (YYYY-MM-DD).
 * Converts to MM-DD internally and applies 02-29→02-28 resolution.
 */
export function getQuestionForDate(
  bank: QuestionBank,
  dateKey: string,
  locale: 'ko' | 'en'
): string {
  const mmdd = toQuestionKey(dateKey);
  return getQuestion(bank, mmdd, locale);
}

/**
 * Validate the question bank.
 * Returns { valid: boolean, errors: string[] }
 *
 * Checks:
 * - Exactly 365 entries (01-01..12-31, no 02-29)
 * - Each entry date format "MM-DD"
 * - Each entry has non-empty question and questionEn
 * - No duplicate dates
 * - Valid month/day ranges
 */
export function validateBank(bank: QuestionBank): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check key count
  const keys = Object.keys(bank);
  if (keys.length !== 365) {
    errors.push(`Expected 365 entries, got ${keys.length}`);
  }

  // Validate each entry
  const seenDates = new Set<string>();

  for (const key of keys) {
    const record = bank[key];

    // Check for duplicate dates (check all records, regardless of key format)
    if (seenDates.has(record.date)) {
      errors.push(`duplicate date: ${record.date}`);
    }
    seenDates.add(record.date);

    // Validate key format
    if (!/^\d{2}-\d{2}$/.test(key)) {
      errors.push(`Invalid key format: ${key} (expected MM-DD)`);
      continue;
    }

    // Reject 02-29
    if (key === '02-29') {
      errors.push('Bank contains 02-29 (should only have 365 days, no leap-day)');
    }

    // Validate record date matches key
    if (record.date !== key) {
      errors.push(`Record at ${key} has date field: ${record.date}`);
    }

    // Validate month/day range
    const [m, d] = key.split('-').map(Number);
    if (m < 1 || m > 12) {
      errors.push(`Invalid month in ${key}: ${m}`);
    } else if (d < 1 || d > daysInMonth(2026, m)) {
      // Use 2026 (non-leap) as reference for day-in-month check
      errors.push(`Invalid day in ${key}: ${d} (month ${m} has max ${daysInMonth(2026, m)} days)`);
    }

    // Validate record month/day
    if (record.month !== m || record.day !== d) {
      errors.push(`Record at ${key} has month/day mismatch: ${record.month}-${record.day}`);
    }

    // Check for empty question/questionEn
    if (!record.question || !record.question.trim()) {
      errors.push(`Empty question at ${key}`);
    }
    if (!record.questionEn || !record.questionEn.trim()) {
      errors.push(`Empty questionEn at ${key}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Dynamically load the question bank from the data module.
 * This function is called at tool mount time (not in domain layer, but referenced in the hook).
 */
export async function loadQuestionBank(): Promise<QuestionBank> {
  const module = await import('@/components/tools/qna-a-day/data/questions.json');
  const data = module.default as {
    generated: string;
    total: number;
    questions: QuestionRecord[];
  };

  // Convert array to record
  const bank: QuestionBank = {};
  for (const q of data.questions) {
    bank[q.date] = q;
  }

  // Validate
  const validation = validateBank(bank);
  if (!validation.valid) {
    throw new Error(`Invalid question bank: ${validation.errors.join('; ')}`);
  }

  return bank;
}
