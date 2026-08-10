const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf8');

code = code.replace(
  /const res = await fetch\('\/api\/integrations\/upstox\/ltp', \{ headers \}\);/g,
  `const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch('/api/integrations/upstox/ltp', { headers, signal: controller.signal });
      clearTimeout(timeoutId);`
);

fs.writeFileSync('src/store.tsx', code);
console.log('Patched fetch timeout in store.tsx');
