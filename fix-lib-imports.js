const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Replace in .ts files
const tsFiles = execSync('find libs/ui/src/lib -name "*.ts"').toString().split('\n').filter(Boolean);
tsFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/from\s+['"]\.\.\/\.\.\/services\//g, "from '@app/services/");
  newContent = newContent.replace(/from\s+['"]\.\.\/\.\.\/models\//g, "from '@app/models/");
  newContent = newContent.replace(/from\s+['"]\.\.\/\.\.\/enums\//g, "from '@app/enums/");
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated TS imports in ${file}`);
  }
});

// Replace in .scss files
const scssFiles = execSync('find libs/ui/src/lib -name "*.scss"').toString().split('\n').filter(Boolean);
scssFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/@reference\s+['"]\.\.\/\.\.\/\.\.\/styles\.scss['"]/g, '@reference "../../../../../src/styles.scss"');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated SCSS paths in ${file}`);
  }
});
