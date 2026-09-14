const fs = require('fs');
let content = fs.readFileSync('backend/index.js', 'utf8');
content = content.replace(/res\.status\(500\)\.json\(\{ error: error\.message \}\);/g, 'console.error("API Error:", error);\n    res.status(500).json({ error: error.message });');
fs.writeFileSync('backend/index.js', content);
