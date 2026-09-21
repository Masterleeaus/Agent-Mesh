export function monthDateRange(month: string): { start: string; end: string } {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("Invalid month");
  const [year, mon] = month.split("-").map(Number);
  const nextYear = mon === 12 ? year + 1 : year;
  const nextMonth = mon === 12 ? 1 : mon + 1;
  return {
    start: `${year}-${String(mon).padStart(2,"0")}-01`,
    end: `${nextYear}-${String(nextMonth).padStart(2,"0")}-01`,
  };
}
