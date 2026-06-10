#!/usr/bin/env node
// Patches @supabase/* packages to remove `import(/* webpackIgnore */...)` syntax
// that hermesc (Hermes compiler) cannot parse when building with Expo.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all @supabase dist files that might contain the problematic pattern
const supabaseDir = path.join(__dirname, '../node_modules/@supabase');
let files = [];

try {
  const result = execSync(
    `find "${supabaseDir}" -name "*.cjs" -o -name "*.mjs" -o -name "*.js"`,
    { encoding: 'utf8' }
  ).trim();
  files = result.split('\n').filter(f => f && !f.includes('.map'));
} catch (e) {
  // fallback to known files
  files = [
    path.join(__dirname, '../node_modules/@supabase/supabase-js/dist/index.cjs'),
    path.join(__dirname, '../node_modules/@supabase/supabase-js/dist/index.mjs'),
  ];
}

// Matches any: otelModulePromise = import(/* ... */ anything)
const pattern = /otelModulePromise\s*=\s*import\([^)]*\)/g;
const replacement = 'otelModulePromise = Promise.resolve(null)';

let patched = 0;
files.forEach((file) => {
  if (!fs.existsSync(file)) return;
  const original = fs.readFileSync(file, 'utf8');
  if (!original.includes('otelModulePromise') || !original.includes('import(')) return;
  pattern.lastIndex = 0;
  if (!pattern.test(original)) return;
  pattern.lastIndex = 0;
  const fixed = original.replace(pattern, replacement);
  if (fixed !== original) {
    fs.writeFileSync(file, fixed);
    console.log(`[patch-supabase] Patched ${file.replace(path.join(__dirname, '..'), '')}`);
    patched++;
  }
});

if (patched === 0) {
  console.log('[patch-supabase] No files needed patching (already clean or pattern not found)');
}
