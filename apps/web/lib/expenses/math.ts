import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from "@titan-zero/domain";
import type { ExpenseCategory } from "@titan-zero/domain";

export { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS };
export type { ExpenseCategory };

export { formatCentsToDollars, parseDollarsToCents } from "@titan-zero/money";

/**
 * Check that a category value is in the locked set.
 */
export function isValidCategory(value: string): value is ExpenseCategory {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(value);
}