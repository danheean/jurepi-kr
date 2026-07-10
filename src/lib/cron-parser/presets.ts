export interface Preset {
  id: string;
  expression: string;
  descriptionKey: string;
}

export const PRESET_EXPRESSIONS: Readonly<Preset[]> = [
  {
    id: 'every-1-minute',
    expression: '* * * * *',
    descriptionKey: 'presets.everyMinute',
  },
  {
    id: 'every-5-minutes',
    expression: '*/5 * * * *',
    descriptionKey: 'presets.every5Minutes',
  },
  {
    id: 'every-15-minutes',
    expression: '*/15 * * * *',
    descriptionKey: 'presets.every15Minutes',
  },
  {
    id: 'every-30-minutes',
    expression: '*/30 * * * *',
    descriptionKey: 'presets.every30Minutes',
  },
  {
    id: 'every-hour',
    expression: '0 * * * *',
    descriptionKey: 'presets.everyHour',
  },
  {
    id: 'weekdays-9am',
    expression: '0 9 * * MON-FRI',
    descriptionKey: 'presets.weekdays9am',
  },
  {
    id: 'weekdays-5pm',
    expression: '0 17 * * MON-FRI',
    descriptionKey: 'presets.weekdays5pm',
  },
  {
    id: 'daily-midnight',
    expression: '0 0 * * *',
    descriptionKey: 'presets.daily',
  },
  {
    id: 'daily-noon',
    expression: '0 12 * * *',
    descriptionKey: 'presets.dailyNoon',
  },
  {
    id: 'monthly-1st',
    expression: '0 0 1 * *',
    descriptionKey: 'presets.monthly1st',
  },
  {
    id: 'weekly-sunday',
    expression: '0 0 * * 0',
    descriptionKey: 'presets.weeklySunday',
  },
  {
    id: 'yearly',
    expression: '@yearly',
    descriptionKey: 'presets.yearly',
  },
];
