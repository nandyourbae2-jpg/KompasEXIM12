app.post('/api/job-orders/sync-import', (req, res) => {
  try {
    const { importShipmentId, shipmentUn, activeCategories } = req.body;
    console.log('[SYNC] Received sync request for shipmentUn:', shipmentUn, 'id:', importShipmentId);
    console.log('[SYNC] activeCategories count:', activeCategories.length);
    
    db.transaction(() => {
      // 1. Dapatkan daftar JO aktif sebelumnya untuk shipment ini (filter by id AND un to be safe)
      let queryStr = 'SELECT * FROM job_orders WHERE shipment_un = ? AND sumber = ?';
      let queryParams = [shipmentUn, 'import_operational'];
      
      if (importShipmentId) {
        // If we have import_shipment_id column, use it. But for now, we just rely on shipmentUn 
        // to avoid schema errors if we don't migrate perfectly, OR we do migrate it below!
      }
      
      const prevRows = db.prepare(queryStr).all(...queryParams);
      const prevMap = new Map();
      prevRows.forEach(row => prevMap.set(row.import_category_key, row));