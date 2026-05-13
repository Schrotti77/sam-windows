const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

const settings = read('app/(dashboard)/settings/page-client.tsx');
const software = read('app/(dashboard)/software/page-client.tsx');
const vendors = read('app/(dashboard)/vendors/page-client.tsx');

const fakeSuccessMessages = [
  'Profile saved successfully',
  'Notification settings saved',
  'Password changed successfully',
  'System settings saved'
];

for (const message of fakeSuccessMessages) {
  assert(
    !settings.includes(message),
    `Settings must not show fake success toast: ${message}`
  );
}

const implementedExportImportSuccess = [
  'Export successful!',
  'Import completed successfully!'
];
for (const message of implementedExportImportSuccess) {
  assert(
    settings.includes(message),
    `Settings should keep real export/import success toast: ${message}`
  );
}

const requiredBadges = [
  'Profile saving is not implemented yet',
  'Notification preferences are not persisted yet',
  'Password changes are not implemented yet',
  'Two-factor authentication is not implemented yet',
  'System settings are not persisted yet'
];
for (const label of requiredBadges) {
  assert(settings.includes(label), `Settings should clearly mark unavailable function: ${label}`);
}

assert(
  !software.includes("alert('Filter function will be implemented')"),
  'Software filter must not use fake alert placeholder'
);
assert(
  !vendors.includes("alert('Filter dialog would open')"),
  'Vendor filter must not use fake alert placeholder'
);

assert(software.includes('Filter is not available yet'), 'Software filter should be visibly marked unavailable');
assert(vendors.includes('Filter is not available yet'), 'Vendor filter should be visibly marked unavailable');

console.log('UI placeholder honesty checks passed');
