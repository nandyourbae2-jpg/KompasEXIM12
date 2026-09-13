/**
 * statusShipmentCalc.js (Backend Canonical Source)
 * Fungsi helper untuk menghitung Status Shipment secara dinamis.
 * Dipakai oleh Analytics API untuk menghindari duplicate logic dengan frontend.
 */

const hitungStage = (shipment, allJobOrders) => {
  // 1. Cek semua kontainer gate_out_wh terisi (dan ada kontainer minimal 1)
  const totalContainers = shipment.containers ? shipment.containers.length : 0;
  // Jika tidak ada kontainer, anggap belum gate out wh
  // Note: di backend propertinya adalah gate_out_wh
  const semuaContainerGateOutWH = totalContainers > 0 && 
    shipment.containers.every(c => c.gate_out_wh && c.gate_out_wh.trim() !== '');

  // 2. Cek semua Job Orders untuk B/L ini (shipment.un) lunas
  // finance_job_orders table in DB uses shipment_un and remaining_balance
  const shipmentJOs = allJobOrders.filter(jo => jo.shipment_un === shipment.un || jo.shipmentUn === shipment.un);
  const semuaJobOrderLunas = shipmentJOs.every(jo => (jo.remaining_balance !== undefined ? jo.remaining_balance : jo.remainingBalance) === 0);

  // 3. Cek semua Klaim (jika nominal > 0, harus diterima)
  let costs = shipment.costs;
  if (typeof costs === 'string') {
    try { costs = JSON.parse(costs || '{}'); } catch(e) { costs = {}; }
  } else {
    costs = costs || {};
  }

  const claims = [
    costs.claimSupplier,
    costs.claimLinerFwd,
    costs.claimTrucking
  ].filter(c => c && Number(c.amount) > 0);

  const semuaKlaimDiterima = claims.length === 0 || 
    claims.every(c => c.status_klaim === 'Diterima');

  // Evaluasi dari bawah ke atas sesuai hirarki stage
  if (semuaContainerGateOutWH && semuaJobOrderLunas && semuaKlaimDiterima) {
    return 'Status Complete';
  } else if (semuaContainerGateOutWH) {
    return 'Financial Settlement';
  } else if (shipment.ata && shipment.ata.trim() !== '') {
    return 'Delivery Active';
  } else {
    return 'Shipment Active';
  }
};

module.exports = { hitungStage };
