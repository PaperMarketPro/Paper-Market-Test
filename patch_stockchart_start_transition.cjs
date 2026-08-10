const fs = require('fs');
let code = fs.readFileSync('src/components/StockChart.tsx', 'utf8');

code = code.replace(
  /import React, \{ useState, useEffect, useMemo, useRef, useCallback, startTransition \} from 'react';/g,
  "import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';"
);

code = code.replace(
  /startTransition\(\(\) => \{/g,
  "{"
);

fs.writeFileSync('src/components/StockChart.tsx', code);
console.log('Removed startTransition from StockChart.tsx');
