import { Preset } from './presets';

export const QUARTZ_FIELD_NAMES = ['second', 'minute', 'hour', 'dom', 'month', 'dow', 'year'] as const;

export const QUARTZ_PRESETS: Readonly<Preset[]> = [
  {
    id: 'every-second',
    expression: '* * * * * ?',
    descriptionKey: 'presets.quartz.everySecond',
  },
  {
    id: 'every-30-seconds',
    expression: '0/30 * * * * ?',
    descriptionKey: 'presets.quartz.every30Seconds',
  },
  {
    id: 'every-minute',
    expression: '0 * * * * ?',
    descriptionKey: 'presets.quartz.everyMinute',
  },
  {
    id: 'weekdays-9am',
    expression: '0 0 9 ? * MON-FRI',
    descriptionKey: 'presets.quartz.weekdays9am',
  },
  {
    id: 'monthly-last-day',
    expression: '0 0 0 L * ?',
    descriptionKey: 'presets.quartz.monthlyLastDay',
  },
  {
    id: 'third-friday-9am',
    expression: '0 0 9 ? * 6#3',
    descriptionKey: 'presets.quartz.thirdFriday9am',
  },
  {
    id: 'fifteenth-nearest-weekday-9am',
    expression: '0 0 9 15W * ?',
    descriptionKey: 'presets.quartz.fifteenthNearestWeekday9am',
  },
];
