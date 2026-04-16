import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Sparkles, Brain, Mic, Camera, Zap, HeartPulse, Focus, Target, Send, Bot, User, Loader2, CheckCircle2, Square, Play, RotateCcw } from 'lucide-react';
import { callGeminiAI, parseAIJSON } from '../../services/ai';
import confetti from 'canvas-confetti';

const LyaHubDashboard = ({ isOpen, onClose, user, actions, data }) => {
  const [activeTab, setActiveTab] = useState('kits'); 
  const [isClosing, setIsClosing] = useState(false);

  // --- Chat State ---
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Camera/Audit State ---
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [auditStatus, setAuditStatus] = useState('idle'); // idle, loading, success, fail
  const [auditFeedback, setAuditFeedback] = useState('');
  const [isStreamReady, setIsStreamReady] = useState(false);

  // --- Audio Journal State ---
  const MAX_RECORDING_SECONDS = 60; // Gemini audio limit
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef(null);
  const [voiceStatus, setVoiceStatus] = useState('idle'); // idle, recording, processing, result
  const [voiceResult, setVoiceResult] = useState(null); // { transcription, analysis, actionPlan }
  const [audioPlaybackUrl, setAudioPlaybackUrl] = useState(null);
  const audioPlayerRef = useRef(null);

  // Auto-start camera when tab switches to camera
  useEffect(() => {
    // Al cambiar de pestaña, nos aseguramos de apagar la cámara anterior
    if (activeTab !== 'camera') {
      stopCamera();
    }
  }, [activeTab]);

  const startCamera = async () => {
    console.log("🚀 INTENTANDO INICIAR CÁMARA...");
    setIsStreamReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      console.log("✅ PERMISO CONCEDIDO");
      
      // Forzamos el renderizado del elemento de video inmediatamente
      setIsCameraOn(true);

      // Delay de seguridad para que React monte el videoRef
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Error forzando play:", e));
          console.log("📺 STREAM ASIGNADO Y PLAY");
        } else {
          console.error("❌ ERROR: videoRef sigue siendo NULL tras 800ms");
        }
      }, 800);

      setCapturedImage(null);
      setAuditStatus('idle');

      // Verificador maestro con delay
      setTimeout(() => {
        const checker = setInterval(() => {
          if (videoRef.current && videoRef.current.videoWidth > 0) {
            console.log("✨ CÁMARA FLUYENDO");
            setIsStreamReady(true);
            clearInterval(checker);
          }
        }, 500);
        setTimeout(() => clearInterval(checker), 5000);
      }, 1200);

    } catch (err) {
      console.error("Camera access error:", err);
      setAuditFeedback("Error de acceso a cámara. Verifica los permisos de tu navegador.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  // --- Audio Journal Logic ---
  const stopRecordingCleanup = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    // ELIMINADO: audioChunksRef.current = []; <- Esto borra el audio antes de procesarlo
    setIsRecording(false);
    setRecordingDuration(0);
  }, []);

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all audio tracks
        stream.getTracks().forEach(t => t.stop());

        if (audioChunksRef.current.length === 0) return;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log(`📦 ARCHIVO FINAL CONSOLIDADO: ${audioBlob.size} bytes`);
        const playbackUrl = URL.createObjectURL(audioBlob);
        setAudioPlaybackUrl(playbackUrl);

        // Convert to base64 for Gemini
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result.split(',')[1];
          await analyzeVoiceJournal(base64Audio);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start(1000); // collect chunks every second
      setIsRecording(true);
      setVoiceStatus('recording');
      setVoiceResult(null);
      setRecordingDuration(0);

      // Timer for duration display + auto-stop at limit
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const next = prev + 1;
          if (next >= MAX_RECORDING_SECONDS) {
            // Auto-stop when reaching the limit
            stopVoiceRecording();
          }
          return next;
        });
      }, 1000);

    } catch (err) {
      console.error('Microphone access error:', err);
      setVoiceStatus('idle');
    }
  };

  const stopVoiceRecording = () => {
    stopRecordingCleanup();
    setVoiceStatus('processing');
  };

  const analyzeVoiceJournal = async (base64Audio) => {
    try {
      // Simplificamos el contexto para que Lya no se distraiga. Solo nombre y arquetipo actual.
      const payload = [
        `Analiza este desahogo de audio de ${user?.displayName || 'Arquitecto'}.`,
        "TU PRIORIDAD ES EL AUDIO. Ignora cualquier otro dato técnico si no hay audio claro.",
        "Si el audio está vacío o no se entiende, di 'No detecto audio claro' en la transcripción y pide repetirlo.",
        "Si hay audio: Haz coaching estratégico, NO resumas. Confronta, inspira y da 3 pasos de acción.",
        "IMPORTANTE: Pon tu frase más potente y motivadora al final en el campo 'coachInsight'.",
        "Responde en JSON: { \"transcription\": \"...\", \"stressLevel\": 1-10, \"emotions\": [\"Arquetipo1\", \"Arquetipo2\"], \"analysis\": \"...\", \"coachInsight\": \"...\", \"actionPlan\": [\"...\"] }",
        { inlineData: { data: base64Audio, mimeType: "audio/webm" } }
      ];

      const response = await actions.callAI(payload, "Eres Lya, coach de desahogo ejecutivo. Tu tono es directo, estratégico y profundamente humano.");

      let result = parseAIJSON(response);
      
      // Normalización inteligente si la IA devuelve llaves en español o estructuras anidadas
      const normalized = {
        transcription: result.transcription || result.transcripcion || (typeof response === 'string' ? response : 'Sin transcripción'),
        stressLevel: result.stressLevel || result.nivel_estres || result.analisis?.nivel_estres || 5,
        emotions: result.emotions || result.emociones || result.emociones_principales || result.analisis?.emociones_principales || [],
        analysis: result.analysis || result.analisis?.texto || result.analisis || 'Análisis no disponible',
        coachInsight: result.coachInsight || result.insight || 'Sigue construyendo.',
        actionPlan: result.actionPlan || result.plan_accion?.pasos || result.plan_accion || []
      };

      // Si el análisis sigue siendo un objeto, extraer el texto
      if (typeof normalized.analysis === 'object') {
        normalized.analysis = normalized.analysis.insight || normalized.analysis.texto || JSON.stringify(normalized.analysis);
      }

      setVoiceResult(normalized);
      setVoiceStatus('result');
      confetti({ 
        particleCount: 80, 
        spread: 60, 
        origin: { y: 0.7 }, 
        colors: ['#d946ef', '#f59e0b', '#6366f1'] 
      });
    } catch (err) {
      console.error('❌ ERROR AUDIO ANALYSIS:', err);
      setVoiceResult({
        transcription: 'Error de análisis.',
        stressLevel: 0,
        emotions: ['Error'],
        analysis: 'Lya no pudo procesar este audio. Asegúrate de que el micrófono esté funcionando y que no haya demasiado ruido de fondo.',
        actionPlan: ['Reintentar grabación', 'Verificar conexión a internet']
      });
      setVoiceStatus('result');
    }
  };

  const resetVoiceJournal = () => {
    if (audioPlaybackUrl) URL.revokeObjectURL(audioPlaybackUrl);
    setVoiceStatus('idle');
    setVoiceResult(null);
    setAudioPlaybackUrl(null);
    setRecordingDuration(0);
  };

  const handleClose = () => {
    stopCamera();
    stopRecordingCleanup();
    if (audioPlaybackUrl) URL.revokeObjectURL(audioPlaybackUrl);
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 400); 
  };

  if (!isOpen && !isClosing) return null;

  // --- Chat Logic ---
  const buildContext = () => {
    const parts = [];
    parts.push(`Racha: ${data?.streak || 0} días.`);
    if (data?.mode?.title) parts.push(`Modo activo: ${data.mode.title}.`);
    if (data?.weeklyFocus?.priority_1) parts.push(`Foco semanal: ${data.weeklyFocus.priority_1}.`);
    if (data?.energyLevel) parts.push(`Nivel de energía hoy: ${data.energyLevel}/10.`);
    return parts.join(' ');
  };

  const handleChatSend = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = { role: 'user', text: chatInput.trim() };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const context = buildContext();
      const systemPrompt = `Eres Lya, tu coach personal de alto rendimiento integrado en la app "Creador de Sistemas".
Contexto del dashboard del usuario: ${context}
Responde de forma concisa (2-4 oraciones), práctica y motivadora. Usa tono proactivo y 'dopaminérgico'.`;

      const chatHistory = messages.map(m => `${m.role === 'user' ? 'Usuario' : 'Lya'}: ${m.text}`).join('\n');
      const prompt = `${chatHistory ? chatHistory + '\n' : ''}Usuario: ${userMsg.text}`;

      const response = await actions.callAI(prompt, systemPrompt);
      const aiMsg = { role: 'ai', text: response || 'No pude procesar tu mensaje. Intenta de nuevo.' };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat AI error:', err);
      setMessages(prev => [...prev, { role: 'ai', text: 'Error de conexión con la IA.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- Audit Logic ---
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // DIAGNÓSTICO: Ver qué está pasando con el elemento video
    console.log(`DEBUG VIDEO: state=${video.readyState}, dims=${video.videoWidth}x${video.videoHeight}, paused=${video.paused}`);

    // Asegurar dimensiones (algunos navegadores tardan en reportar videoWidth)
    let width = video.videoWidth || video.clientWidth || 640;
    let height = video.videoHeight || video.clientHeight || 480;
    
    // Si el video no está listo, intentamos forzar el play antes de capturar
    if (video.readyState < 2) {
      video.play();
    }

    const MAX_DIM = 1024;
    // ... logic for scaling ...
    if (width > MAX_DIM || height > MAX_DIM) {
      if (width > height) {
        height = (height / width) * MAX_DIM;
        width = MAX_DIM;
      } else {
        width = (width / height) * MAX_DIM;
        height = MAX_DIM;
      }
    }

    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    // Pintamos un fondo gris oscuro preventivo para saber si el canvas funciona
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);
    
    console.log(`📸 Capturando snapshot: ${width}x${height}`);
    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/png');
    
    setCapturedImage(dataUrl);
    stopCamera();
    analyzeWorkspace(dataUrl);
  };

  const analyzeWorkspace = async (base64Image) => {
    setAuditStatus('loading');
    try {
      // Método infalible para limpiar base64
      const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
      
      console.log(`📦 Payload Final - CleanBase64 length: ${cleanBase64.length}`);
      
      const payload = [
         `Actúa como un Auditor implacable de productividad. Analiza esta imagen del espacio de trabajo del usuario. 
          ¿Está limpio y optimizado para la concentración, o hay desorden (tazas, basura, exceso de cosas)?
          Responde ESTRICTAMENTE en formato JSON: { "approved": boolean, "feedback": "tu mensaje directo e impactante" }`,
         { inlineData: { data: cleanBase64, mimeType: "image/png" } }
      ];
      
      const response = await actions.callAI(payload, "Eres Lya, la coach proactiva.", { responseMimeType: "application/json" });
      
      const result = parseAIJSON(response);
      
      if (!result.feedback) {
         setAuditFeedback(typeof response === 'string' ? response : "No se pudo procesar la respuesta.");
         setAuditStatus('fail');
      } else {
         setAuditFeedback(result.feedback);
         if (result.approved) {
            setAuditStatus('success');
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#f59e0b', '#6366f1', '#d946ef']
            });
         } else {
            setAuditStatus('fail');
         }
      }

    } catch (err) {
      console.error("Audit error", err);
      setAuditStatus('fail');
      setAuditFeedback('Hubo un error de conexión al auditar. Intenta nuevamente.');
    }
  };


  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 transition-all duration-500 ease-out ${isOpen && !isClosing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl transition-opacity duration-500" onClick={handleClose} />
      
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-fuchsia-600/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none" />

      {/* Main Container */}
      <div className={`relative w-full max-w-6xl h-full max-h-[90vh] flex flex-col bg-slate-900/60 border border-slate-700/50 rounded-[40px] shadow-2xl shadow-indigo-900/20 overflow-hidden backdrop-blur-xl transform-gpu transition-transform duration-500 ease-out ${isOpen && !isClosing ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-500 p-[2px] animate-spin-slow shadow-[0_0_20px_rgba(99,102,241,0.5)]">
              <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-indigo-300 to-fuchsia-300">
                Lya AI Hub
              </h2>
              <p className="text-slate-400 font-medium tracking-wide">Centro de Comando Proactivo</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white transition-all focus:ring-4 ring-indigo-500/20 hover:rotate-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-700/50 p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible custom-scrollbar">
             <NavButton active={activeTab === 'kits'} onClick={() => setActiveTab('kits')} icon={Zap} label="Growth Kits" />
             <NavButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={Brain} label="Brain Dump 2.0" />
             <NavButton active={activeTab === 'camera'} onClick={() => setActiveTab('camera')} icon={Camera} label="Workspace Audit" />
             <NavButton active={activeTab === 'voice'} onClick={() => setActiveTab('voice')} icon={Mic} label="Audio Journal" />
          </div>

          {/* Main Panel Area */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar relative">
            
            {/* --- KITS TAB --- */}
            {activeTab === 'kits' && (
              <div className="space-y-8 animate-fade-in pb-10">
                <div className="text-center mb-10">
                  <h3 className="text-4xl font-black text-white mb-3">¿Qué estado necesitas alcanzar?</h3>
                  <p className="text-slate-400 text-lg max-w-2xl mx-auto">Selecciona un protocolo para reconfigurar tu enfoque y energía. Lya te exigirá pruebas de tu compromiso.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <KitCard 
                    title="Protocolo Mañana" 
                    description="Verifica que tu entorno esté listo antes de desbloquear tus tareas métricas."
                    icon={Target}
                    color="from-emerald-500 to-teal-600"
                    glow="shadow-emerald-500/20"
                    onClick={() => setActiveTab('camera')}
                  />
                  <KitCard 
                    title="Anxiety's Off Switch" 
                    description="Desahogo mental purificado. Usa tu voz y deja que Lya organice tu caos."
                    icon={HeartPulse}
                    color="from-fuchsia-500 to-pink-600"
                    glow="shadow-fuchsia-500/20"
                    onClick={() => setActiveTab('voice')}
                  />
                  <KitCard 
                    title="Deep Focus 2 Hr" 
                    description="Activa tu zona de inmersión. Conversa con Lya para definir tu única meta."
                    icon={Focus}
                    color="from-indigo-500 to-blue-600"
                    glow="shadow-indigo-500/20"
                    onClick={() => setActiveTab('chat')}
                  />
                </div>
              </div>
            )}

            {/* --- CHAT TAB --- */}
            {activeTab === 'chat' && (
              <div className="h-full flex flex-col animate-fade-in relative z-10 w-full max-w-3xl mx-auto">
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4 custom-scrollbar">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 opacity-50">
                      <Brain className="w-16 h-16 text-indigo-400 mb-4 animate-pulse" />
                      <p className="text-lg text-slate-300 font-medium">Estoy conectada a tu Dashboard. ¿En qué trabajamos hoy?</p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'ai' && (
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                          <Bot className="w-5 h-5 text-indigo-400" />
                        </div>
                      )}
                      <div className={`max-w-[80%] px-5 py-3.5 rounded-3xl text-[15px] leading-relaxed shadow-lg ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-amber-500/20 to-orange-600/20 text-amber-100 border border-amber-500/30 rounded-br-sm'
                          : 'bg-slate-800/80 text-slate-200 border border-slate-700 rounded-bl-sm backdrop-blur-md'
                      }`}>
                        {msg.text}
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/30">
                          <User className="w-5 h-5 text-amber-400" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex gap-3 justify-start items-end">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                      </div>
                      <div className="px-5 py-3.5 rounded-3xl bg-slate-800/80 border border-slate-700 text-slate-400 text-sm rounded-bl-sm flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{animationDelay: '150ms'}}></span>
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{animationDelay: '300ms'}}></span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleChatSend} className="flex gap-3 p-2 bg-slate-800/50 border border-slate-700/50 rounded-full backdrop-blur-xl">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Inicia tu desahogo mental o haz una pregunta..."
                    className="flex-1 px-6 py-4 bg-transparent outline-none text-base text-white placeholder-slate-400"
                    autoFocus
                    disabled={isChatLoading}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isChatLoading}
                    className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg transition-all disabled:opacity-40 hover:scale-105 shrink-0"
                  >
                    <Send className="w-5 h-5 ml-1" />
                  </button>
                </form>
              </div>
            )}

            {/* --- VOICE TAB (Audio Journaling Engine) --- */}
            {activeTab === 'voice' && (
              <div className="h-full flex flex-col items-center animate-fade-in w-full max-w-2xl mx-auto py-6">

                {/* IDLE STATE: Prompt to record */}
                {voiceStatus === 'idle' && (
                  <div className="flex-1 flex flex-col justify-center items-center text-center">
                    <div
                      onClick={startVoiceRecording}
                      className="relative group cursor-pointer mb-10"
                    >
                      <div className="absolute inset-0 bg-fuchsia-500/30 rounded-full blur-xl group-hover:blur-2xl transition-all animate-pulse duration-1000" />
                      <div className="w-36 h-36 relative bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-full flex items-center justify-center shadow-2xl z-10 border border-fuchsia-400/50 group-hover:scale-110 transition-transform duration-300 active:scale-95">
                        <Mic className="w-14 h-14 text-white" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-white mb-4">Desahogo por Voz</h3>
                    <p className="text-lg text-slate-400 leading-relaxed max-w-md">Existen cosas que el teclado limita. Toca para grabar tus pensamientos crudos. Lya transcribirá y estructurará tus ideas en un plan de acción.</p>
                  </div>
                )}

                {/* RECORDING STATE: Live waveform + timer + stop button */}
                {voiceStatus === 'recording' && (
                  <div className="flex-1 flex flex-col justify-center items-center text-center">
                    <div className="relative mb-8">
                      {/* Animated recording rings */}
                      <div className="absolute inset-0 bg-fuchsia-500/20 rounded-full animate-ping" />
                      <div className="absolute inset-0 bg-fuchsia-500/10 rounded-full animate-pulse" />
                      <div className="w-36 h-36 relative bg-gradient-to-br from-rose-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl z-10 border-4 border-rose-400/60">
                        <Square className="w-12 h-12 text-white fill-white" />
                      </div>
                    </div>

                    <div className="text-4xl font-black text-white tabular-nums mb-1">
                      {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, '0')}
                      <span className="text-lg text-slate-400 font-medium"> / {MAX_RECORDING_SECONDS}s</span>
                    </div>
                    <p className="text-rose-300 font-bold uppercase tracking-widest text-sm mb-6 animate-pulse">Grabando...</p>

                    {/* Time limit progress bar */}
                    <div className="w-full max-w-xs mb-8">
                      <div className="h-2.5 bg-slate-700/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                            recordingDuration >= MAX_RECORDING_SECONDS * 0.85
                              ? 'bg-gradient-to-r from-red-500 to-red-600'
                              : recordingDuration >= MAX_RECORDING_SECONDS * 0.6
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                : 'bg-gradient-to-r from-fuchsia-500 to-pink-500'
                          }`}
                          style={{ width: `${Math.min((recordingDuration / MAX_RECORDING_SECONDS) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1.5">
                        <span className="text-[10px] text-slate-500 font-medium">0s</span>
                        <span className={`text-[10px] font-bold ${
                          recordingDuration >= MAX_RECORDING_SECONDS * 0.85 ? 'text-red-400' : 'text-slate-500'
                        }`}>
                          {MAX_RECORDING_SECONDS - recordingDuration > 0
                            ? `${MAX_RECORDING_SECONDS - recordingDuration}s restantes`
                            : 'Procesando...'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">{MAX_RECORDING_SECONDS}s</span>
                      </div>
                    </div>

                    <button
                      onClick={stopVoiceRecording}
                      className="px-10 py-4 bg-gradient-to-r from-rose-500 to-red-600 text-white font-black text-lg rounded-full shadow-2xl shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all"
                    >
                      Detener y Analizar
                    </button>
                  </div>
                )}

                {/* PROCESSING STATE: AI analysis in progress */}
                {voiceStatus === 'processing' && (
                  <div className="flex-1 flex flex-col justify-center items-center text-center">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-pink-600/20 border border-fuchsia-500/30 flex items-center justify-center mb-8 shadow-2xl">
                      <Loader2 className="w-12 h-12 text-fuchsia-400 animate-spin" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-3">Lya está escuchando...</h3>
                    <p className="text-fuchsia-300/80 text-lg animate-pulse">Transcribiendo y analizando tu desahogo</p>
                  </div>
                )}

                {/* RESULT STATE: Transcription + analysis + action plan */}
                {voiceStatus === 'result' && voiceResult && (
                  <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar w-full pb-6">
                    {/* Audio Playback */}
                    {audioPlaybackUrl && (
                      <div className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
                        <button
                          onClick={() => audioPlayerRef.current?.paused ? audioPlayerRef.current.play() : audioPlayerRef.current?.pause()}
                          className="w-12 h-12 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center shrink-0 hover:bg-fuchsia-500/30 transition-colors"
                        >
                          <Play className="w-5 h-5 text-fuchsia-400 ml-0.5" />
                        </button>
                        <audio ref={audioPlayerRef} src={audioPlaybackUrl} className="flex-1 h-10" controls />
                      </div>
                    )}

                    {/* Stress Level Indicator */}
                    <div className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-3xl">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nivel de estrés detectado</h4>
                        <span className={`text-3xl font-black ${voiceResult.stressLevel > 7 ? 'text-rose-400' : voiceResult.stressLevel > 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {voiceResult.stressLevel}/10
                        </span>
                      </div>
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            voiceResult.stressLevel > 7 ? 'bg-gradient-to-r from-rose-500 to-red-500' :
                            voiceResult.stressLevel > 4 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                            'bg-gradient-to-r from-emerald-500 to-teal-500'
                          }`}
                          style={{ width: `${voiceResult.stressLevel * 10}%` }}
                        />
                      </div>
                      {voiceResult.emotions?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {voiceResult.emotions.map((emotion, i) => (
                            <span key={i} className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] text-indigo-300 font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                              {emotion}
                            </span>
                          ))}
                        </div>
                      )}

                      {voiceResult.coachInsight && (
                        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-500/10 to-transparent border-l-2 border-indigo-500 italic text-indigo-100 text-sm">
                          "{voiceResult.coachInsight}"
                        </div>
                      )}
                    </div>

                    {/* Transcription */}
                    <div className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-3xl">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Transcripción</h4>
                      <p className="text-slate-200 leading-relaxed text-lg italic">"{voiceResult.transcription}"</p>
                    </div>

                    {/* Analysis */}
                    <div className="p-6 bg-gradient-to-br from-fuchsia-500/10 to-pink-600/10 border border-fuchsia-500/20 rounded-3xl">
                      <h4 className="text-sm font-bold text-fuchsia-400 uppercase tracking-widest mb-3">Análisis de Lya</h4>
                      <p className="text-slate-200 leading-relaxed text-lg">{voiceResult.analysis}</p>
                    </div>

                    {/* Action Plan */}
                    {voiceResult.actionPlan?.length > 0 && (
                      <div className="p-6 bg-slate-800/50 border border-emerald-500/20 rounded-3xl">
                        <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4">Plan de Acción</h4>
                        <div className="space-y-3">
                          {voiceResult.actionPlan.map((step, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-emerald-400 text-xs font-black">{i + 1}</span>
                              </div>
                              <p className="text-slate-200 leading-relaxed">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reset Button */}
                    <button
                      onClick={resetVoiceJournal}
                      className="w-full py-4 bg-slate-800/50 border border-slate-700/50 rounded-full text-slate-400 font-bold hover:bg-slate-700/50 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Nueva grabación
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* --- CAMERA AUDIT TAB --- */}
            {activeTab === 'camera' && (
              <div className="h-full flex flex-col animate-fade-in max-w-4xl mx-auto w-full">
                <div className="text-center mb-6">
                  <h3 className="text-3xl font-black text-white mb-2 flex items-center justify-center gap-3">
                    <Camera className="text-indigo-400"/> Workspace Audit
                  </h3>
                  <p className="text-slate-400">Verificación de entorno antes de la concentración profunda.</p>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center">
                  
                  {/* Camera View */}
                  {!isCameraOn && (
                    <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 rounded-3xl border-2 border-dashed border-indigo-500/20 w-full max-w-2xl aspect-video">
                      <Camera className="w-16 h-16 text-indigo-500/30 mb-4" />
                      <button 
                        onClick={startCamera}
                        className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-black tracking-widest uppercase shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
                      >
                        Activar Escáner de Entorno
                      </button>
                    </div>
                  )}

                  {isCameraOn && !capturedImage && auditStatus === 'idle' && (
                    <div className="relative w-full max-w-2xl rounded-3xl overflow-hidden border-2 border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.15)] bg-black/50 aspect-video group">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        muted 
                        playsInline 
                        onCanPlay={() => {
                          console.log("DEBUG: Cámara lista (canPlay)");
                          setIsStreamReady(true);
                        }}
                        onLoadedMetadata={(e) => {
                          console.log("DEBUG: Metadatos cargados", e.target.videoWidth, "x", e.target.videoHeight);
                          if (e.target.videoWidth > 0) setIsStreamReady(true);
                        }}
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 border-4 border-transparent group-hover:border-indigo-500/50 rounded-3xl transition-all" />
                      
                      {/* Reticle */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                         <div className="w-32 h-32 border border-white/20 rounded-xl flex items-center justify-center">
                           <Focus className="w-8 h-8 text-white/50" />
                         </div>
                      </div>

                      <button 
                        onClick={capturePhoto}
                        disabled={!isStreamReady}
                        className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-8 py-3 backdrop-blur-md rounded-full text-white font-bold tracking-widest uppercase border border-white/30 transition-all flex items-center gap-2 shadow-xl ${
                          isStreamReady 
                          ? 'bg-white/10 hover:bg-white/20 hover:scale-105' 
                          : 'bg-slate-800/50 cursor-not-allowed opacity-70'
                        }`}
                      >
                        {isStreamReady ? (
                          <><Camera className="w-5 h-5"/> Capturar</>
                        ) : (
                          <><Loader2 className="w-5 h-5 animate-spin"/> Iniciando...</>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Loading State */}
                  {auditStatus === 'loading' && capturedImage && (
                    <div className="relative w-full max-w-2xl aspect-video rounded-3xl overflow-hidden border-2 border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                      <img src={capturedImage} alt="Audit" className="w-full h-full object-cover opacity-50 grayscale blur-sm" />
                       <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
                          <p className="text-amber-300 font-bold text-lg tracking-widest uppercase animate-pulse">Lya está analizando el entorno...</p>
                       </div>
                    </div>
                  )}

                  {/* Result State */}
                  {(auditStatus === 'success' || auditStatus === 'fail') && capturedImage && (
                    <div className={`relative w-full max-w-2xl aspect-video rounded-3xl overflow-hidden border-2 shadow-2xl ${auditStatus === 'success' ? 'border-emerald-500 shadow-emerald-500/20' : 'border-rose-500 shadow-rose-500/20'}`}>
                      <img src={capturedImage} alt="Audit Result" className={`w-full h-full object-cover ${auditStatus === 'fail' ? 'grayscale opacity-70' : 'opacity-90'}`} />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent flex items-end p-8">
                        <div className="w-full bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
                           <div className="flex items-start gap-4">
                             {auditStatus === 'success' ? (
                               <CheckCircle2 className="w-10 h-10 text-emerald-400 shrink-0" />
                             ) : (
                               <X className="w-10 h-10 text-rose-400 shrink-0 bg-rose-500/20 rounded-full p-2" />
                             )}
                             <div>
                               <h4 className={`text-xl font-black uppercase mb-2 ${auditStatus === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                 {auditStatus === 'success' ? 'Auditoría Aprobada' : 'Auditoría Fallida'}
                               </h4>
                               <p className="text-slate-200 leading-relaxed text-lg">{auditFeedback}</p>
                             </div>
                           </div>
                           <div className="mt-6 flex gap-3 justify-end">
                             <button
                               onClick={startCamera}
                               className="px-6 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all"
                             >
                               Reintentar
                             </button>
                             {auditStatus === 'success' && (
                               <button
                                 onClick={() => setActiveTab('kits')}
                                 className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all shadow-lg shadow-emerald-500/30"
                               >
                                 Continuar al Dashboard
                               </button>
                             )}
                           </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, icon: Icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-5 py-4 min-w-[200px] shrink-0 md:w-full rounded-2xl font-bold transition-all ${
      active 
        ? 'bg-indigo-500/20 text-indigo-300 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)] border border-indigo-500/30' 
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
    }`}
  >
    <Icon className={`w-6 h-6 shrink-0 ${active ? 'text-indigo-400' : ''}`} />
    <span className="tracking-wide whitespace-nowrap">{label}</span>
  </button>
);

const KitCard = ({ title, description, icon: Icon, color, glow, onClick }) => (
  <button 
    onClick={onClick}
    className={`relative group p-8 rounded-[2rem] bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 text-left transition-all hover:-translate-y-2 hover:shadow-2xl ${glow}`}
  >
    <div className={`absolute inset-0 rounded-[2rem] bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity`} />
    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 shadow-lg`}>
      <Icon className="w-8 h-8 text-white" />
    </div>
    <h4 className="text-2xl font-black text-white mb-3 md:min-h-[64px]">{title}</h4>
    <p className="text-slate-400 leading-relaxed font-medium text-lg">{description}</p>
  </button>
);

export default LyaHubDashboard;
