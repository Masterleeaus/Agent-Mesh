export type CleaningPricingInput = {
  mode: "hourly" | "fixed";
  hours?: number;
  hourlyRateCents?: number;
  fixedBaseCents?: number;
  roomCents?: number[];
  taskCents?: number[];
  addonsCents?: number[];
  frequencyDiscountBps?: number;
  minimumCents?: number;
  travelCents?: number;
  depositBps?: number;
};

const cents = (v: number | undefined) => Math.max(0, Math.round(v ?? 0));
const sum = (xs: number[] | undefined) => (xs ?? []).reduce((a,b)=>a+cents(b),0);
const bps = (base:number, points:number|undefined) => Math.round(base * Math.max(0, Math.min(10_000, Math.trunc(points ?? 0))) / 10_000);

export function calculateCleaningPrice(input: CleaningPricingInput) {
  const core = input.mode === "hourly"
    ? Math.round(Math.max(0, input.hours ?? 0) * cents(input.hourlyRateCents))
    : cents(input.fixedBaseCents);
  const scoped = core + sum(input.roomCents) + sum(input.taskCents) + sum(input.addonsCents);
  const frequency_discount_cents = bps(scoped, input.frequencyDiscountBps);
  const afterDiscount = Math.max(0, scoped - frequency_discount_cents);
  const service_cents = Math.max(afterDiscount, cents(input.minimumCents));
  const travel_cents = cents(input.travelCents);
  const total_cents = service_cents + travel_cents;
  const deposit_cents = Math.min(total_cents, bps(total_cents, input.depositBps));
  return {
    core_cents: core,
    scoped_cents: scoped,
    frequency_discount_cents,
    minimum_applied: service_cents > afterDiscount,
    subtotal_cents: service_cents,
    travel_cents,
    total_cents,
    deposit_cents,
    balance_after_deposit_cents: total_cents - deposit_cents,
  };
}
