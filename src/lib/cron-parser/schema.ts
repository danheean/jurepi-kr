import { z } from 'zod';

// Parsed field representation
export const ParsedFieldsSchema = z.object({
  minute: z.array(z.number().min(0).max(59)),
  hour: z.array(z.number().min(0).max(23)),
  dom: z.array(z.number().min(1).max(31)),
  month: z.array(z.number().min(1).max(12)),
  dow: z.array(z.number().min(0).max(6)),
  isValid: z.boolean(),
  error: z
    .object({
      field: z.string(),
      message: z.string(),
    })
    .optional(),
});

export type ParsedFields = z.infer<typeof ParsedFieldsSchema>;

// Description model (structured, NOT English prose)
export type DescriptionModel = {
  frequencyKind:
    | 'everyMinute'
    | 'everyNMinutes'
    | 'everyHour'
    | 'everyDay'
    | 'everyWeekday'
    | 'everyWeekend'
    | 'monthly'
    | 'yearly'
    | 'custom';
  atTimes?: Array<{ hour: number; minute: number }>;
  onDays?: string[]; // e.g., ['MON', 'TUE']
  onMonths?: string[]; // e.g., ['JAN', 'FEB']
  onDatesOfMonth?: number[];
  explanation?: string; // Fallback only; should NOT ship
};

// Settings (localStorage)
export const SettingsSchema = z.object({
  timezone: z.string().default('Local'),
  lastExpression: z.string().optional(),
  recents: z.array(z.string()).max(20).default([]),
});

export type Settings = z.infer<typeof SettingsSchema>;

// Parse/validation errors
export interface SyntaxError {
  type: 'syntax';
  message: string;
  position?: number;
}

export interface ParseError {
  type: 'parse';
  field: string;
  message: string;
  value?: string;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FieldError[];
}

// Token interface for tokenizer
export interface Token {
  type: 'literal' | 'range' | 'step' | 'list' | 'name' | 'wildcard';
  value: string;
  position: number;
}

export interface NextRun {
  datetime: Date;
  formatted: string;
  utc?: string;
}
