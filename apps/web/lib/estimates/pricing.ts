/**
 * Dovetails Services LLC — estimate document helpers.
 *
 * Painting computation is canonical in @titan-zero/domain estimate-engine.
 */

import {
  STANDARD_ESTIMATE_NOTES,
  STANDARD_PAYMENT_TERMS,
  STANDARD_DISCLAIMER,
  DOCUMENT_STANDARD_VERSION,
  ESTIMATE_DOCUMENT_SECTIONS,
} from "@titan-zero/domain";

export function getStandardEstimateTerms() {
  return {
    version: DOCUMENT_STANDARD_VERSION,
    notes: STANDARD_ESTIMATE_NOTES,
    payment_terms: STANDARD_PAYMENT_TERMS,
    disclaimer: STANDARD_DISCLAIMER,
    sections: ESTIMATE_DOCUMENT_SECTIONS,
  };
}

export { formatCents } from "@/lib/money";