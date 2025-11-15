const CF_CREATE_MEMBERSHIP = 'https://us-central1-bloqueaspamcl-29064.cloudfunctions.net/createMembership';
const CF_CREATE_SUBSCRIPTION = 'https://us-central1-bloqueaspamcl-29064.cloudfunctions.net/createSubscription';
const CF_CHECK_USER = 'https://us-central1-bloqueaspamcl-29064.cloudfunctions.net/checkUser';

const firebaseConfig = {
  apiKey: "AIzaSyCLZ0dpw_yDwXvtPVGNDPEcUYQh6h7VKrA",
  authDomain: "bloqueaspamcl-29064.firebaseapp.com",
  projectId: "bloqueaspamcl-29064",
  storageBucket: "bloqueaspamcl-29064.firebasestorage.app",
  messagingSenderId: "829054766651",
  appId: "1:829054766651:web:4b3b1e7c8fd0f1b36f0e9a"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

let selectedPlatform = null;
let currentStep = 'platform';
let userEmail = '';
let selectedPlan = 'free';
let currentUser = null;

const PROMO_END = new Date('2024-11-30T23:59:59');

function updateCountdown() {
    const now = new Date();
    const diff = Math.max(0, PROMO_END - now);
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    document.getElementById('countdown').textContent = `${d}d ${h}h ${m}m ${s}s`;
}
setInterval(updateCountdown, 1000);
updateCountdown();

// Detectar parámetros URL al cargar
window.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailFromUrl = urlParams.get('email');
    const action = urlParams.get('action');
    const paymentStatus = urlParams.get('payment');
    
    // Usuario regresó de MercadoPago
    if (paymentStatus === 'success') {
        selectedPlatform = 'android';
        currentStep = 'download';
        document.getElementById('platformSection').classList.add('hidden');
        document.getElementById('stepsSection').classList.remove('hidden');
        updateSteps();
        showDownloadForm();
        setTimeout(() => lucide.createIcons(), 100);
        return;
    }
    
    // Usuario viene del email para upgrade
    if (emailFromUrl && action === 'upgrade') {
        userEmail = emailFromUrl;
        
        // Verificar si usuario existe
        try {
            const response = await fetch(CF_CHECK_USER, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailFromUrl })
            });
            
            const data = await response.json();
            
            if (data.exists && data.membershipType === 'free') {
                // Usuario existe con plan gratis → ir directo a planes premium
                selectedPlatform = 'android';
                currentStep = 'plans';
                document.getElementById('platformSection').classList.add('hidden');
                document.getElementById('stepsSection').classList.remove('hidden');
                updateSteps();
                
                // Mostrar solo planes premium pre-seleccionados
                showUpgradePlansOnly();
                return;
            }
        } catch (error) {
            console.error('Error verificando usuario:', error);
        }
    }
});

auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('✅ Usuario autenticado:', user.email);
        currentUser = user;
        userEmail = user.email;
    }
});

window.selectPlatform = function(platform) {
    selectedPlatform = platform;
    
    if (platform === 'ios') {
        showIOSWaitlist();
    } else {
        currentStep = 'signup';
        document.getElementById('platformSection').classList.add('hidden');
        document.getElementById('stepsSection').classList.remove('hidden');
        showSignupForm();
        setTimeout(() => lucide.createIcons(), 100);
    }
};

function showIOSWaitlist() {
    const container = document.getElementById('formContainer');
    container.innerHTML = `
        <div class="rounded-2xl border border-slate-200 bg-white p-5">
            <div class="flex items-center gap-3 mb-3">
                <div class="p-3 rounded-xl bg-slate-100">
                    <i data-lucide="smartphone" class="w-8 h-8 text-slate-700"></i>
                </div>
                <div>
                    <h3 class="text-lg font-semibold">iOS Próximamente</h3>
                    <p class="text-sm text-slate-600">Te avisaremos cuando esté lista</p>
                </div>
            </div>
            
            <form id="iosWaitlistForm" class="space-y-3 mt-4">
                <input type="email" id="iosEmail" required 
                       placeholder="tu@email.com"
                       class="w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900">
                <button type="submit" id="iosSubmitBtn"
                        class="w-full rounded-xl bg-slate-900 text-white px-4 py-2 font-medium flex items-center justify-center gap-2">
                    <i data-lucide="bell" class="w-4 h-4"></i>
                    <span>Unirme a la lista</span>
                </button>
            </form>
            <div id="iosMessage" class="mt-4 hidden"></div>
        </div>
    `;
    document.getElementById('platformSection').classList.add('hidden');
    document.getElementById('stepsSection').classList.add('hidden');
    setTimeout(() => {
        lucide.createIcons();
        
        // Agregar event listener al formulario
        const form = document.getElementById('iosWaitlistForm');
        if (form) {
            form.addEventListener('submit', submitIOSWaitlist);
        }
    }, 100);
}

