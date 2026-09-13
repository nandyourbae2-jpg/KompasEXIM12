const db = require('../src/database/db');

console.log("Starting Migration: Add Vendor Business Review fields");

try {
  db.prepare('BEGIN').run();

  // Check if columns exist
  const tableInfo = db.prepare("PRAGMA table_info('vendors')").all();
  const hasReviewStatus = tableInfo.some(col => col.name === 'review_status');
  const hasReviewNote = tableInfo.some(col => col.name === 'review_note');

  if (!hasReviewStatus) {
    db.prepare("ALTER TABLE vendors ADD COLUMN review_status TEXT DEFAULT 'CONFIRMED'").run();
    console.log("Added column: review_status");
  } else {
    console.log("Column review_status already exists. Skipping ALTER.");
  }

  if (!hasReviewNote) {
    db.prepare("ALTER TABLE vendors ADD COLUMN review_note TEXT").run();
    console.log("Added column: review_note");
  } else {
    console.log("Column review_note already exists. Skipping ALTER.");
  }

  // Set the 6 specific vendors to NEEDS_REVIEW
  // The user said: ID 1, 2, 3, 5, 15, 16.
  // Their status remains whatever it is now.
  const needsReviewIds = [1, 2, 3, 5, 15, 16];
  let updateCount = 0;
  
  // First, ensure all existing active/inactive vendors default to CONFIRMED or NON_VENDOR 
  // We already ran canonicalization migration. ID 11, 17, 18, 23, 24 are INACTIVE.
  // Also ID 8, 9, 10, 12, 13, 14 are INACTIVE (Duplicates).
  // Wait, let's just let the default 'CONFIRMED' stay for everything else,
  // EXCEPT for those we manually deactivated as NON_VENDOR during canonicalization (11, 17, 18, 23, 24).
  // The user explicitly stated: "Vendor existing yang sudah confirmed/canonical harus review_status = CONFIRMED".
  // Duplicates can remain CONFIRMED and status Inactive. Non-vendors should ideally be NON_VENDOR.
  // The user instructions for marking as Non-Vendor says review_status = 'NON_VENDOR'.
  // But let's just do exactly what's requested for the 6 vendors first.
  
  for (const id of needsReviewIds) {
    const result = db.prepare(`UPDATE vendors SET review_status = 'NEEDS_REVIEW' WHERE id = ?`).run(id);
    if (result.changes > 0) updateCount++;
  }
  
  // Update the known NON-VENDORs from previous migration to review_status = NON_VENDOR to keep data consistent.
  const nonVendorIds = [11, 17, 18, 23, 24];
  for (const id of nonVendorIds) {
    db.prepare(`UPDATE vendors SET review_status = 'NON_VENDOR' WHERE id = ?`).run(id);
  }

  db.prepare('COMMIT').run();
  
  console.log(`Migration successful! Updated ${updateCount} vendors to NEEDS_REVIEW.`);
} catch (e) {
  console.error("Migration failed:", e);
  db.prepare('ROLLBACK').run();
}
