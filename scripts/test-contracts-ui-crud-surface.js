const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(ROOT, relativePath));

const pagePath = 'app/(dashboard)/contracts/page-client.tsx';
const addDialogPath = 'components/contracts/add-contract-dialog.tsx';
const editDialogPath = 'components/contracts/edit-contract-dialog.tsx';
const deleteDialogPath = 'components/contracts/delete-contract-dialog.tsx';

for (const file of [addDialogPath, editDialogPath, deleteDialogPath]) {
  assert(exists(file), `${file} should exist`);
}

const page = read(pagePath);
const addDialog = read(addDialogPath);
const editDialog = read(editDialogPath);
const deleteDialog = read(deleteDialogPath);

const requiredPageSnippets = [
  "@/components/contracts/add-contract-dialog",
  "@/components/contracts/edit-contract-dialog",
  "@/components/contracts/delete-contract-dialog",
  'Add Contract',
  'DropdownMenu',
  'setSelectedContract',
  'setEditDialogOpen(true)',
  'setDeleteDialogOpen(true)'
];

for (const snippet of requiredPageSnippets) {
  assert(page.includes(snippet), `Contracts page should include real CRUD UI wiring: ${snippet}`);
}

assert(addDialog.includes("fetch('/api/vendors'") || addDialog.includes('fetch("/api/vendors"'), 'Add dialog should fetch vendors');
assert(editDialog.includes("fetch('/api/vendors'") || editDialog.includes('fetch("/api/vendors"'), 'Edit dialog should fetch vendors');
assert(addDialog.includes("fetch('/api/contracts'") || addDialog.includes('fetch("/api/contracts"'), 'Add dialog should POST to /api/contracts');
assert(addDialog.includes("method: 'POST'") || addDialog.includes('method: "POST"'), 'Add dialog should use POST');
assert(editDialog.includes('fetch(`/api/contracts/${contract.id}`'), 'Edit dialog should PUT to /api/contracts/:id');
assert(editDialog.includes("method: 'PUT'") || editDialog.includes('method: "PUT"'), 'Edit dialog should use PUT');
assert(deleteDialog.includes('fetch(`/api/contracts/${contract.id}`'), 'Delete dialog should DELETE /api/contracts/:id');
assert(deleteDialog.includes("method: 'DELETE'") || deleteDialog.includes('method: "DELETE"'), 'Delete dialog should use DELETE');

const requiredFields = [
  'vendorId',
  'contractNumber',
  'title',
  'startDate',
  'endDate',
  'renewalDate',
  'contractValue',
  'paymentTerms',
  'renewalTerms',
  'status',
  'notes'
];

for (const field of requiredFields) {
  assert(addDialog.includes(field), `Add dialog should include field ${field}`);
  assert(editDialog.includes(field), `Edit dialog should include field ${field}`);
}

for (const source of [page, addDialog, editDialog, deleteDialog]) {
  assert(!source.includes('alert('), 'Contracts UI CRUD should not use placeholder alerts');
  assert(!source.toLowerCase().includes('coming soon'), 'Contracts UI CRUD should not say coming soon');
  assert(!source.toLowerCase().includes('not implemented'), 'Contracts UI CRUD should not say not implemented');
}

for (const source of [addDialog, editDialog]) {
  assert(!source.includes('createdAt'), 'Contract dialogs should not submit createdAt');
  assert(!source.includes('updatedAt'), 'Contract dialogs should not submit updatedAt');
  assert(!source.includes('vendor:'), 'Contract dialogs should not submit vendor relation objects');
}

console.log('Contracts UI CRUD surface checks passed');
