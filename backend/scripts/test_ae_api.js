const db = require('../src/database/db');
const invoice = '10826';
const job = db.prepare('SELECT e.*, u.nama as ae_assignee_name FROM export_jobs e LEFT JOIN users u ON e.ae_assignee_id = u.id WHERE invoice_no = ?').get(invoice);
console.log(job);
