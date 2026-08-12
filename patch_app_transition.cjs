const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('startTransition')) {
  code = code.replace(
    /import React, \{ useState, useCallback, Component, ReactNode \} from 'react';/g,
    "import React, { useState, useCallback, Component, ReactNode, startTransition } from 'react';"
  );
}

code = code.replace(
  /  const handleNavigate = useCallback\(\(tab: string\) => \{\n    setCurrentTab\(tab\);\n  \}, \[\]\);/g,
  `  const handleNavigate = useCallback((tab: string) => {
    startTransition(() => {
      setCurrentTab(tab);
    });
  }, []);`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Patched handleNavigate with startTransition');
