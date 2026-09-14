const fs = require('fs');
let content = fs.readFileSync('backend/index.js', 'utf8');
content = content.replace("app.post('/api/tasks', async (req, res) => {", "app.post('/api/tasks', async (req, res) => {\n  console.log('HIT POST /api/tasks', req.body);");
fs.writeFileSync('backend/index.js', content);
