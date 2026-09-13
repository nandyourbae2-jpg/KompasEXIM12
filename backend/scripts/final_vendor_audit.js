const db = require('../src/database/db');
const fs = require('fs');

console.log("Starting Final Vendor Master Data Quality Audit...");

// Fetch all vendors
const vendors = db.prepare('SELECT * FROM vendors').all();
const vendorMap = new Map(vendors.map(v => [v.id, v]));

// Fetch usages
const jobOrders = db.prepare('SELECT id, vendor_id, vendor_name FROM job_orders').all();
const commitments = db.prepare('SELECT id, vendor_id, vendor_nama_manual FROM financial_request_ledger').all();

// Vendor usages mapping
const usageCounts = {};
const orphanRefs = [];

jobOrders.forEach(jo => {
  if (jo.vendor_id !== null) {
    if (!vendorMap.has(jo.vendor_id)) {
      orphanRefs.push({ table: 'job_orders', record_id: jo.id, orphan_vendor_id: jo.vendor_id });
    } else {
      if (!usageCounts[jo.vendor_id]) usageCounts[jo.vendor_id] = { jo: 0, commit: 0, total: 0 };
      usageCounts[jo.vendor_id].jo++;
      usageCounts[jo.vendor_id].total++;
    }
  }
});

commitments.forEach(c => {
  if (c.vendor_id !== null) {
    if (!vendorMap.has(c.vendor_id)) {
      orphanRefs.push({ table: 'financial_request_ledger', record_id: c.id, orphan_vendor_id: c.vendor_id });
    } else {
      if (!usageCounts[c.vendor_id]) usageCounts[c.vendor_id] = { jo: 0, commit: 0, total: 0 };
      usageCounts[c.vendor_id].commit++;
      usageCounts[c.vendor_id].total++;
    }
  }
});

// Duplicates detection
const nameMap = new Map();
const possibleDuplicates = [];
vendors.forEach(v => {
  const norm = v.nama.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!nameMap.has(norm)) {
    nameMap.set(norm, [v]);
  } else {
    nameMap.get(norm).push(v);
  }
});
for (const [norm, arr] of nameMap.entries()) {
  if (arr.length > 1) {
    possibleDuplicates.push(arr);
  }
}

// Categorize vendors
let totalValid = 0;
let totalNonVendor = 0;
let totalReview = 0;
let unclassifiedType = 0;
let notRatedCount = 0;
const typeDist = { 'Forwarder': 0, 'Trucking': 0, 'Both': 0, 'Other': 0 };

const validVendors = [];
const nonVendorParties = [];
const needsReview = [];

vendors.forEach(v => {
  const lowerName = v.nama.toLowerCase();
  let category = "NEEDS_REVIEW";
  
  if (lowerName.includes("pt") || lowerName.includes("cv") || lowerName.includes("logistics") || lowerName.includes("trans") || lowerName.includes("forwarding") || lowerName.includes("cargo") || lowerName.includes("express") || lowerName.includes("line")) {
    category = "VALID_VENDOR";
    totalValid++;
    validVendors.push(v);
  } else if (lowerName.includes("npct") || lowerName.includes("pelindo") || lowerName.includes("bea cukai") || lowerName.includes("karantina") || lowerName.includes("depo") || lowerName.includes("jict") || lowerName.includes("terminal") || lowerName.includes("pajak") || lowerName.includes("dhl") || lowerName.includes("pelayaran")) {
    category = "NON_VENDOR_PARTY";
    totalNonVendor++;
    nonVendorParties.push(v);
  } else {
    category = "NEEDS_REVIEW";
    totalReview++;
    needsReview.push(v);
  }

  if (v.service_type === 'Forwarder' || v.service_type === 'Trucking' || v.service_type === 'Both') {
    typeDist[v.service_type]++;
  } else {
    typeDist['Other']++;
    if (category === "VALID_VENDOR") unclassifiedType++;
  }
  
  if (v.review_count === 0 || !v.rating) {
    notRatedCount++;
  }
});

