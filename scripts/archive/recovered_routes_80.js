          console.log('[SYNC] Inserting new tagihan:', { finalCode, invoiceNo: cat.inv, vendorId, costType: cat.name, dpp, persenPpn, totalInvoice, shipmentUn, sumber: 'import_operational', key: cat.key, status, importShipmentId });
          
          db.prepare(`
            INSERT INTO job_orders (job_order_code, invoice_no, vendor_id, cost_type, dpp, persen_ppn, total_invoice, tanggal_jatuh_tempo, shipment_un, sumber, import_category_key, status_linked, import_shipment_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, date('now'), ?, ?, ?, ?, ?)
          `).run(
            finalCode, cat.inv, vendorId, cat.name, dpp, persenPpn, totalInvoice, shipmentUn, 'import_operational', cat.key, status, importShipmentId || null
          );
        }