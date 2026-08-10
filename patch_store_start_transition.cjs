const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf8');

code = code.replace(
  /import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback, startTransition } from 'react';/g,
  "import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';"
);

code = code.replace(
  /startTransition\(\(\) => \{/g,
  "{"
);

fs.writeFileSync('src/store.tsx', code);
console.log('Removed startTransition from store.tsx');
