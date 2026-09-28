import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

export function exportCSV(rows: any[], filename = 'mf-results.csv'){
  const headers = Object.keys(rows[0] || {});
  const csv = [headers.join(',')].concat(rows.map(r => headers.map(h=>r[h]).join(','))).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
}

export function exportXLSX(rows: any[], filename = 'mf-results.xlsx'){
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Results');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, filename);
}
