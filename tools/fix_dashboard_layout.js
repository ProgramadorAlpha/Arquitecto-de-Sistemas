const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, '..', 'src', 'components', 'Tabs', 'DashboardTab.jsx');
let content = fs.readFileSync(filepath, 'utf8');

// 1. Remove Grid 8/12 wrapper
content = content.replace(
  /<div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-12 gap-8">\s*{\/\* =+[\s\S]*?MAIN COLUMN \(8\/12\)[\s\S]*?=+ \*\/}\s*<div className="xl:col-span-8 flex flex-col gap-8">/,
  '<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6 md:gap-8 items-start">'
);

// 2. Add classes to Tesla Morning (1)
content = content.replace(
  /{\/\* ─── 2\. TESLA MORNING 3-6-9 ─── \*\/}\s*<div className="bg-white dark:bg-slate-900 rounded-\[2\.5rem\] shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800">/,
  '{/* ─── 2. TESLA MORNING 3-6-9 ─── */}\n          <div className="col-span-1 md:col-span-2 xl:col-span-8 order-1 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800">'
);

// 3. Add classes to Cierre de Alto Rendimiento (3)
content = content.replace(
  /{\/\* ─── 5\. CIERRE DE ALTO RENDIMIENTO ─── \*\/}\s*<div className="bg-white dark:bg-\[#0B0B0E\] p-8 rounded-\[3rem\] text-slate-800 dark:text-white shadow-2xl relative border border-slate-100 dark:border-slate-800\/60 transition-colors">/,
  '{/* ─── 5. CIERRE DE ALTO RENDIMIENTO ─── */}\n          <div className="col-span-1 md:col-span-2 xl:col-span-8 order-3 bg-white dark:bg-[#0B0B0E] p-8 rounded-[3rem] text-slate-800 dark:text-white shadow-2xl relative border border-slate-100 dark:border-slate-800/60 transition-colors">'
);

// 4. Transform Sidebar wrapper
content = content.replace(
  /<\/div>\s*{\/\* =+[\s\S]*?SIDEBAR COLUMN \(4\/12\)[\s\S]*?=+ \*\/}\s*<div className="xl:col-span-4 flex flex-col gap-8 h-full">/,
  '{/* SIDEBAR MIGRATED OUT OF WRAPPER */}'
);

// 5. Wrap Business English (4) and fix Skeleton
// Note: EnglishWidget is called. We need to wrap the whole conditional block.
content = content.replace(
  /{\/\* ─── 3\. BUSINESS ENGLISH C1 ─── \*\/}\s*{data\.englishWords\.length > 0 \? \(/,
  '{/* ─── 3. BUSINESS ENGLISH C1 ─── */}\n          <div className="col-span-1 md:col-span-2 xl:col-span-4 order-4 flex flex-col h-full">\n          {data.englishWords.length > 0 ? ('
);

// Find the skeleton div and modify it
content = content.replace(
  /\/\* Skeleton mientras la IA genera las palabras \*\/\s*<div className="bg-gradient-to-br from-slate-900 to-slate-950 p-7 rounded-\[2\.5rem\] border border-slate-800\/50 shadow-xl">/,
  '/* Skeleton mientras la IA genera las palabras */\n            <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-7 rounded-[2.5rem] border border-slate-800/50 shadow-xl flex-1">'
);

// Close Business English wrapper
content = content.replace(
  /<\/div>\s*}\)\s*<\/div>\s*{\/\* ─── 4\./g, // Wait, wrong matching
  'replace logic below'
);

// Actually, to safely close EnglishWidget, let's just use string replace.
content = content.replace(
  `              </div>\n            </div>\n          )}`,
  `              </div>\n            </div>\n          )}\n          </div>`
);

// 6. Journal de Energia (2)
content = content.replace(
  /return \(\s*<div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950 p-8 rounded-\[3rem\] border border-slate-100 dark:border-slate-800\/50 shadow-xl relative overflow-hidden">/,
  'return (\n              <div className="col-span-1 md:col-span-2 xl:col-span-4 order-2 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800/50 shadow-xl relative overflow-hidden flex flex-col h-full">'
);

// 7. El Manifiesto (9)
content = content.replace(
  /{\/\* ─── Manifesto Quote \(improved\) ─── \*\/}\s*<div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-\[2\.5rem\] text-white relative overflow-hidden group">/,
  '{/* ─── Manifesto Quote (improved) ─── */}\n          <div className="col-span-1 md:col-span-1 xl:col-span-6 order-9 flex flex-col justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden group">'
);

// 8. Foco Semanal (8)
content = content.replace(
  /{\/\* ─── Weekly Focus \(improved\) ─── \*\/}\s*<div className="relative group">/,
  '{/* ─── Weekly Focus (improved) ─── */}\n          <div className="col-span-1 md:col-span-1 xl:col-span-6 order-8 relative group">'
);

// 9. Bloques Sagrados (6)
content = content.replace(
  /{\/\* ─── Sacred Blocks \(improved with timeline\) ─── \*\/}\s*<div className="bg-white dark:bg-slate-900 p-8 rounded-\[3rem\] border border-slate-100 dark:border-slate-800 shadow-sm relative">/,
  '{/* ─── Sacred Blocks (improved with timeline) ─── */}\n          <div className="col-span-1 md:col-span-1 xl:col-span-4 order-6 flex flex-col h-full bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm relative">'
);

// 10. Lectura Actual (7)
content = content.replace(
  /{\/\* ─── Reading Block \(improved\) ─── \*\/}\s*<div className="bg-white dark:bg-slate-900 p-8 rounded-\[3rem\] border border-slate-100 dark:border-slate-800 shadow-sm relative">/,
  '{/* ─── Reading Block (improved) ─── */}\n          <div className="col-span-1 md:col-span-1 xl:col-span-4 order-7 bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm relative h-full flex flex-col justify-between">'
);

// 11. Horario de Hoy (5)
content = content.replace(
  /return \(\s*<div className="bg-white dark:bg-slate-900 p-8 rounded-\[3rem\] border border-slate-100 dark:border-slate-800 shadow-sm relative">/,
  'return (\n              <div className="col-span-1 md:col-span-2 xl:col-span-4 order-5 bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm relative flex flex-col h-full">'
);

// 12. End of Grid - remove the extra closing </div> for the 4/12 wrapper
//   Old End:
//   1177:         </div>
//   1178:       </div>
//   1179:       {/* MODALS
content = content.replace(
  /<\/div>\s*<\/div>\s*{\/\* ═══════════════════════════════════════\s*MODALS \(unchanged\)/,
  '      </div>\n\n      {/* ═══════════════════════════════════════\n          MODALS (unchanged)'
);

fs.writeFileSync(filepath, content, 'utf8');
console.log('Fixed dashboard layout.');
