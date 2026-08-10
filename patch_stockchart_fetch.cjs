const fs = require('fs');
let code = fs.readFileSync('src/components/StockChart.tsx', 'utf8');

code = code.replace(
  /const res = await fetch\(\`\/api\/integrations\/upstox\/candles\?symbol=\$\{encodeURIComponent\(symbol\)\}&timeframe=\$\{timeframe\}\`, \{ headers \}\);/g,
  `const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        const res = await fetch(\`/api/integrations/upstox/candles?symbol=\${encodeURIComponent(symbol)}&timeframe=\${timeframe}\`, { headers, signal: controller.signal });
        clearTimeout(timeoutId);`
);

fs.writeFileSync('src/components/StockChart.tsx', code);
console.log('Patched fetch timeout in StockChart.tsx');
