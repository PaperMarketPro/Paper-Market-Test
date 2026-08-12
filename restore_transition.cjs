const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf8');

if (!code.includes('startTransition')) {
  code = code.replace(
    /import React, \{ createContext, useContext, useState, useEffect, useRef, useMemo, useCallback \} from 'react';/g,
    "import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback, startTransition } from 'react';"
  );
}

code = code.replace(
  /\/\/ Process batch updates as low-priority background transition\s*\{/g,
  "// Process batch updates as low-priority background transition\n      startTransition(() => {"
);

code = code.replace(
  /          return changed \? nextPositions : prevPositions;\n        \}\);\n      \}\n    \}, 3000\);/s,
  `          return changed ? nextPositions : prevPositions;
        });
      });
    }, 1000);`
);

fs.writeFileSync('src/store.tsx', code);
console.log('Restored startTransition in store.tsx');