async function submitIOSWaitlist(e) {
    e.preventDefault();
    console.log('📝 iOS Waitlist: Iniciando registro...');
    
    const email = document.getElementById('iosEmail').value;
    const submitBtn = document.getElementById('iosSubmitBtn');
    const messageDiv = document.getElementById('iosMessage');
    
    if (!submitBtn) {
        console.error('❌ Botón submit no encontrado');
        return;
    }
    
    // Guardar HTML original
    const originalHTML = submitBtn.innerHTML;
    
    // Deshabilitar botón y mostrar estado
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Registrando...</span>';
    
    try {
        console.log('📤 Enviando a Cloud Function:', email);
        
        const response = await fetch(CF_CREATE_MEMBERSHIP, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: email, 
                platform: 'ios', 
                authMethod: 'email' 
            })
        });
        
        console.log('📥 Respuesta recibida:', response.status);
        
        const data = await response.json();
        console.log('📊 Data:', data);
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al registrarse en la lista de espera');
        }
        
        console.log('✅ Registro exitoso');
        
        // Mostrar pantalla de éxito
        const container = document.getElementById('formContainer');
        container.innerHTML = `
            <div class="rounded-2xl border border-slate-200 bg-white p-5">
                <div class="flex items-center gap-3 mb-4">
                    <div class="p-3 rounded-xl bg-emerald-100">
                        <i data-lucide="check-circle" class="w-8 h-8 text-emerald-600"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold">¡Listo!</h3>
                        <p class="text-sm text-slate-600">Estás en la lista de espera</p>
                    </div>
                </div>
                
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4">
                    <p class="text-sm text-slate-700 mb-2">
                        <strong>Email confirmado:</strong><br>
                        ${email}
                    </p>
                    <p class="text-xs text-slate-600">
                        Te notificaremos cuando la app para iOS esté disponible.
                    </p>
                </div>
                
                <div class="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                    <i data-lucide="mail" class="w-5 h-5 text-blue-600 mt-0.5"></i>
                    <div class="text-xs text-blue-800">
                        <strong>Revisa tu email</strong><br>
                        Te enviamos una confirmación.
                    </div>
                </div>
            </div>
        `;
        setTimeout(() => lucide.createIcons(), 100);
        
    } catch (error) {
        console.error('❌ Error en iOS waitlist:', error);
        
        // Mostrar mensaje de error
        if (messageDiv) {
            messageDiv.className = 'mt-4 p-4 rounded-xl flex items-start gap-3 bg-red-100 text-red-800 border border-red-300';
            messageDiv.innerHTML = `
                <i data-lucide="alert-circle" class="w-5 h-5 mt-0.5"></i>
                <span class="text-sm">${error.message}</span>
            `;
            messageDiv.classList.remove('hidden');
            setTimeout(() => lucide.createIcons(), 50);
        }
        
        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
        setTimeout(() => lucide.createIcons(), 50);
    }
}

// Asegurar que esté disponible globalmente
window.submitIOSWaitlist = submitIOSWaitlist;

