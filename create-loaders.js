const fs = require('fs');
const path = require('path');
const dirs = ['dashboard', 'brain', 'autopsy', 'entities', 'inventory', 'suppliers', 'projects', 'changes', 'data-hub', 'customers', 'products', 'forecasting', 'goals'];
const content = `import { PageSkeleton } from '@/components/shared/LoadingSkeleton';

export default function Loading() {
  return <PageSkeleton />;
}
`;

dirs.forEach(d => {
  const dirPath = path.join('c:/Users/neer1/Desktop/nexora/src/app', d);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(path.join(dirPath, 'loading.tsx'), content);
});
