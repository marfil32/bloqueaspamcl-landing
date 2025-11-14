const CF_CREATE_MEMBERSHIP = 'https://us-central1-bloqueaspamcl-29064.cloudfunctions.net/createMembership';
const CF_CREATE_SUBSCRIPTION = 'https://us-central1-bloqueaspamcl-29064.cloudfunctions.net/createSubscription';
const CF_CHECK_USER = 'https://us-central1-bloqueaspamcl-29064.cloudfunctions.net/checkUser';

let selectedPlatform = null;
let currentStep = 'platform'; // platform → signup → plans → download
let userEmail = '';

// Countdown
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

// Seleccionar plataforma
window.selectPlatform = function(platform) {
    selectedPlatform = platform;
    
    if (platform === 'ios') {
        showIOSWaitlist();
    } else {
        // Android: continuar con signup
        currentStep = 'signup';
        document.getElementById('platformSection').classList.add('hidden');
        document.getElementById('stepsSection').classList.remove('hidden');
        showSignupForm();
    }
};

function showIOSWaitlist() {
    const container = document.getElementById('formContainer');
    container.innerHTML = `
        <div class="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 class="text-lg font-semibold mb-2">📱 iOS Próximamente</h3>
            <p class="text-sm text-slate-600 mb-4">
                Estamos trabajando en la versión para iPhone. 
                Déjanos tu correo y te avisaremos cuando esté lista.
            </p>
            <form onsubmit="submitIOSWaitlist(event)" class="space-y-3">
                <input type="email" id="iosEmail" required 
                       placeholder="tu@email.com"
                       class="w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900">
                <button type="submit" 
                        class="w-full rounded-xl bg-slate-900 text-white px-4 py-2 font-medium">
                    Unirme a la lista
                </button>
            </form>
        </div>
    `;
    document.getElementById('platformSection').classList.add('hidden');
    document.getElementById('stepsSection').classList.add('hidden');
}

window.submitIOSWaitlist = async function(e) {
    e.preventDefault();
    const email = document.getElementById('iosEmail').value;
    
    try {
        await fetch(CF_CREATE_MEMBERSHIP, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, platform: 'ios', authMethod: 'email' })
        });
        
        showMessage('✅ ¡Listo! Te avisaremos cuando esté disponible para iOS.', 'success');
    } catch {
        showMessage('❌ Error. Intenta nuevamente.', 'error');
    }
};

function showSignupForm() {
    const container = document.getElementById('formContainer');
    container.innerHTML = `
        <div class="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 class="text-lg font-semibold mb-2">Crea tu cuenta</h3>
            
            <button onclick="signInWithGoogle()" 
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
                <button type="submit" 
                        class="w-full rounded-xl bg-slate-900 text-white px-4 py-2 font-medium">
                    Crear cuenta
                </button>
            </form>
            
            <p class="text-xs text-slate-500 mt-3">
                Al continuar aceptas los Términos y la Política de Privacidad.
            </p>
        </div>
        <div id="signupMessage" class="mt-4 hidden"></div>
    `;
}

window.signInWithGoogle = async function() {
    // TODO: Implementar OAuth real
    showMessage('🔄 Redirigiendo a Google...', 'info');
    setTimeout(() => {
        userEmail = 'usuario@gmail.com';
        goToPlans();
    }, 1000);
};

window.signUpWithEmail = async function(e) {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
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
        
        if (!response.ok) throw new Error(data.error);
        
        userEmail = email;
        showMessage('✅ Cuenta creada. Revisa tu email.', 'success');
        
        setTimeout(() => goToPlans(), 2000);
        
    } catch (error) {
        showMessage('❌ ' + error.message, 'error');
    }
};

function goToPlans() {
    currentStep = 'plans';
    updateSteps();
    showPlansForm();
}

