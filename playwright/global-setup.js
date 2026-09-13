import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function globalSetup(config) {
  const srcDb = path.resolve(__dirname, '../backend/kompas-exim.db');
  const destDb = path.resolve(__dirname, '../backend/kompas-exim-test.db');

  console.log('🔄 Setting up E2E Test Database...');
  
  // Use sqlite3 .backup to safely copy the database including WAL contents
  execSync(`sqlite3 "${srcDb}" ".backup '${destDb}'"`);
  
  // Escape $ signs for bash execution. This is the hash for '123456'
  const hash = '\\$2b\\$10\\$nlU3bqxqFDkFynmxibzyseq/5VDvmioVezL2XHKgznq4MNcvw.vWW';
  execSync(`sqlite3 "${destDb}" "UPDATE users SET password_hash = '${hash}';"`);

  console.log(`✅ Test Database created at: ${destDb}`);
}
