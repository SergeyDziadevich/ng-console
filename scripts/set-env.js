const { writeFile } = require('fs');
const path = require('path');
require('dotenv').config();

const targetPath = path.join(__dirname, '../src/environments/environment.ts');
const targetProdPath = path.join(__dirname, '../src/environments/environment.prod.ts');

const envConfigFile = `export const environment = {
  production: false,
  apiUrl: '${process.env.API_URL || 'http://localhost:3000'}',
  geminiApiKey: '${process.env.GEMINI_API_KEY || 'your-gemini-api-key-here'}',
};
`;

const envConfigProdFile = `export const environment = {
  production: true,
  apiUrl: '${process.env.API_URL || 'http://localhost:3000'}',
  geminiApiKey: '${process.env.GEMINI_API_KEY || 'your-gemini-api-key-here'}',
};
`;

writeFile(targetPath, envConfigFile, function (err) {
  if (err) {
    console.error('Error writing environment.ts:', err);
  } else {
    console.log(`Generated environment.ts at ${targetPath}`);
  }
});

writeFile(targetProdPath, envConfigProdFile, function (err) {
  if (err) {
    console.error('Error writing environment.prod.ts:', err);
  } else {
    console.log(`Generated environment.prod.ts at ${targetProdPath}`);
  }
});
