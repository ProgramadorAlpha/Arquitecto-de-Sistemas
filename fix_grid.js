const fs = require('fs');
const filePath = 'src/components/Tabs/DashboardTab.jsx';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Guardar backup
fs.writeFileSync(filePath + '.bak', lines.join('\n'), 'utf8');

// Líneas a reemplazar: 756 a 1065 (índices 755 a 1064 en base 0)
const before = lines.slice(0, 755);   // líneas 1-755 (índices 0-754)
const after  = lines.slice(1065);     // desde línea 1066 en adelante

const newBlock = `      {/* ═══════════════════════════════════════════════════
          GRID PRINCIPAL — 3 columnas equilibradas
          Col 1: Tesla Morning  (sola, ocupa su altura real)
          Col 2: Horario · Bloque Sagrado · Lectura Actual
          Col 3: Idiomas · Journal de Energía
      ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* ── COL 1: Tesla Morning ── */}
        <div className="widget-card widget-card--amber !p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-amber-500 p-7 text-white flex justify-between items-start relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize:'22px 22px'}} />
            <div className="relative z-10">
              <h3 className="text-2xl font-black tracking-tight leading-none mb-1">Tesla Morning</h3>
              <p className="text-orange-200 font-bold text-xs tracking-[0.2em] uppercase">3 · 6 · 9 Protocol</p>
            </div>
            <div className="text-right relative z-10">
              <div className="text-4xl font-black leading-none">{Math.round((morningDone / morningHabits.length) * 100) || 0}%</div>
              <div className="text-[10px] font-bold text-orange-200 uppercase tracking-widest mt-1">Complete</div>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {morningHabits.map((item) => {
              const isDone = data.habits[item.key];
              return (
                <button key={item.key} onClick={() => toggleHabit(item.key)}
                  className={\`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 \${isDone ? 'bg-amber-500/5 border-amber-500/20 opacity-70' : 'bg-[#1A1D24] border-[#2A2D35] hover:border-amber-500/30'}\`}>
                  <div className={\`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 \${item.iconBg} shadow-lg\`}>
                    {item.icon}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 text-left">
                    <span className="font-bold text-white text-sm">{item.label}</span>
                    <p className="text-[11px] text-slate-500 truncate">{item.subLabel}</p>
                  </div>
                  <div className={\`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 transition-all \${isDone ? 'bg-amber-500 border-amber-500' : 'border-slate-700'}\`}>
                    {isDone && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── COL 2: Horario · Bloque Sagrado · Lectura ── */}
        <div className="flex flex-col gap-5">

          {/* Horario de Hoy */}
          <div className="widget-card !bg-[#13151A] border-[#2A2D35]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20"><Clock className="w-4 h-4 text-blue-400" /></div>
                <div>
                  <h3 className="font-black text-white text-sm uppercase tracking-tight">Horario de Hoy</h3>
                  <p className="text-[10px] text-slate-500 font-bold">{data.scheduleItems.length} eventos</p>
                </div>
              </div>
              <button onClick={() => setIsScheduleModalOpen(true)} className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 transition-colors" title="Agregar evento especial">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {data.scheduleItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-5 text-center">
                <Calendar className="w-7 h-7 text-slate-700 mb-2" />
                <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">Sin eventos hoy</p>
                <button onClick={() => setIsScheduleModalOpen(true)} className="mt-2 text-blue-400 text-xs font-bold hover:text-blue-300">+ Agregar evento especial</button>
              </div>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {data.scheduleItems.map((item) => {
                  const catColors = { 'Deep Work': 'bg-blue-500/10 text-blue-400 border-blue-500/20', 'Reunión': 'bg-purple-500/10 text-purple-400 border-purple-500/20', 'Personal': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', 'Bienestar': 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
                  const color = catColors[item.category] || catColors['Personal'];
                  return (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-[#1A1D24] rounded-xl border border-[#2A2D35] group">
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-slate-400">{item.startTime}</p>
                        <p className="text-[9px] text-slate-600">{item.endTime}</p>
                      </div>
                      <div className="w-px h-7 bg-[#2A2D35] shrink-0" />
                      <p className="text-xs font-semibold text-white flex-1 truncate">{item.title}</p>
                      <span className={\`text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0 \${color}\`}>{item.category}</span>
                      <button onClick={() => deleteScheduleItem(item.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all p-1"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bloque Sagrado */}
          <div className="widget-card !bg-[#13151A] border-[#2A2D35]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20"><Anchor className="w-4 h-4 text-amber-400" /></div>
                <div>
                  <h3 className="font-black text-white text-sm uppercase tracking-tight">Bloque Sagrado</h3>
                  <p className="text-[10px] text-slate-500 font-bold">Deep Work protegido</p>
                </div>
              </div>
              <button onClick={() => setIsSacredModalOpen(true)} className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
            </div>
            {data.sacredBlocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-5 text-center">
                <Anchor className="w-7 h-7 text-slate-700 mb-2" />
                <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">Sin bloques definidos</p>
                <button onClick={() => setIsSacredModalOpen(true)} className="mt-2 text-amber-400 text-xs font-bold hover:text-amber-300">+ Definir bloque sagrado</button>
              </div>
            ) : (
              <div className="space-y-2">
                {data.sacredBlocks.slice(0, 3).map((b, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#1A1D24] rounded-xl border border-amber-500/10">
                    <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-amber-400 uppercase tracking-wide truncate">{b.label}</p>
                      <p className="text-[10px] text-slate-500">{b.day}{b.time && \` · \${b.time}\`}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lectura Actual */}
          <div className="widget-card !bg-[#13151A] border-[#2A2D35] relative">
            <button onClick={() => setIsReadingModalOpen(true)} className="absolute top-4 right-4 p-1.5 text-slate-600 hover:text-white transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20"><BookOpen className="w-4 h-4 text-emerald-400" /></div>
              <div>
                <h3 className="font-black text-white text-sm uppercase tracking-tight">Lectura Actual</h3>
                <p className="text-[10px] text-slate-500 font-bold">Progreso diario</p>
              </div>
            </div>
            {data.reading?.current_book ? (
              <>
                <p className="text-sm font-bold text-white leading-snug line-clamp-2 mb-3">{data.reading.current_book}</p>
                <button onClick={toggleReading}
                  className={\`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all \${
                    data.reading.last_read_date === today
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-[#1A1D24] border border-[#2A2D35] text-slate-400 hover:border-emerald-500/20 hover:text-emerald-400'
                  }\`}>
                  {data.reading.last_read_date === today
                    ? <><CheckCircle2 className="w-4 h-4" /> ¡Leído hoy!</>
                    : <><BookOpen className="w-4 h-4" /> Marcar como leído</>}
                </button>
                <div className="mt-3">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Racha — últimos 7 días</p>
                  <div className="flex gap-1.5">
                    {[...Array(7)].map((_, i) => {
                      const d = new Date(); d.setDate(d.getDate() - (6 - i));
                      const dateStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                      const isRead = data.reading?.last_read_date === dateStr;
                      const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 2).toUpperCase();
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className={\`w-full h-5 rounded-lg transition-all \${isRead ? 'bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'bg-[#1A1D24] border border-[#2A2D35]'}\`} />
                          <span className="text-[8px] font-bold text-slate-600">{dayName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-5 text-center">
                <BookOpen className="w-7 h-7 text-slate-700 mb-2" />
                <p className="text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">Sin libro activo</p>
                <button onClick={() => setIsReadingModalOpen(true)} className="text-emerald-400 text-xs font-bold hover:text-emerald-300">+ Agregar libro</button>
              </div>
            )}
          </div>
        </div>

        {/* ── COL 3: Idiomas + Journal de Energía ── */}
        <div className="flex flex-col gap-5">
          {data.englishWords.length > 0 ? (
            <LanguageWidget
              words={data.englishWords}
              onComplete={completeLanguageSession}
              isCompleted={data.englishCompleted}
              sessionScore={data.englishScore}
              languageId={langId}
              levelId={levelId}
              onLanguageChange={handleLanguageChange}
              onLevelChange={handleLevelChange}
              onRegenerate={handleRegenerateLanguage}
            />
          ) : (
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
              <p className="text-white font-bold uppercase tracking-widest text-xs">Sincronizando Idiomas...</p>
            </div>
          )}
          <div className="widget-card !bg-[#13151A] border-[#2A2D35] overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20"><Activity className="w-4 h-4 text-blue-400" /></div>
              <div>
                <h3 className="font-black text-white text-sm uppercase tracking-tight">Journal de Energía</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Registra tu frecuencia diaria</p>
              </div>
            </div>
            <EnergySlider value={data.energyLevel} onChange={saveEnergyLevel} />
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { id: 'focus',   label: 'Focus Mode',   emoji: '🎯', color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30'   },
                { id: 'flow',    label: 'Flow State',   emoji: '🌊', color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/30'   },
                { id: 'warrior', label: 'Warrior Mode', emoji: '⚔️', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
              ].map(mode => (
                <button key={mode.id} onClick={() => saveMentalState(mode.id)}
                  className={\`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all \${
                    data.mentalState === mode.id
                      ? \`\${mode.bg} \${mode.border} scale-[1.04] shadow-lg\`
                      : 'bg-[#1A1D24] border-[#2A2D35] hover:border-white/10'
                  }\`}>
                  <span className="text-xl">{mode.emoji}</span>
                  <span className={\`text-[8px] font-black uppercase tracking-wider text-center leading-tight \${
                    data.mentalState === mode.id ? mode.color : 'text-slate-500'
                  }\`}>{mode.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 pb-1">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Historial — últimos 7 días</p>
              <div className="flex items-end gap-1.5" style={{ height: '56px' }}>
                {[...Array(7)].map((_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - (6 - i));
                  const dateStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                  const entry = data.energyHistory.find(e => e.date === dateStr);
                  const lvl = entry?.level || 0;
                  const pct = lvl > 0 ? Math.max((lvl / 10) * 100, 8) : 0;
                  const mode = entry?.mode || '';
                  const modeColors = { focus: 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]', flow: 'bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.5)]', warrior: 'bg-violet-500 shadow-[0_0_6px_rgba(139,92,246,0.5)]' };
                  const barColor = modeColors[mode] || 'bg-amber-500';
                  const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 2).toUpperCase();
                  const isToday = i === 6;
                  return (
                    <div key={dateStr} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <div className="w-full rounded-sm overflow-hidden flex items-end bg-[#1A1D24] rounded-md" style={{ height: '46px' }}>
                        {pct > 0
                          ? <div className={\`w-full rounded-md transition-all duration-700 \${barColor}\`} style={{ height: \`\${pct}%\` }} />
                          : <div className="w-full" style={{ height: '4px', background: '#2A2D35', borderRadius: '4px', marginTop: 'auto' }} />}
                      </div>
                      <span className={\`text-[8px] font-bold \${isToday ? 'text-blue-400' : 'text-slate-600'}\`}>{isToday ? 'HOY' : dayName}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 mt-2">
                {[{id:'focus',color:'bg-blue-500',label:'Focus'},{id:'flow',color:'bg-cyan-500',label:'Flow'},{id:'warrior',color:'bg-violet-500',label:'Warrior'}].map(m => (
                  <div key={m.id} className="flex items-center gap-1">
                    <div className={\`w-2 h-2 rounded-full \${m.color}\`} />
                    <span className="text-[8px] text-slate-600 font-bold uppercase">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          CIERRE NOCTURNO — Franja horizontal full-width
          Los 6 hábitos en una sola fila (sin ocupar ninguna columna del grid)
      ═══════════════════════════════════════════════════ */}
      <div className="widget-card widget-card--violet !p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-500/10">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2.5 rounded-2xl"><Moon className="w-5 h-5 text-indigo-300 stroke-[2]" /></div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white">Cierre de Alto Rendimiento</h3>
              <p className="text-slate-500 text-[11px] font-medium">Rutina nocturna · {nightDone}/{nightHabitsList.length} completados</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#6366f1] font-black text-xl">{Math.round((nightDone / nightHabitsList.length) * 100) || 0}%</span>
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500" style={{ width: \`\${Math.round((nightDone / nightHabitsList.length) * 100) || 0}%\` }} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-indigo-500/10">
          {nightHabitsList.map(item => {
            const isDone = data.nightHabits[item.key] === 1;
            return (
              <button key={item.key} onClick={() => toggleNightHabit(item.key)}
                className={\`flex flex-col items-center justify-center gap-2 py-5 px-3 bg-[#13151A] transition-all hover:bg-indigo-500/5 active:scale-95 \${isDone ? '!bg-indigo-950/60' : ''}\`}>
                <div className={\`p-2.5 rounded-2xl transition-all \${isDone ? 'bg-indigo-500 text-white shadow-[0_0_14px_rgba(99,102,241,0.5)]' : 'bg-slate-800 text-slate-500'}\`}>
                  {item.icon}
                </div>
                <div className="text-center">
                  <p className={\`text-[11px] font-black leading-tight \${isDone ? 'text-indigo-300' : 'text-slate-400'}\`}>{item.label}</p>
                  <p className="text-[9px] text-slate-600 mt-0.5 leading-tight hidden sm:block">{item.subLabel}</p>
                </div>
                <div className={\`w-5 h-5 rounded-full flex items-center justify-center transition-all \${isDone ? 'bg-indigo-500' : 'border-2 border-slate-700'}\`}>
                  {isDone && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ FILA FINAL: Mandamiento + Foco Semanal ═══ */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="widget-card !bg-gradient-to-br from-indigo-900/70 to-indigo-950 border-indigo-800/30 min-h-0">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 mb-3">Mandamiento del Día</p>
          <p className="text-base sm:text-lg italic font-medium leading-relaxed text-slate-100 font-serif break-words">
            &ldquo;{settings.manifesto || 'La inacción no es neutral; es una elección activa por la mediocridad.'}&rdquo;
          </p>
        </div>
        <div className="widget-card border-red-900/40 relative min-h-0">
          <button onClick={() => setIsFocusModalOpen(true)} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-red-500 shrink-0" />
            <h3 className="font-black text-white uppercase text-sm">Foco Semanal</h3>
          </div>
          <p className="text-base sm:text-lg font-black text-red-500 uppercase tracking-tight break-words leading-snug">
            {data.weeklyFocus.priority_1 || 'DEFINE TU ROCA'}
          </p>
        </div>
      </div>`;

const result = before.concat([newBlock]).concat(after);
fs.writeFileSync(filePath, result.join('\n'), 'utf8');
console.log('DONE — total lines: ' + result.length);
