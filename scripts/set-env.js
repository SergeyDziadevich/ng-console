// Reads .env and writes values into Angular environment files at build time.
// Run automatically via the `prestart` and `prebuild` npm scripts.
const { writeFileSync } = require('fs');
const { resolve } = require('path');
require('dotenv').config({ path: resolve(__dirname, '../.env') });

const geminiApiKey = process.env['GEMINI_API_KEY'] ?? '';

const devEnv = `export const environment = {
  production: false,
  apiUrl: 'http://localhost:4200',
  geminiApiKey: '${geminiApiKey}',
};
`;

const prodEnv = `export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com',
  geminiApiKey: '${geminiApiKey}',
};
`;

writeFileSync(resolve(__dirname, '../src/environments/environment.ts'), devEnv);
writeFileSync(resolve(__dirname, '../src/environments/environment.prod.ts'), prodEnv);

console.log('✅ Environment files generated from .env');

