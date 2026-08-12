const fs = require('fs');

function patchFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  
  if (!code.includes('startTransition')) {
    code = code.replace(
      /import React, \{ (.*) \} from 'react';/,
      "import React, { $1, startTransition } from 'react';"
    );
  }

  code = code.replace(
    /const handleAssetTap = React\.useCallback\(\(inst: Instrument\) => \{\n\s*setExpandedAsset\(prev => prev\?\.symbol === inst\.symbol \? null : inst\);\n\s*\}, \[\]\);/g,
    `const handleAssetTap = React.useCallback((inst: Instrument) => {
    startTransition(() => {
      setExpandedAsset(prev => prev?.symbol === inst.symbol ? null : inst);
    });
  }, []);`
  );

  code = code.replace(
    /const handleQuickTrade = React\.useCallback\(\(symbol: string\) => \{\n\s*setSelectedAssetBySymbol\(symbol\);\n\s*onNavigate\('trade'\);\n\s*\}, \[setSelectedAssetBySymbol, onNavigate\]\);/g,
    `const handleQuickTrade = React.useCallback((symbol: string) => {
    startTransition(() => {
      setSelectedAssetBySymbol(symbol);
      onNavigate('trade');
    });
  }, [setSelectedAssetBySymbol, onNavigate]);`
  );

  fs.writeFileSync(filePath, code);
}

patchFile('src/components/Markets.tsx');

let dash = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
dash = dash.replace(
  /setIsSearchOpen\(true\)/g,
  "startTransition(() => setIsSearchOpen(true))"
);
dash = dash.replace(
  /setIsSearchOpen\(false\)/g,
  "startTransition(() => setIsSearchOpen(false))"
);
dash = dash.replace(
  /onNavigate\('positions'\)/g,
  "startTransition(() => onNavigate('positions'))"
);
dash = dash.replace(
  /onNavigate\('journal'\)/g,
  "startTransition(() => onNavigate('journal'))"
);

fs.writeFileSync('src/components/Dashboard.tsx', dash);

console.log('Patched handlers.');
