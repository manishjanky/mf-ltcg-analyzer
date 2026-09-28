export type Lot = {
  schemeName: string;
  purchaseDate: string; // ISO
  units: number;
  amount: number;
};

export type AllocationResult = {
  schemeName: string;
  totalUnits: number;
  qualifiedUnits: number;
  nonQualifiedUnits: number;
  lots: Lot[];
};

export function allocateFIFO(
  transactions: {date: string; schemeName: string; units: number; amount: number;}[],
  qualifyingPeriodDays: number | Record<string, number>,
  asOfDate = new Date()
): AllocationResult[] {
  // Group by scheme
  const byScheme = new Map<string, {date: string; units: number; amount: number;}[]>();
  for (const t of transactions.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())) {
    const arr = byScheme.get(t.schemeName) || [];
    arr.push(t);
    byScheme.set(t.schemeName, arr);
  }

  const results: AllocationResult[] = [];
  for (const [scheme, txs] of byScheme.entries()) {
    const lots: Lot[] = [];
    // Process transactions FIFO: buys add lots, sells reduce from oldest lots
    for (const tx of txs) {
      const units = Number(tx.units) || 0;
      if (units === 0) continue;

      if (units > 0) {
        lots.push({ schemeName: scheme, purchaseDate: tx.date, units, amount: tx.amount });
      } else {
        let remaining = Math.abs(units);
        while (remaining > 0 && lots.length > 0) {
          const first = lots[0];
          if (first.units > remaining) {
            first.units -= remaining;
            remaining = 0;
          } else {
            remaining -= first.units;
            lots.shift();
          }
        }
      }
    }

    let totalUnits = 0;
    let qualifiedUnits = 0;
    const asOf = asOfDate instanceof Date ? asOfDate : new Date(asOfDate);
    const schemeQualDays = typeof qualifyingPeriodDays === 'number' ? qualifyingPeriodDays : (qualifyingPeriodDays[scheme] ?? 365);

    for (const lot of lots) {
      totalUnits += lot.units;
      const purchase = new Date(lot.purchaseDate);
      const diffDays = Math.floor((asOf.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= schemeQualDays) {
        qualifiedUnits += lot.units;
      }
    }

    results.push({ schemeName: scheme, totalUnits, qualifiedUnits, nonQualifiedUnits: totalUnits - qualifiedUnits, lots });
  }

  return results;
}
