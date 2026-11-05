const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'out');

if (!fs.existsSync(outDir)) {
  console.log('out directory not found. Skipping postbuild.');
  process.exit(0);
}

function processDirectory(currentDir) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      // Check if this directory starts with __next.
      if (entry.name.startsWith('__next.')) {
        // Walk inside this __next directory to find all nested files
        function copyNestedFiles(nestedDir, relativeParts) {
          const nestedEntries = fs.readdirSync(nestedDir, { withFileTypes: true });
          for (const nestedEntry of nestedEntries) {
            const nestedFullPath = path.join(nestedDir, nestedEntry.name);
            if (nestedEntry.isDirectory()) {
              copyNestedFiles(nestedFullPath, [...relativeParts, nestedEntry.name]);
            } else if (nestedEntry.isFile()) {
              // Construct the dotted filename
              // e.g. entry.name = "__next.!KGF1dGhlbnRpY2F0ZWQp", relativeParts = ["products"], nestedEntry.name = "__PAGE__.txt"
              // result = "__next.!KGF1dGhlbnRpY2F0ZWQp.products.__PAGE__.txt"
              const dottedName = [entry.name, ...relativeParts, nestedEntry.name].join('.');
              const destinationPath = path.join(currentDir, dottedName);

              fs.copyFileSync(nestedFullPath, destinationPath);
              console.log(`[postbuild] Copied: ${dottedName}`);
            }
          }
        }

        copyNestedFiles(fullPath, []);
      } else {
        processDirectory(fullPath);
      }
    }
  }
}

console.log('[postbuild] Scanning out/ directory for Turbopack dotted RSC files...');
processDirectory(outDir);
console.log('[postbuild] Completed successfully!');

