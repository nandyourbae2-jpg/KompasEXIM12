app.post('/api/job-orders/sync-import', (req, res) => {
  try {
    const { shipmentUn, activeCategories } = req.body;
    console.log('[SYNC] Received sync request for shipmentUn:', shipmentUn);
    console.log('[SYNC] activeCategories count:', activeCategories.length);
    
    db.transaction(() => {