function showSignupForm() {
    const container = document.getElementById('formContainer');
    container.innerHTML = `
        <div class="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 class="text-lg font-semibold mb-2">Crea tu cuenta</h3>
            
            <button onclick="signInWithGoogle()" 
                    id="googleSignInButton"
                    class="w-full flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 px-4 py-2 text-slate-800 font-medium mb-4">
                <svg class="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
            </button>
            
            <div class="relative my-4">
                <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-slate-300"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                    <span class="px-2 bg-white text-slate-500">O</span>
                </div>
            </div>
            
            <form onsubmit="signUpWithEmail(event)" class="space-y-3">
                <div>
                    <label class="text-sm text-slate-700">Correo</label>
                    <input type="email" id="signupEmail" required 
                           placeholder="tu@email.com"
                           class="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900">
                </div>
                <div>
                    <label class="text-sm text-slate-700">Contraseña</label>
                    <input type="password" id="signupPassword" required minlength="6"
                           placeholder="Mínimo 6 caracteres"
                           class="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900">
                </div>
                <button type="submit" id="signupButton"
                        class="w-full rounded-xl bg-slate-900 text-white px-4 py-2 font-medium">
                    Crear cuenta
                </button>
            </form>
            
            <div class="mt-4 text-center">
                <button onclick="showLoginForm()" class="text-sm text-slate-600 hover:text-slate-900">
                    ¿Ya tienes cuenta? <span class="font-medium">Inicia sesión</span>
                </button>
            </div>
        </div>
        <div id="signupMessage" class="mt-4 hidden"></div>
    `;
    setTimeout(() => lucide.createIcons(), 100);
}

function showLoginForm() {
    const container = document.getElementById('formContainer');
    container.innerHTML = `
        <div class="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 class="text-lg font-semibold mb-2">Inicia sesión</h3>
            
            <button onclick="signInWithGoogle()" 
                    id="googleSignInButton"
                    class="w-full flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 px-4 py-2 text-slate-800 font-medium mb-4">
                <svg class="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
            </button>
            
            <div class="relative my-4">
                <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-slate-300"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                    <span class="px-2 bg-white text-slate-500">O</span>
                </div>
            </div>
            
            <form onsubmit="loginWithEmail(event)" class="space-y-3">
                <div>
                    <label class="text-sm text-slate-700">Correo</label>
                    <input type="email" id="loginEmail" required 
                           placeholder="tu@email.com"
                           class="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900">
                </div>
                <div>
                    <label class="text-sm text-slate-700">Contraseña</label>
                    <input type="password" id="loginPassword" required
                           placeholder="Tu contraseña"
                           class="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900">
                </div>
                <button type="submit" id="loginButton"
                        class="w-full rounded-xl bg-slate-900 text-white px-4 py-2 font-medium">
                    Iniciar sesión
                </button>
            </form>
            
            <div class="mt-4 text-center">
                <button onclick="showSignupForm()" class="text-sm text-slate-600 hover:text-slate-900">
                    ¿No tienes cuenta? <span class="font-medium">Regístrate</span>
                </button>
            </div>
        </div>
        <div id="loginMessage" class="mt-4 hidden"></div>
    `;
    setTimeout(() => lucide.createIcons(), 100);
}

