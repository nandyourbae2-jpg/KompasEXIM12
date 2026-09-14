const fs = require('fs');
let code = fs.readFileSync('__tests__/payments.test.js', 'utf8');
code = code.replace(/const res = await request\(app\)\n        \.get\('\/api\/job-orders'\)\n        \.set\('Authorization', `Bearer \${staffToken}`\);\n      expect\(jo\.status_badge\)\.toBe\('Belum Dibayar'\);/g,
  "const res = await request(app).get('/api/job-orders').set('Authorization', `Bearer ${staffToken}`);\n      const jo = res.body.find(j => j.id === create.body.id);\n      expect(jo.status_badge).toBe('Belum Dibayar');");
code = code.replace(/const check = await request\(app\)\n        \.get\('\/api\/job-orders'\)\n        \.set\('Authorization', `Bearer \${staffToken}`\);\n      expect\(jo\.total_paid\)\.toBe\(100000000\);/g,
  "const check = await request(app).get('/api/job-orders').set('Authorization', `Bearer ${staffToken}`);\n      const jo = check.body.find(j => j.id === create.body.id);\n      expect(jo.total_paid).toBe(100000000);");
code = code.replace(/const check = await request\(app\)\n        \.get\('\/api\/job-orders'\)\n        \.set\('Authorization', `Bearer \${staffToken}`\);\n      expect\(jo\.remaining_balance\)\.toBe\(0\);/g,
  "const check = await request(app).get('/api/job-orders').set('Authorization', `Bearer ${staffToken}`);\n      const jo = check.body.find(j => j.id === create.body.id);\n      expect(jo.remaining_balance).toBe(0);");
fs.writeFileSync('__tests__/payments.test.js', code);
