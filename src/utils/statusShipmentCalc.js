/**
 * statusShipmentCalc.js
 * Fungsi helper untuk menghitung Status Shipment secara dinamis.
 */

export const hitungStage = (shipment, allJobOrders) => {
  // 1. Cek semua kontainer gate_out_wh terisi (dan ada kontainer minimal 1)
  const totalContainers = shipment.containers.length;
  // Jika tidak ada kontainer, anggap belum gate out wh
  const semuaContainerGateOutWH = totalContainers > 0 && 
    shipment.containers.every(c => c.gateOutWh && c.gateOutWh.trim() !== '');

  // 2. Cek semua Job Orders untuk B/L ini (shipment.un) lunas
  const shipmentJOs = allJobOrders.filter(jo => jo.shipmentUn === shipment.un);
  // Kalau belum ada JO dan kita butuh Settlement, anggap belum lunas atau butuh JO. 
  // Wait, asumsi bisnis: jika tidak ada JO, artinya hutang belum dibayar (belum lunas), 
  // atau kalau benar-benar 0 biaya bisa di-bypass. Kita anggap true kalau tidak ada JO?
  // User bilang: "seluruh Job Order (tagihan/utang ke vendor) untuk B/L tsb berstatus "Lunas" (remaining_balance === 0)".
  // Jadi kalau `shipmentJOs.length === 0`, kita anggap `semuaJobOrderLunas = true`.
  const semuaJobOrderLunas = shipmentJOs.every(jo => jo.remainingBalance === 0);

  // 3. Cek semua Klaim (jika nominal > 0, harus diterima)
  const claims = [
    shipment.costs?.claimSupplier,
    shipment.costs?.claimLinerFwd,
    shipment.costs?.claimTrucking
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