window.signUpWithEmail = async function(e) {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const btn = document.getElementById('signupButton');
    
    btn.disabled = true;
    btn.textContent = 'Creando cuenta...';
    
    try {
        const response = await fetch(CF_CREATE_MEMBERSHIP, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email, 
                password, 
                platform: selectedPlatform,
                authMethod: 'email',
                plan: 'free'
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al crear cuenta');
        }
        
        await auth.signInWithEmailAndPassword(email, password);
        userEmail = email;
        
        showMessage('✅ Cuenta creada. Selecciona tu plan...', 'success');
        setTimeout(() => {
            currentStep = 'plans';
            updateSteps();
            showPlansForm();
        }, 1500);
        
    } catch (error) {
        showMessage('❌ ' + error.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Crear cuenta';
    }
};

window.loginWithEmail = async function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginButton');
    
    btn.disabled = true;
    btn.textContent = 'Iniciando sesión...';
    
    try {
        const checkResponse = await fetch(CF_CHECK_USER, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const userData = await checkResponse.json();
        
        if (!userData.exists) {
            throw new Error('Usuario no encontrado. Regístrate primero.');
        }
        
        await auth.signInWithEmailAndPassword(email, password);
        userEmail = email;
        
        showMessage('✅ Sesión iniciada. Selecciona tu plan...', 'success');
        setTimeout(() => {
            currentStep = 'plans';
            updateSteps();
            showPlansForm();
        }, 1500);
        
    } catch (error) {
        showMessage('❌ ' + error.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Iniciar sesión';
    }
};

window.signInWithGoogle = async function() {
    const btn = document.getElementById('googleSignInButton');
    if (!btn) {
        console.error('❌ Botón de Google no encontrado');
        return;
    }
    
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Abriendo Google...';
    
    try {
        console.log('🔍 Iniciando Google Sign-In...');
        
        // Verificar que Firebase Auth está disponible
        if (typeof auth === 'undefined' || typeof googleProvider === 'undefined') {
            throw new Error('Firebase Auth no está inicializado correctamente');
        }
        
        console.log('✅ Firebase Auth disponible');
        btn.textContent = 'Conectando con Google...';
        
        // Popup de Google (REAL, no simulado)
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        
        console.log('✅ Usuario autenticado con Google:', user.email);
        userEmail = user.email;
        
        btn.textContent = 'Verificando cuenta...';
        
        // Verificar si el usuario ya existe
        const checkResponse = await fetch(CF_CHECK_USER, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email })
        });
        
        const userData = await checkResponse.json();
        console.log('📊 Estado de usuario:', userData);
        
        // Si no existe, crear la cuenta
        if (!userData.exists) {
            console.log('📝 Creando nueva cuenta...');
            btn.textContent = 'Creando cuenta...';
            
            const response = await fetch(CF_CREATE_MEMBERSHIP, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: user.email,
                    platform: selectedPlatform,
                    authMethod: 'google',
                    plan: 'free'
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error al crear cuenta');
            }
            
            console.log('✅ Cuenta creada exitosamente');
        } else {
            console.log('✅ Usuario ya existe, continuando...');
        }
        
        showMessage('✅ Conectado con Google. Selecciona tu plan...', 'success');
        setTimeout(() => {
            currentStep = 'plans';
            updateSteps();
            showPlansForm();
        }, 1500);
        
    } catch (error) {
        console.error('❌ Error en Google Sign-In:', error);
        
        let errorMessage = error.message;
        
        // Mensajes de error específicos
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Cancelaste el inicio de sesión con Google';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'El navegador bloqueó el popup. Permite popups para este sitio.';
        } else if (error.code === 'auth/unauthorized-domain') {
            errorMessage = 'Este dominio no está autorizado en Firebase. Contacta al administrador.';
        }
        
        showMessage('❌ ' + errorMessage, 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
        setTimeout(() => lucide.createIcons(), 100);
    }
};

