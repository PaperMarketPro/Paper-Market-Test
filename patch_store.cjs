const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf8');

// Change batchInterval to 800ms
code = code.replace(
  /        \}\);\n      \}\);\n    \}, 100\);/g,
  "        });\n      });\n    }, 800);"
);

// We should also check fallbackInterval, let's keep it at 1000, that's fine.

fs.writeFileSync('src/store.tsx', code);
console.log('Patched store.tsx');
