/**
 * PaymentStatusService
 * 
 * Generic domain service responsible strictly for determining payment lifecycle states.
 */
class PaymentStatusService {
  /**
   * Calculates the canonical payment status based on invoice and paid amounts.
   * 
   * @param {number} totalInvoice 
   * @param {number} totalPaid 
   * @returns {string} UNPAID | PARTIALLY_PAID | PAID
   */
  static calculatePaymentStatus(totalInvoice, totalPaid) {
    const invoice = parseFloat(totalInvoice) || 0;
    const paid = parseFloat(totalPaid) || 0;

    if (invoice === 0) {
      // If there's no invoice amount, and paid > 0, it's weird, but we treat it as paid.
      return paid > 0 ? 'PAID' : 'UNPAID';
    }

    if (paid >= invoice) {
      return 'PAID';
    }

    if (paid > 0) {
      return 'PARTIALLY_PAID';
    }

    return 'UNPAID';
  }
}

module.exports = PaymentStatusService;
