    jos.forEach(jo => { 
      if (jo.vendor_id) {
        jo.vendor = db.prepare('SELECT id, nama FROM vendors WHERE id = ?').get(jo.vendor_id);
      }
      jo.remaining_balance = jo.total_invoice - jo.total_paid;
      if (jo.total_paid >= jo.total_invoice && jo.total_invoice > 0) jo.status_badge = 'Lunas';
      else if (jo.total_paid > 0) jo.status_badge = 'Bayar Sebagian';
      else jo.status_badge = 'Belum Dibayar';
      jo.payment_logs = paymentsByJo[jo.id] || [];
    });