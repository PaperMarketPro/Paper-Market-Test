const fs = require('fs');
let code = fs.readFileSync('src/components/StockChart.tsx', 'utf8');

code = code.replace(
  /        return computeIndicators\(updated, true\);\n      \}\);\n    \}\);\n  \}, \[activeAsset\.ltp, activeAsset\.symbol, computeIndicators\]\);/s,
  `        return computeIndicators(updated, true);
      });
    }
  }, [activeAsset.ltp, activeAsset.symbol, computeIndicators]);`
);

fs.writeFileSync('src/components/StockChart.tsx', code);
console.log('Fixed syntax error in StockChart.tsx');
