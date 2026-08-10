const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf8');

code = code.replace(
  /batchInterval = setInterval\(\(\) => \{/g,
  "batchInterval = setInterval(() => {"
);
code = code.replace(
  /\}, 800\);/g,
  "}, 3000);"
);

code = code.replace(
  /fallbackInterval = setInterval\(\(\) => \{[\s\S]*?\}, 1000\);/g,
  `fallbackInterval = setInterval(() => {
        const now = Date.now();
        instrumentsRef.current.forEach(inst => {
          const lastLiveTime = lastLiveTicksRef.current[inst.symbol] || 0;
          if (now - lastLiveTime > 2000) {
            pendingTicksRef.current[inst.symbol] = { isSim: true };
          }
        });
      }, 3000);`
);

fs.writeFileSync('src/store.tsx', code);
console.log('Patched intervals in store.tsx');
