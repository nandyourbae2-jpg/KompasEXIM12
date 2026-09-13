const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, '../kompas-exim.db');
const db = new Database(dbPath);

const BCRYPT_ROUNDS = 10;
const isDryRun = process.argv.includes('--dry-run');

console.log('==================================================');
console.log('PASSWORD MIGRATION SCRIPT (Bcrypt)');
console.log('==================================================');
if (isDryRun) {
  console.log('MODE: DRY RUN (No data will be mutated)');
} else {
  console.log('MODE: EXECUTE (Passwords will be hashed and updated)');
}
console.log('==================================================\n');

try {
  // Check if password_migrated_at exists, if not create it for auditability
  try {
    db.prepare('ALTER TABLE users ADD COLUMN password_migrated_at TEXT').run();
    console.log('[+] Added password_migrated_at column to users table.');
  } catch (e) {
    // Column might already exist
  }

  const users = db.prepare('SELECT id, employee_id, nama, password_hash FROM users').all();
  
  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  const updateStmt = db.prepare("UPDATE users SET password_hash = ?, password_migrated_at = datetime('now', 'localtime') WHERE id = ?");

  // Transaction ensures either all passwords in a batch update, or none
  const migratePasswords = db.transaction((usersToMigrate) => {
    for (const user of usersToMigrate) {
      if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$')) {
        console.log(`[SKIPPED] User ${user.employee_id} (${user.nama}) - Already hashed.`);
        skippedCount++;
        continue;
      }

      try {
        const hash = bcrypt.hashSync(user.password_hash, BCRYPT_ROUNDS);
        if (!isDryRun) {
          updateStmt.run(hash, user.id);
        }
        console.log(`[SUCCESS] User ${user.employee_id} (${user.nama}) - Migrated.`);
        successCount++;
      } catch (err) {
        console.error(`[ERROR] Failed to hash password for ${user.employee_id}:`, err);
        errorCount++;
      }
    }
  });

  migratePasswords(users);

  console.log('\n==================================================');
  console.log('MIGRATION REPORT');
  console.log('==================================================');
  console.log(`Total Users Found : ${users.length}`);
  console.log(`Successfully Hash : ${successCount}`);
  console.log(`Skipped (Hashed)  : ${skippedCount}`);
  console.log(`Errors Occurred   : ${errorCount}`);
  console.log('==================================================');

} catch (e) {
  console.error('\n[FATAL ERROR] Migration aborted:', e.message);
} finally {
  db.close();
}
