const ReportRepository = require('../repositories/ReportRepository');

class ReportService {
  async getReports(departemen, tipe) {
    return ReportRepository.findReports(departemen, tipe);
  }

  async createReport(payload, user) {
    const { tipe, judul, isi, problem_report_id } = payload;
    return ReportRepository.createReport(tipe, judul, isi, user.departemen, user.id, problem_report_id);
  }

  async updateTanggapan(id, tanggapan_manager, user) {
    return ReportRepository.updateTanggapan(id, tanggapan_manager, user.id);
  }

  async updateTinjau(id) {
    return ReportRepository.updateTinjau(id);
  }

  async getPlanGdg() {
    const shipments = ReportRepository.getShipmentsWithProjects();
    const shipmentIds = shipments.map(s => s.id);
    
    // Fix N+1 queries by fetching containers in bulk
    const allContainers = ReportRepository.getContainersForShipments(shipmentIds);
    const containerMap = {};
    allContainers.forEach(c => {
      if (!containerMap[c.shipment_id]) containerMap[c.shipment_id] = [];
      containerMap[c.shipment_id].push(c);
    });

    return shipments.map(s => {
      const containers = containerMap[s.id] || [];
      const isReady = containers.length > 0 && containers.every(c => c.trucking_repo_vendor && c.trucking_wh_vendor);
      return {
        ...s,
        containers,
        status_readiness: isReady ? 'Siap' : 'Menunggu Vendor',
        free_time_terakhir: s.eta && s.free_time_destination ? 
          new Date(new Date(s.eta).getTime() + s.free_time_destination*24*60*60*1000).toISOString().slice(0,10) : null
      };
    });
  }

  async getStatusShipment() {
    const shipments = ReportRepository.getShipmentsWithProjects();
    const shipmentIds = shipments.map(s => s.id);
    // Fix N+1 queries
    const allContainers = ReportRepository.getContainersForShipments(shipmentIds);
    const allJobs = ReportRepository.getJobOrdersForShipments(shipmentIds, 'import_operational');

    const containerMap = {};
    allContainers.forEach(c => {
      if (!containerMap[c.shipment_id]) containerMap[c.shipment_id] = [];
      containerMap[c.shipment_id].push(c);
    });

    const jobMap = {};
    allJobs.forEach(j => {
      if (!jobMap[j.import_shipment_id]) jobMap[j.import_shipment_id] = [];
      jobMap[j.import_shipment_id].push(j);
    });

    return shipments.map(s => {
      const containers = containerMap[s.id] || [];
      const jobs = jobMap[s.id] || [];
      
      let stage = 'Shipment Active';
      if (s.ata) {
        const semuaGateOut = containers.length > 0 && containers.every(c => c.gate_out_wh);
        stage = semuaGateOut ? 'Financial Settlement' : 'Delivery Active';
        if (stage === 'Financial Settlement') {
          const semuaLunas = jobs.length > 0 && jobs.every(j => j.total_paid >= j.total_invoice);
          if (semuaLunas) stage = 'Status Complete';
        }
      }
      return { ...s, stage };
    });
  }

  async getControlTowerStats(departemen, user) {
    const targetDept = departemen || user.departemen;
    const tasks = ReportRepository.getTasksByDepartment(targetDept);
    const jobs = ReportRepository.getJobOrdersFinancials(); 
    
    return {
      tasks: {
        total: tasks.length,
        selesai: tasks.filter(t => t.status === 'Selesai').length,
        kritis: tasks.filter(t => t.prioritas === 'Kritis').length
      },
      finance: {
        total_invoice: jobs.reduce((s, j) => s + j.total_invoice, 0),
        total_paid: jobs.reduce((s, j) => s + j.total_paid, 0)
      }
    };
  }

  async getArchiveHistory() {
    return ReportRepository.getArchiveHistory();
  }
}

module.exports = new ReportService();