function showPlansForm() {
    const container = document.getElementById('formContainer');
    container.innerHTML = `
        <div class="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 class="text-lg font-semibold mb-2">Selecciona tu plan</h3>
            <p class="text-sm text-slate-600 mb-4">Promoción especial hasta el 30 de noviembre</p>
            
            <div class="space-y-3 mb-4">
                <div id="planFree" onclick="selectPlan('free')" 
                     class="p-4 rounded-xl border-2 border-slate-900 shadow-lg cursor-pointer hover:shadow-xl transition">
                    <div class="flex items-start justify-between mb-2">
                        <div>
                            <h4 class="font-semibold">Plan Gratis</h4>
                            <p class="text-2xl font-bold mt-1">$0<span class="text-sm font-normal text-slate-600">/mes</span></p>
                        </div>
                        <span class="px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">Gratis</span>
                    </div>
                    <ul class="text-xs space-y-1.5 text-slate-700">
                        <li class="flex items-start gap-2">
                            <i data-lucide="check" class="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0"></i>
                            <span>Bloqueo spam comunitario</span>
                        </li>
                    </ul>
                </div>
                
                <div id="planMonthly" onclick="selectPlan('premium_monthly')" 
                     class="p-4 rounded-xl border-2 border-slate-300 cursor-pointer hover:shadow-lg transition">
                    <div class="flex items-start justify-between mb-2">
                        <div>
                            <h4 class="font-semibold">Premium Mensual</h4>
                            <p class="text-2xl font-bold mt-1">
                                $990<span class="text-sm font-normal text-slate-600">/mes</span>
                            </p>
                            <p class="text-xs text-slate-500 line-through">Antes: $2,990/mes</p>
                        </div>
                        <span class="px-3 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">-67%</span>
                    </div>
                    <ul class="text-xs space-y-1.5 text-slate-700">
                        <li class="flex items-start gap-2">
                            <i data-lucide="check" class="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0"></i>
                            <span>Todo lo del plan gratis</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <i data-lucide="check" class="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0"></i>
                            <span>Bloqueo prefijos 600/809</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <i data-lucide="check" class="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0"></i>
                            <span>Modo "Solo Contactos Seguros"</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <i data-lucide="check" class="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0"></i>
                            <span>Lista de bloqueo personalizada</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <i data-lucide="check" class="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0"></i>
                            <span>Estadísticas detalladas</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <i data-lucide="sparkles" class="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0"></i>
                            <span class="font-medium">7 días de prueba gratis</span>
                        </li>
                    </ul>
                </div>
                
                <div id="planAnnual" onclick="selectPlan('premium_annual')" 
                     class="p-4 rounded-xl border-2 border-slate-300 cursor-pointer hover:shadow-lg transition">
                    <div class="flex items-start justify-between mb-2">
                        <div>
                            <h4 class="font-semibold">Premium Anual</h4>
                            <p class="text-2xl font-bold mt-1">
                                $5,990<span class="text-sm font-normal text-slate-600">/año</span>
                            </p>
                            <p class="text-xs text-slate-500 line-through">Antes: $9,990/año</p>
                        </div>
                        <span class="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">-40%</span>
                    </div>
                    <ul class="text-xs space-y-1.5 text-slate-700">
                        <li class="flex items-start gap-2">
                            <i data-lucide="check" class="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0"></i>
                            <span>Todo lo del plan Premium</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <i data-lucide="trending-down" class="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0"></i>
                            <span class="font-medium">Ahorra $5,900 al año</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <i data-lucide="sparkles" class="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0"></i>
                            <span class="font-medium">7 días de prueba gratis</span>
                        </li>
                    </ul>
                </div>
            </div>
            
            <button onclick="proceedToCheckout()" 
                    id="payButton"
                    class="w-full px-5 py-3 rounded-2xl bg-slate-900 text-white font-medium shadow hover:shadow-md disabled:opacity-60">
                Continuar con Plan Gratis
            </button>
            
            <p class="text-[11px] text-slate-500 text-center mt-3">
                Los pagos se procesan de forma segura
            </p>
        </div>
        <div id="plansMessage" class="mt-4 hidden"></div>
    `;
    setTimeout(() => lucide.createIcons(), 100);
}

