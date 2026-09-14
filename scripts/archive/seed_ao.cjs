const bcrypt = require('bcryptjs');
const db = require('./backend/src/database/db');

async function seedAoUser() {
  const hash = await bcrypt.hash('password123', 10);
  
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

  // Also seed some customers and assign to AO-001
  const user = db.prepare('SELECT id FROM users WHERE employee_id = ?').get('AO-001');
  if (user) {
    try {
      const custInfo1 = db.prepare("INSERT INTO customers (customer_code, name, industry) VALUES ('CUST-01', 'PT. Maju Bersama', 'Tekstil')").run();
      const custInfo2 = db.prepare("INSERT INTO customers (customer_code, name, industry) VALUES ('CUST-02', 'CV. Aneka Tambang', 'Pertambangan')").run();
      
      db.prepare("INSERT INTO ao_customer_assignments (user_id, customer_id) VALUES (?, ?)").run(user.id, custInfo1.lastInsertRowid);
      db.prepare("INSERT INTO ao_customer_assignments (user_id, customer_id) VALUES (?, ?)").run(user.id, custInfo2.lastInsertRowid);

      // Create an invoice
      db.prepare("INSERT INTO invoices (invoice_no, customer_id, shipment_type, shipment_id, amount, status) VALUES (?, ?, ?, ?, ?, ?)").run('INV-MB-001', custInfo1.lastInsertRowid, 'IMPORT', 1, 50000000, 'UNPAID');

      console.log('Seeded customers & invoices');
    } catch(e) {
      console.log('Seed data error (might already exist):', e.message);
    }
  }
}

seedAoUser();
