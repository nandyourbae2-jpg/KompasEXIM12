const db = require('../src/database/db');
const fs = require('fs');

console.log("Starting Vendor Audit...");

const vendors = db.prepare('SELECT * FROM vendors').all();
const jobOrders = db.prepare('SELECT vendor_id FROM job_orders WHERE vendor_id IS NOT NULL').all();
const vendorUsage = {};
jobOrders.forEach(jo => {
  vendorUsage[jo.vendor_id] = (vendorUsage[jo.vendor_id] || 0) + 1;
});

const report = [];

report.push("# Vendor Migration Review Report\n");
report.push("| Vendor ID | Vendor Name | Vendor Type | Usage Count (Job Orders) | Classification | Recommendation |");
report.push("|---|---|---|---|---|---|");

let totalValid = 0;
let totalNonVendor = 0;
let totalReview = 0;

for (const v of vendors) {
  const usageCount = vendorUsage[v.id] || 0;
  
  let classification = "NEEDS_REVIEW";
  let recommendation = "REVIEW";

  const lowerName = v.nama.toLowerCase();
  
  // Simple heuristic
  if (lowerName.includes("pt") || lowerName.includes("cv") || lowerName.includes("logistics") || lowerName.includes("trans") || lowerName.includes("forwarding") || lowerName.includes("cargo") || lowerName.includes("express")) {
    classification = "VALID_VENDOR";
    recommendation = "KEEP";
    totalValid++;
  } else if (lowerName.includes("npct") || lowerName.includes("pelindo") || lowerName.includes("bea cukai") || lowerName.includes("karantina") || lowerName.includes("depo") || lowerName.includes("jict") || lowerName.includes("terminal") || lowerName.includes("pajak") || lowerName.includes("dhl")) {
    classification = "NON_VENDOR_PARTY";
    recommendation = "POSSIBLE_NON_VENDOR (Remove from Vendor Master)";
    totalNonVendor++;
  } else {
    totalReview++;
  }

  report.push(`| ${v.id} | ${v.nama} | ${v.service_type} | ${usageCount} | ${classification} | ${recommendation} |`);
}

report.push("\n### Summary");
report.push(`- Total Existing Vendor: ${vendors.length}`);
report.push(`- Valid Vendor: ${totalValid}`);
report.push(`- Non-Vendor Party: ${totalNonVendor}`);
report.push(`- Needs Review: ${totalReview}`);

fs.writeFileSync('audit_report.md', report.join('\n'));
console.log("Audit complete! Report saved to audit_report.md.");
