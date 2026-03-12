const app = {
    userId: null,
    db: null,

    // State Caches
    weeklyData: {},
    monthlyData: {},
    networkData: [],
    habitsData: {},
    nightHabitsData: {},
    systemsData: [],
    stats: { streak: 0, last_perfect_date: null, history: [] },
    englishData: null,
    sacredBlocksData: [], // [NEW feature]
    readingData: null, // [NEW feature] Reading block
    currentWeekOffset: 0,
    focusInterval: null,
    focusTimeLeft: 90 * 60,
    brownNoise: null,
    isPlanB: false,

    // Config
    settings: {
        ai_model: 'gemini-2.5-flash',
        api_key: '',
        user_name: '',
        company_name: 'Mi Empresa',
        theme: 'light'
    },

    // Placeholder Configuration
    placeholders: {
        priority_1: [
            "Ej. Cerrar presupuesto Obra X...",
            "Ej. Finalizar presupuesto Casa Vilamoura",
            "Ej. Terminar la propuesta comercial para Cliente Z",
            "Ej. Definir estructura del nuevo sistema de ventas",
            "Ej. Resolver el bloqueo técnico en el servidor",
            "Ej. Escribir el manifiesto de la nueva marca",
            "Ej. Auditar los flujos de caja del Q1",
            "Ej. Crear la presentación para la ronda de inversión",
            "Ej. Diseñar la arquitectura del módulo de IA",
            "Ej. Negociar contrato con proveedor crítico"
        ],
        brain_dump: [
            "Escribe aquí todo lo que tienes en la cabeza...",
            "Ideas sueltas, pendientes rápidos, ruidos mentales...",
            "¿Qué te está quitando la paz? Vacíalo aquí.",
            "Tareas pequeñas, recordatorios, llamadas por hacer...",
            "No filtres, solo escribe. Luego organizamos.",
            "Recordatorios de fechas importantes."
        ]
    },

    // Configuración de Hábitos Nocturnos
    nightHabitsConfig: [
        {
            key: 'plan_tomorrow',
            label: 'Planificación',
            description: 'Agenda de mañana lista',
            planBLabel: 'Planificación Express',
            planBDescription: 'Anotar 1 prioridad única',
            icon: 'clipboard-check',
            color: 'blue'
        },
        {
            key: 'green_juice_prep',
            label: 'Jugo Verde',
            description: 'Preparado noche anterior',
            planBLabel: 'Hidratación',
            planBDescription: 'Vaso de agua grande',
            icon: 'leaf',
            color: 'green'
        },
        {
            key: 'screen_limit',
            label: 'Desconexión',
            description: 'Límite TV / Pantallas',
            planBLabel: 'Modo Avión',
            planBDescription: 'Alejar móvil de la cama',
            icon: 'monitor-off',
            color: 'purple'
        },
        {
            key: 'environment_prep',
            label: 'Entorno Listo',
            description: 'Ropa y maletín listos',
            planBLabel: 'Ropa Lista',
            planBDescription: 'Solo ropa para mañana',
            icon: 'briefcase',
            color: 'amber'
        },
        {
            key: 'gratitude',
            label: 'Gratitud',
            description: '3 cosas por las que agradecer',
            planBLabel: 'Gratitud Simple',
            planBDescription: '1 cosa buena de hoy',
            icon: 'heart',
            color: 'rose'
        },
        {
            key: 'reflection',
            label: 'Reflexión',
            description: 'Revisar victorias del día',
            planBLabel: 'Victoria Flash',
            planBDescription: 'Recordar 1 logro',
            icon: 'book-open',
            color: 'teal'
        }
    ],

    getSmartPlaceholder: (key) => {
        const list = app.placeholders[key] || app.placeholders.priority_1;
        const randomIndex = Math.floor(Math.random() * list.length);
        return list[randomIndex];
    },

    // =========================================================================
    // UTILS: TOAST NOTIFICATIONS
    // =========================================================================
    toast: (message, type = 'info') => {
        const container = document.getElementById('toast-container');
        if (!container) return alert(message); // Fallback

        const toastEl = document.createElement('div');
        toastEl.className = `toast toast-${type}`;

        const icons = {
            success: 'check-circle',
            error: 'alert-circle',
            warning: 'alert-triangle',
            info: 'info'
        };

        toastEl.innerHTML = `
            <i data-lucide="${icons[type]}" class="w-5 h-5 flex-shrink-0"></i>
            <span>${message}</span>
        `;

        container.appendChild(toastEl);
        lucide.createIcons();

        // Animate in
        requestAnimationFrame(() => {
            toastEl.classList.add('show');
        });

        // Remove after 3s
        setTimeout(() => {
            toastEl.classList.remove('show');
            setTimeout(() => {
                toastEl.remove();
            }, 300);
        }, 4000);
    },

    showModal: (title, content) => {
        document.getElementById('generic-modal-title').innerText = title;
        document.getElementById('generic-modal-content').innerHTML = content;
        document.getElementById('generic-modal').classList.remove('hidden');
    },

    // =========================================================================
    // INITIALIZATION & AUTH
    // =========================================================================
    init: () => {
        // Inicializar tema ANTES de todo (evita flash de contenido)
        app.initTheme();

        // Auth Listener
        firebase.auth().onAuthStateChanged(async (user) => {
            const loading = document.getElementById('app-loading');
            try {
                if (user) {
                    console.log('User logged in:', user.email);
                    app.userId = user.uid;
                    app.db = firebase.firestore();

                    // Init User Data if needed
                    await app.loadSettings();
                    await app.loadDailyMantra();

                    // MASTER ADMIN CHECK (Restored)
                    if (user.email === 'tecnomania73@gmail.com') {
                        app.isMaster = true;
                        const adminBtn = document.getElementById('tab-btn-admin');
                        if (adminBtn) adminBtn.classList.remove('hidden');
                        app.toast('Bienvenido Maestro. Panel de Control Activo.', 'info');
                    } else {
                        app.isMaster = false;

                        // [REAL-TIME ENFORCEMENT & AUTO-REPAIR]
                        app.db.collection('users').doc(user.uid).onSnapshot((doc) => {
                            if (doc.exists) {
                                const data = doc.data();
                                app.userData = { ...app.userData, ...data }; // Sync local state
                                app.checkSubscriptionStatus(); // Run check immediately
                            } else {
                                // [AUTO-REPAIR] Doc missing but Auth exists -> Fix it!
                                console.warn("User doc missing in Firestore. Requesting auto-repair...");
                                app.repairUser(user);
                            }
                        });

                        // Initial check handled by snapshot
                    }

                    // Update UI with Basic Info
                    const emailDisplay = document.getElementById('config-email-display');
                    if (emailDisplay) emailDisplay.innerText = user.email;

                    if (!app.settings.user_name) app.settings.user_name = user.displayName || 'Arquitecto';
                    const nameDisplay = document.getElementById('user-name-display'); // This might not exist in profile section? It acts as global
                    // Note: 'user-name-display' not found in my grep search earlier?

                    app.showApp();
                } else {
                    console.log('User not logged in');
                    app.userId = null;
                    document.getElementById('login-overlay').classList.remove('hidden');
                    document.getElementById('app-container').classList.add('hidden');
                }
            } catch (error) {
                console.error("Init Error:", error);
                app.toast("Error de inicio: " + error.message, "error");
            } finally {
                if (loading) loading.classList.add('hidden');
            }
        });

        // Initialize Lucide icons
        lucide.createIcons();

        // Bind Forms
        document.getElementById('login-form').addEventListener('submit', app.handleLogin);
        document.getElementById('register-form').addEventListener('submit', app.handleRegister);
    },

    // [AUTO-REPAIR] Fix missing Firestore documents for existing Auth users
    repairUser: async (user) => {
        try {
            console.log(`[REPAIR] Restoring data for ${user.email}...`);
            await app.db.collection('users').doc(user.uid).set({
                user_name: user.displayName || 'Usuario Recuperado',
                email: user.email,
                role: 'user',
                subscription_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 Days Trial
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Create default subcollections just in case
            const batch = app.db.batch();
            const userRef = app.db.collection('users').doc(user.uid);
            batch.set(userRef.collection('settings').doc('global'), {
                user_name: user.displayName || 'Usuario Recuperado',
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            batch.set(userRef.collection('weekly').doc('current'), { created: true });
            await batch.commit();

            app.toast("Perfil sincronizado automáticamente.", "success");
        } catch (e) {
            console.error("Auto-Repair Failed:", e);
            app.toast("Error sincronizando perfil: " + e.message, "error");
        }
    },

    showLoginTab: (tab) => {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const loginBtn = document.getElementById('tab-login-btn');
        const registerBtn = document.getElementById('tab-register-btn');

        if (tab === 'login') {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            loginBtn.classList.replace('bg-slate-100', 'bg-slate-900');
            loginBtn.classList.replace('text-slate-600', 'text-white');
            loginBtn.classList.remove('hover:bg-slate-200');
            registerBtn.classList.replace('bg-slate-900', 'bg-slate-100');
            registerBtn.classList.replace('text-white', 'text-slate-600');
            registerBtn.classList.add('hover:bg-slate-200');
        } else {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            registerBtn.classList.replace('bg-slate-100', 'bg-slate-900');
            registerBtn.classList.replace('text-slate-600', 'text-white');
            registerBtn.classList.remove('hover:bg-slate-200');
            loginBtn.classList.replace('bg-slate-900', 'bg-slate-100');
            loginBtn.classList.replace('text-white', 'text-slate-600');
            loginBtn.classList.add('hover:bg-slate-200');
        }
    },

    handleLogin: async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('btn-login');
        const errorBox = document.getElementById('auth-error');

        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Cargando...';
        errorBox.classList.add('hidden');
        lucide.createIcons();

        try {
            await firebase.auth().signInWithEmailAndPassword(email, password);
            // onAuthStateChanged handled the rest
        } catch (error) {
            console.error(error);
            document.getElementById('auth-error-text').innerText = app.mapAuthError(error.code);
            errorBox.classList.remove('hidden');
            btn.disabled = false;
            btn.innerHTML = 'Ingresar';
        }
    },

    handleRegister: async (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const name = document.getElementById('register-name').value;
        const btn = document.getElementById('btn-register');
        const errorBox = document.getElementById('register-error');

        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Creando...';
        errorBox.classList.add('hidden');
        lucide.createIcons();

        try {
            const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
            await result.user.updateProfile({ displayName: name });

            // Initialize User Data Structure in Firestore
            const batch = app.db.batch();
            const userRef = app.db.collection('users').doc(result.user.uid);

            // [FIX] Write Metadata to Root Doc for Admin Visibility
            batch.set(userRef, {
                user_name: name,
                email: email,
                role: 'user',
                subscription_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 Days Trial Default
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Keep existing subcollection structure for compatibility
            batch.set(userRef.collection('settings').doc('global'), {
                user_name: name,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            batch.set(userRef.collection('weekly').doc('current'), { created: true });

            await batch.commit();
            // onAuthStateChanged handles routing

        } catch (error) {
            console.error("Registration Error:", error);
            document.getElementById('register-error-text').innerText = app.mapAuthError(error.code || error.message);
            errorBox.classList.remove('hidden');
        } finally {
            // ALWAYS reset the button, even on success (though auth state change might redirect first)
            // If success, the page might reload/redirect, but if not, we must unfreeze.
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'Crear Cuenta';
            }
        }
    },

    mapAuthError: (code) => {
        switch (code) {
            case 'auth/invalid-email': return 'El correo no es válido.';
            case 'auth/user-disabled': return 'Usuario deshabilitado.';
            case 'auth/user-not-found': return 'Usuario no encontrado. ¿Te registraste?';
            case 'auth/wrong-password': return 'Contraseña incorrecta.';
            case 'auth/invalid-credential': return 'Credenciales incorrectas (Correo o contraseña).';
            case 'auth/email-already-in-use': return 'Este correo ya está registrado.';
            case 'auth/weak-password': return 'La contraseña es muy débil (mín 6 caracteres).';
            case 'auth/too-many-requests': return 'Muchos intentos fallidos. Intenta más tarde.';
            default: return 'Error: ' + code;
        }
    },

    sendPasswordReset: async () => {
        const email = document.getElementById('login-email').value.trim();

        if (!email) {
            return app.toast("Por favor, escribe tu correo en el campo antes de resetear.", "warning");
        }

        try {
            await firebase.auth().sendPasswordResetEmail(email);
            app.toast(`Correo enviado a ${email}. Revisa tu Spam.`, "success");
        } catch (e) {
            console.error(e);
            let msg = "Error al enviar correo.";
            if (e.code === 'auth/user-not-found') msg = "No existe cuenta con este correo.";
            if (e.code === 'auth/invalid-email') msg = "El correo no es válido.";
            app.toast(msg, "error");
        }
    },

    logout: async () => {
        try {
            await firebase.auth().signOut();
            // HARD RELOAD: Critical for security to clear all JS state
            window.location.reload();
        } catch (e) {
            console.error("Logout Error:", e);
            window.location.reload(); // Reload anyway to be safe
        }
    },

    togglePasswordVisibility: (id) => {
        const input = document.getElementById(id);
        input.type = input.type === 'password' ? 'text' : 'password';
    },

    // =========================================================================
    // FEATURE: TEMA CLARO/OSCURO
    // =========================================================================

    initTheme: () => {
        // Verificar preferencia guardada en localStorage primero (más rápido)
        const savedTheme = localStorage.getItem('theme');

        if (savedTheme) {
            app.applyTheme(savedTheme);
        } else {
            // Verificar preferencia del sistema
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            app.applyTheme(prefersDark ? 'dark' : 'light');
        }

        // Escuchar cambios en la preferencia del sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                app.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    },

    applyTheme: (theme) => {
        // Manejar tema automático
        if (theme === 'auto') {
            localStorage.removeItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            theme = prefersDark ? 'dark' : 'light';
        }

        const html = document.documentElement;

        if (theme === 'dark') {
            html.classList.add('dark');
            document.body.classList.add('dark');
        } else {
            html.classList.remove('dark');
            document.body.classList.remove('dark');
        }

        // Actualizar iconos del toggle
        app.updateThemeToggleIcon(theme);

        // Guardar en localStorage para carga rápida
        localStorage.setItem('theme', theme);

        // Actualizar variable interna
        app.settings.theme = theme;

        // Actualizar botones de selección de tema en configuración
        app.updateThemeButtons(theme);
    },

    toggleTheme: () => {
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        app.applyTheme(newTheme);

        // Guardar en Firebase si hay usuario logueado
        if (app.userId && app.db) {
            app.db.collection('users').doc(app.userId)
                .collection('settings').doc('global')
                .set({ theme: newTheme }, { merge: true })
                .catch(e => console.warn('No se pudo guardar preferencia de tema:', e));
        }
    },

    updateThemeToggleIcon: (theme) => {
        const sunIcons = document.querySelectorAll('.dark-hidden');
        const moonIcons = document.querySelectorAll('.dark-visible');

        sunIcons.forEach(icon => {
            icon.style.display = theme === 'dark' ? 'none' : 'block';
        });

        moonIcons.forEach(icon => {
            icon.style.display = theme === 'dark' ? 'block' : 'none';
        });
    },

    setAutoTheme: () => {
        localStorage.removeItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        app.applyTheme(prefersDark ? 'dark' : 'light');
    },

    updateThemeButtons: (theme) => {
        const lightBtn = document.getElementById('theme-light-btn');
        const darkBtn = document.getElementById('theme-dark-btn');
        const autoBtn = document.getElementById('theme-auto-btn');

        [lightBtn, darkBtn, autoBtn].forEach(btn => {
            if (btn) {
                btn.classList.remove('border-blue-500', 'bg-blue-50');
                btn.classList.add('border-slate-200');
            }
        });

        const activeBtn = theme === 'dark' ? darkBtn : lightBtn; // Simple logic, assumes auto results in one or other
        // If theme is strictly 'auto', we might want to highlight 'auto' button?
        // But applyTheme resolves auto to 'dark' or 'light' for the variable passed to this function usually?
        // Let's check applyTheme: it DOES resolve to 'dark' or 'light' locally, but sets settings.theme to resolved value?
        // No, wait. 
        // In applyTheme: `if (theme === 'auto') { ... theme = resolves ... }`.
        // So `updateThemeButtons` receives resolved theme.
        // But if user clicks Auto, we want Auto button highlighed.
        // My implementation of `applyTheme` overwrites `theme` variable.
        // And `updateThemeButtons` uses that resolved variable.
        // So 'Auto' button will never be active visually if I follow that logic blindly.
        // Let's look at the stored value.

        // Correction: Let's check localStorage.
        const stored = localStorage.getItem('theme');
        if (!stored) {
            if (autoBtn) {
                autoBtn.classList.remove('border-slate-200');
                autoBtn.classList.add('border-blue-500', 'bg-blue-50');
                if (darkBtn) darkBtn.classList.remove('border-blue-500', 'bg-blue-50'); // Ensure others are off
                if (lightBtn) lightBtn.classList.remove('border-blue-500', 'bg-blue-50');
            }
            return;
        }

        const active = theme === 'dark' ? darkBtn : lightBtn;
        if (active) {
            active.classList.remove('border-slate-200');
            active.classList.add('border-blue-500', 'bg-blue-50');
        }
    },

    // =========================================================================
    // DAILY MANTRA (IA + FIRESTORE CACHE)
    // =========================================================================
    loadDailyMantra: async () => {
        if (!app.userId) return;
        const container = document.getElementById('daily-mantra-container');
        const textElement = document.getElementById('daily-mantra-text');
        const headerSubtitle = document.getElementById('header-mantra-subtitle'); // Opcional: sincronizar con el header
        
        console.log("[MANTRA] Iniciando carga...", { container: !!container, textElement: !!textElement });
        if (!container || !textElement) return;

        try {
            const today = new Date().toISOString().split('T')[0];
            
            // 1. Intentar leer de global (daily_content/mantras/days/{today})
            let mantra = null;
            
            // Note: firestore-compat uses collection().doc()
            const globalRef = app.db.collection('daily_content').doc('mantras').collection('days').doc(today);
            const globalDoc = await globalRef.get();

            if (globalDoc.exists) {
                mantra = globalDoc.data().text;
                console.log("[MANTRA] Cargado desde Global");
            } else {
                // 2. Intentar leer de cache personal (users/{userId}/daily_cache/{today})
                const userCacheRef = app.db.collection('users').doc(app.userId).collection('daily_cache').doc(today);
                const userCacheDoc = await userCacheRef.get();

                if (userCacheDoc.exists) {
                    mantra = userCacheDoc.data().text;
                    console.log("[MANTRA] Cargado desde Cache de Usuario");
                }
            }

            // 3. Si no existe en ningún lado (o es Master y queremos regenerar/actualizar global)
            if (!mantra) {
                console.log("[MANTRA] Generando nuevo mantra con IA...");
                const prompt = "Actúa como un mentor estoico y sabio. Genera un mantra diario corto (máximo 12 palabras) para un hombre de fe y liderazgo. Enfocado en disciplina, presencia o propósito. Devuelve ÚNICAMENTE el texto, sin comillas, sin puntos finales y sin explicaciones.";
                
                const response = await app.callGeminiAI(prompt);
                mantra = response.trim().replace(/^"|"$/g, ''); // Limpiar comillas si las hay

                // 4. Guardar en Firestore para evitar re-consumo
                const mantraData = {
                    text: mantra,
                    generated_at: firebase.firestore.FieldValue.serverTimestamp(),
                    date: today
                };

                // Guardar en cache de usuario (siempre permitido)
                await app.db.collection('users').doc(app.userId).collection('daily_cache').doc(today).set(mantraData);

                // Si es Master, guardar también en Global para todos
                if (app.isMaster) {
                    try {
                        await globalRef.set(mantraData);
                        console.log("[MANTRA] Guardado en Global (Master power)");
                    } catch (e) {
                        console.warn("[MANTRA] No se pudo guardar en Global (¿permisos?):", e);
                    }
                }
            }

            // 5. Inyectar en el UI
            if (mantra) {
                console.log("[MANTRA] Aplicando al UI:", mantra);
                textElement.innerText = mantra; 
                
                // También actualizar el subtítulo del header si existe para consistencia total
                if (headerSubtitle) headerSubtitle.innerText = `"${mantra}"`;
                
                container.classList.remove('hidden');
                container.style.display = 'block'; // Forzar visibilidad por si acaso
                lucide.createIcons();
            }

        } catch (error) {
            console.error("Error cargando mantra diario:", error);
            // Silencioso para no romper la experiencia de usuario
            container.classList.add('hidden');
        }
    },

    showApp: () => {
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');

        // Actualizar nombre de usuario en el header
        const nameDisplay = document.getElementById('user-name-display');
        if (nameDisplay) {
            nameDisplay.innerText = app.settings.user_name || 'Arquitecto';
        }

        // Actualizar avatar con iniciales
        const avatarEl = document.getElementById('user-avatar');
        if (avatarEl && app.settings.user_name) {
            const initials = app.settings.user_name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
            avatarEl.innerText = initials;
        }

        // Load Dashboard Data
        app.loadHabits();
        app.loadNightHabits();
        app.loadWeekly();
        app.loadEnglishWord(); // Load English Widget
        app.loadStats();
        app.loadSacredBlocks(); // [NEW]
        app.loadReading(); // [NEW] Reading Block
        app.loadDailyMantra(); // Actualizar mantra al mostrar
        app.renderSettings();
        app.updateDateDisplay(); // Show initial date
        lucide.createIcons();
    },

    // Recover Modal
    showRecover: () => document.getElementById('recover-modal').classList.remove('hidden'),
    closeRecover: () => document.getElementById('recover-modal').classList.add('hidden'),

    // =========================================================================
    // NAVIGATION
    // =========================================================================
    switchTab: (tabName) => {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));

        // Show selected tab
        const targetTab = document.getElementById('tab-' + tabName);
        if (targetTab) targetTab.classList.remove('hidden');

        // Update tab button styles
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('bg-blue-600', 'border-blue-500', 'text-white', 'shadow-lg', 'shadow-blue-900/50');
            btn.classList.add('bg-slate-800/50', 'border-slate-700', 'text-slate-400');
        });

        const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
        if (activeBtn) {
            activeBtn.classList.remove('bg-slate-800/50', 'border-slate-700', 'text-slate-400');
            activeBtn.classList.add('bg-blue-600', 'border-blue-500', 'text-white', 'shadow-lg', 'shadow-blue-900/50');

            // AUTO-SCROLL: Asegurar que el tab activo sea visible en móvil
            activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }

        // Load tab-specific data
        if (tabName === 'weekly') app.loadWeekly();
        if (tabName === 'monthly') app.loadMonthly();
        if (tabName === 'systems') app.loadSystems();
        if (tabName === 'network') app.loadNetwork();
        if (tabName === 'settings') app.renderSettings();
        if (tabName === 'admin') app.loadAdminUsers(); // [FIX] Auto-load Admin Data
    },

    // =========================================================================
    // SETTINGS & AI API
    // =========================================================================
    loadSettings: async () => {
        if (!app.userId) return;
        try {
            console.log("Cargando configuración...");
            // Timeout de 4 segundos para evitar bloqueo
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout obteniendo settings")), 4000));

            const docPromise = app.db.collection('users').doc(app.userId).collection('settings').doc('global').get();

            const doc = await Promise.race([docPromise, timeout]);

            if (doc.exists) {
                app.settings = { ...app.settings, ...doc.data() };
                console.log("Configuración cargada.");

                // Aplicar tema guardado si existe, si no, usa default o auto
                if (app.settings.theme) {
                    app.applyTheme(app.settings.theme);
                }
            }
        } catch (e) {
            console.warn("No se pudo cargar configuración (usando defaults):", e.message);
        }
    },

    renderSettings: () => {
        document.getElementById('config-ai-model').value = app.settings.ai_model || 'gemini-1.5-flash';
        document.getElementById('config-api-key').value = app.settings.api_key || '';
        document.getElementById('config-user-name').value = app.settings.user_name || '';
        document.getElementById('config-company-name').value = app.settings.company_name || '';
        document.getElementById('config-english-level').value = app.settings.english_level || 'C1';

        const statusEl = document.getElementById('api-connection-status');
        if (app.settings.api_key) {
            statusEl.innerHTML = '<span class="text-green-500 flex items-center gap-2 text-xs font-bold"><i data-lucide="check-circle" class="w-3 h-3"></i> Conectado</span>';
        } else {
            statusEl.innerHTML = '<span class="text-slate-400 flex items-center gap-2 text-xs"><i data-lucide="circle" class="w-3 h-3"></i> Sin configurar</span>';
        }
        lucide.createIcons();
    },

    saveSettings: async () => {
        const newSettings = {
            ai_model: document.getElementById('config-ai-model').value,
            api_key: document.getElementById('config-api-key').value,
            user_name: document.getElementById('config-user-name').value,
            company_name: document.getElementById('config-company-name').value,
            english_level: document.getElementById('config-english-level').value
        };

        // CORREGIDO: Usar getElementById con el nuevo ID del botón
        const btn = document.getElementById('btn-save-settings');
        if (!btn) {
            console.error('Botón de guardar no encontrado');
            app.toast('Error interno: Botón no encontrado', 'error');
            return;
        }

        const originalText = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Guardando...';
        btn.disabled = true;
        lucide.createIcons();

        try {
            await app.db.collection('users').doc(app.userId).collection('settings').doc('global').set(newSettings, { merge: true });
            app.settings = { ...app.settings, ...newSettings };

            // Update UI globally
            const nameDisplay = document.getElementById('user-name-display');
            if (nameDisplay) nameDisplay.innerText = app.settings.user_name;

            // Actualizar avatar con nuevas iniciales
            const avatarEl = document.getElementById('user-avatar');
            if (avatarEl && app.settings.user_name) {
                const initials = app.settings.user_name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);
                avatarEl.innerText = initials;
            }

            app.renderSettings();

            // Mostrar confirmación visual
            btn.innerHTML = '<i data-lucide="check" class="w-5 h-5"></i> ¡Guardado!';
            btn.classList.remove('bg-blue-600');
            btn.classList.add('bg-green-600');
            lucide.createIcons();

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('bg-green-600');
                btn.classList.add('bg-blue-600');
                btn.disabled = false;
                lucide.createIcons();
            }, 2000);

        } catch (e) {
            app.toast("Error al guardar: " + e.message, "error");
            btn.innerHTML = originalText;
            btn.disabled = false;
            lucide.createIcons();
        }
    },


    // =========================================================================
    // SACRED BLOCKS LOGIC
    // =========================================================================

    loadSacredBlocks: async () => {
        if (!app.userId) return;
        try {
            const doc = await app.db.collection('users').doc(app.userId).collection('settings').doc('sacred_blocks').get();
            if (doc.exists) {
                app.sacredBlocksData = doc.data().blocks || [];
            } else {
                // Generar defaults si no existen
                app.sacredBlocksData = [
                    { day: 'JUE', label: 'Ministerio', time: '08:00 PM', color: 'cyan' },
                    { day: 'DOM', label: 'Estudio Atalaya', time: '10:00 AM - 12:00 PM', color: 'blue' }
                ];
                await app.saveSacredBlocks();
            }
            app.renderSacredBlocks();
        } catch (e) {
            console.error("Error loading sacred blocks:", e);
        }
    },

    saveSacredBlocks: async () => {
        try {
            await app.db.collection('users').doc(app.userId).collection('settings').doc('sacred_blocks').set({
                blocks: app.sacredBlocksData
            });
            app.renderSacredBlocks();
        } catch (e) { console.error("Error saving blocks:", e); }
    },

    renderSacredBlocks: () => {
        const container = document.getElementById('sacred-blocks-list');
        if (!container) return; // Might not exist yet in HTML modification step

        let html = '';
        app.sacredBlocksData.forEach((block, index) => {
            html += `
              <div class="flex items-center gap-3 p-3 bg-${block.color}-50 rounded-xl border border-${block.color}-100">
                <span class="bg-${block.color}-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">${block.day}</span>
                <div class="flex-1">
                  <p class="font-bold text-slate-700 text-sm">${block.label}</p>
                  <p class="text-xs text-slate-500">${block.time}</p>
                </div>
              </div>
            `;
        });
        container.innerHTML = html;
    },

    openSacredBlockEditor: () => {
        let formHtml = '<div class="space-y-4">';
        app.sacredBlocksData.forEach((block, idx) => {
            formHtml += `
                <div class="p-3 border rounded-xl bg-slate-50">
                    <div class="flex gap-2 mb-2">
                        <input type="text" id="sb-day-${idx}" value="${block.day}" class="w-16 p-2 rounded text-xs font-bold uppercase border">
                        <input type="text" id="sb-label-${idx}" value="${block.label}" class="flex-1 p-2 rounded text-sm font-bold border" placeholder="Nombre">
                    </div>
                    <div class="flex gap-2">
                        <input type="text" id="sb-time-${idx}" value="${block.time}" class="flex-1 p-2 rounded text-xs border" placeholder="Hora">
                        <select id="sb-color-${idx}" class="p-2 rounded text-xs border">
                            <option value="cyan" ${block.color === 'cyan' ? 'selected' : ''}>Cyan</option>
                            <option value="blue" ${block.color === 'blue' ? 'selected' : ''}>Blue</option>
                            <option value="purple" ${block.color === 'purple' ? 'selected' : ''}>Purple</option>
                            <option value="red" ${block.color === 'red' ? 'selected' : ''}>Red</option>
                        </select>
                    </div>
                </div>
            `;
        });
        formHtml += `<button onclick="app.addSacredBlock()" class="w-full py-2 bg-slate-200 rounded-lg text-xs font-bold mt-2">+ Añadir Bloque</button>`;
        formHtml += `
            <div class="flex gap-2 mt-4">
                <button onclick="document.getElementById('generic-modal').classList.add('hidden')" class="flex-1 py-3 text-slate-500">Cancelar</button>
                <button onclick="app.saveSacredBlocksFromForm()" class="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Guardar Cambios</button>
            </div>
        </div>`;

        document.getElementById('generic-modal-title').innerText = "Editar Bloques Sagrados";
        const content = document.getElementById('generic-modal-content');
        content.innerHTML = formHtml;
        document.getElementById('generic-modal').classList.remove('hidden');

        // Hide standard close button of generic modal
        const defaultBtn = content.nextElementSibling;
        if (defaultBtn) defaultBtn.classList.add('hidden');
    },

    addSacredBlock: () => {
        app.saveSacredBlocksLocalState();
        app.sacredBlocksData.push({ day: 'NUEVO', label: 'Nueva Actividad', time: '00:00', color: 'blue' });
        app.openSacredBlockEditor();
    },

    saveSacredBlocksLocalState: () => {
        app.sacredBlocksData = app.sacredBlocksData.map((_, idx) => {
            const day = document.getElementById(`sb-day-${idx}`)?.value || 'N/A';
            const label = document.getElementById(`sb-label-${idx}`)?.value || 'Sin nombre';
            const time = document.getElementById(`sb-time-${idx}`)?.value || '00:00';
            const color = document.getElementById(`sb-color-${idx}`)?.value || 'blue';
            return { day, label, time, color };
        });
    },

    saveSacredBlocksFromForm: async () => {
        app.saveSacredBlocksLocalState();
        await app.saveSacredBlocks();
        app.toast("Bloques Sagrados actualizados", "success");
        document.getElementById('generic-modal').classList.add('hidden');

        const content = document.getElementById('generic-modal-content');
        const defaultBtn = content.nextElementSibling;
        if (defaultBtn) defaultBtn.classList.remove('hidden');
    },

    // =========================================================================
    // READING BLOCK LOGIC [NEW]
    // =========================================================================

    loadReading: async () => {
        if (!app.userId) return;
        try {
            const doc = await app.db.collection('users').doc(app.userId).collection('settings').doc('reading').get();
            if (doc.exists) {
                app.readingData = doc.data();
            } else {
                app.readingData = { current_book: "Ningún libro seleccionado", last_read_date: null }; // Default
            }
            app.renderReading();
        } catch (e) {
            console.error("Error loading reading:", e);
        }
    },

    renderReading: () => {
        const container = document.getElementById('reading-block-content');
        if (!container) return;

        const isReadToday = app.readingData.last_read_date === new Date().toISOString().split('T')[0];
        const statusColor = isReadToday ? 'green' : 'slate';
        const statusText = isReadToday ? '¡Leído hoy!' : 'Leer 1 página';
        const statusIcon = isReadToday ? 'check-circle-2' : 'circle';
        const titleColor = isReadToday ? 'text-slate-800 line-through opacity-50' : 'text-slate-800';

        container.innerHTML = `
            <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Leyendo actualmente</p>
                <p class="font-bold ${titleColor} text-lg mb-3 truncate">${app.readingData.current_book}</p>
                
                <button onclick="app.toggleReadingToday()" 
                    class="w-full flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all
                    ${isReadToday ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}">
                    <i data-lucide="${statusIcon}" class="w-4 h-4"></i>
                    ${statusText}
                </button>
            </div>
        `;
        lucide.createIcons();
    },

    toggleReadingToday: () => {
        const today = new Date().toISOString().split('T')[0];
        if (app.readingData.last_read_date === today) {
            app.readingData.last_read_date = null; // Undo
        } else {
            app.readingData.last_read_date = today;
            app.toast("¡Excelente! Lectura registrada.", "success");
        }
        app.saveReading();
        app.renderReading();
    },

    openReadingEditor: () => {
        app.showModal('Actualizar Lectura', `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-bold text-slate-600 mb-1">Título del Libro</label>
                    <input type="text" id="reading-book-input" value="${app.readingData.current_book}" 
                        class="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="Ej. Hábitos Atómicos">
                </div>
                <button onclick="app.saveReadingFromModal()" class="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800">
                    Guardar Libro
                </button>
            </div>
        `);
    },

    saveReadingFromModal: () => {
        const title = document.getElementById('reading-book-input').value.trim();
        if (title) {
            app.readingData.current_book = title;
            app.saveReading();
            document.getElementById('generic-modal').classList.add('hidden');
            app.toast("Libro actualizado", "success");
        }
    },

    saveReading: async () => {
        if (!app.userId) return;
        try {
            await app.db.collection('users').doc(app.userId).collection('settings').doc('reading').set(app.readingData);
        } catch (e) {
            console.error("Error saving reading:", e);
        }
    },

    // =========================================================================
    // FEATURE: WEEKLY FOCUS QUICK EDIT
    // =========================================================================

    openWeeklyFocusEditor: () => {
        const current = document.getElementById('dashboard-priority-1').innerText;
        // Use Modal instead of Prompt for better UX
        const html = `
            <div class="space-y-4">
                <p class="text-sm text-slate-500">Define tu objetivo principal para esta semana.</p>
                <input type="text" id="weekly-focus-input" value="${current === 'Cargando...' ? '' : current}" 
                    class="w-full p-3 border rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="Ej. Terminar Proyecto X">
                <div class="flex gap-2">
                    <button onclick="document.getElementById('generic-modal').classList.add('hidden')" class="flex-1 py-3 text-slate-500 font-bold">Cancelar</button>
                    <button onclick="app.saveWeeklyFocusFromModal()" class="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200">Guardar</button>
                </div>
            </div>
        `;

        // Hide standard close button of generic modal
        const content = document.getElementById('generic-modal-content');
        const defaultBtn = content.nextElementSibling;
        if (defaultBtn) defaultBtn.classList.add('hidden');

        app.showModal('Editar Foco Semanal', html);
    },

    saveWeeklyFocusFromModal: () => {
        const newVal = document.getElementById('weekly-focus-input').value;
        if (newVal !== null && newVal.trim() !== '') {
            document.getElementById('dashboard-priority-1').innerText = newVal;
            app.weeklyData.priority_1 = newVal;
            app.db.collection('users').doc(app.userId).collection('weekly').doc('current').set({ priority_1: newVal }, { merge: true });
            app.toast("Foco Semanal actualizado", "success");
        }
        document.getElementById('generic-modal').classList.add('hidden');
        // Restore default button
        const content = document.getElementById('generic-modal-content');
        const defaultBtn = content.nextElementSibling;
        if (defaultBtn) defaultBtn.classList.remove('hidden');
    },

    // Nueva función helper para actualizar el estado de la API
    updateApiStatus: (hasKey) => {
        const statusEl = document.getElementById('api-connection-status');
        if (!statusEl) return;

        if (hasKey) {
            statusEl.innerHTML = '<span class="text-green-500 flex items-center gap-2 text-xs font-bold"><i data-lucide="check-circle" class="w-3 h-3"></i> Conectado</span>';
        } else {
            statusEl.innerHTML = '<span class="text-slate-400 flex items-center gap-2 text-xs"><i data-lucide="circle" class="w-3 h-3"></i> Sin configurar</span>';
        }
        lucide.createIcons();
    },

    testApiKey: async () => {
        const key = document.getElementById('config-api-key').value;
        const resultDiv = document.getElementById('api-test-result');
        if (!key) return app.toast("Ingresa una API Key", "warning");

        resultDiv.className = 'mt-2 text-sm p-3 rounded-lg bg-slate-100 flex items-center gap-2';
        resultDiv.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin text-slate-500"></i> Probando conexión...';
        resultDiv.classList.remove('hidden');
        lucide.createIcons();

        try {
            // Simple call to Gemini to list models or generate dummy content
            const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.models) {
                resultDiv.className = 'mt-2 text-sm p-3 rounded-lg bg-green-50 text-green-700 border border-green-200';
                resultDiv.innerText = "¡Conexión Exitosa! API Key válida.";
            } else if (data.error) {
                throw new Error(data.error.message);
            }
        } catch (e) {
            resultDiv.className = 'mt-2 text-sm p-3 rounded-lg bg-red-50 text-red-700 border border-red-200';
            resultDiv.innerText = "Error: " + e.message;
        }
    },

    // HELPER: Parse and clean robustly JSON from AI
    parseAIJSON: (text) => {
        try {
            // 1. Extraer bloque JSON
            const firstBrace = text.indexOf('{');
            const lastBrace = text.lastIndexOf('}');
            const firstBracket = text.indexOf('[');
            const lastBracket = text.lastIndexOf(']');

            let start = -1;
            let end = -1;

            // Determinar si es un objeto o un array buscando el primer símbolo
            if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
                start = firstBrace;
                end = lastBrace;
            } else if (firstBracket !== -1) {
                start = firstBracket;
                end = lastBracket;
            }

            if (start === -1 || end === -1) throw new Error("La IA no devolvió un formato JSON válido.");

            let cleanText = text.substring(start, end + 1);

            // 2. Limpieza de errores comunes de la IA
            cleanText = cleanText
                .replace(/\/\/.*$/gm, '') // Quitar comentarios
                .replace(/,\s*([}\]])/g, '$1') // Quitar comas finales
                .replace(/[\n\r]/g, ' ') // Quitar saltos de línea para evitar errores de string
                .trim();

            // 3. Intento de parseo
            try {
                return JSON.parse(cleanText);
            } catch (e1) {
                console.warn("JSON.parse básico falló, intentando reparación...", e1);
                // Intento reparación: Asegurar comillas en claves
                const repaired = cleanText.replace(/([{,]\s*)([a-zA-Z0-9_]+?)\s*:/g, '$1"$2":');
                return JSON.parse(repaired);
            }
        } catch (e) {
            console.error("Error crítico parseando JSON de IA:", e, text);
            throw e;
        }
    },


    // GLOBAL AI CALL HELPER - ACTUALIZADO
    callGeminiAI: async (prompt, systemInstruction = "Eres un asistente experto en productividad y relaciones.") => {
        if (!app.settings.api_key) {
            throw new Error("Configura tu API Key de Gemini en la pestaña Configuración.");
        }

        // Usar modelo actualizado (gemini-2.5-flash es el recomendado en 2026)
        const model = app.settings.ai_model || 'gemini-2.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${app.settings.api_key}`;

        const payload = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }]
                }
            ],
            systemInstruction: {
                parts: [{ text: systemInstruction }]
            },
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024
            }
        };

        console.log('🤖 Llamando a Gemini API:', model);

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            // Manejar errores del API
            if (data.error) {
                console.error('❌ Error de Gemini API:', data.error);
                throw new Error(data.error.message || 'Error desconocido del API');
            }

            // Verificar respuesta válida
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                console.error('❌ Respuesta inválida:', data);
                throw new Error('Respuesta vacía del modelo. Intenta de nuevo.');
            }

            const responseText = data.candidates[0].content.parts[0].text;
            console.log('✅ Respuesta recibida');

            return responseText;

        } catch (fetchError) {
            console.error('❌ Error de fetch:', fetchError);

            // Mensajes de error más amigables
            if (fetchError.message.includes('API key')) {
                throw new Error('API Key inválida. Verifica tu clave en Google AI Studio.');
            }
            if (fetchError.message.includes('quota')) {
                throw new Error('Límite de cuota excedido. Espera un momento.');
            }
            if (fetchError.message.includes('model')) {
                throw new Error(`Modelo "${model}" no disponible. Ve a Configuración y selecciona otro modelo.`);
            }
            if (fetchError.message.includes('fetch')) {
                throw new Error('Error de conexión. Verifica tu internet y que la API Key sea válida.');
            }

            throw fetchError;
        }
    },

    listModels: async () => {
        if (!app.settings.api_key) return app.toast("Configura la API Key primero", "warning");

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${app.settings.api_key}`);
            const data = await response.json();

            if (data.models) {
                const names = data.models.map(m => m.name.replace('models/', '')).join('\n');
                app.showModal("Modelos Disponibles", names);
                console.log(data.models);
            } else {
                app.toast("No se pudieron listar los modelos", "error");
                console.error(data);
            }
        } catch (e) {
            app.toast("Error listando modelos: " + e.message, "error");
        }
    },

    // =========================================================================
    // FEATURE: DASHBOARD & HABITS
    // =========================================================================
    togglePlanB: () => {
        app.isPlanB = !app.isPlanB;
        console.log("Plan B Toggled:", app.isPlanB);

        // Visual feedback on button
        const btn = document.getElementById('btn-planb');
        if (btn) {
            if (app.isPlanB) {
                btn.classList.replace('bg-red-50', 'bg-red-600');
                btn.classList.replace('text-red-600', 'text-white');
                btn.innerText = 'Desactivar Plan B';
                app.toast('Plan B activado: Modo supervivencia', 'warning');
            } else {
                btn.classList.replace('bg-red-600', 'bg-red-50');
                btn.classList.replace('text-white', 'text-red-600');
                btn.innerText = 'Activar Plan B';
                app.toast('Plan B desactivado: Volviendo a la excelencia', 'success');
            }
        }

        // Definitive Re-render
        if (typeof app.renderHabits === 'function') app.renderHabits();
        if (typeof app.renderNightHabits === 'function') app.renderNightHabits();

        console.log("Re-rendered all habits for Plan B state:", app.isPlanB);
    },

    loadHabits: async () => {
        if (!app.userId) return;
        // Real-time listener for habits
        app.db.collection('users').doc(app.userId).collection('habits').doc(new Date().toISOString().split('T')[0])
            .onSnapshot((doc) => {
                app.habitsData = doc.exists ? doc.data() : { movement: 0, meditation: 0, reflection: 0, greenJuice: 0, tvLimit: 0, planTomorrow: 0, environmentPrep: 0 };
                app.renderHabits();
                app.calculateHabitProgress();
                app.checkPerfectDay(); // Check if day is perfect
            });

        // Also load Priority 1 for Dashboard from Weekly
        const weeklyDoc = await app.db.collection('users').doc(app.userId).collection('weekly').doc('current').get();
        if (weeklyDoc.exists) {
            document.getElementById('dashboard-priority-1').innerText = weeklyDoc.data().priority_1 || 'Sin definir';
        }
    },

    renderHabits: () => {
        // ... (Reusing existing render logic adapted for `app.habitsData`)
        const container = document.getElementById('habits-list');
        if (!container) return;
        container.innerHTML = '';

        const habitDefinition = [
            { key: 'movement', label: app.isPlanB ? 'Movim. Rápido' : 'Movimiento', sub: app.isPlanB ? '5min Flexiones/Estirar' : 'Tesla 3: 15min ejercicio', color: 'orange', icon: 'zap' },
            { key: 'meditation', label: app.isPlanB ? 'Respiración' : 'Meditación', sub: app.isPlanB ? '3 Reps Profundas' : 'Tesla 6: 10min silencio', color: 'blue', icon: 'moon' },
            { key: 'reflection', label: app.isPlanB ? 'Lectura Flash' : 'Reflexión', sub: app.isPlanB ? 'Leer 1 Párrafo' : 'Tesla 9: Lectura/Diario', color: 'purple', icon: 'book' },
            { key: 'planTomorrow', label: app.isPlanB ? 'Plan Express' : 'Planificación', sub: app.isPlanB ? 'Top 3 Prioridades' : 'Agenda de mañana lista', color: 'emerald', icon: 'check-circle' }
        ];

        habitDefinition.forEach(h => {
            const isDone = app.habitsData[h.key] === 1;
            const html = `
                <div onclick="app.toggleHabit('${h.key}', ${!isDone})" class="cursor-pointer p-4 rounded-2xl border transition-all ${isDone ? `bg-${h.color}-50 border-${h.color}-200` : 'bg-slate-50 border-slate-100 hover:border-slate-200'}">
                    <div class="flex justify-between items-start mb-2">
                        <div class="p-2 rounded-lg ${isDone ? `bg-${h.color}-100 text-${h.color}-600` : 'bg-white text-slate-400'}">
                            <i data-lucide="${h.icon}" class="w-5 h-5"></i>
                        </div>
                        ${isDone ? `<i data-lucide="check" class="w-5 h-5 text-${h.color}-600"></i>` : ''}
                    </div>
                    <p class="font-bold text-slate-700 text-sm">${h.label}</p>
                    <p class="text-xs text-slate-400 mt-1">${h.sub}</p>
                </div>
            `;
            container.innerHTML += html;
        });
        lucide.createIcons();
    },

    toggleHabit: async (key, value) => {
        const today = new Date().toISOString().split('T')[0];

        // Optimistic UI Update
        app.habitsData[key] = value ? 1 : 0;
        app.renderHabits();
        app.calculateHabitProgress(); // Update progress immediately
        app.checkPerfectDay(); // Check completion

        await app.db.collection('users').doc(app.userId).collection('habits').doc(today).set({
            [key]: value ? 1 : 0
        }, { merge: true });
    },

    // =========================================================================
    // FEATURE: HÁBITOS NOCTURNOS (CIERRE DE ALTO RENDIMIENTO)
    // =========================================================================

    loadNightHabits: async () => {
        if (!app.userId) return;

        const today = new Date().toISOString().split('T')[0];

        // Real-time listener para hábitos nocturnos
        app.db.collection('users').doc(app.userId)
            .collection('night_habits').doc(today)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    app.nightHabitsData = doc.data();
                } else {
                    // Inicializar con todos los hábitos en 0
                    app.nightHabitsData = {};
                    app.nightHabitsConfig.forEach(h => {
                        app.nightHabitsData[h.key] = 0;
                    });
                }
                app.renderNightHabits();
                app.checkPerfectDay(); // Check completion
            }, (error) => {
                console.error("Error loading night habits:", error);
                app.nightHabitsData = {};
                app.nightHabitsConfig.forEach(h => {
                    app.nightHabitsData[h.key] = 0;
                });
                app.renderNightHabits();
            });
    },

    renderNightHabits: () => {
        const container = document.getElementById('night-habits-grid');
        if (!container) return;

        const colorClasses = {
            blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', activeBg: 'bg-blue-100', activeBorder: 'border-blue-400' },
            green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', activeBg: 'bg-green-100', activeBorder: 'border-green-400' },
            purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', activeBg: 'bg-purple-100', activeBorder: 'border-purple-400' },
            amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', activeBg: 'bg-amber-100', activeBorder: 'border-amber-400' },
            rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600', activeBg: 'bg-rose-100', activeBorder: 'border-rose-400' },
            teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-600', activeBg: 'bg-teal-100', activeBorder: 'border-teal-400' }
        };

        container.innerHTML = app.nightHabitsConfig.map(habit => {
            const isCompleted = app.nightHabitsData[habit.key] === 1;
            const colors = colorClasses[habit.color] || colorClasses.blue;

            return `
                <button onclick="app.toggleNightHabit('${habit.key}')"
                    class="relative flex items-start gap-3 p-4 rounded-2xl border-2 transition-all duration-300 text-left group
                    ${isCompleted
                    ? `${colors.activeBg} ${colors.activeBorder} shadow-sm`
                    : `bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm`
                }">
                    
                    <!-- Icono -->
                    <div class="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all
                        ${isCompleted ? colors.bg : 'bg-slate-100'}">
                        <i data-lucide="${habit.icon}" class="w-5 h-5 ${isCompleted ? colors.text : 'text-slate-400'}"></i>
                    </div>
                    
                    <!-- Texto -->
                    <div class="flex-1 min-w-0">
                        <p class="font-bold text-sm ${isCompleted ? 'text-slate-800' : 'text-slate-700'}">${app.isPlanB ? (habit.planBLabel || habit.label) : habit.label}</p>
                        <p class="text-xs ${isCompleted ? 'text-slate-600' : 'text-slate-400'} truncate">${app.isPlanB ? (habit.planBDescription || habit.description) : habit.description}</p>
                    </div>
                    
                    <!-- Checkbox visual -->
                    <div class="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                        ${isCompleted
                    ? `${colors.activeBorder} ${colors.bg}`
                    : 'border-slate-300 bg-white group-hover:border-slate-400'
                }">
                        ${isCompleted
                    ? `<i data-lucide="check" class="w-4 h-4 ${colors.text}"></i>`
                    : ''
                }
                    </div>
                </button>
            `;
        }).join('');

        // Actualizar barra de progreso
        app.updateNightProgress();

        // Re-renderizar iconos de Lucide
        lucide.createIcons();
    },

    toggleNightHabit: async (key) => {
        const today = new Date().toISOString().split('T')[0];
        const newValue = app.nightHabitsData[key] === 1 ? 0 : 1;
        app.nightHabitsData[key] = newValue;

        app.updateNightProgress(); // Update UI immediately
        app.checkPerfectDay(); // Check global progress

        try {
            await app.db.collection('users').doc(app.userId)
                .collection('night_habits').doc(today)
                .set(app.nightHabitsData, { merge: true });
        } catch (e) {
            console.error("Error saving night habit:", e);
        }
    },

    updateNightProgress: () => {
        const total = app.nightHabitsConfig.length;
        const completed = Object.values(app.nightHabitsData).filter(v => v === 1).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Actualizar texto de porcentaje
        const progressText = document.getElementById('night-progress-text');
        if (progressText) {
            progressText.innerText = `${percentage}%`;
        }

        // Actualizar barra horizontal
        const progressBar = document.getElementById('night-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }

        // Actualizar círculo de progreso
        const progressCircle = document.getElementById('night-progress-circle');
        if (progressCircle) {
            const circumference = 2 * Math.PI * 16; // r=16
            const offset = circumference - (percentage / 100) * circumference;
            progressCircle.style.strokeDashoffset = offset;
        }

        // Mostrar/ocultar mensaje de completado
        const completionMessage = document.getElementById('night-completion-message');
        if (completionMessage) {
            if (percentage === 100) {
                completionMessage.classList.remove('hidden');
            } else {
                completionMessage.classList.add('hidden');
            }
        }
    },

    calculateHabitProgress: () => {
        const habits = ['movement', 'meditation', 'reflection', 'planTomorrow'];
        if (!app.habitsData) return;

        let completed = 0;
        habits.forEach(h => {
            if (app.habitsData[h]) completed++;
        });

        const percent = Math.round((completed / habits.length) * 100);

        // Update Text
        const percentEl = document.getElementById('progress-percent');
        if (percentEl) percentEl.innerText = `${percent}%`;

        // Update Bar (if exists)
        const barEl = document.getElementById('dashboard-progress-bar');
        if (barEl) barEl.style.width = `${percent}%`;
    },

    // =========================================================================
    // FEATURE: WEEKLY PLAN (HISTORY ENABLED)
    // =========================================================================

    getWeekId: (offset = 0) => {
        const d = new Date();
        d.setDate(d.getDate() + (offset * 7));
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    },

    changeWeek: (direction) => {
        app.currentWeekOffset += direction;
        app.loadWeekly();
    },

    loadWeekly: async () => {
        const weekId = app.getWeekId(app.currentWeekOffset);

        // Update UI Label
        const labelEl = document.getElementById('weekly-nav-label');
        if (labelEl) {
            const label = app.currentWeekOffset === 0 ? "Semana Actual" : ((app.currentWeekOffset > 0) ? `+${app.currentWeekOffset} Semanas` : `${app.currentWeekOffset} Semanas`);
            labelEl.innerHTML = `<span class="text-xs text-slate-400 block">Viendo:</span><span class="font-bold text-slate-700">${label} (${weekId})</span>`;
        }

        // Listener for dynamic week
        if (app.weeklyListener) app.weeklyListener(); // Unsubscribe prev

        app.weeklyListener = app.db.collection('users').doc(app.userId).collection('weekly').doc(weekId)
            .onSnapshot((doc) => {
                app.weeklyData = doc.exists ? doc.data() : { checklist: {} };
                // If it's a new week (empty), initialize text fields to empty strings to avoid uncontrolled inputs if undefined
                if (!doc.exists) {
                    app.weeklyData = {
                        checklist: {},
                        priority_1: '', priority_2: '', priority_3: '',
                        brain_dump: ''
                    };
                }
                app.renderWeekly();
            });
    },

    saveWeekly: async () => {
        const weekId = app.getWeekId(app.currentWeekOffset);
        await app.db.collection('users').doc(app.userId).collection('weekly').doc(weekId).set(app.weeklyData, { merge: true });
    },

    renderWeekly: () => {
        // Targeted container inside the specific weekly tab
        const container = document.getElementById('weekly-content-container');
        if (!container) return; w = app.weeklyData;
        const check = w.checklist || {};

        container.innerHTML = `
            <div class="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-8 rounded-3xl shadow-xl mb-6">
               <div class="flex items-center gap-4 mb-4">
                  <div class="bg-white/10 p-3 rounded-2xl"><i data-lucide="calendar" class="text-indigo-400 w-7 h-7"></i></div>
                  <div>
                    <h2 class="text-2xl font-bold">Ritual de Domingo</h2>
                    <p class="text-indigo-200 text-sm">"Una hora de planificación ahorra diez horas de ejecución."</p>
                  </div>
               </div>
               
               <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  ${app.renderWeeklyCheckItem('finances', 'Revisar cuentas/pagos pendientes', check.finances)}
                  ${app.renderWeeklyCheckItem('delegation', 'Asignar tarea administrativa', check.delegation)}
                  ${app.renderWeeklyCheckItem('review', 'Revisar logros semana pasada', check.review)}
                  ${app.renderWeeklyCheckItem('schedule', 'Bloquear horas Gym/Ministerio', check.schedule)}
               </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div class="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <div class="flex justify-between items-center mb-6">
                     <h3 class="font-bold text-slate-800 flex items-center gap-2"><i data-lucide="target" class="text-red-500 w-5 h-5"></i> Las 3 Rocas</h3>
                     <button onclick="app.generateBreakdown()" class="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg font-bold flex items-center gap-1 hover:bg-indigo-100 transition">
                        <i data-lucide="sparkles" class="w-3 h-3"></i> IA: Desglosar #1
                     </button>
                  </div>
                  
                  <div class="space-y-4">
                     ${app.renderPriorityInput('priority_1', '1. El Dinosaurio (Lo más difícil)', 'bg-red-50/50 border-red-100 focus:ring-red-200', w.priority_1)}
                     ${app.renderPriorityInput('priority_2', '2. Tarea Clave (Delegable)', 'bg-slate-50 border-slate-200 focus:ring-blue-200', w.priority_2)}
                     ${app.renderPriorityInput('priority_3', '3. Personal / Salud', 'bg-slate-50 border-slate-200 focus:ring-green-200', w.priority_3)}
                  </div>
               </div>

               <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                  <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2"><i data-lucide="brain" class="text-slate-400 w-5 h-5"></i> Vaciado Mental</h3>
                  <textarea 
                     onchange="app.updateWeeklyField('brain_dump', this.value)"
                     class="flex-1 w-full bg-slate-50 border-none rounded-xl p-4 text-sm text-slate-600 placeholder-slate-500 placeholder-opacity-50 resize-none focus:ring-2 focus:ring-indigo-100 outline-none min-h-[200px]"
                     placeholder="${app.getSmartPlaceholder('brain_dump')}"
                  >${w.brain_dump || ''}</textarea>
               </div>
            </div>
        `;
        lucide.createIcons();
    },

    renderWeeklyCheckItem: (key, label, checked) => {
        return `
            <div onclick="app.toggleWeeklyCheck('${key}')" class="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${checked ? 'bg-indigo-500/20 border-indigo-400 text-white' : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'}">
                <div class="w-5 h-5 rounded border flex items-center justify-center ${checked ? 'bg-indigo-500 border-indigo-500' : 'border-slate-500'}">
                    ${checked ? '<i data-lucide="check" class="w-3 h-3 text-white"></i>' : ''}
                </div>
                <span class="text-sm font-medium">${label}</span>
            </div>
        `;
    },

    renderPriorityInput: (key, label, classes, value) => {
        const placeholder = app.getSmartPlaceholder(key);
        return `
            <div>
                <label class="text-xs font-bold text-slate-400 uppercase mb-1 block">${label}</label>
                <input value="${value || ''}" 
                       onchange="app.updateWeeklyField('${key}', this.value)" 
                       class="w-full p-3 rounded-xl font-bold text-slate-800 outline-none border focus:ring-2 placeholder-slate-500 placeholder-opacity-50 ${classes}" 
                       placeholder="${placeholder}" />
            </div>
        `;
    },

    toggleWeeklyCheck: (key) => {
        if (!app.weeklyData.checklist) app.weeklyData.checklist = {};
        app.weeklyData.checklist[key] = !app.weeklyData.checklist[key];
        app.saveWeekly();
        app.renderWeekly();
    },

    updateWeeklyField: (key, val) => {
        app.weeklyData[key] = val;
        app.saveWeekly();
    },

    generateBreakdown: async () => {
        const task = app.weeklyData.priority_1;
        if (!task) return app.toast("Escribe primero tu prioridad #1", "warning");

        const btn = document.querySelector('button[onclick="app.generateBreakdown()"]');
        const oldHtml = btn.innerHTML;
        btn.innerHTML = 'Thinking...';
        btn.disabled = true;

        try {
            const prompt = `Actúa como Project Manager experto. Tengo esta tarea prioritaria: "${task}". Desglósala en 3 pasos accionables y concretos para empezar ya. Formato lista HTML <ul><li>.`;
            const responseText = await app.callGeminiAI(prompt);

            // Clean markdown
            const htmlContent = responseText.replace(/```html/g, '').replace(/```/g, '');

            // Show result modal
            app.showModal("Plan de Acción Sugerido", htmlContent.replace(/<[^>]*>?/gm, '\n• ')); // Basic strip and bullet
        } catch (e) {
            app.toast(e.message, "error");
        } finally {
            btn.innerHTML = oldHtml;
            btn.disabled = false;
        }
    },


    // =========================================================================
    // FEATURE: NETWORK (TRIBE)
    // =========================================================================
    loadNetwork: async () => {
        const snapshot = await app.db.collection('users').doc(app.userId).collection('network').orderBy('display_order').get();
        app.networkData = [];
        snapshot.forEach(doc => {
            app.networkData.push({ id: doc.id, ...doc.data() });
        });

        // Candidates count
        const candSnapshot = await app.db.collection('users').doc(app.userId).collection('network').where('status', '==', 'candidate').get();
        app.expansionData = {
            candidates: candSnapshot.size,
            progress: Math.min((candSnapshot.size / 10) * 100, 100)
        };

        app.renderNetwork();
    },

    renderNetwork: () => {
        const container = document.getElementById('tab-network');
        const innerCircle = app.networkData.filter(p => p.status !== 'candidate');

        // Dynamic Content (Day logic)
        const dayIdx = new Date().getDay() % 3;
        const quotes = [
            "Tu éxito como CEO no vale nada si este círculo se rompe.", "El liderazgo empieza en casa.", "Nadie en su lecho de muerte dice: 'Ojalá hubiera trabajado más'."
        ];
        const rules = [
            "Prohibido hablar de obra", "Hoy solo se escucha, no se resuelve", "Preguntar: ¿Cómo te sientes? antes de ¿Qué hiciste?"
        ];
        const questions = [
            "¿Qué aventura imposible intentaríamos si el dinero no importara?", "¿Cuál es tu recuerdo favorito de nosotros este año?", "¿En qué te puedo apoyar mejor esta semana?"
        ];

        let html = `
            <div class="space-y-6">
              <div class="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-100 p-8 rounded-3xl relative overflow-hidden shadow-sm">
                 <div class="relative z-10 flex flex-col md:flex-row justify-between items-start gap-4">
                       <div>
                           <div class="flex items-center gap-3 mb-2">
                             <i data-lucide="heart" class="text-pink-500 fill-pink-500 w-6 h-6"></i>
                             <h2 class="text-2xl font-bold text-pink-900">El Círculo Íntimo</h2>
                           </div>
                           <p class="text-pink-800/80 font-medium italic">"${quotes[dayIdx]}"</p>
                           <p class="text-xs font-bold text-rose-500 uppercase tracking-widest mt-2">Regla de hoy: ${rules[dayIdx]}</p>
                       </div>
                       <div class="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-pink-100/50 max-w-sm">
                           <div class="flex items-center gap-2 mb-1">
                                <i data-lucide="sparkles" class="w-3 h-3 text-pink-400"></i>
                                <span class="text-[10px] font-bold text-pink-400 uppercase">Pregunta Conexión (AI)</span>
                           </div>
                           <p class="text-sm font-serif text-slate-700">"${questions[dayIdx]}"</p>
                       </div>
                   </div>
              </div>

              <div class="flex justify-between items-end">
                <h3 class="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                   <i data-lucide="users" class="w-5 h-5"></i> Miembros Clave (${innerCircle.length})
                </h3>
                <button onclick="app.openEditNetworkModal()" class="bg-slate-900 dark:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition shadow-lg shadow-slate-200 dark:shadow-blue-900/40">
                   + Añadir
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="tribe-grid">
        `;

        // Render Cards (Premium Design v2 - Dark Mode Fix)
        innerCircle.forEach(p => {
            const avatarColor = p.avatar_color || 'blue';
            const lastDate = p.last_connect_date ? new Date(p.last_connect_date) : null;
            const diffDays = lastDate ? Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24)) : 999;
            const statusColor = diffDays < 7 ? 'bg-green-500' : diffDays < 14 ? 'bg-amber-500' : 'bg-red-500';
            const statusText = diffDays < 7 ? 'Conectado' : diffDays < 14 ? 'Atención' : 'Desconectado';

            html += `
                <div class="bg-white dark:bg-slate-800 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                     draggable="true" 
                     data-id="${p.id}"
                     ondragstart="app.handleDragStart(event)" 
                     ondragover="app.handleDragOver(event)" 
                     ondrop="app.handleDrop(event)">
                   
                   <!-- Card Header -->
                   <div class="p-5 pb-2 flex items-start justify-between relative z-10">
                       <div class="flex items-center gap-4">
                            <!-- Avatar -->
                            <div class="relative">
                                <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-${avatarColor}-100 to-${avatarColor}-200 dark:from-${avatarColor}-900/50 dark:to-${avatarColor}-800/50 flex items-center justify-center text-${avatarColor}-600 dark:text-${avatarColor}-300 font-bold text-xl shadow-inner border border-white dark:border-slate-600">
                                    ${(p.name || '?').substring(0, 2).toUpperCase()}
                                </div>
                                <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${statusColor} border-2 border-white dark:border-slate-800 flex items-center justify-center shadow-sm" title="${statusText}">
                                    ${diffDays < 7 ? '<i data-lucide="check" class="w-3 h-3 text-white"></i>' : ''}
                                </div>
                            </div>
                            <!-- Name & Role -->
                            <div>
                                <h3 class="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">${p.name}</h3>
                                <div class="flex items-center gap-2 mt-1">
                                    <span class="text-[10px] font-bold text-${avatarColor}-700 dark:text-${avatarColor}-300 bg-${avatarColor}-50 dark:bg-${avatarColor}-900/30 px-2 py-0.5 rounded-md uppercase tracking-wide border border-${avatarColor}-100 dark:border-${avatarColor}-800/50">${p.role || 'Sin Rol'}</span>
                                </div>
                            </div>
                       </div>
                       
                       <!-- Edit Button (Improved) -->
                       <button onclick="app.openEditNetworkModal('${p.id}')" 
                           class="bg-white dark:bg-slate-700 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600 hover:border-blue-200 transition-all opacity-100 md:opacity-0 group-hover:opacity-100"
                           title="Editar">
                            <i data-lucide="pencil" class="w-4 h-4"></i>
                       </button>
                   </div>
                   
                   <!-- Separator -->
                   <div class="h-px w-full bg-gradient-to-r from-transparent via-slate-100 dark:via-slate-700 to-transparent my-1"></div>
                   
                   <!-- Body -->
                   <div class="px-5 py-2 space-y-3">
                        <p class="text-xs text-slate-400 dark:text-slate-500 ml-1 italic">${p.relationship}</p>

                        <!-- Stats Row -->
                       <div class="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-750 dark:bg-black/20 p-2.5 rounded-xl">
                          <span class="text-slate-400 dark:text-slate-500 text-xs font-medium flex items-center gap-1.5">
                             <i data-lucide="clock" class="w-3 h-3"></i> Última vez
                          </span>
                          <span class="font-bold whitespace-nowrap ${diffDays > 14 ? 'text-red-500' : diffDays > 7 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}">
                             ${p.last_connect_date ? (diffDays === 0 ? 'Hoy' : diffDays === 1 ? 'Ayer' : `Hace ${diffDays} días`) : 'Nunca'}
                          </span>
                       </div>
                       
                       ${p.personal_reminder ? `
                       <div class="flex gap-2 items-start py-1 px-1">
                          <i data-lucide="sticky-note" class="w-3 h-3 text-amber-400 mt-1 shrink-0"></i>
                          <p class="text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed line-clamp-2">"${p.personal_reminder}"</p>
                       </div>` : ''}
                   </div>
                   
                   <!-- Actions -->
                   <div class="p-4 grid grid-cols-5 gap-2 mt-1">
                      <button onclick="app.updateConnection('${p.id}')" 
                          class="col-span-4 bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600 py-3 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-2 shadow-lg shadow-slate-200 dark:shadow-none hover:shadow-xl">
                         <i data-lucide="check-circle" class="w-3 h-3"></i> 
                         Registrar Encuentro
                      </button>
                      <button onclick="app.generateMessageAdvice('${p.id}', '${p.name}', '${p.relationship}')" 
                          class="col-span-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl flex items-center justify-center transition-all border border-indigo-100 dark:border-indigo-800/50"
                          title="Obtener consejo de IA">
                         <i data-lucide="sparkles" class="w-4 h-4"></i>
                      </button>
                   </div>
                </div>
            `;
        });

        html += `</div>`;

        // Expansion Section
        html += `
        <div class="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 mt-10">
            <div class="flex justify-between items-end mb-4">
                <div>
                    <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-1">Buscando la Tribu (Expansión)</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Objetivo: Encontrar 2 emprendedores en Portugal.</p>
                </div>
                <div class="text-right">
                    <span class="text-3xl font-bold text-blue-600 dark:text-blue-400">${Math.round(app.expansionData.progress)}%</span>
                </div>
            </div>
            <div class="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-6">
                <div class="h-full bg-blue-600 rounded-full transition-all" style="width: ${app.expansionData.progress}%"></div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onclick="app.openEditNetworkModal(null, true)" class="p-4 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-400 dark:text-slate-500 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition flex items-center justify-center gap-2 text-sm font-bold">
                    <i data-lucide="plus" class="w-5 h-5"></i> Añadir Candidato
                </button>
                <div class="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-3">
                    <i data-lucide="lightbulb" class="w-4 h-4 text-yellow-500"></i>
                    <span>Idea IA: "Buscar eventos Tech en Lisboa este mes"</span>
                </div>
            </div>
        </div>
        `;

        container.innerHTML = html;
        lucide.createIcons();
    },

    // OPEN MODAL (Create or Edit)
    openEditNetworkModal: (id = null, isCandidate = false) => {
        const modal = document.getElementById('add-network-modal');
        const form = document.getElementById('network-form');
        const titleEl = document.getElementById('network-modal-title');
        const btn = document.getElementById('btn-save-network');

        // Reset form
        form.reset();

        if (id) {
            // EDIT MODE
            const person = app.networkData.find(p => p.id === id);
            if (!person) return;

            titleEl.innerText = "Editar Miembro";
            btn.innerText = "Actualizar Persona";

            document.getElementById('net-id').value = id;
            document.getElementById('net-name').value = person.name || '';
            document.getElementById('net-relationship').value = person.relationship || '';
            document.getElementById('net-role').value = person.role || '';
            document.getElementById('net-reminder').value = person.personal_reminder || '';
            document.getElementById('net-color').value = person.avatar_color || 'blue';
            document.getElementById('net-is_candidate').checked = (person.status === 'candidate');
        } else {
            // CREATE MODE
            titleEl.innerText = "Añadir a la Tribu";
            btn.innerText = "Guardar Persona";
            document.getElementById('net-id').value = '';
            document.getElementById('net-is_candidate').checked = isCandidate;
        }

        modal.classList.remove('hidden');
    },

    // HANDLE FORM SUBMIT
    handleNetworkSubmit: async (e) => {
        // e.preventDefault() is called inline in HTML
        const id = document.getElementById('net-id').value;

        const data = {
            name: document.getElementById('net-name').value,
            relationship: document.getElementById('net-relationship').value,
            role: document.getElementById('net-role').value,
            personal_reminder: document.getElementById('net-reminder').value,
            avatar_color: document.getElementById('net-color').value,
            status: document.getElementById('net-is_candidate').checked ? 'candidate' : 'inner_circle'
        };

        if (id) {
            await app.updateNetworkPerson(id, data);
        } else {
            await app.addNetworkPerson(data);
        }

        document.getElementById('add-network-modal').classList.add('hidden');
    },

    addNetworkPerson: async (data) => {
        try {
            const size = app.networkData.length;
            await app.db.collection('users').doc(app.userId).collection('network').add({
                ...data,
                last_connect_date: new Date().toISOString().split('T')[0],
                display_order: size,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            app.toast("Miembro añadido exitosamente", "success");
            app.loadNetwork();
        } catch (e) { app.toast("Error: " + e.message, "error"); }
    },

    updateNetworkPerson: async (id, data) => {
        try {
            await app.db.collection('users').doc(app.userId).collection('network').doc(id).set(data, { merge: true });
            app.toast("Miembro actualizado", "success");
            app.loadNetwork();
        } catch (e) { app.toast("Error al actualizar: " + e.message, "error"); }
    },

    updateConnection: async (id) => {
        await app.db.collection('users').doc(app.userId).collection('network').doc(id).set({
            last_connect_date: new Date().toISOString().split('T')[0]
        }, { merge: true });
        app.toast("¡Cita registrada! El reloj se reinicia.", "success");
        app.loadNetwork();
    },

    generateMessageAdvice: async (id, name, relation) => {
        // Abrir modal y mostrar loading
        app.openAiAdviceModal(name);

        const dayOfWeek = new Date().toLocaleDateString('es-ES', { weekday: 'long' });

        const prompt = `Actúa como coach experto en relaciones interpersonales. 

Contexto: Es ${dayOfWeek}. El usuario quiere conectar con ${name}, quien es su ${relation}.

Genera consejos personalizados en formato JSON con esta estructura exacta:
{
    "consejo": "Un consejo específico y accionable para fortalecer esta relación hoy",
    "tema": "Un tema de conversación interesante que NO sea sobre trabajo",
    "pregunta": "Una pregunta abierta y genuina para iniciar una conversación significativa"
}

Sé cálido, específico y práctico. Responde SOLO con el JSON válido, sin explicaciones adicionales ni markdown.`;

        try {
            const resText = await app.callGeminiAI(prompt, "Eres un coach experto en relaciones interpersonales y comunicación efectiva.");
            const advice = app.parseAIJSON(resText);

            // Mostrar resultado en el modal
            app.showAiAdviceResult(advice);

        } catch (e) {
            console.error('Error en generateMessageAdvice:', e);
            app.showAiAdviceError(e.message);
        }
    },

    // Funciones auxiliares para el modal de consejos IA
    openAiAdviceModal: (personName) => {
        const modal = document.getElementById('ai-advice-modal');
        const nameEl = document.getElementById('ai-advice-person-name');
        const loadingEl = document.getElementById('ai-advice-loading');
        const resultEl = document.getElementById('ai-advice-result');
        const errorEl = document.getElementById('ai-advice-error');
        const copyBtn = document.getElementById('ai-advice-copy-btn');

        // Reset states
        nameEl.innerText = `Para conectar con ${personName}`;
        loadingEl.classList.remove('hidden');
        resultEl.classList.add('hidden');
        errorEl.classList.add('hidden');
        copyBtn.classList.add('hidden');

        // Mostrar modal
        modal.classList.remove('hidden');
        lucide.createIcons();
    },

    closeAiAdviceModal: () => {
        document.getElementById('ai-advice-modal').classList.add('hidden');
    },

    showAiAdviceResult: (advice) => {
        const loadingEl = document.getElementById('ai-advice-loading');
        const resultEl = document.getElementById('ai-advice-result');
        const copyBtn = document.getElementById('ai-advice-copy-btn');

        // Llenar contenido
        document.getElementById('ai-advice-tip').innerText = advice.consejo || 'Sin consejo disponible';
        document.getElementById('ai-advice-topic').innerText = advice.tema || 'Sin tema disponible';
        document.getElementById('ai-advice-question').innerText = `"${advice.pregunta || '¿Cómo estás?'}"`;

        // Guardar para copiar
        app.currentAdvice = advice;

        // Mostrar resultado
        loadingEl.classList.add('hidden');
        resultEl.classList.remove('hidden');
        copyBtn.classList.remove('hidden');
        copyBtn.classList.add('flex');

        lucide.createIcons();
    },

    showAiAdviceError: (message) => {
        const loadingEl = document.getElementById('ai-advice-loading');
        const errorEl = document.getElementById('ai-advice-error');
        const errorText = document.getElementById('ai-advice-error-text');

        errorText.innerText = message;

        loadingEl.classList.add('hidden');
        errorEl.classList.remove('hidden');

        lucide.createIcons();
    },

    copyAiAdvice: () => {
        if (!app.currentAdvice) return;

        const text = `💡 CONSEJO: ${app.currentAdvice.consejo}\n\n🗣️ TEMA: ${app.currentAdvice.tema}\n\n❓ PREGUNTA: ${app.currentAdvice.pregunta}`;

        navigator.clipboard.writeText(text).then(() => {
            const copyBtn = document.getElementById('ai-advice-copy-btn');
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> ¡Copiado!';
            copyBtn.classList.remove('bg-indigo-600');
            copyBtn.classList.add('bg-green-600');
            lucide.createIcons();

            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.classList.remove('bg-green-600');
                copyBtn.classList.add('bg-indigo-600');
                lucide.createIcons();
            }, 2000);
        });
    },

    // =========================================================================
    // FEATURE: STREAK & STATS
    // =========================================================================
    loadStats: async () => {
        if (!app.userId) return;
        try {
            const doc = await app.db.collection('users').doc(app.userId).collection('stats').doc('general').get();
            if (doc.exists) {
                app.stats = doc.data();

                // [STREAK RESET LOGIC]
                // If last_perfect_date is NOT yesterday (and not today), streak is broken.
                const today = new Date().toISOString().split('T')[0];
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (app.stats.last_perfect_date !== today && app.stats.last_perfect_date !== yesterdayStr) {
                    if (app.stats.streak > 0) {
                        console.log("Streak broken! Resetting to 0.");
                        app.stats.streak = 0;
                        // Update DB immediately
                        app.db.collection('users').doc(app.userId).collection('stats').doc('general').update({ streak: 0 });
                    }
                }

            } else {
                app.stats = { streak: 0, last_perfect_date: null, history: [] };
            }
            app.renderStreak();
        } catch (e) {
            console.error("Error loading stats:", e);
        }
    },

    updateDateDisplay: () => {
        const options = { weekday: 'long', day: 'numeric', month: 'short' };
        const dateStr = new Date().toLocaleDateString('es-ES', options);
        // Capitalize first letter
        const formatted = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

        const el = document.getElementById('current-date-display');
        if (el) el.innerHTML = `${formatted} <span class="text-slate-400 font-normal ml-1">| Calculando...</span>`;
    },

    renderStreak: () => {
        const el = document.getElementById('streak-display');
        if (el) {
            el.innerHTML = `<i data-lucide="flame" class="w-4 h-4"></i> Racha: ${app.stats.streak || 0} días`;

            // Highlight if streak > 0
            if (app.stats.streak > 0) {
                el.parentElement.classList.replace('bg-slate-100', 'bg-orange-100');
                el.parentElement.classList.replace('text-slate-600', 'text-orange-600');
            } else {
                el.parentElement.classList.replace('bg-orange-100', 'bg-slate-100');
                el.parentElement.classList.replace('text-orange-600', 'text-slate-600');
            }

            // Update History Button Visibility if needed, or just ensure it exists
            // We'll assume the history button is static in HTML, or we can inject it.
        }
    },

    openStreakHistory: () => {
        const history = app.stats.history || [];
        let html = '<div class="space-y-2">';
        if (history.length === 0) {
            html += '<p class="text-slate-500 text-sm">Sin historial aún.</p>';
        } else {
            // Show last 10 entries reverse
            history.slice(-10).reverse().forEach(entry => {
                html += `
                    <div class="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-lg">
                        <span class="text-slate-700 font-medium">${entry.date}</span>
                        <span class="text-orange-600 font-bold">${entry.streak} días</span>
                    </div>
                `;
            });
        }
        html += '</div>';
        app.showModal('Historial de Rachas', html);
    },

    checkPerfectDay: async () => {
        if (!app.habitsData || !app.nightHabitsData) return;

        // 1. Check Morning Habits
        const morningKeys = ['movement', 'meditation', 'reflection', 'planTomorrow'];
        const morningDone = morningKeys.every(k => app.habitsData[k] === 1);

        // 2. Check Night Habits
        const nightKeys = app.nightHabitsConfig.map(h => h.key);
        const nightDone = nightKeys.every(k => app.nightHabitsData[k] === 1);

        const allDone = morningDone && nightDone;
        const today = new Date().toISOString().split('T')[0];

        // Update UI Status Text
        const statusEl = document.getElementById('current-date-display');
        if (statusEl) {
            const options = { weekday: 'long', day: 'numeric', month: 'short' };
            const dateStr = new Date().toLocaleDateString('es-ES', options);
            const formatted = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

            if (allDone) {
                statusEl.innerHTML = `${formatted} <span class="text-green-600 font-bold ml-1">| ¡Día Completado!</span>`;
            } else {
                const progress = Math.round(((Object.values(app.habitsData).reduce((a, b) => a + b, 0) + Object.values(app.nightHabitsData).reduce((a, b) => a + b, 0)) / (morningKeys.length + nightKeys.length)) * 100);
                statusEl.innerHTML = `${formatted} <span class="text-blue-600 font-bold ml-1">| ${progress}% Progreso</span>`;
            }
        }

        // 3. Strict Streak Logic
        // Primero, validar si la racha se rompió al entrar hoy (Logic moved to loadStats, but double check here)

        if (allDone && app.stats.last_perfect_date !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            let newStreak = app.stats.streak;

            // Si el último día perfecto fue ayer, incrementamos.
            if (app.stats.last_perfect_date === yesterdayStr) {
                newStreak++;
            } else {
                // Si fue antes de ayer (o null), y hoy completamos, entonces es día 1 de nueva racha.
                // PERO: Si ya reseteamos a 0 en loadStats, entonces 0 -> 1.
                newStreak = 1;
            }

            // Update Local
            app.stats.streak = newStreak;
            app.stats.last_perfect_date = today;

            // Add to History
            if (!app.stats.history) app.stats.history = [];
            app.stats.history.push({ date: today, streak: newStreak });

            app.renderStreak();

            // Save to DB
            try {
                await app.db.collection('users').doc(app.userId).collection('stats').doc('general').set({
                    streak: newStreak,
                    last_perfect_date: today,
                    history: app.stats.history
                }, { merge: true });

                // Celebration
                if (typeof confetti === 'function') {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                }

            } catch (e) {
                console.error("Error saving streak:", e);
            }
        }
        // Note: We don't decrement if they uncheck something, to be kind? 
        // Or if they uncheck, we verify? 
        // User asked: "si se pierde un día la racha se tiene que romper". This implies automatic check on load (handled in loadStats).
        // If they uncheck a habit TODAY that they previously finished, strictly speaking they are no longer "perfect" today.
        // So we should revert the streak increment?
        else if (!allDone && app.stats.last_perfect_date === today) {
            if (app.stats.streak > 0) app.stats.streak--;
            app.stats.last_perfect_date = null; // Removed today
            // Remove from history?
            if (app.stats.history && app.stats.history.length > 0) {
                const lastEntry = app.stats.history[app.stats.history.length - 1];
                if (lastEntry.date === today) {
                    app.stats.history.pop();
                }
            }

            app.renderStreak();

            await app.db.collection('users').doc(app.userId).collection('stats').doc('general').set({
                streak: app.stats.streak,
                last_perfect_date: null, // Firestore merge might keep it? Explicit set might be needed or ignore. 
                // Actually to remove a field: firebase.firestore.FieldValue.delete()
                // But setting to null is fine for our logic `!== today`.
                history: app.stats.history
            }, { merge: true });
        }
    },

    // =========================================================================
    // FEATURE: ENGLISH MASTERY (ENHANCED)
    // =========================================================================
    englishCurrentIndex: 0,

    loadEnglishWord: async () => {
        const today = new Date().toISOString().split('T')[0];

        // 1. Check Cache
        try {
            const doc = await app.db.collection('daily_content').doc(today).get();

            if (doc.exists) {
                app.englishData = doc.data();

                // Validation: Check if it has 3 valid words
                if (!app.englishData.words || !Array.isArray(app.englishData.words) || app.englishData.words.length !== 3) {
                    console.log("⚠️ Corrupted cache detected. Regenerating...");
                    await app.attemptEnglishGeneration(today);
                } else if (app.englishData.words[0].word === "Synergy") {
                    // Stale check
                    console.log("⚠️ Fallback data detected. Retrying generation...");
                    await app.attemptEnglishGeneration(today);
                } else {
                    app.renderEnglishWidget();
                }
            } else {
                // No cache -> Fetch
                await app.attemptEnglishGeneration(today);
            }
        } catch (e) {
            console.error(e);
            app.loadFallbackEnglish();
        }
    },

    attemptEnglishGeneration: async (today, retries = 3) => {
        for (let i = 0; i < retries; i++) {
            try {
                console.log(`🔄 Generation attempt ${i + 1}/${retries}...`);
                await app.fetchEnglishContentV2(today);
                return; // Success
            } catch (e) {
                console.warn(`Attempt ${i + 1} failed: ${e.message}`);
                if (i === retries - 1) throw e; // Throw on last fail
                await new Promise(r => setTimeout(r, 1500)); // Wait before retry
            }
        }
    },

    forceRefreshEnglish: async () => {
        const today = new Date().toISOString().split('T')[0];
        if (confirm("¿Generar nuevas palabras ahora? (Esto reemplazará el contenido actual)")) {
            // Show loading state
            const container = document.getElementById('english-widget');
            if (container) container.innerHTML = '<div class="h-full flex flex-col items-center justify-center gap-3"><i data-lucide="loader-2" class="w-8 h-8 animate-spin text-blue-500"></i><p class="text-sm text-slate-500">Generando nuevo contenido...</p></div>';
            lucide.createIcons();

            try {
                await app.attemptEnglishGeneration(today);
            } catch (e) {
                app.toast("Error tras varios intentos: " + e.message, "error");
                app.loadFallbackEnglish();
            }
        }
    },

    fetchEnglishContent: async (today) => {
        console.log("Generating 3 English Words...");
        const prompt = `Genera 3 términos de inglés de negocios avanzado (C1/C2) para un CEO.
        
        IMPORTANTE: 
        - NO uses palabras básicas (Synergy, Leverage, ROI).
        - SOLO responde con JSON válido.
        - Usa comillas dobles para TODAS las claves.
        
        Requisito de pronunciación:
        1. "ipa": Fonética estándar
        2. "simplified": Pronunciación aproximada (LATAM)

        Estructura OBLIGATORIA:
        {
          "words": [
            {
              "word": "Term",
              "ipa": "/.../",
              "simplified": "...", 
              "translation": "...",
              "example": "...",
              "context": "..."
            }
          ]
        }`;

        try {
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout: Gemini tardó demasiado.")), 30000));

            const jsonStr = await Promise.race([
                app.callGeminiAI(prompt, "Responde SOLO con JSON válido RFC 8259. Sin formato markdown."),
                timeout
            ]);

            console.log("Raw Gemini Response:", jsonStr);

            // 1. Extract JSON block (Naive extraction often fails with AI, so we scan for {} envelope)
            const firstBrace = jsonStr.indexOf('{');
            const lastBrace = jsonStr.lastIndexOf('}');

            if (firstBrace === -1 || lastBrace === -1) throw new Error("No se encontró JSON en la respuesta.");

            let cleanText = jsonStr.substring(firstBrace, lastBrace + 1);

            // 2. NUCLEAR SANITIZATION ☢️
            // Fix common AI JSON errors: unquoted keys, comments, trailing commas.

            // Remove comments //
            cleanText = cleanText.replace(/\/\/.*$/gm, '');

            // Quote Unquoted Keys:  key: -> "key":
            // Matches start of line or space/brace/comma, then key chars, then :
            cleanText = cleanText.replace(/([{,]\s*)([a-zA-Z0-9_]+?)\s*:/g, '$1"$2":');

            // Remove trailing commas before } or ]
            cleanText = cleanText.replace(/,\s*([}\]])/g, '$1');

            console.log("Sanitized JSON:", cleanText);

            // 3. Parse with Fallback
            let data;
            try {
                data = JSON.parse(cleanText);
            } catch (parseError) {
                console.warn("Standard JSON.parse failed. Retrying with Function (eval)...", parseError);
                // Safe-ish eval for object literals (only reads data, doesn't execute)
                // This handles edge cases like single quotes 'key': 'val'
                try {
                    data = new Function('return ' + cleanText)();
                } catch (evalError) {
                    throw new Error("Imposible parsear respuesta AI: " + parseError.message);
                }
            }

            if (!data.words || !Array.isArray(data.words)) throw new Error("Estructura inválida: falta array 'words'");

            const finalData = {
                words: data.words,
                lessonCompleted: false
            };

            app.englishData = finalData;
            app.renderEnglishWidget();

            await app.db.collection('daily_content').doc(today).set(finalData);
            app.toast("¡Vocabulario Generado!", "success");

        } catch (e) {
            console.error("Error generating English content:", e);
            app.toast("Error: " + e.message, "error");
            app.loadFallbackEnglish();
        }
    },

    fetchEnglishContentV2: async (today) => {
        const level = app.settings.english_level || 'C1';

        // Diversificación de Contextos (Pilares)
        const categories = [
            "Uso Cotidiano (Frases idiomáticas, High-frequency)",
            "Viajes y Turismo (Aeropuertos, Hoteles, Navegación urbana)",
            "Negocios y Profesional (Reuniones, Emails, Liderazgo)",
            "Cultura General y Socialización (Arte, Historia, Conversación casual)"
        ];
        // Select random category to avoid redundancy in the long run (though today is filtered by date)
        // To be truly random but balanced, we pick one randomly.
        const category = categories[Math.floor(Math.random() * categories.length)];

        console.log(`Generating English Content | Level: ${level} | Category: ${category}`);

        const prompt = `Actúa como un profesor de inglés experto.
        Genera 3 palabras o frases cortas de vocabulario nivel ${level} para un estudiante.
        Contexto temático: "${category}".

        IMPORTANTE: 
        - Asegura que las palabras coincidan con el nivel ${level}.
        - NO uses palabras básicas si el nivel es alto.
        - FORMATO: Texto plano, una palabra por línea.
        - SEPARADOR: Usa el carácter pipe "|" para separar los campos.
        
        Campos requeridos por línea:
        Palabra/Frase | IPA | Pronunciación Aproximada (Español) | Traducción | Ejemplo de uso | Contexto Específico

        Ejemplo (Formato esperado):
        Ubiquitous|/juːˈbɪk.wɪ.təs/|yu-BI-kwi-tus|Omnipresente|Smartphones are ubiquitous.|General
        To touch base|/-/|tu tach beis|Contactar brevemente|Let's touch base tomorrow.|Idiom
        
        Responde SOLO con las 3 líneas de texto. Nada más.`;

        // Strict validation in the system instruction
        const systemInstr = `Eres un motor de vocabulario estricto. Tu única función es generar arrays de datos. Debes devolver EXACTAMENTE 3 ítems. Si generas menos o más, fallas.`;

        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout: Gemini tardó demasiado.")), 15000));

        const rawText = await Promise.race([
            app.callGeminiAI(prompt, systemInstr),
            timeout
        ]);

        console.log("Raw Gemini Response (Text):", rawText);

        // PARSE TEXT (Robust Split)
        const lines = rawText.split('\n').filter(line => line.includes('|') && line.trim().length > 5);

        // STRICT VALIDATION
        if (lines.length !== 3) {
            throw new Error(`Validación fallida: Se esperaban 3 palabras, llegaron ${lines.length}. Reintentando...`);
        }

        const parsedWords = lines.map(line => {
            const parts = line.split('|').map(p => p.trim());
            // Ensure we have enough parts, if not fill with defaults
            return {
                word: parts[0] || "Error",
                ipa: parts[1] || "-",
                simplified: parts[2] || parts[0],
                translation: parts[3] || "Sin traducción",
                example: parts[4] || "-",
                context: parts[5] || category.split(' ')[0]
            };
        });

        const finalData = {
            words: parsedWords,
            lessonCompleted: false,
            meta: { level, category, generated_at: new Date().toISOString() }
        };

        app.englishData = finalData;
        app.renderEnglishWidget();

        // Save to cache
        await app.db.collection('daily_content').doc(today).set(finalData);
        app.toast(`Vocabulario Generado (${level})`, "success");
    },

    loadFallbackEnglish: () => {
        app.englishData = {
            words: [
                { word: "Synergy", ipa: "/ˈsɪn.ɚ.dʒi/", simplified: "SI-ner-yi", translation: "Sinergia", example: "The synergy drove innovation.", context: "Strategy" },
                { word: "Leverage", ipa: "/ˈlɛv.ər.ɪdʒ/", simplified: "LE-ve-rich", translation: "Apalancar", example: "We must leverage our assets.", context: "Finance" },
                { word: "Scalability", ipa: "/ˌskeɪ.ləˈbɪl.ə.ti/", simplified: "skei-la-BI-li-ti", translation: "Escalabilidad", example: "Scalability is our priority.", context: "Growth" }
            ],
            lessonCompleted: false
        };
        app.renderEnglishWidget();
    },

    nextEnglishWord: () => {
        if (app.englishData && app.englishData.words) {
            app.englishCurrentIndex = (app.englishCurrentIndex + 1) % app.englishData.words.length;
            app.renderEnglishWidget();
        }
    },

    prevEnglishWord: () => {
        if (app.englishData && app.englishData.words) {
            app.englishCurrentIndex = (app.englishCurrentIndex - 1 + app.englishData.words.length) % app.englishData.words.length;
            app.renderEnglishWidget();
        }
    },

    completeEnglishLesson: async () => {
        if (!app.englishData.lessonCompleted) {
            app.englishData.lessonCompleted = true;
            app.confettiAction();

            // Increment Streak Logic
            try {
                const today = new Date().toISOString().split('T')[0];
                const statsRef = app.db.collection('users').doc(app.userId).collection('stats').doc('english');
                const doc = await statsRef.get();

                let streak = 0;
                let lastDate = null;
                // History of completed lessons
                let history = [];

                if (doc.exists) {
                    const data = doc.data();
                    streak = data.streak || 0;
                    lastDate = data.lastDate;
                    history = data.history || [];
                }

                // Check continuity
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (lastDate === yesterdayStr) {
                    streak++;
                } else if (lastDate !== today) {
                    streak = 1; // Reset or Start
                }

                // Add to history if not present
                const historyEntry = { date: today, words: app.englishData.words.map(w => w.word) };
                // Filter out duplicates just in case
                history = history.filter(h => h.date !== today);
                history.push(historyEntry);

                await statsRef.set({
                    streak: streak,
                    lastDate: today,
                    history: history
                }, { merge: true });

                // Update Local Cache of Today's Lesson
                await app.db.collection('daily_content').doc(today).update({ lessonCompleted: true });

            } catch (e) {
                console.error("Error saving English streak:", e);
            }

            app.renderEnglishWidget();
        }
    },

    confettiAction: () => {
        if (typeof confetti === 'function') {
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        }
    },

    openEnglishHistory: async () => {
        try {
            const statsRef = app.db.collection('users').doc(app.userId).collection('stats').doc('english');
            const doc = await statsRef.get();
            let history = [];
            if (doc.exists && doc.data().history) history = doc.data().history;

            let html = '<div class="space-y-3 max-h-[60vh] overflow-y-auto pr-2">';

            if (history.length === 0) {
                html += '<p class="text-center text-slate-400 py-4">Sin lecciones completadas aún.</p>';
            } else {
                history.slice().reverse().forEach(entry => {
                    html += `
                        <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p class="text-xs font-bold text-slate-400 mb-1">${entry.date}</p>
                            <p class="font-bold text-slate-700">${entry.words.join(', ')}</p>
                        </div>
                    `;
                });
            }
            html += '</div>';
            app.showModal('Historial de Vocabulario', html);
        } catch (e) {
            app.toast("Error cargando historial", "error");
        }
    },

    renderEnglishWidget: async () => {
        const container = document.getElementById('english-widget');
        if (!container || !app.englishData || !app.englishData.words) return;

        const words = app.englishData.words;
        const current = words[app.englishCurrentIndex];
        const total = words.length;

        // Get Streak & Level
        let streak = 0;
        let level = 1;

        if (app.userId) {
            try {
                app.db.collection('users').doc(app.userId).collection('stats').doc('english').get().then(doc => {
                    if (doc.exists) {
                        streak = doc.data().streak || 0;
                        level = Math.floor(streak / 9) + 1; // Level up every 9 days
                        // Update UI async
                        const badge = document.getElementById('english-streak-badge');
                        const levelBadge = document.getElementById('english-level-badge');
                        if (badge) badge.innerText = `🔥 ${streak}`;
                        if (levelBadge) levelBadge.innerText = `Nvl ${level}`;
                    }
                });
            } catch (e) { }
        }

        container.innerHTML = `
            <div class="relative h-full flex flex-col justify-between group">
                <!-- Header -->
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                         <span class="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Business English</span>
                         <span class="text-xs text-slate-400 font-bold" id="english-level-badge">Nvl ${level}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="app.openEnglishHistory()" class="text-slate-400 hover:text-blue-600 transition" title="Ver Historial">
                            <i data-lucide="history" class="w-4 h-4"></i>
                        </button>
                        <span id="english-streak-badge" class="bg-orange-50 text-orange-600 text-xs font-bold px-2 py-1 rounded-full border border-orange-100">🔥 ${streak}</span>
                        <button onclick="app.playPronunciation('${current.word.replace(/'/g, "\\'")}')" class="text-slate-400 hover:text-blue-600 transition bg-slate-50 p-1.5 rounded-lg active:scale-95" title="Escuchar pronunciación">
                            <i data-lucide="volume-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Main Content -->
                <div class="flex-1 flex flex-col justify-center text-center">
                    <h3 class="text-3xl font-black text-slate-800 mb-1 tracking-tight">${current.word}</h3>
                    
                    <div class="flex flex-col items-center gap-0.5 mb-3">
                        <span class="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">${current.ipa}</span>
                        <span class="text-sm text-blue-600 font-bold">"${current.simplified}"</span>
                    </div>

                    <p class="text-sm text-slate-600 italic leading-relaxed mb-2">"${current.example}"</p>
                    <p class="text-xs text-slate-400 font-bold uppercase tracking-widest border-t border-slate-100 pt-2 w-16 mx-auto">${current.translation}</p>
                </div>

                <!-- Footer / Controls -->
                <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                    <button onclick="app.prevEnglishWord()" class="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-blue-600 transition">
                        <i data-lucide="chevron-left" class="w-5 h-5"></i>
                    </button>

                    <div class="flex gap-1">
                        ${words.map((_, i) => `
                            <div class="w-1.5 h-1.5 rounded-full transition-all ${i === app.englishCurrentIndex ? 'bg-blue-500 w-3' : 'bg-slate-200'}"></div>
                        `).join('')}
                    </div>

                    ${app.englishCurrentIndex === total - 1
                ? (app.englishData.lessonCompleted
                    ? `<div class="flex items-center gap-2">
                         <span class="text-xs font-bold text-green-500 flex items-center gap-1"><i data-lucide="check-circle" class="w-4 h-4"></i> Listo</span>
                         <!-- Refresh Button MOVED HERE -->
                         <button onclick="app.forceRefreshEnglish()" title="Regenerar" class="text-slate-300 hover:text-blue-500 transition ml-2">
                            <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                         </button>
                       </div>`
                    : `<button onclick="app.completeEnglishLesson()" class="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200">Completar</button>`)
                : `<button onclick="app.nextEnglishWord()" class="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-blue-600 transition">
                                <i data-lucide="chevron-right" class="w-5 h-5"></i>
                           </button>`
            }
                </div>
            </div>
        `;
        lucide.createIcons();
    },

    playPronunciation: (text) => {
        if ('speechSynthesis' in window) {
            // Cancel previous to avoid queue
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US'; // Force American English
            utterance.rate = 0.9; // Slightly slower for clarity

            // Try to find a good voice
            const voices = window.speechSynthesis.getVoices();
            const preferred = voices.find(v => v.lang === 'en-US' && v.name.includes('Google'));
            if (preferred) utterance.voice = preferred;

            window.speechSynthesis.speak(utterance);
        } else {
            app.toast("Tu navegador no soporta audio.", "error");
        }
    },

    // =========================================================================
    // FEATURE: MASTER ADMIN PANEL
    // =========================================================================

    checkSubscriptionStatus: () => {
        // Clear status if Master
        if (app.isMaster) {
            const badge = document.getElementById('header-subscription-status');
            if (badge) badge.innerText = "MASTER";
            return;
        }

        const expiryStr = app.userData.subscription_expiry;
        if (!expiryStr) {
            app.showLockedOverlay();
            return;
        }

        const expiry = new Date(expiryStr);
        const now = new Date();
        const diffTime = expiry - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Update Header Badge
        const badge = document.getElementById('header-subscription-status');
        const dot = document.getElementById('user-status-dot');

        if (badge) {
            if (diffDays <= 0) {
                badge.innerText = "EXPIRADO";
                badge.className = "text-[10px] uppercase tracking-widest font-bold text-red-500 animate-pulse";
                if (dot) dot.className = "absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900";
            } else {
                badge.innerText = `${diffDays} DÍAS RESTANTES`;

                // Color Logic
                if (diffDays > 3) {
                    badge.className = "text-[10px] uppercase tracking-widest font-bold text-green-400";
                    if (dot) dot.className = "absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900";
                } else {
                    badge.className = "text-[10px] uppercase tracking-widest font-bold text-yellow-400";
                    if (dot) dot.className = "absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-yellow-500 rounded-full border-2 border-slate-900";
                }
            }
        }

        if (now > expiry) {
            console.warn("Suscripción expirada:", expiryStr);
            app.showLockedOverlay();
        } else {
            // Hide overlay if it was shown
            const overlay = document.getElementById('subscription-overlay');
            if (overlay) overlay.classList.add('hidden');
        }
    },

    showLockedOverlay: () => {
        const overlay = document.getElementById('subscription-locked-overlay');
        if (!overlay) return;

        overlay.innerHTML = `
            <div class="bg-slate-800 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl border border-slate-700">
                <div class="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i data-lucide="lock" class="w-10 h-10 text-red-500"></i>
                </div>
                
                <h2 class="text-3xl font-black text-white mb-2">Acceso Expirado</h2>
                <p class="text-slate-400 mb-8">Tu periodo de prueba o suscripción ha finalizado.</p>

                <div class="bg-slate-900/50 p-4 rounded-xl border border-slate-700 mb-8">
                    <p class="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Para reactivar tu acceso:</p>
                    
                    <div class="flex flex-col gap-2">
                         <a href="https://mail.google.com/mail/?view=cm&fs=1&to=tecnomania73@gmail.com&su=Reactivar%20Acceso%20-%20Arquitecto%20Sistemas" 
                           target="_blank"
                           class="flex items-center justify-center gap-3 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition">
                           <i data-lucide="mail" class="w-5 h-5"></i>
                           Enviar desde Gmail
                        </a>
                        <a href="mailto:tecnomania73@gmail.com?subject=Reactivar%20Acceso%20-%20Arquitecto%20Sistemas" 
                           class="text-xs text-slate-400 hover:text-white underline pb-2">
                           Usar otro correo
                        </a>
                    </div>
                    
                    <p class="text-[10px] text-slate-600 border-t border-slate-700 pt-2">tecnomania73@gmail.com</p>
                </div>

                <div class="border-t border-slate-700 pt-6">
                    <button onclick="app.offerRetentionDiscount()" class="text-slate-400 hover:text-white text-sm font-bold transition">
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        `;

        lucide.createIcons();
        overlay.classList.remove('hidden');
    },

    // [RETENTION] Offer 30% Discount on Exit
    offerRetentionDiscount: () => {
        const overlay = document.getElementById('subscription-locked-overlay');

        overlay.innerHTML = `
            <div class="bg-gradient-to-br from-indigo-900 to-purple-900 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl border border-indigo-500/30 animate-in zoom-in duration-300 relative overflow-hidden">
                
                <!-- Confetti Effect Background -->
                <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

                <div class="relative z-10">
                    <div class="inline-block bg-amber-500 text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-6 animate-bounce">
                        ¡Espera!
                    </div>

                    <h2 class="text-4xl font-black text-white mb-2">No te vayas aún...</h2>
                    <p class="text-indigo-200 mb-8 text-lg">Tenemos una oferta exclusiva para ti.</p>

                    <div class="bg-white/10 p-6 rounded-2xl border border-white/20 mb-8">
                        <p class="text-sm text-indigo-200 mb-1 uppercase tracking-widest">Descuento Especial</p>
                        <div class="text-5xl font-black text-white mb-2">-30%</div>
                        <p class="text-xs text-indigo-300">En tu renovación anual si actúas hoy.</p>
                    </div>

                    <div class="space-y-3">
                         <a href="https://mail.google.com/mail/?view=cm&fs=1&to=tecnomania73@gmail.com&su=QUIERO%20MI%20DESCUENTO%2030%25&body=Hola%2C%20quiero%20reactivar%20mi%20cuenta%20aprovechando%20el%2030%25%20de%20descuento." 
                           target="_blank"
                           onclick="setTimeout(() => { app.logout(); }, 5000)"
                           class="block w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl font-bold text-lg transition shadow-lg shadow-amber-900/50 flex items-center justify-center gap-2">
                           <i data-lucide="mail" class="w-5 h-5"></i>
                           Pedir con Gmail
                        </a>

                         <a href="mailto:tecnomania73@gmail.com?subject=QUIERO%20MI%20DESCUENTO%2030%25&body=Hola%2C%20quiero%20reactivar%20mi%20cuenta%20aprovechando%20el%2030%25%20de%20descuento."
                           onclick="setTimeout(() => { app.logout(); }, 5000)"
                           class="block w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm transition">
                           Usar otro correo
                        </a>
                        
                        <button onclick="app.logout()" class="block w-full bg-transparent hover:bg-white/5 text-indigo-300 py-3 rounded-xl text-sm font-bold transition">
                            No gracias, cerrar sesión
                        </button>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
    },

    loadAdminUsers: async () => {
        if (!app.isMaster) return;

        // FORCE VISIBILITY & DOM REPAIR
        const tab = document.getElementById('tab-admin');
        const mainContainer = document.getElementById('app-container');

        if (tab) {
            // 1. DOM Position Repair (Fixes nesting issues)
            if (mainContainer && tab.parentNode !== mainContainer) {
                console.warn("[ADMIN] Tab misplaced. Moving to root container...");
                mainContainer.appendChild(tab);
            }

            // 2. Force CSS Visibility (Class based only)
            tab.classList.remove('hidden');
            // tab.style.display = 'block'; // REMOVED: Caused persistence bug
            console.log("[ADMIN] Tab visible (Class toggle)");
        }

        const container = document.getElementById('admin-users-list');
        // Show loading state with Audit Button
        container.innerHTML = `
            <div class="col-span-full flex flex-col items-center py-10 gap-4">
                <i data-lucide="loader" class="w-10 h-10 animate-spin text-blue-500"></i>
                <p>Consultando base de datos...</p>
                <button onclick="app.runDiagnostics()" class="text-xs bg-slate-800 p-2 rounded border border-slate-700 hover:bg-slate-700">
                    🛠️ Auditoría de Emergencia
                </button>
            </div>
        `;

        try {
            console.log("[ADMIN] Iniciando carga de usuarios...");

            // Fetch all users
            const snapshot = await app.db.collection('users').get();
            console.log(`[ADMIN] Snapshot obtenido. Documentos: ${snapshot.size}`);

            if (snapshot.empty) {
                console.warn("[ADMIN] La colección 'users' parece vacía o no tengo permisos de lectura.");
                container.innerHTML = '<div class="col-span-full text-slate-400 text-center">No se encontraron usuarios (¿Permisos?).</div>';
                app.toast("Alerta: 0 usuarios encontrados.", "warning");
                return;
            }

            const users = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log(`[ADMIN] Usuario encontrado: ${doc.id}`, data);
                users.push({ id: doc.id, ...data });
            });

            app.renderAdminUsers(users);
            app.toast(`Éxito: ${users.length} usuarios cargados.`, "success");

        } catch (e) {
            console.error("[ADMIN] Error crítico cargando usuarios:", e);
            container.innerHTML = `<div class="col-span-full text-red-500 text-center"><p class="font-bold">Error de Acceso</p><p class="text-sm">${e.message}</p></div>`;
            app.toast("Error: " + e.message, "error");
        }
    },

    renderAdminUsers: (users) => {
        const container = document.getElementById('admin-users-list');
        container.innerHTML = '';

        if (users.length === 0) {
            container.innerHTML = '<div class="col-span-full text-slate-400 text-center">No hay usuarios registrados.</div>';
            return;
        }

        users.forEach(u => {
            const isMaster = u.email === 'tecnomania73@gmail.com';
            const expiry = u.subscription_expiry ? new Date(u.subscription_expiry).toLocaleDateString() : 'Sin acceso';
            const isExpired = u.subscription_expiry ? new Date() > new Date(u.subscription_expiry) : true;

            const card = document.createElement('div');
            card.className = `bg-slate-800 rounded-2xl p-6 border ${isMaster ? 'border-yellow-500/50' : 'border-slate-700'} relative overflow-hidden`;

            // Fallback for Legacy Users (Empty Root Doc)
            const displayName = u.user_name || u.name || "Usuario (Sin Nombre)";
            const displayEmail = u.email || "Email no visible (Legacy)";
            const initial = displayName.charAt(0).toUpperCase();

            // Card Template with Safe Variables
            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            ${initial}
                        </div>
                        <div>
                            <p class="font-bold text-white">${displayName}</p>
                            <p class="text-xs text-slate-400">${displayEmail}</p>
                        </div>
                    </div>
                    ${isMaster ? '<span class="bg-yellow-500/20 text-yellow-400 text-[10px] font-bold px-2 py-1 rounded uppercase">MASTER</span>' : ''}
                </div>

                <div class="bg-slate-900/50 rounded-xl p-3 mb-4 border border-slate-700/50">
                    <p class="text-xs text-slate-500 uppercase font-bold mb-1">Estado Suscripción</p>
                    <div class="flex justify-between items-center">
                        <span class="${isExpired ? 'text-red-400' : 'text-green-400'} font-mono text-sm font-bold">
                            ${isMaster ? '∞ Infinito' : expiry}
                        </span>
                        ${isExpired && !isMaster ? '<i data-lucide="lock" class="w-4 h-4 text-red-500"></i>' : '<i data-lucide="check-circle" class="w-4 h-4 text-green-500"></i>'}
                    </div>
                </div>

                ${!isMaster ? `
                <div class="grid grid-cols-2 gap-2">
                    <button onclick="app.grantAccess('${u.id}', 7)" class="bg-slate-700 hover:bg-blue-600 text-white text-xs py-2 rounded-lg transition">
                        +7 Días (Trial)
                    </button>
                    <button onclick="app.grantAccess('${u.id}', 30)" class="bg-slate-700 hover:bg-green-600 text-white text-xs py-2 rounded-lg transition">
                        +1 Mes
                    </button>
                    <button onclick="app.grantAccess('${u.id}', 365)" class="bg-slate-700 hover:bg-purple-600 text-white text-xs py-2 rounded-lg transition">
                        +1 Año
                    </button>
                    <button onclick="app.grantAccess('${u.id}', 0)" class="bg-slate-700 hover:bg-red-600 text-white text-xs py-2 rounded-lg transition flex items-center justify-center gap-1">
                        <i data-lucide="ban" class="w-3 h-3"></i> Revocar
                    </button>
                </div>
                ` : ''}
            `;
            container.appendChild(card);
        });
        lucide.createIcons();
    },

    grantAccess: async (userId, days) => {
        if (!app.isMaster) return;

        // Calculate new date
        let newDate;
        if (days === 0) {
            // Revoke: Set to yesterday
            newDate = new Date();
            newDate.setDate(newDate.getDate() - 1);
        } else {
            // Add to NOW (or add to existing expiry? Let's keep it simple: Add to NOW for reset/ext)
            // Or better: If has active subscription, add to it. If expired, add to NOW.
            const userDoc = await app.db.collection('users').doc(userId).get();
            const currentExpiry = userDoc.data().subscription_expiry;

            let baseDate = new Date();
            if (currentExpiry && new Date(currentExpiry) > baseDate) {
                baseDate = new Date(currentExpiry);
            }

            baseDate.setDate(baseDate.getDate() + days);
            newDate = baseDate;
        }

        try {
            await app.db.collection('users').doc(userId).set({
                subscription_expiry: newDate.toISOString()
            }, { merge: true });

            app.toast(days > 0 ? `Acceso extendido por ${days} días` : 'Acceso revocado', 'success');
            app.loadAdminUsers(); // Reload UI
        } catch (e) {
            app.toast('Error: ' + e.message, 'error');
        }
    },



    // [DIAGNOSTIC TOOL]
    // [DIAGNOSTIC TOOL]
    runDiagnostics: async () => {
        // Force User Check - Remove isMaster check for debug if needed, but safer to keep
        // Create Overlay
        const overlay = document.createElement('div');
        overlay.id = "audit-overlay";
        overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:99999;color:#0f0;font-family:monospace;padding:2rem;overflow:auto;white-space:pre-wrap;";
        overlay.innerHTML = "<h2 style='color:#fff;border-bottom:1px solid #333;padding-bottom:10px;margin-bottom:20px'>🔍 Auditoría del Sistema (v4.1)</h2><div id='audit-log'>Iniciando escaneo...</div><button onclick='this.parentElement.remove()' style='position:fixed;top:20px;right:20px;background:#c00;color:white;border:none;padding:10px 20px;cursor:pointer;font-weight:bold'>CERRAR</button>";
        document.body.appendChild(overlay);

        const log = (msg) => {
            const el = document.getElementById('audit-log');
            if (el) el.innerHTML += `\n> ${msg}`;
            console.log("[AUDIT]", msg);
        };

        try {
            const user = firebase.auth().currentUser;
            log(`Usuario Actual: ${user ? user.email : 'No logueado'}`);
            log(`UID: ${user ? user.uid : 'N/A'}`);
            log(`Es Master (Local): ${app.isMaster}`);

            if (!user) throw new Error("No hay usuario autenticado.");

            log("--- Conectando a Firestore ---");
            const snapshot = await app.db.collection('users').get();
            log(`✔️ Conexión Exitosa. Total Documentos: ${snapshot.size}`);

            if (snapshot.size === 0) {
                log("⚠️ ALERTA: La colección está vacía. Posibles causas:\n1. Reglas de seguridad bloquean lectura (Revisar logs consola).\n2. No hay usuarios creados.");
            }

            snapshot.forEach(doc => {
                const d = doc.data();
                const name = d.name || d.user_name || "Sin Nombre";
                const email = d.email || "No email";
                log(`\n📄 DOC ID: ${doc.id}`);
                log(`   - Nombre: ${name}`);
                log(`   - Email: ${email}`);
                log(`   - Expiración: ${d.subscription_expiry || 'Nivel Dios/Indefinido'}`);
            });

            log("\n--- Fin del Reporte ---");

        } catch (e) {
            log(`❌ ERROR CRÍTICO: ${e.message}`);
            log(JSON.stringify(e, null, 2));
        }
    },


    // Toggle Plan B (Survival Mode)
    togglePlanB: () => {
        const btn = document.getElementById('btn-planb');
        app.isPlanB = !app.isPlanB; // Toggle state

        if (app.isPlanB) {
            // Activate Plan B visual state
            btn.innerHTML = "DESACTIVAR PLAN B";
            btn.classList.replace('bg-red-50', 'bg-red-600');
            btn.classList.replace('text-red-600', 'text-white');
            document.body.classList.add('plan-b-active');
            // Optional: You could hide non-essential elements here
            app.toast("🚨 PLAN B ACTIVADO: Solo supervivencia. 1. Movimiento 2. Biblia 3. Trabajo Profundo.", "warning");
        } else {
            // Deactivate Plan B
            btn.innerHTML = "ACTIVAR PLAN B";
            btn.classList.replace('bg-red-600', 'bg-red-50');
            btn.classList.replace('text-white', 'text-red-600');
            document.body.classList.remove('plan-b-active');
        }
    },

    // Toggle Expansion Mode vs Monk Mode
    toggleMode: () => {
        const titleEl = document.getElementById('mode-title');
        const descEl = document.getElementById('mode-desc');
        const iconContainer = document.getElementById('mode-icon-container');

        // Simple toggle state stored in DOM or app variable
        const isExpansion = titleEl.innerText.includes('EXPANSIÓN');

        if (isExpansion) {
            // Switch to Monk Mode
            titleEl.innerText = "MODO MONJE (FOCUS)";
            descEl.innerText = "Objetivo: Profundidad y Silencio";
            iconContainer.innerHTML = '<i data-lucide="mountain" class="w-5 h-5"></i>';
            iconContainer.className = "p-2 rounded-full bg-slate-800 text-white hover:scale-110 transition shadow-sm"; // Dark theme for monk
        } else {
            // Switch back to Expansion Mode
            titleEl.innerText = "MODO EXPANSIÓN (CEO)";
            descEl.innerText = "Objetivo: Dominación total del día";
            iconContainer.innerHTML = '<i data-lucide="zap" class="w-5 h-5"></i>';
            iconContainer.className = "p-2 rounded-full bg-green-100 text-green-600 hover:scale-110 transition shadow-sm";
        }
        lucide.createIcons();
    },
    openFocusMode: () => {
        const modal = document.getElementById('focus-modal');
        const select = document.getElementById('focus-task-select');

        // Populate tasks
        select.innerHTML = '';
        const tasks = [
            { id: 'p1', val: app.weeklyData.priority_1, label: 'Roca #1' },
            { id: 'p2', val: app.weeklyData.priority_2, label: 'Roca #2' },
            { id: 'p3', val: app.weeklyData.priority_3, label: 'Roca #3' }
        ];

        tasks.forEach(t => {
            if (t.val) {
                const opt = document.createElement('option');
                opt.value = t.val;
                opt.text = `${t.label}: ${t.val.substring(0, 30)}...`;
                select.appendChild(opt);
            }
        });

        if (tasks.every(t => !t.val)) {
            const opt = document.createElement('option');
            opt.text = "Sin tareas definidas en Plan Semanal";
            select.appendChild(opt);
        }

        modal.classList.remove('hidden');
    },

    closeFocusMode: () => {
        document.getElementById('focus-modal').classList.add('hidden');
        app.stopTimer();
        if (app.brownNoiseSource) { // Check brownNoiseSource instead of brownNoise
            app.brownNoiseSource.stop();
            app.brownNoiseSource = null;
            app.isNoisePlaying = false;
        }
    },

    startTimer: () => {
        const btn = document.getElementById('btn-timer-action');
        if (app.focusInterval) {
            // Pause logic
            clearInterval(app.focusInterval);
            app.focusInterval = null;
            btn.innerHTML = '<i data-lucide="play" class="w-8 h-8 fill-current"></i>';
            btn.classList.replace('bg-amber-500', 'bg-green-500');
        } else {
            // Start logic
            app.focusInterval = setInterval(() => {
                if (app.focusTimeLeft > 0) {
                    app.focusTimeLeft--;
                    app.updateTimerDisplay();
                } else {
                    app.stopTimer();
                    app.toast("¡Tiempo Terminado!", "success");
                }
            }, 1000);
            btn.innerHTML = '<i data-lucide="pause" class="w-8 h-8 fill-current"></i>';
            btn.classList.replace('bg-green-500', 'bg-amber-500');
        }
        lucide.createIcons();
    },

    stopTimer: () => {
        clearInterval(app.focusInterval);
        app.focusInterval = null;
        const btn = document.getElementById('btn-timer-action');
        if (btn) {
            btn.innerHTML = '<i data-lucide="play" class="w-8 h-8 fill-current"></i>';
            btn.classList.replace('bg-amber-500', 'bg-green-500');
        }
        lucide.createIcons();
    },

    updateTimerDisplay: () => {
        const minutes = Math.floor(app.focusTimeLeft / 60);
        const seconds = app.focusTimeLeft % 60;
        document.getElementById('timer-display').innerText =
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    },

    toggleNoise: () => {
        const btn = document.getElementById('btn-noise');
        if (!app.isNoisePlaying) { // Check app.isNoisePlaying
            // Better approach: Web Audio API for infinite Brown Noise
            if (!app.audioCtx) {
                app.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Generate Brown Noise buffer
            const bufferSize = app.audioCtx.sampleRate * 2; // 2 seconds
            const buffer = app.audioCtx.createBuffer(1, bufferSize, app.audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            let lastOut = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 3.5; // Gain
            }

            app.brownNoiseSource = app.audioCtx.createBufferSource();
            app.brownNoiseSource.buffer = buffer;
            app.brownNoiseSource.loop = true;
            app.brownNoiseSource.connect(app.audioCtx.destination);
            app.brownNoiseSource.start();

            // State tracking
            app.isNoisePlaying = true;

            btn.classList.replace('bg-white/10', 'bg-white/30');
            btn.classList.add('ring-2', 'ring-white');
        } else {
            if (app.brownNoiseSource) { // Ensure source exists before stopping
                app.brownNoiseSource.stop();
                app.brownNoiseSource = null; // Re-create next time
                app.isNoisePlaying = false;

                btn.classList.replace('bg-white/30', 'bg-white/10');
                btn.classList.remove('ring-2', 'ring-white');
            }
        }
    },
    dragSrcEl: null,
    handleDragStart: (e) => {
        app.dragSrcEl = e.target.closest('[draggable]');
        e.dataTransfer.effectAllowed = 'move';
        e.target.style.opacity = '0.4';
    },
    handleDragOver: (e) => {
        if (e.preventDefault) e.preventDefault();
        return false;
    },
    handleDrop: async (e) => {
        e.stopPropagation();
        const card = e.target.closest('[draggable]');
        if (app.dragSrcEl !== card) {
            app.dragSrcEl.style.opacity = '1';

            // Logic: Swap display_order of source and target in Firestore
            const srcId = app.dragSrcEl.dataset.id;
            const targetId = card.dataset.id;

            const srcItem = app.networkData.find(i => i.id === srcId);
            const targetItem = app.networkData.find(i => i.id === targetId);

            if (srcItem && targetItem) {
                // Swap orders locally
                const tempOrder = srcItem.display_order;
                srcItem.display_order = targetItem.display_order;
                targetItem.display_order = tempOrder;

                // Save to DB
                const batch = app.db.batch();
                batch.update(app.db.collection('users').doc(app.userId).collection('network').doc(srcId), { display_order: srcItem.display_order });
                batch.update(app.db.collection('users').doc(app.userId).collection('network').doc(targetId), { display_order: targetItem.display_order });
                await batch.commit();

                app.loadNetwork(); // Reload to sort
            }
        }
        return false;
    },

    // =========================================================================
    // FEATURE: MONTHLY & SYSTEMS (Stubbed for brevity but fully functional)
    // =========================================================================
    loadMonthly: async () => {
        if (!app.userId) return;

        try {
            const doc = await app.db.collection('users').doc(app.userId).collection('monthly').doc('current').get();
            app.monthlyData = doc.exists ? doc.data() : {
                wins: '',
                drains: '',
                intention: '',
                revenue_last: '',
                revenue_goal: '',
                celebration: ''
            };
            app.renderMonthly();
        } catch (e) {
            console.error("Error loading monthly:", e);
            app.renderMonthly();
        }
    },
    saveMonthly: async () => {
        await app.db.collection('users').doc(app.userId).collection('monthly').doc('current').set(app.monthlyData, { merge: true });
    },
    updateMonthlyField: (key, val) => {
        app.monthlyData[key] = val;
        app.saveMonthly();
    },
    // FUNCIÓN renderMonthly() - IMPLEMENTACIÓN COMPLETA
    renderMonthly: () => {
        const container = document.getElementById('tab-monthly');
        if (!container) return;

        const currentMonth = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

        container.innerHTML = `
            <div class="max-w-4xl mx-auto space-y-6 px-4">
                <!-- Header -->
                <div class="text-center mb-8">
                    <div class="bg-amber-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <i data-lucide="target" class="w-8 h-8 text-amber-600"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-slate-800">Visión Mensual</h2>
                    <p class="text-slate-500 text-sm mt-2 capitalize">${currentMonth}</p>
                </div>

                <!-- Grid de 2 columnas -->
                <div class="grid md:grid-cols-2 gap-6">
                    
                    <!-- Victorias del Mes Pasado -->
                    <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="bg-green-100 p-2 rounded-xl">
                                <i data-lucide="trophy" class="w-5 h-5 text-green-600"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-slate-800">Victorias del Mes Pasado</h3>
                                <p class="text-xs text-slate-500">¿Qué lograste? Celebra tus éxitos</p>
                            </div>
                        </div>
                        <textarea 
                            class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                            rows="4"
                            placeholder="Ej: Cerré 3 proyectos, mejoré mi rutina matutina..."
                            onchange="app.updateMonthlyField('wins', this.value)">${app.monthlyData.wins || ''}</textarea>
                    </div>

                    <!-- Fugas de Energía -->
                    <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="bg-red-100 p-2 rounded-xl">
                                <i data-lucide="battery-low" class="w-5 h-5 text-red-600"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-slate-800">Fugas de Energía</h3>
                                <p class="text-xs text-slate-500">¿Qué te drenó? Identifica patrones</p>
                            </div>
                        </div>
                        <textarea 
                            class="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                            rows="4"
                            placeholder="Ej: Reuniones innecesarias, procrastinación..."
                            onchange="app.updateMonthlyField('drains', this.value)">${app.monthlyData.drains || ''}</textarea>
                    </div>
                </div>

                <!-- Intención del Mes -->
                <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-6 border border-blue-200">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="bg-blue-100 p-2 rounded-xl">
                            <i data-lucide="compass" class="w-5 h-5 text-blue-600"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-slate-800">Intención del Mes</h3>
                            <p class="text-xs text-slate-500">Una frase que guíe tus decisiones</p>
                        </div>
                        <button onclick="app.aiGenerateIntention()" 
                            class="ml-auto bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-200 transition flex items-center gap-2">
                            <i data-lucide="sparkles" class="w-4 h-4"></i>
                            IA: Sugerir
                        </button>
                    </div>
                    <input type="text"
                        id="monthly-intention"
                        class="w-full p-4 bg-white rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium text-center"
                        placeholder="Ej: 'Este mes elijo la claridad sobre la velocidad'"
                        value="${app.monthlyData.intention || ''}"
                        onchange="app.updateMonthlyField('intention', this.value)">
                </div>

                <!-- Métricas Financieras -->
                <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="bg-amber-100 p-2 rounded-xl">
                            <i data-lucide="euro" class="w-5 h-5 text-amber-600"></i>
                        </div>
                        <h3 class="font-bold text-slate-800">Métricas Financieras</h3>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Facturación Mes Pasado</label>
                            <input type="text"
                                class="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                placeholder="€ 0.00"
                                value="${app.monthlyData.revenue_last || ''}"
                                onchange="app.updateMonthlyField('revenue_last', this.value)">
                        </div>
                        <div>
                            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Meta Este Mes</label>
                            <input type="text"
                                class="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                placeholder="€ 0.00"
                                value="${app.monthlyData.revenue_goal || ''}"
                                onchange="app.updateMonthlyField('revenue_goal', this.value)">
                        </div>
                    </div>
                </div>

                <!-- Celebración Planeada -->
                <div class="bg-gradient-to-br from-pink-50 to-amber-50 rounded-3xl p-6 border border-pink-200">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="bg-pink-100 p-2 rounded-xl">
                            <i data-lucide="party-popper" class="w-5 h-5 text-pink-600"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-slate-800">Celebración Planeada</h3>
                            <p class="text-xs text-slate-500">¿Cómo te premiarás al lograr tu meta?</p>
                        </div>
                    </div>
                    <input type="text"
                        class="w-full p-4 bg-white rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="Ej: Cena especial, día libre, compra especial..."
                        value="${app.monthlyData.celebration || ''}"
                        onchange="app.updateMonthlyField('celebration', this.value)">
                </div>
            </div>
        `;

        lucide.createIcons();
    },

    // Función para generar intención con IA
    aiGenerateIntention: async () => {
        const wins = app.monthlyData.wins || '';
        const drains = app.monthlyData.drains || '';

        const intentionInput = document.getElementById('monthly-intention');
        if (!intentionInput) return;

        intentionInput.value = '⏳ Generando intención...';
        intentionInput.disabled = true;

        try {
            const prompt = `
Basándote en esta información del usuario, genera UNA intención mensual poderosa y concisa (máximo 10 palabras):

Victorias del mes pasado: ${wins || 'No especificado'}
Fugas de energía: ${drains || 'No especificado'}

La intención debe ser:
- En primera persona
- Positiva y motivadora
- Específica pero flexible
- Fácil de recordar

Responde SOLO con la intención, sin explicaciones. Ejemplo: "Este mes elijo la claridad sobre la velocidad"`;

            const result = await app.callGeminiAI(prompt);
            const cleanResult = result.replace(/^["']|["']$/g, '').trim(); // Limpiar si devuelve comillas simples/dobles al inicio/fin

            intentionInput.value = cleanResult;
            app.updateMonthlyField('intention', cleanResult);

        } catch (e) {
            intentionInput.value = '';
            app.toast("Error al generar intención: " + e.message, "error");
        } finally {
            intentionInput.disabled = false;
        }
    },


    // SYSTEMS
    loadSystems: async () => {
        const snapshot = await app.db.collection('users').doc(app.userId).collection('systems').get();
        app.systemsData = [];
        snapshot.forEach(doc => app.systemsData.push({ id: doc.id, ...doc.data() }));
        app.renderSystems();
    },
    saveSystem: async (data) => {
        const modal = document.getElementById('wizard-modal');
        const editingId = modal.dataset.editingId;

        try {
            if (editingId) {
                // MODO EDICIÓN - Actualizar existente
                await app.db.collection('users').doc(app.userId).collection('systems').doc(editingId).update(data);
                delete modal.dataset.editingId;
            } else {
                // MODO CREACIÓN - Crear nuevo
                await app.db.collection('users').doc(app.userId).collection('systems').add({
                    ...data,
                    created_at: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            app.loadSystems();
            app.closeSystemModal();

            // Resetear formulario
            document.querySelector('#wizard-modal form').reset();
            const submitBtn = document.querySelector('#wizard-modal form button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = 'Guardar Sistema';
            }

        } catch (e) {
            app.toast("Error: " + e.message, "error");
        }
    },
    renderSystems: () => {
        const container = document.getElementById('systems-grid');
        if (!container) return;

        // Limpiar solo el grid, NO todo el tab
        container.innerHTML = '';

        // Colores por categoría
        const categoryColors = {
            'Espiritual': { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', icon: 'book-open' },
            'Familia': { bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700', icon: 'heart' },
            'Salud': { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', icon: 'activity' },
            'Trabajo': { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', icon: 'briefcase' },
            'Finanzas': { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', icon: 'wallet' },
            'Relaciones': { bg: 'bg-pink-50', border: 'border-pink-200', badge: 'bg-pink-100 text-pink-700', icon: 'users' },
            'Educación': { bg: 'bg-cyan-50', border: 'border-cyan-200', badge: 'bg-cyan-100 text-cyan-700', icon: 'graduation-cap' },
            'Creatividad': { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', icon: 'palette' },
            'default': { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-700', icon: 'box' }
        };

        if (app.systemsData.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-16">
                <div class="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="box" class="w-10 h-10 text-slate-400"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-600 mb-2">Sin sistemas todavía</h3>
                <p class="text-slate-400 mb-6">Crea tu primer sistema para construir hábitos poderosos</p>
                <button onclick="app.openSystemModal()" class="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2 hover:bg-blue-700 transition">
                    <i data-lucide="plus" class="w-5 h-5"></i> Crear Primer Sistema
                </button>
            </div >
            `;
            lucide.createIcons();
            return;
        }

        app.systemsData.forEach(s => {
            const colors = categoryColors[s.area] || categoryColors['default'];

            const card = `
            <div class="bg-white rounded-3xl border ${colors.border} shadow-sm hover:shadow-md transition-all relative group overflow-hidden" data-system-id="${s.id}">
                <!-- Header con categoría y acciones -->
                <div class="p-5 pb-0">
                    <div class="flex justify-between items-start mb-3">
                        <span class="${colors.badge} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            ${s.area || 'General'}
                        </span>
                        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onclick="app.editSystem('${s.id}')" class="p-1.5 hover:bg-slate-100 rounded-lg transition" title="Editar">
                                <i data-lucide="pencil" class="w-4 h-4 text-slate-400"></i>
                            </button>
                            <button onclick="app.deleteSystem('${s.id}')" class="p-1.5 hover:bg-red-50 rounded-lg transition" title="Eliminar">
                                <i data-lucide="trash-2" class="w-4 h-4 text-red-400"></i>
                            </button>
                        </div>
                        <!-- Checkmark decorativo -->
                        <div class="absolute top-4 right-4 opacity-20 group-hover:opacity-0 transition-opacity">
                            <i data-lucide="check-circle" class="w-6 h-6 text-slate-300"></i>
                        </div>
                    </div>
                    
                    <!-- Título e Identidad -->
                    <h3 class="font-bold text-xl text-slate-900 mb-1 pr-8">${s.title || 'Sin título'}</h3>
                    <p class="text-sm text-slate-400 italic mb-4">"${s.identity || 'Sin identidad definida'}"</p>
                </div>
                
                <!--Contenido -->
                <div class="px-5 pb-4 space-y-3">
                    <div class="flex items-start gap-2">
                        <i data-lucide="zap" class="w-4 h-4 text-amber-500 mt-0.5 shrink-0"></i>
                        <div>
                            <p class="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Acción:</p>
                            <p class="text-sm text-slate-700">${s.action || 'Sin definir'}</p>
                        </div>
                    </div>
                    
                    <div class="flex items-start gap-2">
                        <i data-lucide="clock" class="w-4 h-4 text-purple-500 mt-0.5 shrink-0"></i>
                        <div>
                            <p class="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Gatillo:</p>
                            <p class="text-sm text-slate-700">${s.trigger || 'Sin definir'}</p>
                        </div>
                    </div>
                </div>
                
                <!--Plan B(si existe)-- >
                ${s.plan_b ? `
                <div class="px-5 pb-5 pt-2 border-t border-slate-100">
                    <div class="flex items-start gap-2">
                        <i data-lucide="life-buoy" class="w-4 h-4 text-red-400 mt-0.5 shrink-0"></i>
                        <div>
                            <p class="text-[10px] font-bold uppercase text-red-400 tracking-wider">Plan B</p>
                            <p class="text-sm text-slate-600">${s.plan_b}</p>
                        </div>
                    </div>
                </div>
                ` : ''
                }
            </div >
    `;

            container.innerHTML += card;
        });

        lucide.createIcons();
    },

    // EDITAR SISTEMA
    editSystem: async (id) => {
        const system = app.systemsData.find(s => s.id === id);
        if (!system) return app.toast("Sistema no encontrado", "error");

        // Abrir modal y rellenar campos
        app.openSystemModal();

        // Pequeño delay para que el modal se abra
        setTimeout(() => {
            document.getElementById('sys-area').value = system.area || 'Salud';
            document.getElementById('sys-goal').value = system.goal || '';
            document.getElementById('sys-title').value = system.title || '';
            document.getElementById('sys-identity').value = system.identity || '';
            document.getElementById('sys-action').value = system.action || '';
            document.getElementById('sys-trigger').value = system.trigger || '';
            document.getElementById('sys-environment').value = system.environment || '';
            document.getElementById('sys-planb').value = system.plan_b || '';

            // Guardar ID para saber que estamos editando
            document.getElementById('wizard-modal').dataset.editingId = id;

            // Cambiar texto del botón
            const submitBtn = document.querySelector('#wizard-modal form button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i data-lucide="save" class="w-5 h-5"></i> Actualizar Sistema';
                lucide.createIcons();
            }
        }, 100);
    },

    // ELIMINAR SISTEMA
    deleteSystem: async (id) => {
        const system = app.systemsData.find(s => s.id === id);
        if (!system) return;

        const confirmDelete = confirm(`¿Seguro que deseas eliminar el sistema "${system.title}" ?\n\nEsta acción no se puede deshacer.`);

        if (confirmDelete) {
            try {
                await app.db.collection('users').doc(app.userId).collection('systems').doc(id).delete();
                app.systemsData = app.systemsData.filter(s => s.id !== id);
                app.renderSystems();
                // Opcional: mostrar notificación de éxito
            } catch (e) {
                app.toast("Error al eliminar: " + e.message, "error");
            }
        }
    },
    openSystemModal: () => document.getElementById('wizard-modal').classList.remove('hidden'),
    closeSystemModal: () => {
        const modal = document.getElementById('wizard-modal');
        modal.classList.add('hidden');

        // Limpiar estado de edición
        delete modal.dataset.editingId;

        // Resetear formulario
        const form = modal.querySelector('form');
        if (form) form.reset();

        // Restaurar texto del botón
        const submitBtn = modal.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = 'Guardar Sistema';
        }
    },

    generateAI: async () => {
        const goal = document.getElementById('sys-goal').value;
        const area = document.getElementById('sys-area').value;
        if (!goal) return app.toast("Escribe una meta", "warning");

        try {
            app.toast("Generando Sistema... (Esto puede tomar unos segundos)", "info");

            // PROMPT MEJORADO
            const prompt = `Actúa como James Clear (Atomic Habits). El usuario quiere un sistema para el área "${area}" con la meta: "${goal}".
        
        OBJETIVO: Generar un protocolo de comportamiento específico.
        
        IMPORTANTE: 
        - Responde SOLO con un objeto JSON válido. 
        - NO uses bloques de código markdown (\`\`\`json).
        - NO incluyas texto introductorio ni conclusiones.
        
        Estructura JSON requerida:
        {
            "title": "Nombre corto y memorable del sistema",
            "identity": "Afirmación de identidad en presente (ej: Soy un atleta)",
            "action": "La acción mínima viable (< 2 min) para empezar",
            "trigger": "Disparador específico (Cuándo/Dónde sucedera)",
            "environment": "Un cambio en el entorno para hacerlo obvio/fácil",
            "plan_b": "Estrategia 'Si todo falla' (versión reducida)"
        }`;

            const res = await app.callGeminiAI(prompt, "Eres un arquitecto de hábitos estricto. Respondes solo con JSON puro.");
            console.log("AI Raw Response:", res);

            const sys = app.parseAIJSON(res);

            if (!sys || !sys.title) throw new Error("Datos incompletos en la respuesta.");

            // Asignar valores
            document.getElementById('sys-title').value = sys.title || '';
            document.getElementById('sys-identity').value = sys.identity || '';
            document.getElementById('sys-action').value = sys.action || '';
            document.getElementById('sys-trigger').value = sys.trigger || '';
            document.getElementById('sys-environment').value = sys.environment || '';
            document.getElementById('sys-planb').value = sys.plan_b || sys.planB || '';

            app.toast("Sistema generado con éxito", "success");

        } catch (e) {
            console.error("Error generating system:", e);
            app.toast("Error al generar: " + e.message, "error");
        }
    },

    // MANIFESTO
    openManifesto: () => document.getElementById('manifesto-modal').classList.remove('hidden'),
    closeManifesto: () => document.getElementById('manifesto-modal').classList.add('hidden'),
};

window.app = app;
window.onload = app.init;