function showPlansForm() {
    const container = document.getElementById('formContainer');
    container.innerHTML = `
        <div class="space-y-4">
            <!-- Plan Mensual -->
            <div onclick="selectPlan('premium_monthly')" 
                 id="planMonthly"
                 class="relative rounded-3xl border-2 border-slate-300 p-5 cursor-pointer hover:border-slate-400 bg-white transition">
                <div class="absolute -top-3 left-5 px-3 py-1 rounded-full text-[11px] bg-amber-100 border border-amber-300 text-amber-900">
                    Ahorra $2,000
                </div>
                <h3 class="text-base font-semibold">Premium Mensual</h3>
                <div class="mt-2 flex items-end gap-2">
                    <span class="text-2xl font-bold">$990</span>
                    <span class="text-slate-500">/mes</span>
                </div>
                <div class="text-xs text-slate-400 line-through">$2,990 /mes</div>
                <ul class="mt-3 space-y-1 text-sm text-slate-700">
                    <li>• Todas las funciones</li>
                    <li>• 7 días gratis</li>
                    <li>• Cancela cuando quieras</li>
                </ul>
            </div>
            
            <!-- Plan Anual -->
            <div onclick="selectPlan('premium_annual')" 
                 id="planAnnual"
                 class="relative rounded-3xl border-2 border-slate-300 p-5 cursor-pointer hover:border-slate-400 bg-white transition">
                <div class="absolute -top-3 right-5 px-3 py-1 rounded-full text-[11px] bg-emerald-100 border border-emerald-300 text-emerald-900">
                    Ahorra $3,000
                </div>
                <h3 class="text-base font-semibold">Premium Anual</h3>
                <div class="mt-2 flex items-end gap-2">
                    <span class="text-2xl font-bold">$5,990</span>
                    <span class="text-slate-500">/año</span>
                </div>
                <div class="text-xs text-slate-400 line-through">$9,990 /año</div>
                <ul class="mt-3 space-y-1 text-sm text-slate-700">
                    <li>• Todas las funciones</li>
                    <li>• 7 días gratis</li>
                    <li>• Ahorra 50%</li>
                </ul>
            </div>
            
            <button onclick="proceedToCheckout()" 
                    id="payButton"
                    class="w-full px-5 py-3 rounded-2xl bg-slate-900 text-white font-medium shadow hover:shadow-md disabled:opacity-60">
                Continuar al pago
            </button>
            
            <p class="text-[11px] text-slate-500 text-center">
                Pagos procesados con Mercado Pago
            </p>
        </div>
        <div id="plansMessage" class="mt-4 hidden"></div>
    `;
}

let selectedPlan = 'premium_monthly';

window.selectPlan = function(plan) {
    selectedPlan = plan;
    
    // Visual feedback
    document.getElementById('planMonthly').classList.remove('border-slate-900', 'shadow-lg');
    document.getElementById('planAnnual').classList.remove('border-slate-900', 'shadow-lg');
    
    if (plan === 'premium_monthly') {
        document.getElementById('planMonthly').classList.add('border-slate-900', 'shadow-lg');
    } else {
        document.getElementById('planAnnual').classList.add('border-slate-900', 'shadow-lg');
    }
};

window.proceedToCheckout = async function() {
    const btn = document.getElementById('payButton');
    btn.disabled = true;
    btn.textContent = 'Procesando...';
    
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
            showMessage('🔄 Redirigiendo a Mercado Pago...', 'info');
            setTimeout(() => {
                window.location.href = data.subscriptionLink;
            }, 1500);
        } else {
            // Fallback para demo
            setTimeout(() => goToDownload(), 1000);
        }
        
    } catch (error) {
        showMessage('❌ ' + error.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Continuar al pago';
    }
};

function goToDownload() {
    currentStep = 'download';
    updateSteps();
    showDownloadForm();
}

function showDownloadForm() {
    const container = document.getElementById('formContainer');
    container.innerHTML = `
        <div class="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 class="text-lg font-semibold mb-2">🎉 ¡Listo!</h3>
            <p class="text-sm text-slate-600 mb-4">
                Tu cuenta premium está activada. Descarga la app e inicia sesión con tu correo.
            </p>
            
            <div class="flex gap-3 flex-wrap">
                <a href="https://play.google.com/store" 
                   class="flex-1 bg-slate-900 text-white px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
                        <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
                    </svg>
                    Google Play
                </a>
            </div>
            
            <div class="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p class="text-xs text-slate-600">
                    <strong>📧 Revisa tu email</strong><br>
                    Te enviamos las instrucciones de acceso y un link directo a la app.
                </p>
            </div>
        </div>
    `;
}

function updateSteps() {
    const steps = {
        signup: 1,
        plans: 2,
        download: 3
    };
    
    const current = steps[currentStep];
    
    for (let i = 1; i <= 3; i++) {
        const el = document.getElementById(`step${i}`);
        if (!el) continue;
        
        if (i === current) {
            el.classList.remove('text-slate-500');
            el.classList.add('text-slate-900');
            el.querySelector('div').classList.add('bg-slate-900', 'text-white', 'border-slate-900');
            el.querySelector('div').classList.remove('bg-white', 'border-slate-300');
        } else if (i < current) {
            el.classList.remove('text-slate-500');
            el.classList.add('text-emerald-600');
            el.querySelector('div').classList.add('bg-emerald-500', 'text-white');
            el.querySelector('div').innerHTML = '✓';
        }
    }
}

function showMessage(message, type) {
    const containers = ['signupMessage', 'plansMessage'];
    
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.className = `mt-4 p-4 rounded-xl ${
                type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
                type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
                'bg-blue-100 text-blue-800 border border-blue-300'
            }`;
            el.textContent = message;
            el.classList.remove('hidden');
        }
    });
}
