const fs = require('fs');
const { execSync } = require('child_process');

// Generate raw autolinking config
execSync('npx expo-modules-autolinking resolve --platform android 2>&1', {
  cwd: 'E:/ResturantBilling',
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

const raw = execSync('npx expo-modules-autolinking resolve --platform android', {
  cwd: 'E:/ResturantBilling',
  encoding: 'utf8',
  shell: true
}).replace(/\x1b\[[0-9;]*m/g, '');

// Convert JS object notation to JSON
let fixed = raw
  // Quote unquoted keys  
  .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3')
  // Replace single-quoted strings with double-quoted
  .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"')
  // Remove trailing commas
  .replace(/,(\s*[}\]])/g, '$1');

try {
  const obj = JSON.parse(fixed);
  fs.writeFileSync('E:/ResturantBilling/android/build/generated/autolinking/autolinking.json', JSON.stringify(obj, null, 2));
  console.log('SUCCESS: Valid JSON written');
  console.log('Keys:', Object.keys(obj));
  console.log('Modules:', obj.modules?.length || 0);
} catch(e) {
  console.error('Parse error:', e.message);
  // Show context around error
  const pos = parseInt(e.message.match(/position (\d+)/)?.[1] || '0');
  if (pos > 0) {
    console.log('Near pos', pos, ':', fixed.substring(Math.max(0,pos-80), pos+80));
  } else {
    console.log('First 500 chars:', fixed.substring(0, 500));
  }
}
