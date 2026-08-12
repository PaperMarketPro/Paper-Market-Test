const fs = require('fs');
let code = fs.readFileSync('src/components/TradeScreen.tsx', 'utf8');

if (!code.includes('startTransition')) {
  code = code.replace(
    /import React, \{ useState, useEffect \} from 'react';/g,
    "import React, { useState, useEffect, startTransition } from 'react';"
  );
}

code = code.replace(
  /onClick=\{\(\) => setDirection\('BUY'\)\}/g,
  "onClick={() => startTransition(() => setDirection('BUY'))}"
);
code = code.replace(
  /onClick=\{\(\) => setDirection\('SELL'\)\}/g,
  "onClick={() => startTransition(() => setDirection('SELL'))}"
);
code = code.replace(
  /onClick=\{\(\) => setOrderType\('MARKET'\)\}/g,
  "onClick={() => startTransition(() => setOrderType('MARKET'))}"
);
code = code.replace(
  /onClick=\{\(\) => setOrderType\('LIMIT'\)\}/g,
  "onClick={() => startTransition(() => setOrderType('LIMIT'))}"
);
code = code.replace(
  /onClick=\{\(\) => setProductType\('INTRADAY'\)\}/g,
  "onClick={() => startTransition(() => setProductType('INTRADAY'))}"
);
code = code.replace(
  /onClick=\{\(\) => setProductType\('DELIVERY'\)\}/g,
  "onClick={() => startTransition(() => setProductType('DELIVERY'))}"
);

fs.writeFileSync('src/components/TradeScreen.tsx', code);
console.log('Patched TradeScreen.tsx');
