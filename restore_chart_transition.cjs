const fs = require('fs');
let code = fs.readFileSync('src/components/StockChart.tsx', 'utf8');

if (!code.includes('startTransition')) {
  code = code.replace(
    /import React, \{ useState, useEffect, useMemo, useRef, useCallback \} from 'react';/g,
    "import React, { useState, useEffect, useMemo, useRef, useCallback, startTransition } from 'react';"
  );
}

code = code.replace(
  /    previousAssetPrice\.current = currentLtp;\n\n    \{\n      setCandles\(prev => \{/g,
  "    previousAssetPrice.current = currentLtp;\n\n    startTransition(() => {\n      setCandles(prev => {"
);

code = code.replace(
  /        return computeIndicators\(updated, true\);\n      \}\);\n    \}\n  \}, \[activeAsset\.ltp, activeAsset\.symbol, computeIndicators\]\);/s,
  `        return computeIndicators(updated, true);
      });
    });
  }, [activeAsset.ltp, activeAsset.symbol, computeIndicators]);`
);

fs.writeFileSync('src/components/StockChart.tsx', code);
console.log('Restored startTransition in StockChart.tsx');
