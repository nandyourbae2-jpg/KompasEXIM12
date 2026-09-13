const bcrypt = require('bcrypt');
const db = require('./src/database/db');

async function seedAoUser() {
  const hash = await bcrypt.hash('password', 10);
  
  try {
    db.prepare(`
      INSERT INTO users (employee_id, nama, departemen, level_otoritas, password_hash)
      VALUES (?, ?, ?, ?, ?)
    `).run('AO-001', 'Staff AO Budi', 'Account Officer', 'Staff Dept', hash);
    console.log('User AO-001 created!');
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      console.log('User AO-001 already exists.');
    } else {
      console.error(e);
    }
  }

  const user = db.prepare('SELECT id FROM users WHERE employee_id = ?').get('AO-001');
  if (user) {
    try {
      const c1 = db.prepare("INSERT INTO customers (customer_code, name, industry) VALUES ('CUST-01', 'PT. Maju Bersama', 'Tekstil')").run();
      const c2 = db.prepare("INSERT INTO customers (customer_code, name, industry) VALUES ('CUST-02', 'CV. Aneka Tambang', 'Pertambangan')").run();
      
      db.prepare("INSERT INTO ao_customer_assignments (user_id, customer_id) VALUES (?, ?)").run(user.id, c1.lastInsertRowid);
      db.prepare("INSERT INTO ao_customer_assignments (user_id, customer_id) VALUES (?, ?)").run(user.id, c2.lastInsertRowid);

      db.prepare("INSERT INTO invoices (invoice_no, customer_id, shipment_type, shipment_id, amount, status, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)").run('INV-MB-001', c1.lastInsertRowid, 'IMPORT', 1, 50000000, 'UNPAID', '2026-08-30');
      db.prepare("INSERT INTO invoices (invoice_no, customer_id, shipment_type, shipment_id, amount, status, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)").run('INV-AT-002', c2.lastInsertRowid, 'EXPORT', 2, 75000000, 'OVERDUE', '2026-08-10');

      console.log('Seeded customers & invoices');
    } catch(e) {
      console.log('Seed data error (might already exist):', e.message);
    }
  }
}

seedAoUser();