// NUEVA FUNCIÓN: Mostrar solo planes premium para upgrade
function showUpgradePlansOnly() {
    const container = document.getElementById('formContainer');
    container.innerHTML = `
        <div class="rounded-2xl border border-slate-200 bg-white p-5">
            <div class="mb-4">
                <h3 class="text-lg font-semibold">Actualiza a Premium</h3>
                <p class="text-sm text-slate-600">¡Hola! Desbloquea todas las funciones</p>
            </div>
            
            <div class="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200">
                <p class="text-xs text-blue-800">
                    <strong>Cuenta actual:</strong> ${userEmail}
                </p>
            </div>
            
            <div class="space-y-3 mb-4">
                <div id="planMonthly" onclick="selectPlan('premium_monthly')" 
                     class="p-4 rounded-xl border-2 border-slate-900 shadow-lg cursor-pointer hover:shadow-xl transition">
                    <div class="flex items-start justify-between mb-2">
                        <div>
                            <h4 class="font-semibold">Premium Mensual</h4>
                            <p class="text-2xl font-bold mt-1">
                                $990<span class="text-sm font-normal text-slate-600">/mes</span>
                            </p>
                            <p class="text-xs text-slate-500 line-through">Antes: $2,990/mes</p>
                        </div>
                        <span class="px-3 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">-67%</span>
                    </div>
                    <ul class="text-xs space-y-1.5 text-slate-700">
                        <li class="flex items-start gap-2">
                            <i data-lucide="check" class="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0"></i>
                            <span>Bloqueo spam comunitario</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <i data-lucide="check" class="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0"></i>
                            <span>Bloqueo prefijos 600/809</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <i data-lucide="check" class="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0"></i>
                            <span>Modo "Solo Contactos Seguros"</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <i data-lucide="check" class="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0"></i>
                            <span>Lista de bloqueo personalizada</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <i data-lucide="check" class="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0"></i>
                            <span>Estadísticas detalladas</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <i data-lucide="sparkles" class="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0"></i>
                            <span class="font-medium">7 días de prueba gratis</span>
                        </li>
                    </ul>
                </div>
                
                <div id="planAnnual" onclick="selectPlan('premium_annual')" 
                     class="p-4 rounded-xl border-2 border-slate-300 cursor-pointer hover:shadow-lg transition">
                    <div class="flex items-start justify-between mb-2">
                        <div>
                            <h4 class="font-semibold">Premium Anual</h4>
                            <p class="text-2xl font-bold mt-1">
                                $5,990<span class="text-sm font-normal text-slate-600">/año</span>
                            </p>
                            <p class="text-xs text-slate-500 line-through">Antes: $9,990/año</p>
                        </div>
                        <div class="text-right">
                            <span class="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium block mb-1">-40%</span>
                            <span class="text-xs text-emerald-700 font-medium">Mejor precio</span>
                        </div>
                    </div>
                    <ul class="text-xs space-y-1.5 text-slate-700">
                        <li class="flex items-start gap-2">
                            <i data-lucide="check" class="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0"></i>
                            <span>Todo lo del plan Premium</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <i data-lucide="trending-down" class="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0"></i>
                            <span class="font-medium">Ahorra $5,900 al año</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <i data-lucide="sparkles" class="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0"></i>
                            <span class="font-medium">7 días de prueba gratis</span>
                        </li>
                    </ul>
                </div>
            </div>
            
            <button onclick="proceedToCheckout()" 
                    id="payButton"
                    class="w-full px-5 py-3 rounded-2xl bg-slate-900 text-white font-medium shadow hover:shadow-md disabled:opacity-60">
                Pagar con Mercado Pago
            </button>
            
            <p class="text-[11px] text-slate-500 text-center mt-3">
                Los pagos se procesan de forma segura con Mercado Pago
            </p>
        </div>
        <div id="plansMessage" class="mt-4 hidden"></div>
    `;
    
    // Pre-seleccionar el plan mensual por defecto
    selectedPlan = 'premium_monthly';
    setTimeout(() => lucide.createIcons(), 100);
}

window.selectPlan = function(plan) {
    selectedPlan = plan;
    
    const freeEl = document.getElementById('planFree');
    const monthlyEl = document.getElementById('planMonthly');
    const annualEl = document.getElementById('planAnnual');
    
    if (freeEl) {
        freeEl.classList.remove('border-slate-900', 'shadow-lg');
        freeEl.classList.add('border-slate-300');
    }
    
    if (monthlyEl) {
        monthlyEl.classList.remove('border-slate-900', 'shadow-lg');
        monthlyEl.classList.add('border-slate-300');
    }
    
    if (annualEl) {
        annualEl.classList.remove('border-slate-900', 'shadow-lg');
        annualEl.classList.add('border-slate-300');
    }
    
    if (plan === 'free' && freeEl) {
        freeEl.classList.add('border-slate-900', 'shadow-lg');
        freeEl.classList.remove('border-slate-300');
        document.getElementById('payButton').textContent = 'Continuar con Plan Gratis';
    } else if (plan === 'premium_monthly' && monthlyEl) {
        monthlyEl.classList.add('border-slate-900', 'shadow-lg');
        monthlyEl.classList.remove('border-slate-300');
        document.getElementById('payButton').textContent = 'Pagar con Mercado Pago';
    } else if (plan === 'premium_annual' && annualEl) {
        annualEl.classList.add('border-slate-900', 'shadow-lg');
        annualEl.classList.remove('border-slate-300');
        document.getElementById('payButton').textContent = 'Pagar con Mercado Pago';
    }
};

