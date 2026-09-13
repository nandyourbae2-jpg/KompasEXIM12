const db = require('../src/database/db');
const fs = require('fs');
const xlsx = require('xlsx');

const invoice = '10826';
const sourceRecord = db.prepare('SELECT * FROM source_records WHERE raw_invoice_no = ? ORDER BY id DESC LIMIT 1').get(invoice);
if (sourceRecord) {
  const importRow = db.prepare('SELECT * FROM source_imports WHERE id = ?').get(sourceRecord.source_import_id);
  if (importRow && fs.existsSync(importRow.file_path)) {
    const workbook = xlsx.readFile(importRow.file_path, { cellDates: false });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
    const headerRow = data[0];
    const invIndex = headerRow.findIndex(h => typeof h === 'string' && h.toUpperCase().includes('INV'));
    let targetRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][invIndex] == invoice || (data[i][invIndex] && data[i][invIndex].toString().includes(invoice))) {
        targetRowIndex = i;
        break;
      }
    }
    if (targetRowIndex !== -1) {
      console.log(`\n--- ALL COLUMNS FOR INVOICE ${invoice} ---`);
      headerRow.forEach((h, i) => {
        if (h) {
           console.log(`Column '${h.replace(/\n/g, '\\n').replace(/\r/g, '\\r')}': ${data[targetRowIndex][i]} (type: ${typeof data[targetRowIndex][i]})`);
        }
      });
    }
  }
}
