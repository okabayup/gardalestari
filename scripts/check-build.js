
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'public/manifest.json',
  'public/sw.js',
  'public/offline.html',
  '.next/server/app/manifest.js'
];

function checkFiles() {
  console.log('Verifying PWA build files...');
  const missingFiles = [];

  requiredFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    } else {
      console.log(`✅ Found: ${file}`);
    }
  });

  if (missingFiles.length > 0) {
    console.error('\n❌ PWA Build Verification Failed!');
    console.error('The following required files are missing:');
    missingFiles.forEach(file => console.error(`  - ${file}`));
    console.error('\nPlease check your next-pwa configuration in next.config.ts and ensure the manifest file exists.');
    process.exit(1); // Exit with an error code to fail the build
  } else {
    console.log('\n✅ PWA Build Verification Successful! All files are present.');
  }
}

checkFiles();
