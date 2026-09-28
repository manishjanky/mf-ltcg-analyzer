export type Transaction = {
  date: string; // ISO date
  schemeName: string;
  amount: number;
  units: number;
  type?: string; // e.g., BUY, SIP, SELL, REDEMPTION
  raw?: Record<string, any>;
  headerMeta?: Array<{ value: string; label: string }>;
};

export type HeaderMeta = {
  value: string;
  label: string;
};

export async function parseCSV(csvText: string): Promise<Transaction[]> {
  const Papa = (await import('papaparse')).default;
  const res = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  return (res.data as any[]).map((row) => ({ raw: row } as any));
}

export async function parseJSON(jsonText: string): Promise<Transaction[]> {
  const arr = JSON.parse(jsonText);
  return (arr as any[]).map((row) => ({ raw: row } as any));
}

export async function parseXLSX(buffer: ArrayBuffer): Promise<Transaction[]> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];

  const cellEntries = Object.entries(sheet).filter(([key]) => !key.startsWith('!'));
  const rowValues = new Map<number, Map<number, any>>();

  for (const [cellRef, cell] of cellEntries) {
    const decoded = XLSX.utils.decode_cell(cellRef);
    const value = cell && 'v' in cell ? cell.v : undefined;
    if (value === undefined || value === null || String(value).trim() === '') continue;

    if (!rowValues.has(decoded.r)) {
      rowValues.set(decoded.r, new Map<number, any>());
    }
    rowValues.get(decoded.r)!.set(decoded.c, value);
  }

  const rowNumbers = [...rowValues.keys()].sort((a, b) => a - b);
  const headerRow = rowNumbers.find((rowNumber) => {
    const row = rowValues.get(rowNumber) ?? new Map();
    return [...row.values()].some((value) => /(date|scheme|amount|units|transaction type|type)/i.test(String(value).trim()));
  });

  if (headerRow === undefined) {
    return [];
  }

  const headerCells = [...(rowValues.get(headerRow) ?? new Map()).entries()]
    .map(([colIndex, value]) => {
      const label = String(value).trim();
      if (!/(date|scheme|amount|units|transaction type|type)/i.test(label)) {
        return null;
      }
      return {
        colIndex,
        label,
        ref: `${columnIndexToLetter(colIndex)}${headerRow + 1}`
      };
    })
    .filter(Boolean) as Array<{ colIndex: number; label: string; ref: string }>;

  if (headerCells.length === 0) {
    return [];
  }

  const mapping = {
    date: headerCells.find((header) => /date/i.test(header.label))?.colIndex ?? headerCells[0].colIndex,
    schemeName: headerCells.find((header) => /scheme/i.test(header.label))?.colIndex ?? headerCells[1]?.colIndex ?? headerCells[0].colIndex,
    amount: headerCells.find((header) => /amount/i.test(header.label))?.colIndex ?? headerCells[2]?.colIndex ?? headerCells[0].colIndex,
    units: headerCells.find((header) => /unit/i.test(header.label))?.colIndex ?? headerCells[3]?.colIndex ?? headerCells[0].colIndex,
    type: headerCells.find((header) => /type/i.test(header.label))?.colIndex ?? headerCells[4]?.colIndex ?? headerCells[0].colIndex,
  };

  const transactions: Transaction[] = [];

  for (const rowNumber of rowNumbers) {
    if (rowNumber <= headerRow) continue;
    const rowMap = rowValues.get(rowNumber) ?? new Map();
    if (rowMap.size === 0) continue;

    const rowHasData = [...rowMap.entries()].some(([colIndex, value]) => {
      const text = String(value ?? '').trim();
      if (!text) return false;
      const header = headerCells.find((item) => item.colIndex === colIndex);
      return !!header || text.length > 0;
    });
    if (!rowHasData) continue;

    const raw: Record<string, any> = {};
    for (const [colIndex, value] of rowMap.entries()) {
      const cellRef = `${columnIndexToLetter(colIndex)}${rowNumber + 1}`;
      raw[cellRef] = value;
      const header = headerCells.find((item) => item.colIndex === colIndex);
      if (header) {
        raw[header.label] = value;
      }
    }

    const dateValue = rowMap.get(mapping.date);
    const schemeValue = rowMap.get(mapping.schemeName);
    const amountValue = rowMap.get(mapping.amount);
    const unitsValue = rowMap.get(mapping.units);
    const typeValue = rowMap.get(mapping.type) ?? 'BUY';

    if (!dateValue || !schemeValue || !amountValue || !unitsValue) {
      continue;
    }

    transactions.push({
      raw,
      headerMeta: headerCells.map((header) => ({ value: header.ref, label: `${header.label} (${header.ref})` })),
      date: normalizeDateValue(dateValue),
      schemeName: String(schemeValue ?? '').trim(),
      amount: parseNumberValue(amountValue),
      units: parseNumberValue(unitsValue),
      type: String(typeValue || 'BUY').trim(),
    });
  }

  return transactions;
}

function columnIndexToLetter(index: number): string {
  let value = index + 1;
  let result = '';
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

function isNonEmptyCell(value: any): boolean {
  if (value === null || value === undefined) return false;
  return String(value).trim() !== '';
}

function normalizeDateValue(value: any): string {
  if (!value || String(value).trim() === '') return new Date(0).toISOString();
  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) return parsed.toISOString();
  return new Date(0).toISOString();
}

function parseNumberValue(value: any): number {
  if (value == null || value === '') return 0;
  const str = String(value).replace(/,/g, '').replace(/[^0-9.-]/g, '');
  const n = Number(str);
  return Number.isFinite(n) ? n : 0;
}

export type Mapping = {
  date: string;
  schemeName: string;
  amount: string;
  units: string;
  type?: string;
};

export function normalizeRows(rows: any[], mapping: Mapping): Transaction[] {
  return rows.map((r) => {
    const raw = r.raw ?? r;
    const dateKey = mapping.date || 'Date';
    const schemeKey = mapping.schemeName || 'Scheme Name';
    const amountKey = mapping.amount || 'Amount';
    const unitsKey = mapping.units || 'Units';
    const typeKey = mapping.type || 'Type';

    const dateVal = raw[dateKey] ?? raw[dateKey.toLowerCase()] ?? raw['Date'] ?? raw['date'];
    const unitsVal = raw[unitsKey] ?? raw[unitsKey.toLowerCase()] ?? raw['Units'] ?? raw['units'];
    const amountVal = raw[amountKey] ?? raw[amountKey.toLowerCase()] ?? raw['Amount'] ?? raw['amount'];
    const schemeVal = raw[schemeKey] ?? raw[schemeKey.toLowerCase()] ?? raw['Scheme Name'] ?? raw['Scheme'] ?? raw['scheme'];
    const typeVal = raw[typeKey] ?? raw[typeKey.toLowerCase()] ?? raw['Transaction Type'] ?? raw['Type'] ?? raw['type'] ?? 'BUY';
    return {
      date: normalizeDateValue(dateVal),
      schemeName: String(schemeVal || '').trim(),
      amount: parseNumberValue(amountVal),
      units: parseNumberValue(unitsVal),
      type: String(typeVal || 'BUY').trim(),
      raw,
    } as Transaction;
  });
}
