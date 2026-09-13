const db = require('../src/database/db');
const fs = require('fs');
const xlsx = require('xlsx');

const invoice = '10826';
console.log(`\n============================================================`);
console.log(`DIAGNOSIS FOR INVOICE: ${invoice}`);
console.log(`============================================================\n`);

// 1. Get export_jobs
const job = db.prepare('SELECT * FROM export_jobs WHERE invoice_no = ?').get(invoice);
console.log(`--- export_jobs ---`);
if (job) {
  console.log(`ID: ${job.id}`);
  console.log(`Business Key: ${job.business_key}`);
  console.log(`Closing Docs: ${job.closing_docs}`);
  console.log(`Closing Docs Time: ${job.closing_docs_time}`);
  console.log(`Closing CY: ${job.closing_cy}`);
  console.log(`Closing CY Time: ${job.closing_cy_time}`);
  console.log(`Initial ETD: ${job.initial_etd}`);
  console.log(`ETD: ${job.etd}`);
  console.log(`ETA: ${job.eta}`);
} else {
  console.log(`Not found.`);
}

// 2. Get source_records
const sourceRecord = db.prepare('SELECT * FROM source_records WHERE raw_invoice_no = ? ORDER BY id DESC LIMIT 1').get(invoice);
console.log(`\n--- source_records ---`);
if (sourceRecord) {
  console.log(`ID: ${sourceRecord.id}`);
  console.log(`Import ID: ${sourceRecord.source_import_id}`);
  console.log(`Raw Closing Docs: ${sourceRecord.raw_closing_docs}`);
  console.log(`Raw Closing Docs Time: ${sourceRecord.raw_closing_docs_time}`);
  console.log(`Raw Closing CY: ${sourceRecord.raw_closing_cy}`);
  console.log(`Raw Closing CY Time: ${sourceRecord.raw_closing_cy_time}`);
  console.log(`Raw ETD: ${sourceRecord.raw_etd}`);
  console.log(`Raw ETA: ${sourceRecord.raw_eta}`);
} else {
  console.log(`Not found.`);
}

// 3. Find the import file
if (sourceRecord) {
  const importRow = db.prepare('SELECT * FROM source_imports WHERE id = ?').get(sourceRecord.source_import_id);
  console.log(`\n--- source_imports ---`);
  if (importRow) {
    console.log(`File Name: ${importRow.file_name}`);
    console.log(`File Path: ${importRow.file_path}`);
    
    // Attempt to read raw Excel
    if (fs.existsSync(importRow.file_path)) {
      console.log(`\n--- Original Excel ---`);
      const workbook = xlsx.readFile(importRow.file_path, { cellDates: false });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
      
      // Find row with invoice
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
        console.log(`Found invoice at row ${targetRowIndex + 1}`);
        headerRow.forEach((h, i) => {
          if (h && (h.toUpperCase().includes('CLOSING') || h.toUpperCase().includes('ETD') || h.toUpperCase().includes('ETA'))) {
             console.log(`Column '${h}': ${data[targetRowIndex][i]} (type: ${typeof data[targetRowIndex][i]})`);
          }
        });
      } else {
        console.log(`Invoice not found in Excel.`);
      }
    } else {
      console.log(`Excel file does not exist at ${importRow.file_path}`);
    }
  }
}

