    try {
      db.prepare('ALTER TABLE job_orders ADD COLUMN import_category_key TEXT').run();
      console.log('Migration: Added import_category_key to job_orders');
    } catch (e) { /* Column already exists */ }
    
    try {
      db.prepare('ALTER TABLE job_orders ADD COLUMN import_shipment_id INTEGER').run();
      console.log('Migration: Added import_shipment_id to job_orders');
    } catch (e) { /* Column already exists */ }
  })();
} catch (error) {