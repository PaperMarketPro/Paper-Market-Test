const fs = require('fs');
let code = fs.readFileSync('src/components/StockChart.tsx', 'utf8');

code = code.replace(
  /const controller = new AbortController\(\);/g,
  `if (symbol.includes(' CE') || symbol.includes(' PE')) {
          throw new Error("Options use simulated history");
        }
        const controller = new AbortController();`
);

fs.writeFileSync('src/components/StockChart.tsx', code);
console.log('Patched skip fetch in StockChart.tsx');
