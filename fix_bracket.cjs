const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf8');

code = code.replace(
  /          return changed \? nextPositions : prevPositions;\n        \}\);\n      \}\);\n    \}, 3000\);/s,
  `          return changed ? nextPositions : prevPositions;
        });
      }
    }, 3000);`
);

fs.writeFileSync('src/store.tsx', code);
console.log('Fixed syntax error in store.tsx');
