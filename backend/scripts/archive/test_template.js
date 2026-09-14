const AeChecklistRuleEngine = require('./services/AeChecklistRuleEngine');

console.log(AeChecklistRuleEngine.determineTemplateName({ buyer: 'PBN', product_type: 'LOIN' })); // Expected: PBN (LOIN)
console.log(AeChecklistRuleEngine.determineTemplateName({ buyer: 'BOLTON', product_type: 'POUCH' })); // Expected: PBN (POUCH)
console.log(AeChecklistRuleEngine.determineTemplateName({ buyer: 'TRINITY', destination: 'GENOA' })); // Expected: PBN (GENOA ONLY)
console.log(AeChecklistRuleEngine.determineTemplateName({ buyer: 'SAMICO', product_type: 'ANYTHING' })); // Expected: SAMICO
console.log(AeChecklistRuleEngine.determineTemplateName({ buyer: 'PSFI', product_type: 'WR' })); // Expected: PSFI
