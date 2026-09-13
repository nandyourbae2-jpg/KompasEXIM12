const db = require('../src/database/db');
const fs = require('fs');

console.log("Starting Vendor Canonicalization Evidence Audit...");

// Fetch Vendors
const vendors = db.prepare('SELECT * FROM vendors').all();
const vendorMap = new Map(vendors.map(v => [v.id, v]));

// Prepare data structures
const evidence = {};
vendors.forEach(v => {
  evidence[v.id] = {
    v,
    usage: 0,
    jobOrders: [],
    ledgers: [],
    requests: [],
    costContexts: new Set()
  };
});

// 1. Gather Evidence from Job Orders
const jobOrders = db.prepare('SELECT id, job_order_code, vendor_id, cost_type, sumber FROM job_orders WHERE vendor_id IS NOT NULL').all();
jobOrders.forEach(jo => {
  if (evidence[jo.vendor_id]) {
    evidence[jo.vendor_id].usage++;
    evidence[jo.vendor_id].jobOrders.push(jo);
    evidence[jo.vendor_id].costContexts.add(jo.cost_type);
  }
});

// 2. Gather Evidence from Financial Request Ledger
const ledgers = db.prepare('SELECT id, request_number, vendor_id, cost_category, source FROM financial_request_ledger WHERE vendor_id IS NOT NULL').all();
ledgers.forEach(l => {
  if (evidence[l.vendor_id]) {
    evidence[l.vendor_id].usage++;
    evidence[l.vendor_id].ledgers.push(l);
    evidence[l.vendor_id].costContexts.add(l.cost_category);
  }
});

// 3. Gather Evidence from Financial Requests
const requests = db.prepare('SELECT id, request_number, vendor_id, sumber_kategori FROM financial_requests WHERE vendor_id IS NOT NULL').all();
requests.forEach(r => {
  if (evidence[r.vendor_id]) {
    evidence[r.vendor_id].usage++;
    evidence[r.vendor_id].requests.push(r);
    evidence[r.vendor_id].costContexts.add(r.sumber_kategori);
  }
});

// Analyze duplicate groups (A: PT ABC, B: Papandayan)
const groupAIds = [6, 12];
const groupBIds = [7, 8, 9, 10, 13, 14];
const needsReviewIds = [1, 4, 11, 15, 16, 17, 20, 21, 22, 24, 18, 23];
// We will process all vendors but highlight these explicitly

function getRecommendation(v, ev) {
  const name = v.nama.toLowerCase();
  const usage = ev.usage;
  const contexts = Array.from(ev.costContexts).join(', ').toLowerCase();
  
  if (groupAIds.includes(v.id) || groupBIds.includes(v.id)) {
    return 'DUPLICATE CANDIDATE'; // Handled in duplicate section
  }

  if (name.includes("pelabuhan") || name.includes("40' pbn") || name === "kkp" || name.includes("npct") || name.includes("depo") || name.includes("bea cukai") || name.includes("pajak") || name.includes("karantina")) {
    if (name === "kkp" || name.includes("bea cukai") || name.includes("pajak")) return 'NON-VENDOR (GOV/REGULATORY)';
    if (name.includes("pelabuhan") || name.includes("npct") || name.includes("depo") || name.includes("terminal")) return 'NON-VENDOR (FACILITY/PORT)';
    if (name.includes("40' pbn")) return 'DATA QUALITY ISSUE (CONTAINER LABEL)';
    return 'NON-VENDOR';
  }
  
  if (usage > 0) {
    if (contexts.includes('truck') || contexts.includes('angkutan') || name.includes('truck')) return 'KEEP AS VENDOR (RECLASSIFY AS TRUCKING)';
    if (contexts.includes('forward') || contexts.includes('custom') || contexts.includes('ocean') || name.includes('forward')) return 'KEEP AS VENDOR (RECLASSIFY AS FORWARDER)';
    return 'KEEP AS VENDOR';
  }
  
  return 'NEEDS BUSINESS REVIEW';
}

const report = [];
report.push("# Vendor Canonicalization Evidence Audit");
report.push("> **READ-ONLY AUDIT**: No database modifications were made.\n");

// DUPLICATE GROUP A
report.push("## 2. DUPLICATE GROUP ANALYSIS — PT ABC");
report.push("| Vendor ID | Name | Usage | Cost Context | Metadata Match | Recommendation | Confidence |");
report.push("|---|---|---|---|---|---|---|");
groupAIds.forEach(id => {
  const ev = evidence[id];
  if(ev) report.push(`| ${id} | ${ev.v.nama} | ${ev.usage} | ${Array.from(ev.costContexts).join(', ')} | Type: ${ev.v.service_type} | DUPLICATE CANDIDATE | HIGH |`);
});

