import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { parseXLSX } from './parser';

describe('parseXLSX', () => {
  it('uses actual cell references and skips empty rows after the header', async () => {
    const rows = Array.from({ length: 16 }, () => Array(20).fill(''));
    rows[11][5] = 'Date';
    rows[11][6] = 'Scheme Name';
    rows[11][7] = 'Amount';
    rows[11][8] = 'Units';
    rows[11][9] = 'Transaction Type';

    rows[12][5] = '01/05/2024';
    rows[12][6] = 'Axis Fund';
    rows[12][7] = 1200;
    rows[12][8] = 10;
    rows[12][9] = 'BUY';

    rows[13] = Array(20).fill('');
    rows[14][5] = '01/06/2024';
    rows[14][6] = 'HDFC Fund';
    rows[14][7] = 1500;
    rows[14][8] = 15;
    rows[14][9] = 'BUY';

    const sheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1');
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

    const transactions = await parseXLSX(buffer as ArrayBuffer);

    expect(transactions).toHaveLength(2);
    expect(transactions[0].raw).toHaveProperty('F13');
    expect(transactions[0].raw).toHaveProperty('G13');
    expect(transactions[0].date).toBeTruthy();
    expect(transactions[0].schemeName).toBe('Axis Fund');
    expect(transactions[1].schemeName).toBe('HDFC Fund');
  });
});
