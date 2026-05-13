const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(ROOT, relativePath));

const pagePath = 'app/(dashboard)/assignments/page-client.tsx';
const addDialogPath = 'components/assignments/add-assignment-dialog.tsx';
const editDialogPath = 'components/assignments/edit-assignment-dialog.tsx';
const deleteDialogPath = 'components/assignments/delete-assignment-dialog.tsx';

for (const file of [addDialogPath, editDialogPath, deleteDialogPath]) {
  assert(exists(file), `${file} should exist`);
}

const page = read(pagePath);
const addDialog = read(addDialogPath);
const editDialog = read(editDialogPath);
const deleteDialog = read(deleteDialogPath);

const requiredPageSnippets = [
  '@/components/assignments/add-assignment-dialog',
  '@/components/assignments/edit-assignment-dialog',
  '@/components/assignments/delete-assignment-dialog',
  'Add Assignment',
  'DropdownMenu',
  'setSelectedAssignment',
  'setEditDialogOpen(true)',
  'setDeleteDialogOpen(true)'
];

for (const snippet of requiredPageSnippets) {
  assert(page.includes(snippet), `Assignments page should include real CRUD UI wiring: ${snippet}`);
}

assert(addDialog.includes("fetch('/api/software'") || addDialog.includes('fetch("/api/software"'), 'Add dialog should fetch software options');
assert(editDialog.includes("fetch('/api/software'") || editDialog.includes('fetch("/api/software"'), 'Edit dialog should fetch software options');
assert(addDialog.includes("fetch('/api/assignments'") || addDialog.includes('fetch("/api/assignments"'), 'Add dialog should POST to /api/assignments');
assert(addDialog.includes("method: 'POST'") || addDialog.includes('method: "POST"'), 'Add dialog should use POST');
assert(editDialog.includes('fetch(`/api/assignments/${assignment.id}`'), 'Edit dialog should PUT to /api/assignments/:id');
assert(editDialog.includes("method: 'PUT'") || editDialog.includes('method: "PUT"'), 'Edit dialog should use PUT');
assert(deleteDialog.includes('fetch(`/api/assignments/${assignment.id}`'), 'Delete dialog should DELETE /api/assignments/:id');
assert(deleteDialog.includes("method: 'DELETE'") || deleteDialog.includes('method: "DELETE"'), 'Delete dialog should use DELETE');

const requiredFields = [
  'softwareId',
  'userId',
  'assignedBy',
  'assignedAt',
  'status',
  'notes'
];

for (const field of requiredFields) {
  assert(addDialog.includes(field), `Add dialog should include field ${field}`);
  assert(editDialog.includes(field), `Edit dialog should include field ${field}`);
}

for (const source of [page, addDialog, editDialog, deleteDialog]) {
  assert(!source.includes('alert('), 'Assignments UI CRUD should not use placeholder alerts');
  assert(!source.toLowerCase().includes('coming soon'), 'Assignments UI CRUD should not say coming soon');
  assert(!source.toLowerCase().includes('not implemented'), 'Assignments UI CRUD should not say not implemented');
}

for (const source of [addDialog, editDialog]) {
  assert(!source.includes('software:'), 'Assignment dialogs should not submit software relation objects');
  assert(!source.includes('vendor:'), 'Assignment dialogs should not submit vendor relation objects');
  assert(!source.includes('createdAt'), 'Assignment dialogs should not submit createdAt');
  assert(!source.includes('updatedAt'), 'Assignment dialogs should not submit updatedAt');
}

console.log('Assignments UI CRUD surface checks passed');
