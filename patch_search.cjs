const fs = require('fs');
let code = fs.readFileSync('src/components/Markets.tsx', 'utf8');

// fnoOptionsSearchQuery
code = code.replace(
  /setFnoOptionsSearchQuery\(val\);/g,
  "startTransition(() => setFnoOptionsSearchQuery(val));"
);

// equitySearchQuery
code = code.replace(
  /setEquitySearchQuery\(e.target.value\)/g,
  "startTransition(() => setEquitySearchQuery(e.target.value))"
);

// fnoFuturesSearchQuery
code = code.replace(
  /setFnoFuturesSearchQuery\(e.target.value\)/g,
  "startTransition(() => setFnoFuturesSearchQuery(e.target.value))"
);

fs.writeFileSync('src/components/Markets.tsx', code);

let dash = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
dash = dash.replace(
  /setSearchQuery\(e.target.value\)/g,
  "startTransition(() => setSearchQuery(e.target.value))"
);
fs.writeFileSync('src/components/Dashboard.tsx', dash);

console.log('Patched search inputs');
