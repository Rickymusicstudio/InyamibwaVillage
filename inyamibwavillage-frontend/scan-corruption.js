const fs = require('fs');
const path = require('path');

const targetDir = __dirname;
const htmlFiles = fs.readdirSync(targetDir).filter(file => file.endsWith('.html'));

console.log('🔍 Scanning for corrupted characters in HTML files...');

let corruptedCount = 0;

htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(targetDir, file), 'utf8');
  if (content.includes('�')) {
    console.log(`❗ Corruption found in: ${file}`);
    corruptedCount++;
  }
});

if (corruptedCount === 0) {
  console.log('✅ Scan complete: No corrupted files detected.');
} else {
  console.log(`⚠️ Total corrupted files: ${corruptedCount}`);
}

