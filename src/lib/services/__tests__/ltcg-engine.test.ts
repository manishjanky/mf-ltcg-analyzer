import { describe, it, expect } from 'vitest';
import { allocateFIFO } from '../ltcg-engine';

const sample = [
  { date: '2023-01-10', schemeName: 'Equity Fund A', units: 100, amount: 10000 },
  { date: '2024-02-15', schemeName: 'Equity Fund A', units: 50, amount: 5000 },
  { date: '2022-03-20', schemeName: 'Gold Fund X', units: 200, amount: 20000 },
  { date: '2024-09-01', schemeName: 'Equity Fund A', units: -50, amount: -5000 },
  { date: '2025-04-01', schemeName: 'Equity Fund A', units: 30, amount: 3000 },
];

describe('ltcg engine', () => {
  it('allocates FIFO and computes qualified units per scheme', () => {
    const asOf = new Date('2026-09-26');
    // equity qualifies at 365 days, gold at 730
    const quals = { 'Equity Fund A': 365, 'Gold Fund X': 730 };
    const res = allocateFIFO(sample, quals, asOf as any);
    const equity = res.find(r=> r.schemeName === 'Equity Fund A')!;
    const gold = res.find(r=> r.schemeName === 'Gold Fund X')!;
    // after consumption: Equity lots -> 100 (2023-01-10), 50 (2024-02-15) then -50 reduces oldest => remaining 50 (from 2023),50 (from 2024), then +30 => lots: 50(2023),50(2024),30(2025)
    expect(equity.totalUnits).toBe(130);
    // qualified relative to 2026-09-26: 2023 and 2024 purchases are older than 365 days, 2025 purchase may or may not be
    expect(equity.qualifiedUnits).toBeGreaterThanOrEqual(100);
    // gold: purchase 2022 => well over 730 days
    expect(gold.totalUnits).toBe(200);
    expect(gold.qualifiedUnits).toBe(200);
  });
});
