const Database = require('better-sqlite3');
const db = new Database('kompas-exim.db');

const year = new Date().getFullYear();
const prefix = `EXP-${year}-`;

function _generateJobCode() {
  const records = db.prepare("SELECT job_code FROM export_jobs WHERE job_code LIKE ?").all(`${prefix}%`);
  let maxNum = 0;
  for (const record of records) {
    const numStr = record.job_code.replace(prefix, '');
    const num = parseInt(numStr, 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  }
  return `${prefix}${String(maxNum + 1).padStart(6, '0')}`;
}

const tx = db.transaction(() => {
  const code1 = _generateJobCode();
  console.log("Code 1:", code1);
  db.prepare("INSERT INTO export_jobs (job_code, business_key) VALUES (?, ?)").run(code1, 'TEST-1');
  
  const code2 = _generateJobCode();
  console.log("Code 2:", code2);
  db.prepare("INSERT INTO export_jobs (job_code, business_key) VALUES (?, ?)").run(code2, 'TEST-2');
});

try {
  tx();
} catch (e) {
  console.error(e);
}
