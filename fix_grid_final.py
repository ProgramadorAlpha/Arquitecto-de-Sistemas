import codecs

with codecs.open('src/components/Tabs/DashboardTab.jsx', 'r', 'utf-8') as f:
    lines = f.readlines()

header = "".join(lines[:749])  # 0 to 748, so exactly up to line 749

new_bottom = """
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start relative z-10 w-full mb-8">
        {/* ── COLUMNA 1: Tesla Morning + Journal de Energía ── */}
        <div className="flex flex-col gap-5">
          <div className="widget-card widget-card--amber !p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-amber-500 dark:from-orange-700 dark:to-orange-900 p-8 text-white flex justify-between items-start relative">
              <div>
                <h3 className="text-3xl font-black tracking-tight leading-none mb-1">Tesla Morning</h3>
                <p className="text-orange-200 font-medium tracking-wide">3 · 6 · 9 Protocol</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black leading-none">{Math.round((morningDone / morningHabits.length) * 100) || 0}%</div>
                <div className="text-[10px] font-bold text-orange-200 uppercase tracking-widest mt-1">Complete</div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {morningHabits.map((item) => {
                const isDone = data.habits[item.key];
                return (
                  <button key={item.key} onClick={() => toggleHabit(item.key)} className={`w-full flex items-center justify-between gap-4 p-5 rounded-[2rem] border-y border-r border-l-[6px] transition-all ${isDone ? 'bg-amber-50/50 dark:bg-amber-900/10 opacity-60 border-slate-100 dark:border-slate-800' : 'bg-white dark:bg-slate-800 shadow-sm border-slate-100 dark:border-slate-800'}`}>
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-500/10 text-amber-500 font-black text-lg shrink-0">{item.number}</div>
                      <div className="flex flex-col flex-1 min-w-0 text-left">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-base">{item.label}</span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.subLabel}</p>
                      </div>
                    </div>
                    {isDone ? <CheckCircle2 className="w-6 h-6 text-amber-500 shrink-0" /> : <Circle className="w-6 h-6 text-slate-300 dark:text-slate-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Journal de Energía */}
          <div className="widget-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20"><Activity className="w-6 h-6 text-blue-500" /></div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-lg">Journal de Energía</h3>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Estado Diario</p>
              </div>
            </div>

            <EnergySlider value={data.energyLevel} onChange={saveEnergyLevel} />

            <div className="grid grid-cols-2 gap-2 mt-6">
               <button onClick={() => saveMentalState('Focus')} className={`p-3 rounded-xl border text-[11px] font-black tracking-wider uppercase transition-all flex flex-col items-center justify-center gap-1 ${data.mentalState==='Focus'?'bg-blue-500 text-white border-blue-600 shadow-md shadow-blue-500/20':'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-400 hover:text-blue-500'}`}>
                 <Zap className="w-4 h-4" /> FOCUS MODE
               </button>
               <button onClick={() => saveMentalState('Slow')} className={`p-3 rounded-xl border text-[11px] font-black tracking-wider uppercase transition-all flex flex-col items-center justify-center gap-1 ${data.mentalState==='Slow'?'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20':'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-emerald-400 hover:text-emerald-500'}`}>
                 <Leaf className="w-4 h-4" /> SLOW STATE
               </button>
               <button onClick={() => saveMentalState('Water')} className={`p-3 rounded-xl border text-[11px] font-black tracking-wider uppercase transition-all flex flex-col items-center justify-center gap-1 ${data.mentalState==='Water'?'bg-cyan-500 text-white border-cyan-600 shadow-md shadow-cyan-500/20':'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-cyan-400 hover:text-cyan-500'}`}>
                 <Waves className="w-4 h-4" /> WATER MODE
               </button>
               <button onClick={() => saveMentalState('Burnout')} className={`p-3 rounded-xl border text-[11px] font-black tracking-wider uppercase transition-all flex flex-col items-center justify-center gap-1 ${data.mentalState==='Burnout'?'bg-red-500 text-white border-red-600 shadow-md shadow-red-500/20':'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-red-400 hover:text-red-500'}`}>
                 <Battery className="w-4 h-4" /> LOW BATTERY
               </button>
            </div>
            {data.energyHistory && data.energyHistory.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Última Semana</p>
                <div className="flex gap-1 h-12 items-end justify-between">
                  {data.energyHistory.slice(-7).map((log, i) => (
                    <div key={i} className="w-full bg-slate-100 dark:bg-slate-800 rounded-sm relative group" style={{height: `${(log.level/10)*100}%`}}>
                       {log.mode === 'Focus' && <div className="absolute -top-1 left-0 right-0 h-1 bg-blue-500 rounded-full" />}
                       {log.mode === 'Slow' && <div className="absolute -top-1 left-0 right-0 h-1 bg-emerald-500 rounded-full" />}
                       {log.mode === 'Water' && <div className="absolute -top-1 left-0 right-0 h-1 bg-cyan-500 rounded-full" />}
                       {log.mode === 'Burnout' && <div className="absolute -top-1 left-0 right-0 h-1 bg-red-500 rounded-full" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── COLUMNA 2: Horario + Bloques + Lectura ── */}
        <div className="flex flex-col gap-5">
          {/* Horario de Hoy */}
          <div className="widget-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20"><Clock className="w-5 h-5 text-indigo-500" /></div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-lg">Horario de Hoy</h3>
              </div>
              <button onClick={() => setIsScheduleModalOpen(true)} className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-500 rounded-xl transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              {data.scheduleItems && data.scheduleItems.length > 0 ? (
                data.scheduleItems.map(item => (
                  <div key={item.id} className="group flex items-center gap-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 relative">
                     <span className="text-xs font-bold text-slate-400 dark:text-slate-500 w-12">{item.startTime}</span>
                     <div className="flex-1 min-w-0">
                       <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{item.title}</p>
                     </div>
                     <button onClick={() => deleteScheduleItem(item.id)} className="opacity-0 group-hover:opacity-100 absolute right-0 p-1 text-slate-400 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))
              ) : (
                <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center mt-2">Agenda limpia.<br/>Añade eventos importantes.</p>
                </div>
              )}
            </div>
          </div>

          {/* Bloque Sagrado */}
          <div className="widget-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
              <button 
                  onClick={() => setIsSacredModalOpen(true)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-blue-500 transition-colors"
                  aria-label="Editar bloques"
              >
                  <Edit2 className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 mb-5">
                  <div className="bg-blue-500/10 p-2.5 flex items-center justify-center rounded-xl border border-blue-500/20"><Anchor className="w-5 h-5 text-blue-500" /></div>
                  <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Bloque Sagrado</h3>
                  </div>
              </div>
              <div className="space-y-3">
                  {data.sacredBlocks && data.sacredBlocks.length > 0 ? (
                      data.sacredBlocks.map((block, i) => (
                          <div key={i} className="flex flex-col p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-2xl">
                              <span className="text-[10px] font-black uppercase text-blue-500 tracking-wider mb-1">{block.day} • {block.time}</span>
                              <span className="font-bold text-slate-800 dark:text-white truncate">{block.label}</span>
                          </div>
                      ))
                  ) : (
                      <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                          <span className="text-xs text-slate-500 font-medium">Sin bloques definidos.</span>
                      </div>
                  )}
              </div>
          </div>

          {/* Lectura Actual */}
          <div className="widget-card group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
            <button onClick={() => setIsReadingModalOpen(true)} className="absolute top-4 right-4 p-2 text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:text-amber-500"><Edit2 className="w-4 h-4" /></button>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-500/10 flex items-center justify-center p-2.5 rounded-xl border border-amber-500/20"><BookOpen className="w-5 h-5 text-amber-500" /></div>
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-base">Lectura Actual</h3>
            </div>
            {data.reading?.current_book ? (
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 p-4 rounded-2xl flex items-center justify-between">
                <div className="min-w-0 pr-4">
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{data.reading.current_book}</p>
                  <p className="text-[10px] text-slate-500 font-black tracking-wider uppercase mt-1">META: 30 MIN DIARIOS</p>
                </div>
                <button 
                  onClick={toggleReading} 
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${data.reading?.last_read_date === today ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 hover:border-amber-500 hover:text-amber-500'}`}
                >
                  {data.reading?.last_read_date === today ? <CheckCircle2 className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                </button>
              </div>
            ) : (
               <div className="py-4 text-center cursor-pointer" onClick={() => setIsReadingModalOpen(true)}>
                 <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">Cargar libro actual</p>
               </div>
            )}
          </div>
        </div>

        {/* ── COLUMNA 3: Idiomas ── */}
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
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center shadow-lg">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
              <p className="text-slate-800 dark:text-white font-bold uppercase tracking-widest text-xs">Sincronizando Idiomas...</p>
            </div>
          )}
        </div>
      </div>

      {/* ── FRONTIER BOTTOM: Cierre Nocturno, Mandamiento, Foco ── */}
      <div className="w-full flex flex-col gap-5 relative z-10 mx-auto pb-10">
          {/* Cierre de Alto Rendimiento (Franja horizontal) */}
          <div className="widget-card widget-card--violet w-full !bg-white dark:!bg-slate-900 shadow-xl border border-indigo-100 dark:border-indigo-900/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 px-2">
                <div className="flex items-center gap-5">
                    <div className="bg-indigo-500/10 p-4 rounded-2xl shadow-sm border border-indigo-500/20"><Moon className="w-8 h-8 text-indigo-600 dark:text-indigo-400 stroke-[2.5]" /></div>
                    <div>
                        <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Cierre Nocturno</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-bold tracking-wide mt-1 uppercase">Preparación Biológica para el Día Siguiente</p>
                    </div>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/40 px-6 py-3 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 flex flex-col items-center md:items-end">
                   <div className="text-indigo-600 dark:text-indigo-400 font-black text-3xl leading-none tabular-nums">{Math.round((nightDone / nightHabitsList.length) * 100) || 0}%</div>
                   <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Éxito Diario</span>
                </div>
            </div>
            
            {/* Horizontal Grid para Cierre */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {nightHabitsList.map(item => {
                  const isDone = data.nightHabits[item.key] === 1;
                  return (
                    <button key={item.key} onClick={() => toggleNightHabit(item.key)} className={`flex flex-col justify-between p-6 rounded-[2rem] transition-all min-h-[160px] ${isDone ? `${item.theme.bg} scale-[1.03] shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] border-transparent z-10 relative saturate-150` : 'bg-slate-50 dark:bg-[#151518] border border-slate-200 dark:border-slate-800/80 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:shadow-lg'}`}>
                      <div className="flex items-start justify-between w-full mb-6">
                        <div className={`p-4 rounded-[1.2rem] ${isDone ? 'bg-white/90 dark:bg-white text-indigo-600 shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>{item.icon}</div>
                        {isDone ? <CheckCircle2 className="w-7 h-7 text-indigo-600 shrink-0" /> : <Circle className="w-7 h-7 text-slate-300 dark:text-slate-600 shrink-0" />}
                      </div>
                      <div className="mt-auto text-left">
                        <h4 className={`font-black text-base leading-tight mb-2 ${isDone ? item.theme.text : 'text-slate-700 dark:text-slate-200'}`}>{item.label}</h4>
                        <p className={`text-[11px] uppercase font-bold tracking-wider leading-snug ${isDone ? item.theme.sub : 'text-slate-400 dark:text-slate-500'}`}>{item.subLabel}</p>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
            <div className="widget-card border border-red-200 dark:border-red-900/40 relative h-full bg-white dark:bg-[#1a1315]">
              <button onClick={() => setIsFocusModalOpen(true)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-red-500 transition-colors"><Edit2 className="w-5 h-5" /></button>
              <div className="flex items-center gap-3 mb-6">
                 <div className="bg-red-500/10 p-3 rounded-2xl border border-red-500/20"><Target className="w-6 h-6 text-red-500" /></div>
                 <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-lg">Foco Semanal</h3>
              </div>
              <p className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-500 uppercase tracking-tight leading-tight">{data.weeklyFocus.priority_1 || 'DEFINE TU ROCA CENTRAL'}</p>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-4">La prioridad #1 que mueve la aguja</p>
            </div>

            <div className="widget-card !bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-[#0a0f1c] border border-indigo-200 dark:border-indigo-800/30 h-full flex flex-col justify-center shadow-lg">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-amber-400 mb-6 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Mandamiento del Día</p>
              <p className="text-xl sm:text-2xl italic font-medium leading-relaxed text-indigo-900 dark:text-slate-100 font-serif">"{settings.manifesto || 'La inacción no es neutral; es una elección activa por la mediocridad.'}"</p>
            </div>
          </div>
      </div>

      {/* Modals */}
      <Modal isOpen={isSacredModalOpen} onClose={() => setIsSacredModalOpen(false)} title="Horario Sagrado">
          <SacredBlockEditor initialBlocks={data.sacredBlocks} onSave={saveSacredBlocks} />
      </Modal>
      <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title="Nuevo Evento">
          <div className="space-y-5 p-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Título del evento</label>
                <input type="text" value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} placeholder="Ej. Deep Work, Reunión..." className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium border border-transparent dark:border-slate-700 font-sans" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Inicio</label>
                     <input type="time" value={newEvent.startTime} onChange={e => setNewEvent(p => ({ ...p, startTime: e.target.value }))} className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 border border-transparent dark:border-slate-700 font-medium" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Fin</label>
                     <input type="time" value={newEvent.endTime} onChange={e => setNewEvent(p => ({ ...p, endTime: e.target.value }))} className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 border border-transparent dark:border-slate-700 font-medium" />
                  </div>
              </div>
              <button onClick={addScheduleItem} className="w-full py-4 mt-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30">
                <CheckCircle2 className="w-5 h-5" /> AÑADIR AL HORARIO
              </button>
          </div>
      </Modal>
      <Modal isOpen={isFocusModalOpen} onClose={() => setIsFocusModalOpen(false)} title="Editar Foco">
          <textarea defaultValue={data.weeklyFocus.priority_1} id="f-in" className="w-full p-5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl text-slate-900 dark:text-red-400 outline-none h-40 uppercase font-black tracking-wide border border-transparent focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all resize-none" placeholder="DEFINE TU PRIORIDAD PRINCIPAL..." />
          <Button onClick={() => saveWeeklyFocus(document.getElementById('f-in').value)} className="w-full mt-5 py-4 bg-red-600 hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.3)]">GUARDAR FOCO</Button>
      </Modal>
      <Modal isOpen={isReadingModalOpen} onClose={() => setIsReadingModalOpen(false)} title="Lectura Actual">
        <div className="p-2 space-y-4">
           <input type="text" id="read-in" defaultValue={data.reading?.current_book} placeholder="Mi nuevo libro..." className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500" />
           <Button onClick={() => saveReading(document.getElementById('read-in').value)} className="w-full py-4 bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:bg-amber-600">GUARDAR LIBRO</Button>
        </div>
      </Modal>

      </div>
    </div>
  );
};

const SacredBlockEditor = ({ initialBlocks, onSave }) => {
    const [blocks, setBlocks] = useState(initialBlocks.length > 0 ? initialBlocks : [{ day: 'LUN-VIE', label: 'DEEP WORK', time: '05:00 - 08:30', color: 'blue' }]);
    const addBlock = () => setBlocks([...blocks, { day: 'DIA', label: 'NUEVA', time: '00:00', color: 'blue' }]);
    const removeBlock = (idx) => setBlocks(blocks.filter((_, i) => i !== idx));
    const update = (idx, field, val) => {
        const nb = [...blocks];
        nb[idx][field] = val;
        setBlocks(nb);
    };
    return (
        <div className="space-y-4">
            {blocks.map((b, idx) => (
                <div key={idx} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl relative border border-slate-200 dark:border-slate-700/50">
                    <button onClick={() => removeBlock(idx)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                    <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0 pr-8 sm:pr-0 mb-3">
                        <input type="text" value={b.day} onChange={e => update(idx, 'day', e.target.value.toUpperCase())} placeholder="LUN-VIE" className="w-full sm:w-24 p-3 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-black text-center border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none" />
                        <input type="text" value={b.label} onChange={e => update(idx, 'label', e.target.value)} placeholder="Ej. Trabajo Profundo" className="flex-1 p-3 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 font-medium" />
                    </div>
                    <div className="flex gap-3">
                       <input type="text" value={b.time} onChange={e => update(idx, 'time', e.target.value)} placeholder="06:00 - 09:00" className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500" />
                    </div>
                </div>
            ))}
            <button onClick={addBlock} className="w-full py-5 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-500 font-bold uppercase tracking-widest hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition-all">+ AÑADIR BLOQUE</button>
            <Button onClick={() => onSave(blocks)} className="w-full mt-4 py-4 bg-indigo-600 shadow-lg shadow-indigo-500/30">GUARDAR BLOQUES</Button>
        </div>
    );
};

export default DashboardTab;
"""

with codecs.open('src/components/Tabs/DashboardTab.jsx', 'w', 'utf-8') as f:
    f.write(header + new_bottom)
