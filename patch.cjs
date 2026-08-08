const fs = require('fs');
let code = fs.readFileSync('src/components/Navigation.tsx', 'utf8');

const target = `            <div 
              onClick={() => handleNavClick('profile')}
              className={\`cursor-pointer flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold font-mono transition-all shadow-sm hover:scale-[1.02] \${\n                upstoxStatus.isRealUpstox \n                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'\n                  : 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-white/5 dark:border-white/5 dark:text-gray-300'\n              }\`}
              title={upstoxStatus.isRealUpstox ? "Live Pro Feed Connected" : "NSE / BSE Market Status"}
            >
              <span className={\`w-2 h-2 rounded-full \${upstoxStatus.isRealUpstox ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500'}\`} />
              <span className="hidden sm:inline font-mono text-[10px] uppercase font-bold">
                {upstoxStatus.isRealUpstox ? 'LIVE FEED: PRO' : 'NSE / BSE'}
              </span>
            </div>`;

const replacement = `            <div 
              onClick={() => handleNavClick('profile')}
              className={\`cursor-pointer flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold font-mono transition-all shadow-sm hover:scale-[1.02] \${
                upstoxStatus.isRealUpstox 
                  ? isMarketOpen ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400'
                  : isMarketOpen ? 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-white/5 dark:border-white/5 dark:text-gray-300' : 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-white/5 dark:border-white/5 dark:text-gray-500'
              }\`}
              title={upstoxStatus.isRealUpstox ? "Live Pro Feed Connected" : "NSE / BSE Market Status"}
            >
              <span className={\`w-2 h-2 rounded-full \${isMarketOpen ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500'}\`} />
              <span className="hidden sm:inline font-mono text-[10px] uppercase font-bold">
                {upstoxStatus.isRealUpstox ? (isMarketOpen ? 'PRO FEED: ACTIVE' : 'PRO FEED: CLOSED') : (isMarketOpen ? 'NSE / BSE' : 'MKT CLOSED')}
              </span>
            </div>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/Navigation.tsx', code);
  console.log("Patch applied successfully!");
} else {
  console.log("Target not found! (Trying a regex fallback)");
  const regex = /<div\s+onClick=\{\(\) => handleNavClick\('profile'\)\}[\s\S]*?<\/div>/;
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/components/Navigation.tsx', code);
  console.log("Regex patch applied!");
}
