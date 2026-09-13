const fs = require('fs');
let code = fs.readFileSync('__tests__/payments.test.js', 'utf8');
code = code.replace(/const res = await request\(app\)\.get\('\/api\/job-orders'\)\.set\('Authorization', `Bearer \${staffToken}`\); if \(res\.status !== 200\) console\.log\('GET JO ERROR:', res\.body\);/g, 
  "const res = await request(app)\n        .get('/api/job-orders')\n        .set('Authorization', `Bearer ${staffToken}`);");
fs.writeFileSync('__tests__/payments.test.js', code);