// Output Report
const report = [];
report.push("# Final Vendor Master Data Quality Audit\n");

report.push("## Vendor Master Summary\n");
report.push(`- Total Vendors: ${vendors.length}`);
report.push(`- Valid Vendors: ${totalValid}`);
report.push(`- Non-Vendor Party: ${totalNonVendor}`);
report.push(`- Needs Review: ${totalReview}`);
report.push(`- Possible Duplicates: ${possibleDuplicates.length} groups`);
report.push(`- Orphan References: ${orphanRefs.length}`);
report.push(`- Unclassified Type (Valid Vendors): ${unclassifiedType}`);
report.push(`- Not Rated Vendors: ${notRatedCount}`);

report.push("\n## Vendor Type Distribution\n");
report.push(`- Forwarder: ${typeDist['Forwarder']}`);
report.push(`- Trucking: ${typeDist['Trucking']}`);
report.push(`- Both: ${typeDist['Both']}`);
report.push(`- Other/Invalid: ${typeDist['Other']}`);

report.push("\n## 1. Valid Vendor Check\n");
report.push("| ID | Name | Type | Status | Usage (JO/Com/Tot) | Rated? | Action |");
report.push("|---|---|---|---|---|---|---|");
validVendors.forEach(v => {
  const usage = usageCounts[v.id] || {jo:0, commit:0, total:0};
  const isRated = v.review_count > 0 ? "Yes (" + v.rating.toFixed(2) + ")" : 'NOT RATED';
  report.push(`| ${v.id} | ${v.nama} | ${v.service_type} | ${v.status} | ${usage.jo} / ${usage.commit} / ${usage.total} | ${isRated} | SAFE TO KEEP |`);
});

report.push("\n## 2. Possible Duplicates\n");
if (possibleDuplicates.length === 0) {
  report.push("No possible duplicates found.");
} else {
  possibleDuplicates.forEach((group, idx) => {
    report.push(`\n**Group ${idx + 1}**`);
    group.forEach(v => {
      report.push(`- ID: ${v.id}, Name: ${v.nama}, Type: ${v.service_type}`);
    });
  });
}

report.push("\n## 3. Orphan References\n");
if (orphanRefs.length === 0) {
  report.push("No orphan references found.");
} else {
  report.push("| Table | Record ID | Orphan Vendor ID |");
  report.push("|---|---|---|");
  orphanRefs.forEach(ref => {
    report.push(`| ${ref.table} | ${ref.record_id} | ${ref.orphan_vendor_id} |`);
  });
}

report.push("\n## 4. Needs Review (Ambiguous Vendors)\n");
if (needsReview.length === 0) {
  report.push("No ambiguous vendors found.");
} else {
  report.push("| ID | Vendor Name | Current Type | Usage (Total) | Recommendation | Reason |");
  report.push("|---|---|---|---|---|---|");
  needsReview.forEach(v => {
    const usage = usageCounts[v.id] || {total: 0};
    report.push(`| ${v.id} | ${v.nama} | ${v.service_type} | ${usage.total} | REVIEW | Name pattern doesn't strictly match typical vendor or non-vendor party. |`);
  });
}

report.push("\n## 5. Non-Vendor Parties\n");
report.push("These records should be manually evaluated for deactivation/removal since architecture no longer depends on them.");
report.push("| ID | Vendor Name | Usage (Total) | Status |");
report.push("|---|---|---|---|");
nonVendorParties.forEach(v => {
  const usage = usageCounts[v.id] || {total: 0};
  report.push(`| ${v.id} | ${v.nama} | ${usage.total} | ${v.status} |`);
});

fs.writeFileSync('/Users/macbookair/.gemini/antigravity-ide/brain/575b857d-84e9-4368-9f20-7bd54cb9ac49/vendor_data_quality_audit.md', report.join('\n'));
console.log("Data Quality Audit complete! Artifact saved.");
