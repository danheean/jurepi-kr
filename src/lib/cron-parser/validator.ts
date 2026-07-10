import { ParsedFields, ValidationResult, FieldError } from './schema';

/**
 * Validates parsed cron fields for semantic correctness.
 * Current checks: dom/dow mutual-exclusion interpretation
 */
export function validateFields(fields: ParsedFields): ValidationResult {
  const errors: FieldError[] = [];

  // If both dom and dow are non-wildcard, document the OR logic
  // This is valid in POSIX cron but may surprise users
  // For now, we don't reject it, just note it's an OR relationship in description
  const domIsWildcard = fields.dom.length === 31; // 1..31
  const dowIsWildcard = fields.dow.length === 7; // 0..6

  if (!domIsWildcard && !dowIsWildcard) {
    // Both specified: valid but uses OR logic (handled in description)
    // No error needed; user is guided through description model
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
