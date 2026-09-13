// --- 3.5. DOCUMENT TYPES ---
app.get('/api/document-types', (req, res) => {
  res.json({ documentTypes: ["BL", "Invoice", "Packing List", "Form E", "PIB", "SPPB", "DO"] });
});

// --- 4. VENDORS ---
app.get('/api/vendors', (req, res) => {