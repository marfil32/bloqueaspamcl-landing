const CF_CREATE_MEMBERSHIP = 'https://us-central1-bloqueaspamcl-29064.cloudfunctions.net/createMembership';
const CF_CREATE_SUBSCRIPTION = 'https://us-central1-bloqueaspamcl-29064.cloudfunctions.net/createSubscription';
const CF_CHECK_USER = 'https://us-central1-bloqueaspamcl-29064.cloudfunctions.net/checkUser';

window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailFromUrl = urlParams.get('email');
    
    if (emailFromUrl) {
        document.getElementById('email').value = emailFromUrl;
        document.getElementById('email').readOnly = true;
        checkExistingUser(emailFromUrl);
    }
});

document.querySelectorAll('input[name="platform"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const planSection = document.getElementById('planSection');
        if (e.target.value === 'android') {
            planSection.style.display = 'block';
        } else {
            planSection.style.display = 'none';
        }
    });
});

async function checkExistingUser(email) {
    try {
        const response = await fetch(CF_CHECK_USER, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (data.exists && data.membershipType === 'free') {
            showUpgradeOptions();
        }
    } catch (error) {
        console.error('Error verificando usuario:', error);
    }
}

function showUpgradeOptions() {
    document.getElementById('passwordSection').style.display = 'none';
    const googleBtn = document.getElementById('googleSignInBtn');
    if (googleBtn) googleBtn.style.display = 'none';
    document.getElementById('submitBtn').textContent = 'Actualizar a Premium';
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'bg-blue-50 border-l-4 border-blue-500 p-4 mb-4';
    infoDiv.innerHTML = `
        <p class="font-medium">👋 ¡Hola de nuevo!</p>
        <p class="text-sm">Ya tienes una cuenta. Selecciona un plan Premium para actualizar.</p>
    `;
    
    const form = document.getElementById('registrationForm');
    form.insertBefore(infoDiv, form.firstChild);
}

document.getElementById('registrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const platform = document.querySelector('input[name="platform"]:checked')?.value;
    const plan = document.querySelector('input[name="plan"]:checked')?.value;
    
    const isReadOnly = document.getElementById('email').readOnly;
    if (isReadOnly && plan && plan !== 'free') {
        await handleUpgrade(email, plan);
        return;
    }
    
    await handleNewUser(email, password, platform, plan);
});

async function handleNewUser(email, password, platform, plan) {
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Procesando...';
    
    try {
        if (platform === 'ios') {
            await createAccount(email, null, platform, 'email', 'free');
            showMessage('✅ Agregado a lista de espera para iOS. Revisa tu email.', 'success');
        } else if (plan === 'free') {
            await createAccount(email, password, platform, 'email', 'free');
            showMessage(
                `✅ ¡Cuenta creada exitosamente!
                
                📧 Revisa tu email para los próximos pasos.
                📱 Descarga la app e inicia sesión con tus credenciales.`,
                'success'
            );
        } else {
            await createSubscription(email, password, platform, plan);
        }
    } catch (error) {
        showMessage('❌ ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Crear cuenta';
    }
}

async function handleUpgrade(email, plan) {
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Procesando...';
    
    try {
        await createSubscription(email, null, 'android', plan);
    } catch (error) {
        showMessage('❌ ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Actualizar a Premium';
    }
}

async function createAccount(email, password, platform, authMethod, plan) {
    const response = await fetch(CF_CREATE_MEMBERSHIP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, platform, authMethod, plan })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
}

async function createSubscription(email, password, platform, plan) {
    const response = await fetch(CF_CREATE_SUBSCRIPTION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, platform, plan })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    
    if (data.subscriptionLink) {
        showMessage('🔄 Redirigiendo a pago...', 'info');
        setTimeout(() => {
            window.location.href = data.subscriptionLink;
        }, 1500);
    }
    
    return data;
}

function showMessage(message, type) {
    const resultMessage = document.getElementById('resultMessage');
    resultMessage.className = `mt-4 p-4 rounded-lg ${
        type === 'success' ? 'bg-green-100 text-green-800' :
        type === 'error' ? 'bg-red-100 text-red-800' :
        type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
        'bg-blue-100 text-blue-800'
    }`;
    resultMessage.innerHTML = message.replace(/\n/g, '<br>');
    resultMessage.classList.remove('hidden');
    resultMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

const googleBtn = document.getElementById('googleSignInBtn');
if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const platform = document.querySelector('input[name="platform"]:checked')?.value;
        const plan = document.querySelector('input[name="plan"]:checked')?.value;
        
        if (!email || !platform) {
            showMessage('⚠️ Completa email y plataforma', 'warning');
            return;
        }
        
        try {
            await createAccount(email, null, platform, 'google', plan || 'free');
            showMessage('✅ Pre-registro exitoso. Revisa tu email para los próximos pasos.', 'success');
        } catch (error) {
            showMessage('❌ ' + error.message, 'error');
        }
    });
}
