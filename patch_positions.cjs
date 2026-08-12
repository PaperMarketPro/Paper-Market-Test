const fs = require('fs');
let code = fs.readFileSync('src/components/PositionsList.tsx', 'utf8');

if (!code.includes('startTransition')) {
  code = code.replace(
    /import React, \{ useState \} from 'react';/,
    "import React, { useState, startTransition } from 'react';"
  );
}

code = code.replace(/onClick=\{\(\) => setActiveTab\(([^)]+)\)\}/g, "onClick={() => startTransition(() => setActiveTab($1))}");

fs.writeFileSync('src/components/PositionsList.tsx', code);
console.log('Patched PositionsList.tsx interactions');
