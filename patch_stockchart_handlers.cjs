const fs = require('fs');
let code = fs.readFileSync('src/components/StockChart.tsx', 'utf8');

// Ensure startTransition is available
if (!code.includes('startTransition')) {
  code = code.replace(
    /import React, \{ (.*) \} from 'react';/,
    "import React, { $1, startTransition } from 'react';"
  );
}

// Wrapping simple setters
code = code.replace(/onClick=\{\(\) => setTimeframe\(([^)]+)\)\}/g, "onClick={() => startTransition(() => setTimeframe($1))}");
code = code.replace(/onClick=\{\(\) => setChartType\(([^)]+)\)\}/g, "onClick={() => startTransition(() => setChartType($1))}");
code = code.replace(/onClick=\{\(\) => setShowEMA\(([^)]+)\)\}/g, "onClick={() => startTransition(() => setShowEMA($1))}");
code = code.replace(/onClick=\{\(\) => setShowSMA\(([^)]+)\)\}/g, "onClick={() => startTransition(() => setShowSMA($1))}");
code = code.replace(/onClick=\{\(\) => setShowBB\(([^)]+)\)\}/g, "onClick={() => startTransition(() => setShowBB($1))}");
code = code.replace(/onClick=\{\(\) => setShowSupertrend\(([^)]+)\)\}/g, "onClick={() => startTransition(() => setShowSupertrend($1))}");
code = code.replace(/onClick=\{\(\) => setShowVWAP\(([^)]+)\)\}/g, "onClick={() => startTransition(() => setShowVWAP($1))}");
code = code.replace(/onClick=\{\(\) => setShowEma50_200\(([^)]+)\)\}/g, "onClick={() => startTransition(() => setShowEma50_200($1))}");
code = code.replace(/onClick=\{\(\) => setShowVolume\(([^)]+)\)\}/g, "onClick={() => startTransition(() => setShowVolume($1))}");
code = code.replace(/onClick=\{\(\) => setShowRSI\(([^)]+)\)\}/g, "onClick={() => startTransition(() => setShowRSI($1))}");
code = code.replace(/onClick=\{\(\) => setShowMACD\(([^)]+)\)\}/g, "onClick={() => startTransition(() => setShowMACD($1))}");
code = code.replace(/onClick=\{\(\) => setShowAutoSR\(([^)]+)\)\}/g, "onClick={() => startTransition(() => setShowAutoSR($1))}");

fs.writeFileSync('src/components/StockChart.tsx', code);
console.log('Patched StockChart.tsx interactions');
