const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/app/app.routes.ts',
  'src/app/app.ts',
  'src/app/features/settings/settings.ts',
  'src/app/features/tickets/components/ticket-detail/ticket-detail.component.ts',
  'src/app/features/tickets/components/create-ticket/create-ticket.component.ts',
  'src/app/features/user-management/user-management.ts',
  'src/app/features/user-management/add-user/add-user.ts',
  'src/app/features/user-management/edit-user/edit-user.ts',
  'src/app/features/user-management/users-table/users-table.ts',
  'src/app/features/documents/viewer/document-viewer.component.ts',
  'src/app/features/documents/documents.ts'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace static imports: import { ... } from '../../components/...';
  content = content.replace(/from\s+['"][\.\/]+components\/[^'"]+['"]/g, "from '@ng-console-platform/ui'");

  // Replace dynamic imports: import('./components/shell/shell')
  content = content.replace(/import\(['"][\.\/]+components\/[^'"]+['"]\)/g, "import('@ng-console-platform/ui')");

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
