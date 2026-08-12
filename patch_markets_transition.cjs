const fs = require('fs');
let code = fs.readFileSync('src/components/Markets.tsx', 'utf8');

if (!code.includes('startTransition')) {
  code = code.replace(
    /import React, \{ useState \} from 'react';/g,
    "import React, { useState, startTransition } from 'react';"
  );
}

// Wrap onClick functions that just call a setter
code = code.replace(
  /onClick=\{\(\) => setSelectedOptionIndex\(([^)]+)\)\}/g,
  "onClick={() => startTransition(() => setSelectedOptionIndex($1))}"
);

code = code.replace(
  /onClick=\{\(\) => setSelectedExpiry\(([^)]+)\)\}/g,
  "onClick={() => startTransition(() => setSelectedExpiry($1))}"
);

code = code.replace(
  /onClick=\{\(\) => setActiveTab\(([^)]+)\)\}/g,
  "onClick={() => startTransition(() => setActiveTab($1))}"
);

code = code.replace(
  /onClick=\{\(\) => setFnoSection\(([^)]+)\)\}/g,
  "onClick={() => startTransition(() => setFnoSection($1))}"
);

code = code.replace(
  /onClick=\{\(\) => setSelectedList\(([^)]+)\)\}/g,
  "onClick={() => startTransition(() => setSelectedList($1))}"
);

fs.writeFileSync('src/components/Markets.tsx', code);
console.log('Patched Markets.tsx with startTransition');