window.proceedToCheckout = async function() {
    if (selectedPlan === 'free') {
        goToDownload();
        return;
    }
    
    const btn = document.getElementById('payButton');
    btn.disabled = true;
    btn.textContent = 'Redirigiendo a pago...';
    
    try {
        const response = await fetch(CF_CREATE_SUBSCRIPTION, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: userEmail, 
                platform: selectedPlatform,
                plan: selectedPlan
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        
        if (data.subscriptionLink) {
            showMessage('✅ Redirigiendo a Mercado Pago...', 'success');
            setTimeout(() => {
                window.location.href = data.subscriptionLink;
            }, 1500);
        } else {
            throw new Error('No se recibió link de pago');
        }
        
    } catch (error) {
        showMessage('❌ ' + error.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Pagar con Mercado Pago';
    }
};

function goToDownload() {
    currentStep = 'download';
    updateSteps();
    showDownloadForm();
    setTimeout(() => lucide.createIcons(), 100);
}

function showDownloadForm() {
    const container = document.getElementById('formContainer');
    container.innerHTML = `
        <div class="rounded-2xl border border-slate-200 bg-white p-5">
            <div class="flex items-center gap-3 mb-4">
                <div class="p-3 rounded-xl bg-emerald-100">
                    <i data-lucide="check-circle" class="w-8 h-8 text-emerald-600"></i>
                </div>
                <div>
                    <h3 class="text-lg font-semibold">¡Listo!</h3>
                    <p class="text-sm text-slate-600">Tu cuenta está activada</p>
                </div>
            </div>
            
            <p class="text-sm text-slate-700 mb-4">
                Descarga la app e inicia sesión con:<br>
                <strong>${userEmail}</strong>
            </p>
            
            <a href="https://play.google.com/store" 
               class="w-full bg-slate-900 text-white px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2">
                <i data-lucide="download" class="w-5 h-5"></i>
                Descargar para Android
            </a>
            
            <div class="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div class="flex items-start gap-3">
                    <i data-lucide="mail" class="w-5 h-5 text-slate-600 mt-0.5"></i>
                    <div class="text-xs text-slate-600">
                        <strong>Revisa tu email</strong><br>
                        Te enviamos las instrucciones de acceso.
                    </div>
                </div>
            </div>
        </div>
    `;
    setTimeout(() => lucide.createIcons(), 100);
}

function updateSteps() {
    const steps = { signup: 1, plans: 2, download: 3 };
    const current = steps[currentStep];
    
    for (let i = 1; i <= 3; i++) {
        const el = document.getElementById(`step${i}`);
        if (!el) continue;
        
        const circle = el.querySelector('div');
        
        if (i === current) {
            el.classList.remove('text-slate-500');
            el.classList.add('text-slate-900');
            circle.classList.add('bg-slate-900', 'text-white', 'border-slate-900');
            circle.classList.remove('bg-white', 'border-slate-300', 'bg-slate-600');
            circle.textContent = i;
        } else if (i < current) {
            el.classList.remove('text-slate-500');
            el.classList.add('text-slate-600');
            circle.classList.add('bg-slate-600', 'text-white');
            circle.classList.remove('bg-white', 'border-slate-300', 'bg-slate-900');
            circle.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i>';
            setTimeout(() => lucide.createIcons(), 50);
        } else {
            el.classList.add('text-slate-500');
            el.classList.remove('text-slate-900', 'text-slate-600');
            circle.classList.add('bg-white', 'border-slate-300');
            circle.classList.remove('bg-slate-900', 'bg-slate-600');
            circle.textContent = i;
        }
    }
}

function showMessage(message, type) {
    const containers = ['signupMessage', 'plansMessage', 'loginMessage'];
    
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.className = `mt-4 p-4 rounded-xl flex items-start gap-3 ${
                type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
                type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
                'bg-blue-100 text-blue-800 border border-blue-300'
            }`;
            
            const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info';
            el.innerHTML = `
                <i data-lucide="${icon}" class="w-5 h-5 mt-0.5"></i>
                <span class="text-sm">${message}</span>
            `;
            el.classList.remove('hidden');
            setTimeout(() => lucide.createIcons(), 50);
        }
    });
}