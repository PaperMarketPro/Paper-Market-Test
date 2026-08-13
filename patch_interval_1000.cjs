const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf8');

code = code.replace(
  /          return changed \? nextPositions : prevPositions;\n        \}\);\n      \}\);\n    \}, 500\);/g,
  `          return changed ? nextPositions : prevPositions;
        });
      });
    }, 1000);`
);

fs.writeFileSync('src/store.tsx', code);
console.log('Patched store.tsx interval to 1000ms');
