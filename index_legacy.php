<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Architect 2026</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }

        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }

        /* Hide placeholder on focus */
        input:focus::placeholder,
        textarea:focus::placeholder {
            color: transparent;
            opacity: 0;
        }
    </style>
</head>

<body class="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">

    <!-- LOGIN OVERLAY -->
    <div id="login-overlay" class="fixed inset-0 bg-slate-900 z-[100] flex items-center justify-center">
        <div class="bg-white p-8 rounded-3xl max-w-sm w-full mx-4 text-center">
            <h1 class="text-2xl font-bold mb-2">Entrar al Sistema</h1>
            <p class="text-slate-500 mb-6 text-sm">Identifícate para acceder a tu arquitectura de vida.</p>
            <form id="login-form" class="space-y-5 text-left">
                <div id="login-error"
                    class="hidden bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 flex items-center gap-2 animate-pulse">
                    <i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i>
                    <span id="login-error-text">Error</span>
                </div>

                <div class="space-y-1">
                    <label for="login-email"
                        class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Correo
                        Electrónico</label>
                    <input type="email" id="login-email" placeholder="tu@email.com"
                        class="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                        required>
                </div>

                <div class="space-y-1">
                    <div class="flex justify-between items-center ml-1">
                        <label for="login-password"
                            class="text-xs font-bold text-slate-500 uppercase tracking-wider">Contraseña</label>
                    </div>
                    <div class="relative">
                        <input type="password" id="login-password" placeholder="Tu Contraseña Sécreta"
                            class="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition pr-12"
                            required>
                        <button type="button" onclick="app.togglePassword()"
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition"
                            tabindex="-1">
                            <i data-lucide="eye" id="eye-show" class="w-5 h-5"></i>
                            <i data-lucide="eye-off" id="eye-hide" class="w-5 h-5 hidden"></i>
                        </button>
                    </div>
                    <div class="flex justify-end pt-1">
                        <button type="button" onclick="app.showRecover()"
                            class="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline">
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>
                </div>

                <button type="submit" id="btn-login"
                    class="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 transform active:scale-95">
                    Ingresar
                </button>

            </form>
        </div>
    </div>

    <!-- MAIN APP (Hidden by default until login) -->
    <div id="app-container" class="hidden">

        <!-- HEADER -->
        <div class="bg-slate-900 text-white pt-10 pb-24 px-6 rounded-b-[3rem] shadow-2xl relative overflow-hidden">
            <div
                class="absolute top-0 left-0 w-full h-full opacity-5 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-400 via-slate-900 to-slate-900">
            </div>

            <div class="max-w-5xl mx-auto relative z-10">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <i data-lucide="shield" class="text-blue-400 w-6 h-6"></i>
                            <h1 class="text-3xl font-bold tracking-tight">ARQUITECTO DE SISTEMAS <span
                                    class="text-blue-400">2026</span></h1>
                        </div>
                        <p class="text-slate-400 text-sm max-w-md italic border-l-2 border-blue-500 pl-3">
                            "No dependas de la motivación fluctuante. Construye rutinas a prueba de fallos."
                        </p>
                    </div>

                    <button onclick="app.openManifesto()"
                        class="group flex flex-col items-center gap-1 bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/10 transition-all">
                        <i data-lucide="scroll-text"
                            class="text-yellow-400 w-5 h-5 group-hover:scale-110 transition-transform"></i>
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-300">Leer
                            Manifiesto</span>
                    </button>

                    <button onclick="app.logout()" class="text-xs text-slate-500 hover:text-white mt-2 self-start ml-4">
                        Salir
                    </button>
                </div>

                <!-- TABS -->
                <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar" id="tab-container">
                    <button onclick="app.switchTab('dashboard')"
                        class="tab-btn active flex items-center gap-2 px-5 py-3 rounded-xl transition-all font-bold whitespace-nowrap border bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50"
                        data-tab="dashboard">
                        <i data-lucide="activity" class="w-4 h-4"></i> Comando Central
                    </button>
                    <button onclick="app.switchTab('weekly')"
                        class="tab-btn flex items-center gap-2 px-5 py-3 rounded-xl transition-all font-bold whitespace-nowrap border bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                        data-tab="weekly">
                        <i data-lucide="clipboard-list" class="w-4 h-4"></i> Plan Semanal
                    </button>
                    <button onclick="app.switchTab('monthly')"
                        class="tab-btn flex items-center gap-2 px-5 py-3 rounded-xl transition-all font-bold whitespace-nowrap border bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                        data-tab="monthly">
                        <i data-lucide="target" class="w-4 h-4"></i> Visión Mensual
                    </button>
                    <button onclick="app.switchTab('systems')"
                        class="tab-btn flex items-center gap-2 px-5 py-3 rounded-xl transition-all font-bold whitespace-nowrap border bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                        data-tab="systems">
                        <i data-lucide="layout" class="w-4 h-4"></i> Mis Sistemas
                    </button>
                    <button onclick="app.switchTab('network')"
                        class="tab-btn flex items-center gap-2 px-5 py-3 rounded-xl transition-all font-bold whitespace-nowrap border bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                        data-tab="network">
                        <i data-lucide="users" class="w-4 h-4"></i> Tribu y Apoyo
                    </button>
                </div>
            </div>
        </div>

        <div class="max-w-5xl mx-auto px-4 -mt-16 relative z-10">

            <!-- DASHBOARD TAB -->
            <div id="tab-dashboard" class="tab-content space-y-6">
                <!-- Mode Switcher -->
                <!-- Status Bar (Streak + Mode) -->
                <div
                    class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div class="flex items-center gap-4 w-full md:w-auto">
                        <div
                            class="flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-full border border-orange-100">
                            <i data-lucide="flame" class="w-4 h-4 text-orange-600 fill-orange-600"></i>
                            <span class="font-bold text-sm" id="streak-display">Racha: 0 días</span>
                        </div>
                        <div class="hidden md:block text-sm text-slate-500">
                            Hoy: <span class="font-bold text-slate-700" id="current-date-display">...</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                        <div class="text-right">
                            <h3 class="font-bold text-slate-800 text-sm" id="mode-title">MODO EXPANSIÓN (CEO)</h3>
                            <p class="text-[10px] text-slate-500" id="mode-desc">Objetivo: Dominación total del día</p>
                        </div>
                        <div id="mode-icon-container" class="hidden"></div>
                        <!-- Hidden placeholder for JS logic compatibility if needed -->
                        <button onclick="app.togglePlanB()" id="btn-planb"
                            class="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border bg-red-50 text-red-600 border-red-200 hover:bg-red-100">
                            Activar Plan B
                        </button>
                    </div>
                </div>

                <!-- Dashboard Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Left Column (Habits) -->
                    <div class="md:col-span-2 space-y-6">
                        <!-- Morning Ritual -->
                        <div class="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-100">
                            <div
                                class="bg-gradient-to-r from-orange-400 to-amber-500 p-5 text-white flex justify-between items-center">
                                <h2 class="font-bold flex items-center gap-2"><i data-lucide="sun" class="w-5 h-5"></i>
                                    Mañana Tesla (3-6-9)</h2>
                                <span class="text-3xl font-bold opacity-90" id="progress-percent">0%</span>
                            </div>
                            <div class="p-5 space-y-1" id="habits-list">
                                <!-- Habits Injected via JS -->
                            </div>
                        </div>

                        <!-- Evening Ritual -->
                        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2"><i data-lucide="moon"
                                    class="text-indigo-500 w-5 h-5"></i> Cierre del Día</h3>
                            <div class="grid grid-cols-2 gap-4" id="habits-evening">
                                <!-- Evening Habits Injected via JS -->
                            </div>
                        </div>
                    </div>

                    <!-- Right Column (Sidebar) -->
                    <div class="space-y-4">
                        <!-- Manifesto Reminder -->
                        <div class="bg-slate-800 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                            <i data-lucide="quote" class="absolute top-4 right-4 text-white/10 w-10 h-10"></i>
                            <p class="text-xs text-blue-300 font-bold uppercase tracking-wider mb-2">Recordatorio del
                                Manifiesto</p>
                            <p class="font-serif italic text-lg leading-relaxed">"La inacción no es neutral; es una
                                elección activa por la mediocridad."</p>
                        </div>

                        <!-- Sacred Blocks -->
                        <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                            <h3 class="font-bold text-slate-700 mb-3 flex items-center gap-2"><i data-lucide="anchor"
                                    class="w-4 h-4"></i> Bloques Sagrados</h3>
                            <div class="space-y-3">
                                <div class="flex items-center gap-3 p-3 bg-sky-50 rounded-xl border border-sky-100">
                                    <div class="bg-sky-200 p-2 rounded-lg text-sky-700 font-bold text-xs">JUE</div>
                                    <div>
                                        <p class="font-bold text-sky-900 text-sm">Ministerio</p>
                                        <p class="text-xs text-sky-600">08:00 PM</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3 p-3 bg-sky-50 rounded-xl border border-sky-100">
                                    <div class="bg-sky-200 p-2 rounded-lg text-sky-700 font-bold text-xs">DOM</div>
                                    <div>
                                        <p class="font-bold text-sky-900 text-sm">Estudio Atalaya</p>
                                        <p class="text-xs text-sky-600">10:00 AM - 12:00 PM</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- WEEKLY TAB -->
            <div id="tab-weekly" class="tab-content hidden space-y-6">
                <!-- Content injected by JS -->
            </div>

            <!-- MONTHLY TAB -->
            <div id="tab-monthly" class="tab-content hidden space-y-6">
                <!-- Content injected by JS -->
            </div>

            <!-- NETWORK TAB -->
            <div id="tab-network" class="tab-content hidden space-y-6">
                <!-- Content injected by JS -->
            </div>

            <!-- SYSTEMS TAB -->
            <div id="tab-systems" class="tab-content hidden space-y-6">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-2xl font-bold text-slate-800">Biblioteca de Sistemas</h2>
                        <p class="text-slate-500">Tus protocolos para Familia, Iglesia y Negocio.</p>
                    </div>
                    <button onclick="app.openSystemModal()"
                        class="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                        <i data-lucide="plus" class="w-4 h-4"></i> Crear Nuevo
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="systems-grid">
                    <!-- Systems Injected via JS -->
                </div>
            </div>

        </div>
    </div>

    <!-- MANIFESTO MODAL -->
    <div id="manifesto-modal"
        class="fixed inset-0 bg-slate-900 z-[200] overflow-y-auto hidden animate-in fade-in duration-300">
        <div class="max-w-3xl mx-auto min-h-screen bg-white shadow-2xl relative">
            <div class="sticky top-0 bg-slate-900 text-white p-4 flex justify-between items-center z-10 shadow-lg">
                <h2 class="font-bold tracking-widest text-sm uppercase text-yellow-500">Manifiesto del Éxito 2026</h2>
                <button onclick="app.closeManifesto()"
                    class="bg-white/10 hover:bg-white/20 p-2 rounded-full transition"><i data-lucide="x"
                        class="w-5 h-5"></i></button>
            </div>

            <div class="p-8 md:p-12 space-y-12 font-serif text-lg leading-relaxed text-slate-800">
                <section class="text-center border-b pb-10">
                    <h1 class="text-4xl md:text-5xl font-bold text-slate-900 mb-6">UN COMPROMISO CON LA CONVICCIÓN</h1>
                    <p class="italic text-xl text-slate-600">"El éxito no es un accidente. Es el resultado deliberado de
                        despertar un poder interior."</p>
                </section>

                <section>
                    <h3 class="text-2xl font-bold text-blue-900 mb-4 font-sans flex items-center gap-3">
                        <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm">PARTE I</span> La Mente es
                        la Arquitecta
                    </h3>
                    <p class="mb-4">Rechazo el pensamiento limitado. Abandono para siempre la frase "no puede ser".</p>
                </section>

                <section>
                    <h3 class="text-2xl font-bold text-red-900 mb-4 font-sans flex items-center gap-3">
                        <span class="bg-red-100 text-red-800 px-3 py-1 rounded-lg text-sm">PARTE II</span> La Acción es
                        mi Mandato
                    </h3>
                    <p class="mb-4">La inacción es una traición al potencial. Las ideas sin ejecución son alucinaciones.
                    </p>
                </section>

                <section>
                    <h3 class="text-2xl font-bold text-green-900 mb-4 font-sans flex items-center gap-3">
                        <span class="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm">PARTE III</span> Vender
                        es Servir
                    </h3>
                    <p class="mb-4">Redefino la venta. No es manipular, es resolver problemas. <strong>Ayudar
                            vende.</strong></p>
                </section>
            </div>
        </div>
    </div>

    <div id="wizard-modal"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div class="bg-slate-900 p-6 flex justify-between items-center text-white">
                <h3 class="font-bold">Diseñar Nuevo Sistema</h3>
                <button onclick="app.closeSystemModal()"><i data-lucide="x"
                        class="w-6 h-6 text-white/50 hover:text-white"></i></button>
            </div>
            <div class="p-6 overflow-y-auto flex-1 space-y-4">
                <div>
                    <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Área</label>
                    <select id="sys-area" class="w-full p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <option>Personal</option>
                        <option>Familia</option>
                        <option>Espiritual</option>
                        <option>Negocio</option>
                    </select>
                </div>
                <div>
                    <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Meta</label>
                    <div class="flex gap-2">
                        <input id="sys-goal" class="w-full p-3 bg-slate-50 rounded-xl border border-slate-200"
                            placeholder="Ej. Mejorar inglés">
                        <button onclick="app.generateAI()"
                            class="bg-purple-600 text-white px-4 rounded-xl font-bold text-xs whitespace-nowrap"
                            id="btn-ai">
                            <i data-lucide="sparkles" class="w-4 h-4 mb-1 mx-auto"></i> IA
                        </button>
                    </div>
                </div>
                <div id="ai-result-area" class="space-y-3">
                    <input id="sys-title" class="w-full p-3 border rounded-xl" placeholder="Título del Sistema">
                    <input id="sys-identity" class="w-full p-3 border rounded-xl" placeholder="Identidad (Soy...)">
                    <input id="sys-action" class="w-full p-3 border rounded-xl" placeholder="Acción">
                    <input id="sys-trigger" class="w-full p-3 border rounded-xl" placeholder="Gatillo">
                    <input id="sys-environment" class="w-full p-3 border rounded-xl" placeholder="Entorno">
                    <input id="sys-planb" class="w-full p-3 border rounded-xl" placeholder="Plan B">
                </div>
                <button onclick="app.saveSystem()"
                    class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Guardar Sistema</button>
            </div>
        </div>
    </div>

    <!-- RECOVERY MODAL -->
    <div id="recover-modal"
        class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 relative">
            <button onclick="app.closeRecover()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <i data-lucide="x" class="w-5 h-5"></i>
            </button>
            <div class="text-center mb-6">
                <div class="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i data-lucide="key-round" class="text-blue-600 w-6 h-6"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-800">Recuperar Acceso</h3>
                <p class="text-sm text-slate-500">Te enviaremos las instrucciones de restablecimiento.</p>
            </div>

            <form id="recover-form" class="space-y-4">
                <input type="email" id="recover-email" placeholder="tu@email.com"
                    class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required>
                <div id="recover-feedback" class="hidden text-sm p-3 rounded-xl text-center"></div>
                <button type="submit" id="btn-recover"
                    class="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition">
                    Enviar Link
                </button>
            </form>
        </div>
    </div>

    <!-- CANDIDATE MODAL (New) -->
    <div id="candidate-modal"
        class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 relative">
            <button onclick="document.getElementById('candidate-modal').classList.add('hidden')"
                class="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <i data-lucide="x" class="w-5 h-5"></i>
            </button>
            <div class="text-center mb-6">
                <div class="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i data-lucide="user-plus" class="text-blue-600 w-6 h-6"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-800">Añadir Candidato</h3>
                <p class="text-sm text-slate-500">Expande tu tribu estratégica.</p>
            </div>

            <form id="candidate-form" class="space-y-4">
                <input type="text" id="candidate-name" placeholder="Nombre completo"
                    class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required>
                <input type="text" id="candidate-role" placeholder="Rol (Ej. Emprendedor)" value="Emprendedor"
                    class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required>
                <div id="candidate-feedback" class="hidden text-sm p-3 rounded-xl text-center"></div>
                <button type="submit" id="btn-save-candidate"
                    class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">
                    Guardar Candidato
                </button>
            </form>
        </div>
    </div>

    <script src="assets/js/app.js?v=<?php echo time(); ?>"></script>
    <script>
        lucide.createIcons();
    </script>
</body>

</html>