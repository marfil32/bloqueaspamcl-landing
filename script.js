// Configuración
const MERCADOPAGO_PUBLIC_KEY = 'TU_PUBLIC_KEY_AQUI'; // Cambiar después
const CLOUD_FUNCTION_URL = 'https://us-central1-bloqueaspamcl-29064.cloudfunctions.net/createMembership';

// Mostrar/ocultar sección de planes según plataforma
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

// Manejar envío del formulario
document.getElementById('registrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const resultMessage = document.getElementById('resultMessage');
    
    // Obtener datos del formulario
    const email = document.getElementById('email').value;
    const platform = document.querySelector('input[name="platform"]:checked').value;
    const plan = document.querySelector('input[name="plan"]:checked')?.value;
    
    // Deshabilitar botón
    submitBtn.disabled = true;
    submitBtn.textContent = 'Procesando...';
    
    try {
        if (platform === 'ios') {
            // iOS: Agregar a lista de espera
            await addToWaitlist(email);
            showMessage('✅ ¡Listo! Te notificaremos cuando esté disponible para iOS', 'success');
        } else if (plan === 'free') {
            // Plan gratis: Crear cuenta directamente
            await createFreeAccount(email);
        } else {
            // Plan premium: Ir a checkout de MercadoPago
            await initiatePayment(email, plan);
        }
    } catch (error) {
        showMessage('❌ Error: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Continuar';
    }
});

// Agregar a lista de espera (iOS)
async function addToWaitlist(email) {
    const response = await fetch(CLOUD_FUNCTION_URL + '/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, platform: 'ios' })
    });
    
    if (!response.ok) throw new Error('Error agregando a lista de espera');
}

// Crear cuenta gratis
async function createFreeAccount(email) {
    const response = await fetch(CLOUD_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email, 
            membershipType: 'free',
            platform: 'android'
        })
    });
    
    const data = await response.json();
    
    if (!response.ok) throw new Error(data.error);
    
    showMessage(
        `✅ Cuenta creada! Revisa tu email (${email}) para las credenciales de acceso`,
        'success'
    );
}

// Iniciar pago con MercadoPago
async function initiatePayment(email, plan) {
    // TODO: Integración real con MercadoPago
    // Por ahora, simulamos
    showMessage('🔄 Redirigiendo a MercadoPago...', 'info');
    
    setTimeout(() => {
        showMessage('⚠️ Integración de MercadoPago pendiente', 'warning');
    }, 2000);
}

// Mostrar mensajes
function showMessage(message, type) {
    const resultMessage = document.getElementById('resultMessage');
    resultMessage.className = `mt-4 p-4 rounded-lg ${
        type === 'success' ? 'bg-green-100 text-green-800' :
        type === 'error' ? 'bg-red-100 text-red-800' :
        type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
        'bg-blue-100 text-blue-800'
    }`;
    resultMessage.textContent = message;
    resultMessage.classList.remove('hidden');
}
