/**
 * EligibilityRuleEngine
 * 
 * Generic domain service responsible strictly for business gating and eligibility checks.
 * DO NOT mix this with KPI calculations or state mutations.
 */
class EligibilityRuleEngine {
  
  /**
   * Evaluates if a Job Order is eligible to enter the MTB (Realisasi Dana) module.
   * 
   * @param {Object} jobOrder 
   * @param {Object} categoryMasterData 
   * @param {Array} existingRealizations 
   * @returns {Object} { isEligible: boolean, reason: string }
   */
  static isEligibleForMTB(jobOrder, categoryMasterData, existingRealizations) {
    if (!jobOrder) return { eligible: false, code: 'JOB_ORDER_MISSING', reason: 'Job Order not provided.' };
    
    // 1. Must be Fully Paid
    if (jobOrder.payment_status !== 'PAID') {
      return { eligible: false, code: 'NOT_PAID', reason: 'Job Order is not fully paid.' };
    }

    // 2. Must not be Void or Cancelled
    if (jobOrder.payment_status === 'VOID' || jobOrder.payment_status === 'CANCELLED') {
      return { eligible: false, code: 'VOID_OR_CANCELLED', reason: 'Job Order is voided or cancelled.' };
    }

    // 3. Must be permitted by Master Data routing, with fallback for backward compatibility
    if (categoryMasterData && categoryMasterData.allow_mtb !== undefined) {
      if (categoryMasterData.allow_mtb === 0 || categoryMasterData.allow_mtb === false) {
        return { eligible: false, code: 'CATEGORY_NOT_ALLOWED', reason: 'Category is routed out of MTB by Master Data configuration.' };
      }
    } else {
      // Temporary Fallback
      const EXCLUDED_FROM_MTB = ['TRUC (Repo Depo)', 'TRUC (Warehouse)', 'DEPO', 'LOLO (Reimb. Lift Off)'];
      if (jobOrder.cost_type && EXCLUDED_FROM_MTB.includes(jobOrder.cost_type)) {
        return { eligible: false, code: 'CATEGORY_NOT_ALLOWED', reason: 'This Job Order category cannot be realized through MTB.' };
      }
    }

    // 4. Must not already be realized
    if (existingRealizations && existingRealizations.length > 0) {
      return { eligible: false, code: 'ALREADY_REALIZED', reason: 'Job Order has already been realized in MTB.' };
    }

    return { eligible: true, code: null, reason: null };
  }

  /**
   * Evaluates if a Job Order is eligible for payment processing.
   * 
   * @param {Object} jobOrder 
   * @returns {Object} { isEligible: boolean, reason: string }
   */
  static isEligibleForPayment(jobOrder) {
    if (!jobOrder) return { isEligible: false, reason: 'Job Order not provided.' };

    if (jobOrder.payment_status === 'PAID') {
      return { isEligible: false, reason: 'Job Order is already fully paid.' };
    }

    if (jobOrder.payment_status === 'VOID' || jobOrder.payment_status === 'CANCELLED') {
      return { isEligible: false, reason: 'Job Order is voided or cancelled.' };
    }

    return { isEligible: true, reason: 'Eligible' };
  }
}

module.exports = EligibilityRuleEngine;
