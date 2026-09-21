import { calculateCleaningPrice, type CleaningPricingInput } from "./cleaning-pricing";

export type CleaningPackage = {
  code: string;
  name: string;
  mode: "hourly" | "fixed";
  baseCents: number;
  frequencyDiscountBps?: Record<string, number>;
  minimumCents?: number;
  depositBps?: number;
};

export function priceCleaningPackage(
  pkg: CleaningPackage,
  input: Omit<CleaningPricingInput,"mode"|"hourlyRateCents"|"fixedBaseCents"|"minimumCents"|"depositBps"|"frequencyDiscountBps"> & { frequency?: string }
) {
  const discount = input.frequency ? pkg.frequencyDiscountBps?.[input.frequency] : 0;
  return calculateCleaningPrice({
    ...input,
    mode: pkg.mode,
    hourlyRateCents: pkg.mode === "hourly" ? pkg.baseCents : undefined,
    fixedBaseCents: pkg.mode === "fixed" ? pkg.baseCents : undefined,
    minimumCents: pkg.minimumCents,
    depositBps: pkg.depositBps,
    frequencyDiscountBps: discount ?? 0,
  });
}
