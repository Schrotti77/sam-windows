/**
 * Patches React to add React.cache if missing.
 * 
 * Next.js 14 App Router calls React.cache() during build.
 * React 18.3 only exposes .cache via the "react-server" export condition,
 * but on Windows with npm, webpack sometimes resolves the wrong entry point.
 * This script patches all React entry points to include .cache.
 */
const fs = require('fs');
const path = require('path');

const reactDir = path.join(__dirname, '..', 'node_modules', 'react');

// The cache implementation (same as React's internal one)
const cachePolyfill = `
// --- React.cache polyfill (added by patch-react.js) ---
if (typeof exports.cache !== 'function') {
  exports.cache = function cache(fn) { return fn; };
}
// --- end polyfill ---
`;

const filesToPatch = [
  'index.js',
  'cjs/react.production.min.js',
  'cjs/react.development.js',
];

let patched = 0;
for (const file of filesToPatch) {
  const filePath = path.join(reactDir, file);
  if (!fs.existsSync(filePath)) continue;
  
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('patch-react.js')) {
    console.log(`  [skip] ${file} (already patched)`);
    continue;
  }
  
  fs.writeFileSync(filePath, content + '\n' + cachePolyfill);
  console.log(`  [patched] ${file}`);
  patched++;
}

console.log(`React.cache patch complete (${patched} files patched)`);
