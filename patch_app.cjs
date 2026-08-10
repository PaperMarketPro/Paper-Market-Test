const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const handleNavigate = useCallback\(\(tab: string\) => \{\n    React\.startTransition\(\(\) => \{\n      setCurrentTab\(tab\);\n    \}\);\n  \}, \[\]\);/g,
  "const handleNavigate = useCallback((tab: string) => {\n    setCurrentTab(tab);\n  }, []);"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Removed startTransition from App.tsx');
