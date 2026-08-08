const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');
code = code.replace('.animate-marquee {\n  display: flex;\n  width: max-content;\n  animation: marquee 40s linear infinite;\n}', '.animate-marquee {\n  display: flex;\n  width: max-content;\n  animation: marquee 40s linear infinite;\n  will-change: transform;\n  transform: translateZ(0);\n}');
fs.writeFileSync('src/index.css', code);
