import { describe, it, expect } from 'vitest';
import { toDescriptionModel } from './description';
import { parseCron } from './parser';

describe('toDescriptionModel', () => {
  it('should handle every minute', () => {
    const fields = parseCron('* * * * *');
    const model = toDescriptionModel(fields);
    expect(model.frequencyKind).toBe('everyMinute');
  });

  it('should handle every N minutes', () => {
    const fields = parseCron('*/5 * * * *');
    const model = toDescriptionModel(fields);
    expect(model.frequencyKind).toBe('everyNMinutes');
  });

  it('should handle every hour', () => {
    const fields = parseCron('0 * * * *');
    const model = toDescriptionModel(fields);
    expect(model.frequencyKind).toBe('everyHour');
  });

  it('should handle every day at specific time', () => {
    const fields = parseCron('0 9 * * *');
    const model = toDescriptionModel(fields);
    expect(model.frequencyKind).toBe('everyDay');
    expect(model.atTimes).toContainEqual({ hour: 9, minute: 0 });
  });

  it('should handle every weekday at 9 AM', () => {
    const fields = parseCron('0 9 * * MON-FRI');
    const model = toDescriptionModel(fields);
    expect(model.frequencyKind).toBe('everyWeekday');
    expect(model.atTimes).toContainEqual({ hour: 9, minute: 0 });
  });

  it('should handle every weekend at 9 AM', () => {
    const fields = parseCron('0 9 * * SAT-SUN');
    const model = toDescriptionModel(fields);
    expect(model.frequencyKind).toBe('everyWeekend');
  });

  it('should handle monthly on specific day', () => {
    const fields = parseCron('0 0 1 * *');
    const model = toDescriptionModel(fields);
    expect(model.frequencyKind).toBe('monthly');
    expect(model.onDatesOfMonth).toContain(1);
  });

  it('should handle yearly', () => {
    const fields = parseCron('0 0 1 1 *');
    const model = toDescriptionModel(fields);
    expect(model.frequencyKind).toBe('yearly');
    expect(model.onMonths).toContain('JAN');
    expect(model.onDatesOfMonth).toContain(1);
  });

  it('should handle complex custom schedule', () => {
    const fields = parseCron('0 9 15 * MON');
    const model = toDescriptionModel(fields);
    expect(model.frequencyKind).toBe('custom');
  });

  it('should extract at times correctly', () => {
    const fields = parseCron('0,15,30 9,17 * * *');
    const model = toDescriptionModel(fields);
    expect(model.atTimes).toEqual(
      expect.arrayContaining([
        { hour: 9, minute: 0 },
        { hour: 9, minute: 15 },
        { hour: 9, minute: 30 },
        { hour: 17, minute: 0 },
        { hour: 17, minute: 15 },
        { hour: 17, minute: 30 },
      ])
    );
  });

  it('should extract day names', () => {
    const fields = parseCron('0 0 * * MON,WED,FRI');
    const model = toDescriptionModel(fields);
    expect(model.onDays).toEqual(
      expect.arrayContaining(['MON', 'WED', 'FRI'])
    );
  });

  it('should extract month names', () => {
    const fields = parseCron('0 0 1 JAN-MAR *');
    const model = toDescriptionModel(fields);
    expect(model.onMonths).toEqual(
      expect.arrayContaining(['JAN', 'FEB', 'MAR'])
    );
  });

  it('should handle every N hours', () => {
    const fields = parseCron('0 */3 * * *');
    const model = toDescriptionModel(fields);
    expect(model.frequencyKind).toBe('custom');
  });

  it('should handle every N seconds (not standard)', () => {
    const fields = {
      minute: [0],
      hour: [0],
      dom: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
      month: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      dow: [0, 1, 2, 3, 4, 5, 6],
      isValid: true,
    };
    const model = toDescriptionModel(fields);
    expect(model).toBeDefined();
  });

  it('should handle Feb 29 (leap year)', () => {
    const fields = parseCron('0 0 29 2 *');
    const model = toDescriptionModel(fields);
    expect(model.frequencyKind).toBe('yearly');
    expect(model.onMonths).toContain('FEB');
    expect(model.onDatesOfMonth).toContain(29);
  });
});
