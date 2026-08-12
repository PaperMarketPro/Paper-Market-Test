const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

if (!code.includes('startTransition')) {
  code = code.replace(
    /import React, \{ useState \} from 'react';/g,
    "import React, { useState, startTransition } from 'react';"
  );
}

code = code.replace(
  /onClick=\{\(\) => setActiveTab\(([^)]+)\)\}/g,
  "onClick={() => startTransition(() => setActiveTab($1))}"
);

code = code.replace(
  /onClick=\{\(\) => setSelectedSearchTab\(([^)]+)\)\}/g,
  "onClick={() => startTransition(() => setSelectedSearchTab($1))}"
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log('Patched Dashboard.tsx with startTransition');
