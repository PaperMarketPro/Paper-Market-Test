const fs = require('fs');
let code = fs.readFileSync('src/components/TradeScreen.tsx', 'utf8');

code = code.replace(/onClick=\{\(\) => setDirection\('Buy'\)\}/g, "onClick={() => startTransition(() => setDirection('Buy'))}");
code = code.replace(/onClick=\{\(\) => setDirection\('Sell'\)\}/g, "onClick={() => startTransition(() => setDirection('Sell'))}");
code = code.replace(/onClick=\{\(\) => setOrderType\(([^)]+)\)\}/g, "onClick={() => startTransition(() => setOrderType($1))}");
code = code.replace(/onClick=\{\(\) => setRiskPercent\(([^)]+)\)\}/g, "onClick={() => startTransition(() => setRiskPercent($1))}");
code = code.replace(/onClick=\{\(\) => setSimSLPercent\(([^)]+)\)\}/g, "onClick={() => startTransition(() => setSimSLPercent($1))}");
code = code.replace(/onClick=\{\(\) => handleQtyStep\(([^)]+)\)\}/g, "onClick={() => startTransition(() => handleQtyStep($1))}");

fs.writeFileSync('src/components/TradeScreen.tsx', code);
console.log('Patched TradeScreen.tsx');