// DUPLICATE GROUP B
report.push("\n## 3. DUPLICATE GROUP ANALYSIS — PAPANDAYAN CARGO");
report.push("| Vendor ID | Name | Usage | Cost Context | Metadata Match | Recommendation | Confidence |");
report.push("|---|---|---|---|---|---|---|");
groupBIds.forEach(id => {
  const ev = evidence[id];
  if(ev) report.push(`| ${id} | ${ev.v.nama} | ${ev.usage} | ${Array.from(ev.costContexts).join(', ')} | Type: ${ev.v.service_type} | DUPLICATE CANDIDATE | HIGH |`);
});

// NEEDS REVIEW
report.push("\n## 4. NEEDS REVIEW VENDOR ANALYSIS (Evidence Based)");
report.push("| ID | Vendor Name | Current Type | Usage | Cost Contexts | Recommendation |");
report.push("|---|---|---|---|---|---|");
needsReviewIds.forEach(id => {
  const ev = evidence[id];
  if (ev) {
    const rec = getRecommendation(ev.v, ev);
    const ctx = Array.from(ev.costContexts).join(', ') || 'None';
    const label = rec.includes('NON-VENDOR') ? '⚪ ' + rec : (rec.includes('KEEP') ? '🟢 ' + rec : (rec.includes('DATA QUALITY') ? '🔴 ' + rec : '🟡 ' + rec));
    report.push(`| ${id} | ${ev.v.nama} | ${ev.v.service_type} | ${ev.usage} | ${ctx} | ${label} |`);
  }
});

// ALL VENDORS CANONICALIZATION TABLE
let keep = 0, review = 0, dup = 0, nonVendor = 0, dq = 0;
let readyToRate = 0;

report.push("\n## 11. CANONICALIZATION RECOMMENDATION (ALL VENDORS)");
report.push("| Current ID | Name | Current Type | Usage (Evidence) | Cost Contexts | Final Decision Label |");
report.push("|---|---|---|---|---|---|");

vendors.forEach(v => {
  const ev = evidence[v.id];
  let decision = "🟡 REVIEW";
  const ctx = Array.from(ev.costContexts).join(', ') || 'None';
  
  if (groupAIds.includes(v.id)) { decision = "🔵 DUPLICATE CANDIDATE"; dup++; }
  else if (groupBIds.includes(v.id)) { decision = "🔵 DUPLICATE CANDIDATE"; dup++; }
  else {
    const rec = getRecommendation(v, ev);
    if (rec.includes('KEEP')) { decision = "🟢 " + rec; keep++; }
    else if (rec.includes('NON-VENDOR')) { decision = "⚪ " + rec; nonVendor++; }
    else if (rec.includes('DATA QUALITY')) { decision = "🔴 " + rec; dq++; }
    else { decision = "🟡 REVIEW"; review++; }
  }
  
  if (decision.includes('🟢 KEEP') && ev.usage > 0) readyToRate++;

  report.push(`| ${v.id} | ${v.nama} | ${v.service_type} | ${ev.usage} | ${ctx} | ${decision} |`);
});

// EXECUTIVE SUMMARY
report.push("\n## 13. FINAL EXECUTIVE SUMMARY");
report.push(`- **Total Current Records**: ${vendors.length}`);
report.push(`- **Canonical Vendor Candidates (🟢 KEEP)**: ${keep}`);
report.push(`- **Duplicate Candidates (🔵 DUPLICATE)**: ${dup}`);
report.push(`- **Non-Vendor Candidates (⚪ NON-VENDOR)**: ${nonVendor}`);
report.push(`- **Data Quality Issues (🔴 DATA QUALITY ISSUE)**: ${dq}`);
report.push(`- **Needs Business Review (🟡 REVIEW)**: ${review}`);
report.push(`- **Rating Ready Vendors**: ${readyToRate}`);
report.push(`- **Not Rated Vendors**: ${vendors.length}`);

fs.writeFileSync('/Users/macbookair/.gemini/antigravity-ide/brain/575b857d-84e9-4368-9f20-7bd54cb9ac49/vendor_evidence_audit.md', report.join('\n'));
console.log("Evidence audit complete!");
