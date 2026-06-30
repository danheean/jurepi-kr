import { describe, it, expect } from 'vitest';
import {
  getQuestion,
  getQuestionForDate,
  validateBank,
  type QuestionBank,
  type QuestionRecord,
} from './questions';
import { toQuestionKey } from './date';

describe('questions — 365-day question bank', () => {
  // Create a mock bank for testing
  const mockBank: QuestionBank = {
    '01-01': {
      date: '01-01',
      month: 1,
      day: 1,
      question: '내 삶의 목적은?',
      questionEn: 'What is my purpose?',
    },
    '06-30': {
      date: '06-30',
      month: 6,
      day: 30,
      question: '지금 행복한가?',
      questionEn: 'Am I happy now?',
    },
    '12-31': {
      date: '12-31',
      month: 12,
      day: 31,
      question: '올해는 어땠나?',
      questionEn: 'How was this year?',
    },
  };

  describe('getQuestion', () => {
    it('retrieves question by MM-DD and locale', () => {
      const q = getQuestion(mockBank, '01-01', 'ko');
      expect(q).toBe('내 삶의 목적은?');

      const qEn = getQuestion(mockBank, '01-01', 'en');
      expect(qEn).toBe('What is my purpose?');
    });

    it('maps 02-29 to 02-28', () => {
      const bank: QuestionBank = {
        '02-28': {
          date: '02-28',
          month: 2,
          day: 28,
          question: '아팠던 적?',
          questionEn: 'Ever sick?',
        },
      };

      const q = getQuestion(bank, '02-29', 'ko');
      expect(q).toBe('아팠던 적?');
    });

    it('throws if question key not found after 02-29 resolution', () => {
      const bank: QuestionBank = {
        '01-01': {
          date: '01-01',
          month: 1,
          day: 1,
          question: 'q',
          questionEn: 'q',
        },
      };

      expect(() => getQuestion(bank, '06-30', 'ko')).toThrow();
    });

    it('is case-sensitive for locale (ko vs en)', () => {
      const q1 = getQuestion(mockBank, '01-01', 'ko');
      const q2 = getQuestion(mockBank, '01-01', 'en');
      expect(q1).not.toBe(q2);
    });
  });

  describe('getQuestionForDate', () => {
    it('converts dateKey to questionKey and retrieves question', () => {
      const q = getQuestionForDate(mockBank, '2026-06-30', 'ko');
      expect(q).toBe('지금 행복한가?');
    });

    it('handles 02-29 → 02-28 conversion via dateKey', () => {
      const bank: QuestionBank = {
        '02-28': {
          date: '02-28',
          month: 2,
          day: 28,
          question: 'Feb28',
          questionEn: 'Feb28En',
        },
      };

      // 2028 is a leap year; Feb 29 should map to Feb 28 question
      const q = getQuestionForDate(bank, '2028-02-29', 'ko');
      expect(q).toBe('Feb28');
    });

    it('throws if dateKey does not map to a question', () => {
      const bank: QuestionBank = {
        '01-01': {
          date: '01-01',
          month: 1,
          day: 1,
          question: 'q',
          questionEn: 'q',
        },
      };

      expect(() => getQuestionForDate(bank, '2026-06-30', 'ko')).toThrow();
    });
  });

  describe('validateBank', () => {
    it('accepts a valid 365-day bank', () => {
      // Build a complete bank
      const bank: QuestionBank = {};
      for (let m = 1; m <= 12; m++) {
        const daysInMonth =
          m === 2 ? 28 : [4, 6, 9, 11].includes(m) ? 30 : 31;
        for (let d = 1; d <= daysInMonth; d++) {
          const mmdd = `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          bank[mmdd] = {
            date: mmdd,
            month: m,
            day: d,
            question: `Question ${mmdd}`,
            questionEn: `Question ${mmdd} EN`,
          };
        }
      }

      const validation = validateBank(bank);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('rejects a bank with < 365 days', () => {
      const bank: QuestionBank = {
        '01-01': {
          date: '01-01',
          month: 1,
          day: 1,
          question: 'q',
          questionEn: 'q',
        },
      };

      const validation = validateBank(bank);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some((e) => e.includes('365'))).toBe(true);
    });

    it('rejects a bank with 02-29', () => {
      const bank: QuestionBank = {};
      // Add all 365 days
      for (let m = 1; m <= 12; m++) {
        const daysInMonth =
          m === 2 ? 29 : [4, 6, 9, 11].includes(m) ? 30 : 31;
        for (let d = 1; d <= daysInMonth; d++) {
          const mmdd = `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          bank[mmdd] = {
            date: mmdd,
            month: m,
            day: d,
            question: `q`,
            questionEn: `q`,
          };
        }
      }

      const validation = validateBank(bank);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes('02-29'))).toBe(true);
    });

    it('rejects records with empty question or questionEn', () => {
      const bank: QuestionBank = {
        '01-01': {
          date: '01-01',
          month: 1,
          day: 1,
          question: '', // Empty!
          questionEn: 'q',
        },
      };

      const validation = validateBank(bank);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes('question'))).toBe(true);
    });

    it('detects invalid MM-DD format', () => {
      const bank: QuestionBank = {
        'invalid': {
          date: 'invalid',
          month: 1,
          day: 1,
          question: 'q',
          questionEn: 'q',
        },
      };

      const validation = validateBank(bank);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes('format'))).toBe(true);
    });

    it('detects duplicate dates', () => {
      // Build a complete 365-day bank first
      const bank: QuestionBank = {};
      for (let m = 1; m <= 12; m++) {
        const daysInMonth =
          m === 2 ? 28 : [4, 6, 9, 11].includes(m) ? 30 : 31;
        for (let d = 1; d <= daysInMonth; d++) {
          const mmdd = `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          bank[mmdd] = {
            date: mmdd,
            month: m,
            day: d,
            question: `Question ${mmdd}`,
            questionEn: `Question ${mmdd} EN`,
          };
        }
      }

      // Now inject a duplicate: change one entry's date field to match another key
      // Keep 365 keys but create a duplicate date
      bank['01-02'].date = '01-01'; // Now both '01-01' key and '01-02' key have date='01-01'

      const validation = validateBank(bank);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes('duplicate'))).toBe(true);
    });

    it('validates day ranges per month', () => {
      const bank: QuestionBank = {
        '02-30': { // Feb 30 doesn't exist
          date: '02-30',
          month: 2,
          day: 30,
          question: 'q',
          questionEn: 'q',
        },
      };

      const validation = validateBank(bank);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes('day') || e.includes('range'))).toBe(true);
    });
  });
});
