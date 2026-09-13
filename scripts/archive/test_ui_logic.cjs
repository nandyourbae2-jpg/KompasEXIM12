const db = require('./backend/src/database/db');
console.log('--- UI LOGIC TEST ---');

// 1. Golden Job 10826
const j1 = db.prepare(`SELECT closing_docs FROM export_jobs WHERE invoice_no = '10826'`).get();
if (j1) {
   console.log(`Invoice 10826 Closing Docs: ${j1.closing_docs ? j1.closing_docs : 'SOURCE DATA INCOMPLETE'}`);
} else {
   console.log('Invoice 10826 not found');
}

// 2. Missing Closing Docs
const j2 = db.prepare(`SELECT closing_docs FROM export_jobs WHERE closing_docs IS NULL LIMIT 1`).get();
if (j2) {
   console.log(`Missing Closing Docs Display: ${j2.closing_docs ? j2.closing_docs : 'SOURCE DATA INCOMPLETE'}`);
}
