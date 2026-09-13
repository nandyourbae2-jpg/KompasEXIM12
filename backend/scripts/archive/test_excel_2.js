const XLSX = require('xlsx');

const workbook = XLSX.readFile('/Users/macbookair/Downloads/KOMPAS EXIM/backend/src/uploads/log-schedule-1788167877007-442614433.xlsx', { cellDates: true });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });

const row = data.find(r => String(r['INV']).includes('10826') && String(r['NO. AJU / NO. BC']).includes('JKTG70953500'));

console.log(JSON.stringify(row, null, 2));
