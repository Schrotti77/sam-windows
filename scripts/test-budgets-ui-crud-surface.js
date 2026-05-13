const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(ROOT, relativePath));

const pagePath = 'app/(dashboard)/budgets/page-client.tsx';
const addDialogPath = 'components/budgets/add-budget-dialog.tsx';
const editDialogPath = 'components/budgets/edit-budget-dialog.tsx';
const deleteDialogPath = 'components/budgets/delete-budget-dialog.tsx';

for (const file of [addDialogPath, editDialogPath, deleteDialogPath]) {
  assert(exists(file), `${file} should exist`);
}

const page = read(pagePath);
const addDialog = read(addDialogPath);
const editDialog = read(editDialogPath);
const deleteDialog = read(deleteDialogPath);

const requiredPageSnippets = [
  "@/components/budgets/add-budget-dialog",
  "@/components/budgets/edit-budget-dialog",
  "@/components/budgets/delete-budget-dialog",
  'Add Budget',
  'DropdownMenu',
  'setSelectedBudget',
  'setEditDialogOpen(true)',
  'setDeleteDialogOpen(true)'
];

for (const snippet of requiredPageSnippets) {
  assert(page.includes(snippet), `Budgets page should include real CRUD UI wiring: ${snippet}`);
}

assert(addDialog.includes("fetch('/api/budgets'") || addDialog.includes('fetch("/api/budgets"'), 'Add dialog should POST to /api/budgets');
assert(addDialog.includes("method: 'POST'") || addDialog.includes('method: "POST"'), 'Add dialog should use POST');
assert(editDialog.includes('fetch(`/api/budgets/${budget.id}`'), 'Edit dialog should PUT to /api/budgets/:id');
assert(editDialog.includes("method: 'PUT'") || editDialog.includes('method: "PUT"'), 'Edit dialog should use PUT');
assert(deleteDialog.includes('fetch(`/api/budgets/${budget.id}`'), 'Delete dialog should DELETE /api/budgets/:id');
assert(deleteDialog.includes("method: 'DELETE'") || deleteDialog.includes('method: "DELETE"'), 'Delete dialog should use DELETE');

for (const source of [page, addDialog, editDialog, deleteDialog]) {
  assert(!source.includes('alert('), 'Budget UI CRUD should not use placeholder alerts');
  assert(!source.toLowerCase().includes('coming soon'), 'Budget UI CRUD should not say coming soon');
  assert(!source.toLowerCase().includes('not implemented'), 'Budget UI CRUD should not say not implemented');
}

for (const source of [addDialog, editDialog]) {
  assert(!source.includes('remainingAmount'), 'Budget dialogs should not submit remainingAmount; API derives it');
  assert(source.includes('budgetAmount'), 'Budget dialogs should include budgetAmount');
  assert(source.includes('spentAmount'), 'Budget dialogs should include spentAmount');
  assert(source.includes('fiscalYear'), 'Budget dialogs should include fiscalYear');
  assert(source.includes('startDate'), 'Budget dialogs should include startDate');
  assert(source.includes('endDate'), 'Budget dialogs should include endDate');
}

for (const [label, source] of [['Add', addDialog], ['Edit', editDialog]]) {
  assert(source.includes('dateInputYear(data.startDate) === data.fiscalYear'), `${label} dialog should validate that fiscal year matches start date year before POST`);
  assert(source.includes('dateInputYear(data.endDate) === data.fiscalYear'), `${label} dialog should validate that fiscal year matches end date year before POST`);
  assert(source.includes("setValue('startDate', `${fiscalYear}-01-01`"), `${label} dialog should keep start date in sync when fiscal year changes`);
  assert(source.includes("setValue('endDate', `${fiscalYear}-12-31`"), `${label} dialog should keep end date in sync when fiscal year changes`);
  assert(source.includes('handleFiscalYearChange'), `${label} dialog should wire fiscal year change handler`);
}

console.log('Budgets UI CRUD surface checks passed');
