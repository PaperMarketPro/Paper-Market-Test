const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf8');

code = code.replace(
  /          return changed \? nextPositions : prevPositions;\n        \}\);\n      \}\);\n    \}, 250\);/g,
  `          return changed ? nextPositions : prevPositions;
        });
      });
    }, 500);`
);

fs.writeFileSync('src/store.tsx', code);
console.log('Patched store.tsx interval to 500ms');
