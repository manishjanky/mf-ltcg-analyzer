import { describe, it, expect } from 'vitest';
import { parseCSV } from '../parser';

const sampleCSV = `Date,Scheme,Amount,Units,Type
2024-01-01,Test Fund,1000,10,BUY
2025-01-02,Test Fund,1000,10,BUY
`;

describe('parser', () => {
  it('parses CSV', async () => {
    const res = await parseCSV(sampleCSV);
    expect(res.length).toBe(2);
    expect(res[0].schemeName).toBe('Test Fund');
    expect(res[0].units).toBe(10);
  });
});
