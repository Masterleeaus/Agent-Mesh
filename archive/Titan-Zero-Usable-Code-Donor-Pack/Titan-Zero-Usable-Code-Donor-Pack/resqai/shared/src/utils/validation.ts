export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export type ValidationRule<T = unknown> = {
  field: string;
  validate: (value: T, allValues: Record<string, unknown>) => string | null;
};

export function validate<T extends Record<string, unknown>>(values: T, rules: ValidationRule[]): ValidationResult {
  const errors: Record<string, string> = {};
  for (const rule of rules) {
    const error = rule.validate(values[rule.field] as T[keyof T], values as Record<string, unknown>);
    if (error) errors[rule.field] = error;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export const validators = {
  required: (field: string, label?: string): ValidationRule => ({
    field,
    validate: (value) => (value === undefined || value === null || value === '') ? `${label || field} is required` : null,
  }),
  email: (field: string): ValidationRule => ({
    field,
    validate: (value) => (value && typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) ? 'Invalid email address' : null,
  }),
  minLength: (field: string, min: number, label?: string): ValidationRule => ({
    field,
    validate: (value) => (value && typeof value === 'string' && value.length < min) ? `${label || field} must be at least ${min} characters` : null,
  }),
  maxLength: (field: string, max: number, label?: string): ValidationRule => ({
    field,
    validate: (value) => (value && typeof value === 'string' && value.length > max) ? `${label || field} must be at most ${max} characters` : null,
  }),
  pattern: (field: string, regex: RegExp, message: string): ValidationRule => ({
    field,
    validate: (value) => (value && typeof value === 'string' && !regex.test(value)) ? message : null,
  }),
  match: (field: string, matchField: string, labels?: Record<string, string>): ValidationRule => ({
    field,
    validate: (value, allValues) => (value !== allValues[matchField]) ? `${labels?.[field] || field} must match ${labels?.[matchField] || matchField}` : null,
  }),
};
