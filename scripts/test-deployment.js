const fs = require('fs');
const assert = require('assert');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

assert.ok(fs.existsSync('build.cmd'), 'build.cmd must exist because README and Windows install path require it');

const buildCmd = read('build.cmd').toLowerCase();
assert.ok(buildCmd.includes('subst'), 'build.cmd should use subst to avoid Windows path-casing build issues');
assert.ok(buildCmd.includes('for %%d in'), 'build.cmd should select an unused temporary drive dynamically');
assert.ok(!buildCmd.includes('set "drive=s:"'), 'build.cmd must not hard-code S: or delete an existing user mapping');
assert.ok(buildCmd.includes('npm run build'), 'build.cmd should delegate to npm run build');
assert.ok(buildCmd.includes('exit /b'), 'build.cmd should propagate the build exit code');

const installPs1 = read('install.ps1').toLowerCase();
assert.ok(installPs1.includes('build.cmd'), 'install.ps1 should build via build.cmd, not direct npm run build');

const startPs1 = read('start.ps1').toLowerCase();
assert.ok(startPs1.includes('build.cmd'), 'start.ps1 should build via build.cmd when .next is missing');

console.log('Deployment file checks passed');
