const fs = require('fs');

const indexJsPath = 'backend/index.js';
const patchedRoutesPath = 'debit_notes_routes_patched.js';

const indexJsContent = fs.readFileSync(indexJsPath, 'utf8');
const patchedRoutesContent = fs.readFileSync(patchedRoutesPath, 'utf8');

const targetStr = `
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {`;

if (indexJsContent.includes(targetStr)) {
  const updatedContent = indexJsContent.replace(targetStr, `\n\n${patchedRoutesContent}\n\n${targetStr}`);
  fs.writeFileSync(indexJsPath, updatedContent);
  console.log('Successfully injected patched routes into backend/index.js');
} else {
  console.log('Target string not found in backend/index.js');
}
