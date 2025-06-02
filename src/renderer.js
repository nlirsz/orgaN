document.addEventListener('DOMContentLoaded', () => {

    // --- VARIÁVEIS GLOBAIS E CONFIGURAÇÃO ---
    const API_BASE_URL = '/api';  //
    let currentUserId = null; //
    let authToken = null; //
    let scrapedProductData = null; //
    let financeChartInstance = null; //
    let financeOverviewChart = null; //
    let categoryDistributionChart = null; //
    let editingFinanceId = null; //

    // --- SELETORES DE ELEMENTOS ---
    const getElem = (id) => document.getElementById(id); //

    // Seção de Autenticação
    const authSection = getElem('auth-section'); //
    const dashboardLayout = document.querySelector('.dashboard-layout'); //
    const authTabButtons = document.querySelectorAll('.auth-tab-btn'); //
    const authTabContents = document.querySelectorAll('.auth-tab-content'); //
    const loginForm = getElem('login-form'); //
    const registerForm = getElem('register-form'); //
    const loginUsernameInput = getElem('login-username'); //
    const loginPasswordInput = getElem('login-password'); //
    const registerUsernameInput = getElem('register-username'); //
    const registerEmailInput = getElem('register-email'); // NOVO: Campo de email para registro
    const registerPasswordInput = getElem('register-password'); //
    const loginMessage = getElem('login-message'); //
    const registerMessage = getElem('register-message'); //
    const logoutBtn = getElem('logout-btn'); //
    const rememberMeCheckbox = getElem('remember-me-checkbox'); //

    const passwordStrengthIndicator = getElem('password-strength-indicator'); //
    const togglePasswordVisibilityBtn = getElem('toggle-password-visibility'); // NOVO: Botão de mostrar/ocultar senha

    // ... (outros seletores permanecem os mesmos) ...
    const loadingOverlay = getElem('loading-overlay'); //
    const sidebar = document.querySelector('.sidebar'); //
    const tabButtons = document.querySelectorAll('.nav-btn'); //
    const tabContents = document.querySelectorAll('.tab-content'); //
    const productsTab = getElem('products-tab'); //
    const pendingList = getElem('pending-products-list'); //
    const purchasedList = getElem('purchased-products-list'); //
    const goToAddProductTabBtn = getElem('go-to-add-product-tab-btn'); //
    const addProductTab = getElem('add-product-tab'); //
    const productUrlInputAddTab = getElem('productUrlInput-add-tab'); //
    const verifyUrlBtnAddTab = getElem('verifyUrlBtn-add-tab'); //
    const verifiedProductInfoDivAddTab = getElem('verifiedProductInfo-add-tab'); //
    const addProductMessageAddTab = getElem('add-product-message-add-tab'); //
    const saveProductBtnAddTab = getElem('save-product-btn-add-tab'); //
    const manualProductNameInput = getElem('manual-product-name'); //
    const manualProductPriceInput = getElem('manual-product-price'); //
    const manualProductUrlInput = getElem('manual-product-url'); //
    const manualProductImageUrlInput = getElem('manual-product-image-url'); //
    const manualProductCategorySelect = getElem('manual-product-category'); //
    const manualProductBrandInput = getElem('manual-product-brand'); //
    const manualProductDescriptionTextarea = getElem('manual-product-description'); //
    const productUrlInputProductsTab = getElem('productUrlInput-products-tab'); //
    const verifyUrlBtnProductsTab = getElem('verifyUrlBtn-products-tab'); //
    const verifiedProductInfoDivProductsTab = getElem('verifiedProductInfo-products-tab'); //
    const addProductMessageProductsTab = getElem('add-product-message-products-tab'); //
    const saveProductBtnProductsTab = getElem('save-product-btn-products-tab'); //
    const financeMonthInput = getElem('financeMonth'); //
    const financeRevenueInput = getElem('financeRevenue'); //
    const financeExpensesInput = getElem('financeExpenses'); //
    const addFinanceEntryBtn = getElem('add-finance-entry-btn'); //
    const cancelFinanceEditBtn = getElem('cancel-finance-edit-btn'); //
    const financeList = getElem('finance-list'); //
    const totalBalanceElem = getElem('finance-total-balance'); //
    const financeChartCanvas = getElem('financialLineChart'); //
    const financeEntryMessage = getElem('finance-entry-message'); //
    const financeFormContainer = document.querySelector('.finance-form-container');  //
    const financeOverviewChartCanvasEl = getElem('financeOverviewChart'); //
    const categoryDistributionChartCanvasEl = getElem('categoryDistributionChart'); //
    const detailsModal = getElem('product-details-modal'); //
    const modalProductImage = getElem('modal-product-image'); //
    const modalProductName = getElem('modal-product-name'); //
    const modalProductPrice = getElem('modal-product-price'); //
    const modalProductStatus = getElem('modal-product-status'); //
    const modalProductCategory = getElem('modal-product-category'); //
    const modalProductBrand = getElem('modal-product-brand'); //
    const modalProductAddedDate = getElem('modal-product-addedDate'); //
    const modalProductDescription = getElem('modal-product-description'); //
    const modalProductTags = getElem('modal-product-tags'); //
    const modalProductPriority = getElem('modal-product-priority'); //
    const modalProductNotes = getElem('modal-product-notes'); //
    const modalProductLink = getElem('modal-product-link'); //
    const modalActionPurchaseBtn = getElem('modal-action-purchase'); //
    const modalActionEditBtn = getElem('modal-action-edit'); //
    const modalActionDeleteBtn = getElem('modal-action-delete'); //
    const editModal = getElem('edit-product-modal'); //
    const editForm = getElem('edit-product-form'); //
    const editProductIdInput = getElem('edit-product-id'); //
    const editProductNameInput = getElem('edit-product-name'); //
    const editProductPriceInput = getElem('edit-product-price'); //
    const editProductUrlInput = getElem('edit-product-url'); //
    const editProductImageUrlInput = getElem('edit-product-image-url'); //
    const editProductCategorySelect = getElem('edit-product-category'); //
    const editProductStatusSelect = getElem('edit-product-status'); //
    const editProductTagsInput = getElem('edit-product-tags'); //
    const editProductDescriptionTextarea = getElem('edit-product-description'); //
    const editProductPreviewImage = getElem('edit-product-preview-image'); //
    const editProductPrioritySelect = getElem('edit-product-priority'); //
    const editProductNotesTextarea = getElem('edit-product-notes'); //
    const editProductMessage = getElem('edit-product-message'); //
    const imageModal = getElem('image-modal'); //
    const modalImageContent = getElem('modal-image-content'); //


    // --- FUNÇÕES DE UTILIDADE ---
    async function authenticatedFetch(url, options = {}) { /* ...mesma função... */ } //
    function showAuthMessage(element, message, isSuccess = false) { /* ...mesma função... */ } //
    function showTabMessage(element, message, isSuccess = false) { /* ...mesma função... */ } //
    function showModal(modalElement) { /* ...mesma função... */ } //
    function hideModalWithDelay(modalElement, messageElement = null) { /* ...mesma função... */ } //
    function showAuthSection() { /* ...mesma função... */ } //
    async function showDashboard() { /* ...mesma função... */ } //


    // --- LÓGICA DE AUTENTICAÇÃO ---
    if (authTabButtons) { //
        authTabButtons.forEach(button => { //
            button.addEventListener('click', () => { //
                // ... (lógica de troca de abas) ...
                if(loginUsernameInput) loginUsernameInput.value = ''; //
                if(loginPasswordInput) loginPasswordInput.value = ''; //
                if(registerUsernameInput) registerUsernameInput.value = ''; //
                if(registerEmailInput) registerEmailInput.value = ''; // Limpar campo de e-mail
                if(registerPasswordInput) registerPasswordInput.value = ''; //
                if(loginMessage) loginMessage.textContent = ''; //
                if(registerMessage) registerMessage.textContent = ''; //
                if(passwordStrengthIndicator) { //
                    passwordStrengthIndicator.textContent = 'Força: ';
                    passwordStrengthIndicator.style.color = 'grey';
                }
                 // Resetar reCAPTCHA widgets se existirem
                if (typeof grecaptcha !== 'undefined' && grecaptcha.reset) {
                    // Tenta resetar os widgets. Se você der IDs aos seus widgets, use-os aqui.
                    // Ex: grecaptcha.reset(loginRecaptchaWidgetId); grecaptcha.reset(registerRecaptchaWidgetId);
                    // Por enquanto, tentaremos resetar por índice se eles forem os únicos na página.
                    try { grecaptcha.reset(0); } catch(e) {} // Widget de login
                    try { grecaptcha.reset(1); } catch(e) {} // Widget de registro
                }
            });
        });
    }

    // --- LÓGICA PARA MOSTRAR/OCULTAR SENHA ---
    if (togglePasswordVisibilityBtn && registerPasswordInput) { //
        togglePasswordVisibilityBtn.addEventListener('click', () => { //
            const type = registerPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password'; //
            registerPasswordInput.setAttribute('type', type); //
            const icon = togglePasswordVisibilityBtn.querySelector('i'); //
            if (icon) { //
                icon.classList.toggle('fa-eye'); //
                icon.classList.toggle('fa-eye-slash'); //
            }
        });
    }

    // --- LISTENER PARA FEEDBACK DE FORÇA DA SENHA ---
    if (registerPasswordInput && passwordStrengthIndicator) { //
        registerPasswordInput.addEventListener('input', () => { //
            const password = registerPasswordInput.value; //
            let strengthText = 'Força: '; //
            let strengthColor = 'grey'; //
            let score = 0; //

            const legendEl = document.getElementById('password-requirements-legend');

            if (password.length >= 8) score++; else score--; //
            if (password.length >= 10) score++;  //
            if (/[A-Z]/.test(password)) score++; else score--; //
            if (/[a-z]/.test(password)) score++; else score--; //
            if (/[0-9]/.test(password)) score++; else score--; //
            if (/[^A-Za-z0-9]/.test(password)) score++; else score--; //
            
            // Assegurar que o score não seja negativo para a lógica do switch
            score = Math.max(0, score);

            switch (score) { //
                case 0: case 1: case 2:
                    strengthText += 'Fraca'; //
                    strengthColor = 'red'; //
                    if (legendEl) legendEl.style.color = 'red';
                    break;
                case 3: case 4:
                    strengthText += 'Média'; //
                    strengthColor = 'orange'; //
                    if (legendEl) legendEl.style.color = 'orange';
                    break;
                case 5: case 6:
                    strengthText += 'Forte'; //
                    strengthColor = 'green'; //
                    if (legendEl) legendEl.style.color = 'green';
                    break;
                default:
                    strengthText += 'Muito Fraca'; //
                    strengthColor = 'darkred'; //
                     if (legendEl) legendEl.style.color = 'darkred';
            }
            passwordStrengthIndicator.textContent = strengthText; //
            passwordStrengthIndicator.style.color = strengthColor; //
        });
    }


    if (loginForm) { //
        loginForm.addEventListener('submit', async (e) => { //
            e.preventDefault(); //
            const username = loginUsernameInput.value.trim(); //
            const password = loginPasswordInput.value.trim(); //

            const recaptchaWidgetLogin = loginForm.querySelector('.g-recaptcha'); //
            let recaptchaResponse = '';
            if (typeof grecaptcha !== 'undefined' && recaptchaWidgetLogin) {
                // Se você tiver vários widgets, precisa de uma maneira de obter o ID correto.
                // Se este é o único visível ou o primeiro, o índice 0 pode funcionar.
                // Para ser mais robusto, seria bom ter IDs únicos para os divs do g-recaptcha
                // e usar `grecaptcha.getResponse(widgetId)`.
                // Assumindo que o widget de login é o primeiro (índice 0 se você tem dois na página)
                try { recaptchaResponse = grecaptcha.getResponse(0); } catch (err) { console.warn("reCAPTCHA widget (login) não encontrado ou erro ao obter resposta.");}
            }


            if (!username || !password) { //
                showAuthMessage(loginMessage, 'Por favor, preencha todos os campos.'); //
                return; //
            }
            if (typeof grecaptcha !== 'undefined' && recaptchaWidgetLogin && !recaptchaResponse) { //
                showAuthMessage(loginMessage, 'Por favor, complete o reCAPTCHA.'); //
                return; //
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, { //
                    method: 'POST', //
                    headers: { 'Content-Type': 'application/json' }, //
                    body: JSON.stringify({ 
                        username, 
                        password,
                        recaptchaToken: recaptchaResponse 
                    }),
                });
                const data = await response.json(); //

                if (response.ok) { //
                    authToken = data.token; //
                    currentUserId = data.userId; //
                    if (rememberMeCheckbox && rememberMeCheckbox.checked) { //
                        localStorage.setItem('authToken', authToken); //
                        localStorage.setItem('userId', currentUserId); //
                    } else { //
                        localStorage.removeItem('authToken'); //
                        localStorage.removeItem('userId'); //
                    }
                    showAuthMessage(loginMessage, data.message, true); //
                    await showDashboard(); //
                } else { //
                    showAuthMessage(loginMessage, data.message || 'Erro ao fazer login.'); //
                    if (typeof grecaptcha !== 'undefined' && recaptchaWidgetLogin) try {grecaptcha.reset(0);} catch(e){} //
                }
            } catch (error) { //
                console.error('Erro de rede ao fazer login:', error); //
                showAuthMessage(loginMessage, 'Erro de conexão com o servidor.'); //
                if (typeof grecaptcha !== 'undefined' && recaptchaWidgetLogin) try {grecaptcha.reset(0);} catch(e){} //
            }
        });
    }

    if (registerForm) { //
        registerForm.addEventListener('submit', async (e) => { //
            e.preventDefault(); //
            
            const username = registerUsernameInput.value.trim(); //
            const email = registerEmailInput ? registerEmailInput.value.trim() : ''; // NOVO
            const password = registerPasswordInput.value.trim(); //

            const recaptchaWidgetRegister = registerForm.querySelector('.g-recaptcha'); //
            let recaptchaResponse = '';
            if (typeof grecaptcha !== 'undefined' && recaptchaWidgetRegister) {
                 // Assumindo que o widget de registro é o segundo (índice 1 se você tem dois na página)
                try { recaptchaResponse = grecaptcha.getResponse(1); } catch (err) {console.warn("reCAPTCHA widget (register) não encontrado ou erro ao obter resposta.");}
            }


            if (!username || !email || !password) { // // Email adicionado à validação
                showAuthMessage(registerMessage, 'Por favor, preencha nome de usuário, e-mail e senha.'); //
                return; //
            }
            
            const passwordMinLength = 8; 
            if (password.length < passwordMinLength) { //
                 showAuthMessage(registerMessage, `A senha deve ter no mínimo ${passwordMinLength} caracteres.`); //
                 return; //
            }
             // Poderia adicionar mais validações de frontend para a senha aqui, mas a do backend é a principal.

            if (typeof grecaptcha !== 'undefined' && recaptchaWidgetRegister && !recaptchaResponse) { //
                showAuthMessage(registerMessage, 'Por favor, complete o reCAPTCHA.'); //
                return; //
            }

            try {
                const bodyPayload = { //
                    username, //
                    email,    // NOVO
                    password, //
                    recaptchaToken: recaptchaResponse 
                };

                const response = await fetch(`${API_BASE_URL}/auth/register`, { //
                    method: 'POST', //
                    headers: { 'Content-Type': 'application/json' }, //
                    body: JSON.stringify(bodyPayload),
                });
                const data = await response.json(); //

                if (response.ok) { //
                    showAuthMessage(registerMessage, data.message, true); //
                    
                    if (typeof grecaptcha !== 'undefined' && recaptchaWidgetRegister) try {grecaptcha.reset(1);} catch(e){} //
                    registerForm.reset(); //
                    if(passwordStrengthIndicator) { //
                        passwordStrengthIndicator.textContent = 'Força: '; //
                        passwordStrengthIndicator.style.color = 'grey'; //
                    }
                    // Lógica para verificação de e-mail (não logar automaticamente) viria aqui.
                } else { //
                    showAuthMessage(registerMessage, data.message || 'Erro ao registrar.'); //
                    if (typeof grecaptcha !== 'undefined' && recaptchaWidgetRegister) try {grecaptcha.reset(1);} catch(e){} //
                }
            } catch (error) { //
                console.error('Erro de rede ao registrar:', error); //
                showAuthMessage(registerMessage, 'Erro de conexão com o servidor.'); //
                if (typeof grecaptcha !== 'undefined' && recaptchaWidgetRegister) try {grecaptcha.reset(1);} catch(e){} //
            }
        });
    }

    // ... (logoutUser e toda a lógica de abas, produtos, finanças, modais permanecem os mesmos) ...

    // --- INICIALIZAÇÃO ---
    const storedAuthToken = localStorage.getItem('authToken'); //
    const storedUserId = localStorage.getItem('userId'); //

    if (storedAuthToken && storedUserId) { //
        authToken = storedAuthToken; //
        currentUserId = storedUserId; //
        showDashboard(); //
    } else { //
        showAuthSection(); //
    }
});