function generateDNNumber() {
  const tahun = new Date().getFullYear().toString().slice(-2);
  const prefix = `DN-%-${tahun}`;
  const last = db.prepare("SELECT dn_number FROM debit_notes WHERE dn_number LIKE ? ORDER BY dn_number DESC LIMIT 1").get(prefix);
  let nextNum = 1;
  if (last && last.dn_number) {
    const match = last.dn_number.match(/DN-(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  return `DN-${String(nextNum).padStart(4, '0')}-${tahun}`;
}