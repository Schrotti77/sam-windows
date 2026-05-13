const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(ROOT, relativePath));

const sidebar = read('components/layout/sidebar.tsx');
const settings = read('app/(dashboard)/settings/page-client.tsx');

const requiredRoutes = [
  { href: '/contracts', title: 'Contract Management', file: 'app/(dashboard)/contracts/page-client.tsx', api: '/api/contracts' },
  { href: '/budgets', title: 'Budget Management', file: 'app/(dashboard)/budgets/page-client.tsx', api: '/api/budgets' },
  { href: '/assignments', title: 'Software Assignments', file: 'app/(dashboard)/assignments/page-client.tsx', api: '/api/assignments' }
];

for (const route of requiredRoutes) {
  assert(sidebar.includes(`href: '${route.href}'`) || sidebar.includes(`href: "${route.href}"`), `Sidebar should link to ${route.href}`);
  assert(sidebar.includes(route.title), `Sidebar should label ${route.href} as ${route.title}`);
  assert(exists(route.file), `${route.file} should exist`);
  const page = read(route.file);
  assert(page.includes(`fetch('${route.api}')`) || page.includes(`fetch("${route.api}")`), `${route.file} should fetch ${route.api}`);
  assert(!page.includes('not implemented'), `${route.file} should not present implemented data as unavailable placeholder`);
  assert(!page.includes('alert('), `${route.file} should not use placeholder alert handlers`);
}

assert(settings.includes('budgets'), 'Settings export description should mention budgets');
assert(settings.includes('assignments'), 'Settings export description should mention assignments');
assert(settings.includes('records exported'), 'Settings export toast should summarize all exported record types');

console.log('UI product surface checks passed');
