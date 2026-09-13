const fs = require('fs');
const content = fs.readFileSync('backend/index.js', 'utf8');
const fixedContent = content.replace(/\\`/g, '`');
fs.writeFileSync('backend/index.js', fixedContent);
console.log('Fixed escaped backticks');
