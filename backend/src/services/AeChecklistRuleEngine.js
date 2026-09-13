class AeChecklistRuleEngine {
  /**
   * Determine the template name based on job fields
   */
  static determineTemplateName(job) {
    if (!job.buyer) return null;
    const buyer = job.buyer.toUpperCase();
    const product = (job.product_type || '').toUpperCase();
    const destination = (job.destination || '').toUpperCase();

    // The user notes "PBN" could be Bolton or Trinity or Palmera, but let's stick to PBN logic if buyer includes it
    // Actually in the source data, Bolton is often the buyer for Genoa or PBN.
    if (buyer.includes('SAMICO')) return 'SAMICO';
    if (buyer.includes('PSB')) return 'PSB';
    if (buyer.includes('PSFI')) return 'PSFI';
    
    // Assuming PBN is a broad category, or explicit
    if (buyer.includes('PBN') || buyer.includes('BOLTON') || buyer.includes('TMI')) {
       if (destination.includes('GENOA')) return 'PBN (GENOA ONLY)';
       if (product.includes('LOIN')) return 'PBN (LOIN)';
       if (product.includes('FLAKE')) return 'PBN (FLAKES)';
       if (product.includes('WR')) return 'PBN (WR)';
       if (product.includes('FM')) return 'PBN (FM)';
       if (product.includes('POUCH')) return 'PBN (POUCH)';
       if (product.includes('FO')) return 'PBN (FO)';
       if (product.includes('FE')) return 'PBN (FE)';
    }

    // Default fallback if logic doesn't match perfectly
    return null;
  }

  /**
   * Evaluate a set of rules against job attributes.
   * Rules is a JSON string or array: [{field, operator, value}]
   * Returns true if all rules pass, false otherwise.
   */
  static evaluate(rulesJson, job) {
    if (!rulesJson) return true; // No rules means it's unconditionally applicable

    let rules = [];
    try {
      rules = typeof rulesJson === 'string' ? JSON.parse(rulesJson) : rulesJson;
    } catch (e) {
      console.error('Invalid JSON in applicability_rules', rulesJson);
      return false; // Fail safe
    }

    if (!Array.isArray(rules) || rules.length === 0) return true;

    for (const rule of rules) {
      const { field, operator, value } = rule;
      const jobValue = job[field];

      if (jobValue === undefined || jobValue === null) {
        return false; 
      }

      switch (operator) {
        case 'EQUALS':
          if (String(jobValue).toUpperCase() !== String(value).toUpperCase()) return false;
          break;
        case 'IN':
          if (!Array.isArray(value)) return false;
          const uppercaseValueList = value.map(v => String(v).toUpperCase());
          if (!uppercaseValueList.includes(String(jobValue).toUpperCase())) return false;
          break;
        case 'NOT_EQUALS':
          if (String(jobValue).toUpperCase() === String(value).toUpperCase()) return false;
          break;
        default:
          console.warn(`Unknown rule operator: ${operator}`);
          return false;
      }
    }

    return true; // All rules passed
  }
}

module.exports = AeChecklistRuleEngine;
