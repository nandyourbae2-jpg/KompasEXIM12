/**
 * DashboardCalculationService
 * 
 * Generic domain service responsible strictly for KPI aggregation.
 * No frontend should calculate these independently.
 */
class DashboardCalculationService {
  /**
   * Aggregates finance KPIs for the Supervisor/Manager dashboards.
   * 
   * @param {Array} jobOrders 
   * @returns {Object} 
   */
  static calculateFinanceKPI(jobOrders) {
    if (!jobOrders || !Array.isArray(jobOrders)) {
      return { total_invoice: 0, total_paid: 0, outstanding: 0 };
    }

    const summary = jobOrders.reduce((acc, curr) => {
      acc.total_invoice += (parseFloat(curr.total_invoice) || 0);
      acc.total_paid += (parseFloat(curr.total_paid) || 0);
      return acc;
    }, { total_invoice: 0, total_paid: 0 });

    summary.outstanding = Math.max(0, summary.total_invoice - summary.total_paid);
    
    return summary;
  }
}

module.exports = DashboardCalculationService;
