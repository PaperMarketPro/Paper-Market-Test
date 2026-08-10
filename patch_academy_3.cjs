const fs = require('fs');
let code = fs.readFileSync('src/components/Academy.tsx', 'utf8');

const targetStr = `<div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-xl">`;

const replaceStr = `<div className="bg-sky-500/10 p-2.5 rounded-xl border border-sky-500/20 text-[11px] text-sky-200 flex items-center justify-between gap-2 font-mono">
                    <span>💡 If YouTube iframe displays "Unavailable" due to browser domain policies, watch directly on YouTube or use AI Interactive Studio above.</span>
                    <button onClick={() => setPlayerMode('ai')} className="underline font-bold hover:text-white shrink-0">Switch to AI Studio</button>
                  </div>
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-xl">`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('src/components/Academy.tsx', code);
  console.log('Patch step 3 applied successfully');
} else {
  console.log('Target string not found');
}
