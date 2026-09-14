const fs = require('fs');
const file = 'src/pages/Workspace/ImportOps/ImportOpsList.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'const isOdd = idx % 2 === 1;',
  'const totals = calcTotals(s.costs, s.qtty, s.container_costs || []);\n                    const isOdd = idx % 2 === 1;'
);

content = content.replace(
  /Rp \{fmtRupiah\(calcTotals\(JSON\.parse\(s\.costs \|\| '\{\}'\), s\.qtty, s\.container_costs \|\| \[\]\)\.grandTotal\)\}/g,
  '{totals.grandTotal > 0 ? (\n                            <span style={{ fontWeight: "700", color: "var(--color-ink)" }}>\n                              Rp {fmtRupiah(Math.round(totals.grandTotal))}\n                            </span>\n                          ) : (\n                            <span style={{ color: "var(--color-ink-muted-48)" }}>—</span>\n                          )}'
);

content = content.replace(
  /<td style=\{\{ padding: '13px 14px', whiteSpace: 'nowrap', fontWeight: '700', color: 'var\(--color-ink\)' \}\}>\n                          \{totals\.grandTotal \> 0 \? \(/g,
  '<td style={{ padding: \'13px 14px\', whiteSpace: \'nowrap\', textAlign: \'right\' }}>\n                          {totals.grandTotal > 0 ? ('
);

content = content.replace(
  /<td style=\{\{ padding: '13px 14px', whiteSpace: 'nowrap', color: 'var\(--color-primary\)' \}\}>\n                          \{totals\.landedPerKg \> 0 \? \(/g,
  '<td style={{ padding: \'13px 14px\', whiteSpace: \'nowrap\', textAlign: \'right\' }}>\n                          {totals.landedPerKg > 0 ? ('
);

fs.writeFileSync(file, content);
