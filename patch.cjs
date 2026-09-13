const fs = require('fs');
let text = fs.readFileSync('backend/index.js', 'utf8');
text = text.replace("app.listen(PORT", "console.log('ABOUT TO LISTEN'); app.listen(PORT");
fs.writeFileSync('backend/index.js', text);
