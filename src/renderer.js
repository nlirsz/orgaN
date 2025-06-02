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
    const registerEmailInput = getElem('register-email'); // Certifique-se que este ID existe no seu HTML
    const registerPasswordInput = getElem('register-password'); //
    const loginMessage = getElem('login-message'); //
    const registerMessage = getElem('register-message'); //
    const logoutBtn = getElem('logout-btn'); //
    const rememberMeCheckbox = getElem('remember-me-checkbox'); //

    const passwordStrengthIndicator = getElem('password-strength-indicator'); //
    const togglePasswordVisibilityBtn = getElem('toggle-password-visibility'); // Certifique-se que este ID existe

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
    async function authenticatedFetch(url, options = {}) { //
        if (!authToken) { //
            console.error("Token de autenticação não disponível. Redirecionando para login."); //
            showAuthSection(); //
            throw new Error("Não autenticado."); //
        }
        const headers = { //
            'Content-Type': 'application/json', //
            'x-auth-token': authToken, //
            ...options.headers, //
        };
        const response = await fetch(url, { ...options, headers }); //

        if (response.status === 401 || response.status === 403) { //
            showAuthMessage(loginMessage, 'Sessão expirada ou não autorizado. Por favor, faça login novamente.', false); //
            logoutUser(); //
            throw new Error("Não autorizado ou sessão expirada."); //
        }
        return response; //
    }

    function showAuthMessage(element, message, isSuccess = false) { //
        if (element) {
            element.textContent = message; //
            element.className = 'auth-message ' + (isSuccess ? 'success' : 'error'); //
            setTimeout(() => { //
                if (element) element.textContent = ''; //
                if (element) element.className = 'auth-message'; //
            }, 5000); //
        }
    }

    function showTabMessage(element, message, isSuccess = false) { //
         if (element) {
            element.textContent = message; //
            element.className = 'tab-message ' + (isSuccess ? 'success' : 'error'); //
            setTimeout(() => { //
                if (element) element.textContent = ''; //
                if (element) element.className = 'tab-message'; //
            }, 5000); //
        }
    }

    function showModal(modalElement) { //
        if (modalElement) { //
            modalElement.classList.remove('hidden'); //
            modalElement.classList.add('active'); //
        }
    }

    function hideModalWithDelay(modalElement, messageElement = null) { //
        if (modalElement) { //
            modalElement.classList.remove('active'); //
            setTimeout(() => { //
                if (modalElement) modalElement.classList.add('hidden'); //
                if (messageElement && messageElement.textContent) messageElement.textContent = ''; //
            }, 300); //
        }
    }

    function showAuthSection() { //
        if(authSection) authSection.classList.remove('hidden'); //
        if(dashboardLayout) dashboardLayout.classList.add('hidden'); //
        if(loadingOverlay) loadingOverlay.classList.add('hidden'); //

        currentUserId = null; //
        authToken = null; //
        localStorage.removeItem('authToken'); //
        localStorage.removeItem('userId'); //

        if(loginUsernameInput) loginUsernameInput.value = ''; //
        if(loginPasswordInput) loginPasswordInput.value = ''; //
        if(registerUsernameInput) registerUsernameInput.value = ''; //
        if(registerEmailInput) registerEmailInput.value = '';
        if(registerPasswordInput) registerPasswordInput.value = ''; //


        if(authTabButtons) { //
            authTabButtons.forEach(btn => btn.classList.remove('active')); //
            const loginTabBtn = document.querySelector('[data-auth-tab="login"]'); //
            if(loginTabBtn) loginTabBtn.classList.add('active'); //
        }

        if(authTabContents){ //
            authTabContents.forEach(tabContent => tabContent.classList.remove('active')); //
            const loginTabContent = getElem('login-tab-content'); //
            if(loginTabContent) loginTabContent.classList.add('active'); //
        }
        
        if(loginMessage) loginMessage.textContent = ''; //
        if(registerMessage) registerMessage.textContent = ''; //
        if(passwordStrengthIndicator) { //
            passwordStrengthIndicator.textContent = 'Força: ';
            passwordStrengthIndicator.style.color = 'grey';
        }
        if (typeof grecaptcha !== 'undefined' && grecaptcha.reset) {
            try { grecaptcha.reset(0); } catch(e) {} 
            try { grecaptcha.reset(1); } catch(e) {}
        }
    }
    
    async function showDashboard() { //
        if(authSection) authSection.classList.add('hidden'); //
        if(dashboardLayout) dashboardLayout.classList.add('hidden'); //
        if(loadingOverlay) loadingOverlay.classList.remove('hidden'); //

        try {
            await fetchAndRenderDashboardStats(); //
            await fetchAndRenderProducts(); //
            await fetchAndRenderFinances(); //
            
            if(dashboardLayout) dashboardLayout.classList.remove('hidden'); //

            const initialActiveTabButton = document.querySelector('.nav-btn[data-tab="dashboard-main"]'); //
            if (initialActiveTabButton) { //
                initialActiveTabButton.click(); //
            }
        } catch (error) { //
            console.error("Erro ao carregar dados iniciais do dashboard:", error); //
            showAuthMessage(loginMessage, 'Erro ao carregar dados. Tente fazer login novamente.', false); //
            logoutUser(); //
        } finally {
            if(loadingOverlay) loadingOverlay.classList.add('hidden'); //
        }
    }


    // --- LÓGICA DE AUTENTICAÇÃO ---
    if (authTabButtons) { //
        authTabButtons.forEach(button => { //
            button.addEventListener('click', () => { //
                authTabButtons.forEach(btn => btn.classList.remove('active')); //
                button.classList.add('active'); //

                authTabContents.forEach(tabContent => tabContent.classList.remove('active')); //
                const tabContentElement = getElem(`${button.dataset.authTab}-tab-content`); //
                if (tabContentElement) tabContentElement.classList.add('active'); //

                if(loginUsernameInput) loginUsernameInput.value = ''; //
                if(loginPasswordInput) loginPasswordInput.value = ''; //
                if(registerUsernameInput) registerUsernameInput.value = ''; //
                if(registerEmailInput) registerEmailInput.value = '';
                if(registerPasswordInput) registerPasswordInput.value = ''; //
                if(loginMessage) loginMessage.textContent = ''; //
                if(registerMessage) registerMessage.textContent = ''; //
                if(passwordStrengthIndicator) { //
                    passwordStrengthIndicator.textContent = 'Força: ';
                    passwordStrengthIndicator.style.color = 'grey';
                }
                // Resetar reCAPTCHA widgets
                if (typeof grecaptcha !== 'undefined' && grecaptcha.reset) {
                    const loginRecaptchaDiv = loginForm ? loginForm.querySelector('.g-recaptcha') : null;
                    const registerRecaptchaDiv = registerForm ? registerForm.querySelector('.g-recaptcha') : null;
                    if (loginRecaptchaDiv) try {grecaptcha.reset(0);} catch(e){} // Assumindo índice 0 para login
                    if (registerRecaptchaDiv) try {grecaptcha.reset(1);} catch(e){} // Assumindo índice 1 para registro
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
            const legendEl = document.getElementById('password-requirements-legend'); //

            if (password.length >= 8) score++; else if (password.length > 0) score--; // // Evitar negativo se vazio
            if (password.length >= 10) score++;  //
            if (/[A-Z]/.test(password)) score++; else if (password.length > 0) score--; //
            if (/[a-z]/.test(password)) score++; else if (password.length > 0) score--; //
            if (/[0-9]/.test(password)) score++; else if (password.length > 0) score--; //
            if (/[^A-Za-z0-9\s]/.test(password)) score++; else if (password.length > 0) score--; // // Corrigido para não penalizar espaço
            
            score = Math.max(0, score); //

            switch (score) { //
                case 0: 
                    strengthText += 'Muito Fraca'; 
                    strengthColor = 'darkred'; 
                    if (legendEl) legendEl.style.color = 'darkred';
                    break;
                case 1: case 2:
                    strengthText += 'Fraca'; //
                    strengthColor = 'red'; //
                    if (legendEl) legendEl.style.color = 'red'; //
                    break;
                case 3: case 4:
                    strengthText += 'Média'; //
                    strengthColor = 'orange'; //
                    if (legendEl) legendEl.style.color = 'orange'; //
                    break;
                case 5: case 6:
                    strengthText += 'Forte'; //
                    strengthColor = 'green'; //
                    if (legendEl) legendEl.style.color = 'green'; //
                    break;
            }
            if (password.length === 0) { // Se o campo estiver vazio, resetar
                strengthText = 'Força: ';
                strengthColor = 'grey';
                if (legendEl) legendEl.style.color = 'var(--text-secondary)'; // Cor padrão da legenda
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
            let recaptchaResponse = ''; //
            let loginWidgetId;
            if (typeof grecaptcha !== 'undefined' && recaptchaWidgetLogin) { //
                // Tenta obter o widgetId. Se o div do reCAPTCHA tiver um ID, use-o.
                // Se não, o Google atribui IDs sequenciais (0, 1...).
                // Assumindo que este é o primeiro widget na página/aba ativa.
                try { 
                    // Se você renderiza explicitamente com ID, use esse ID.
                    // Caso contrário, o Google anexa o widget e o índice 0 pode funcionar se for o primeiro.
                    // Esta parte pode ser frágil se múltiplos widgets estiverem sempre no DOM.
                    const widgets = document.querySelectorAll('.g-recaptcha');
                    if (widgets.length > 0 && loginForm.contains(widgets[0])) { // Verifica se o primeiro widget está no form de login
                         loginWidgetId = 0; // Ou o ID que o google atribui a ele
                         recaptchaResponse = grecaptcha.getResponse(loginWidgetId);
                    }
                } catch (err) { console.warn("reCAPTCHA widget (login) não encontrado ou erro ao obter resposta.");} //
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
                    if (typeof grecaptcha !== 'undefined' && recaptchaWidgetLogin && loginWidgetId !== undefined) try {grecaptcha.reset(loginWidgetId);} catch(e){} //
                }
            } catch (error) { //
                console.error('Erro de rede ao fazer login:', error); //
                showAuthMessage(loginMessage, 'Erro de conexão com o servidor.'); //
                if (typeof grecaptcha !== 'undefined' && recaptchaWidgetLogin && loginWidgetId !== undefined) try {grecaptcha.reset(loginWidgetId);} catch(e){} //
            }
        });
    }

    if (registerForm) { //
        registerForm.addEventListener('submit', async (e) => { //
            e.preventDefault(); //
            
            const username = registerUsernameInput.value.trim(); //
            const email = registerEmailInput ? registerEmailInput.value.trim() : ''; 
            const password = registerPasswordInput.value.trim(); //

            const recaptchaWidgetRegister = registerForm.querySelector('.g-recaptcha'); //
            let recaptchaResponse = ''; //
            let registerWidgetId;
            if (typeof grecaptcha !== 'undefined' && recaptchaWidgetRegister) { //
                try { 
                    const widgets = document.querySelectorAll('.g-recaptcha');
                    // Assumindo que o de registro é o segundo se ambos estiverem no DOM, ou o primeiro se for o único
                    if (widgets.length > 1 && registerForm.contains(widgets[1])) {
                        registerWidgetId = 1;
                        recaptchaResponse = grecaptcha.getResponse(registerWidgetId);
                    } else if (widgets.length > 0 && registerForm.contains(widgets[0])) {
                         registerWidgetId = 0;
                         recaptchaResponse = grecaptcha.getResponse(registerWidgetId);
                    }
                } catch (err) {console.warn("reCAPTCHA widget (register) não encontrado ou erro ao obter resposta.");} //
            }

            if (!username || !email || !password) { //
                showAuthMessage(registerMessage, 'Por favor, preencha nome de usuário, e-mail e senha.'); //
                return; //
            }
            
            const passwordMinLength = 8; 
            if (password.length < passwordMinLength) { //
                 showAuthMessage(registerMessage, `A senha deve ter no mínimo ${passwordMinLength} caracteres.`); //
                 return; //
            }

            if (typeof grecaptcha !== 'undefined' && recaptchaWidgetRegister && !recaptchaResponse) { //
                showAuthMessage(registerMessage, 'Por favor, complete o reCAPTCHA.'); //
                return; //
            }

            try {
                const bodyPayload = { //
                    username, //
                    email,
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
                    
                    if (typeof grecaptcha !== 'undefined' && recaptchaWidgetRegister && registerWidgetId !== undefined) try {grecaptcha.reset(registerWidgetId);} catch(e){} //
                    if (registerForm) registerForm.reset(); //
                    if(passwordStrengthIndicator) { //
                        passwordStrengthIndicator.textContent = 'Força: '; //
                        passwordStrengthIndicator.style.color = 'grey'; //
                        const legendEl = document.getElementById('password-requirements-legend');
                        if(legendEl) legendEl.style.color = 'var(--text-secondary)';
                    }
                } else { //
                    showAuthMessage(registerMessage, data.message || 'Erro ao registrar.'); //
                    if (typeof grecaptcha !== 'undefined' && recaptchaWidgetRegister && registerWidgetId !== undefined) try {grecaptcha.reset(registerWidgetId);} catch(e){} //
                }
            } catch (error) { //
                console.error('Erro de rede ao registrar:', error); //
                showAuthMessage(registerMessage, 'Erro de conexão com o servidor.'); //
                if (typeof grecaptcha !== 'undefined' && recaptchaWidgetRegister && registerWidgetId !== undefined) try {grecaptcha.reset(registerWidgetId);} catch(e){} //
            }
        });
    }
    
    // --- FUNÇÃO DE LOGOUT ---
    if (logoutBtn) { //
        logoutBtn.addEventListener('click', logoutUser); //
    }

    function logoutUser() { //
        authToken = null; //
        currentUserId = null; //
        localStorage.removeItem('authToken'); //
        localStorage.removeItem('userId'); //
        showAuthSection(); //
    }

    // --- LÓGICA DE NAVEGAÇÃO (ABAS DO DASHBOARD) ---
    if (sidebar && tabButtons.length > 0) { //
        sidebar.addEventListener('click', (e) => { //
            const navBtn = e.target.closest('.nav-btn'); //
            if (!navBtn || navBtn.id === 'logout-btn') return; //
            const tabId = navBtn.dataset.tab; //

            if(tabButtons) tabButtons.forEach(btn => btn.classList.remove('active')); //
            if(navBtn) navBtn.classList.add('active'); //

            if(tabContents) tabContents.forEach(tabContent => { //
                tabContent.classList.toggle('active', tabContent.id === `${tabId}-tab`); //
            });

            if (tabId === 'finance') { //
                fetchAndRenderFinances(); //
            }
            if (tabId === 'dashboard-main') { //
                fetchAndRenderDashboardStats(); //
            }
            if (tabId === 'products') { //
                fetchAndRenderProducts(); //
                clearProductScrapeFormProductsTab(); //
            }
            if (tabId === 'history') { //
                fetchAndRenderProducts(); //
            }
            if (tabId === 'add-product') { //
                clearAddProductFormAddTab(); //
            }
        });
    }

    if (goToAddProductTabBtn) { //
        goToAddProductTabBtn.addEventListener('click', () => { //
            const addProductNavBtn = document.querySelector('.nav-btn[data-tab="add-product"]'); //
            if (addProductNavBtn) { //
                addProductNavBtn.click(); //
            }
        });
    }
    
    // --- FUNÇÕES DE PRODUTOS ---
    const createProductCard = (product) => { /* ...mesma função... */ }; //
    const fetchAndRenderProducts = async () => { /* ...mesma função... */ }; //

    // --- FUNÇÕES DE DASHBOARD PRINCIPAL ---
    const fetchAndRenderDashboardStats = async () => { /* ...mesma função... */ }; //
    const renderGenericChart = (canvasEl, type, data, chartInstanceRef, chartIdForInstanceCheck, isCategory = false) => { /* ...mesma função... */}; //
    
    // --- FUNÇÕES DE FINANÇAS DETALHADO ---
    let financesData = []; //
    const fetchAndRenderFinances = async () => { /* ...mesma função... */ }; //
    const clearFinanceForm = () => { /* ...mesma função... */ }; //
    const setupFinanceEdit = (financeEntry) => { /* ...mesma função... */ }; //
    
    // --- LÓGICA DE EVENTOS PARA SCRAPING E SALVAR PRODUTO ---
    function setupScrapeEventListeners(urlInputEl, verifyBtnEl, infoDivEl, messageEl, saveBtnEl) { /* ...mesma função... */ } //
    if (productUrlInputAddTab && verifyUrlBtnAddTab && verifiedProductInfoDivAddTab && addProductMessageAddTab && saveProductBtnAddTab) { //
        setupScrapeEventListeners(productUrlInputAddTab, verifyUrlBtnAddTab, verifiedProductInfoDivAddTab, addProductMessageAddTab, saveProductBtnAddTab); //
    }
    if (productUrlInputProductsTab && verifyUrlBtnProductsTab && verifiedProductInfoDivProductsTab && addProductMessageProductsTab && saveProductBtnProductsTab) { //
        setupScrapeEventListeners(productUrlInputProductsTab, verifyUrlBtnProductsTab, verifiedProductInfoDivProductsTab, addProductMessageProductsTab, saveProductBtnProductsTab); //
    }
    if (saveProductBtnAddTab) { /* ...mesma função... */ } //
    if (saveProductBtnProductsTab) { /* ...mesma função... */ } //
    async function handleSaveProduct(messageElement) { /* ...mesma função... */ } //
    function clearAddProductFormAddTab() { /* ...mesma função... */ } //
    function clearProductScrapeFormProductsTab() { /* ...mesma função... */ } //
    
    // --- DELEGAÇÃO DE EVENTOS PARA CARDS E MODAIS ---
    const mainContentArea = document.querySelector('.main-content-area'); //
    if (mainContentArea) { //
        mainContentArea.addEventListener('click', async (e) => { /* ...mesma função... */ }); //
    }
    if (detailsModal && modalProductImage) { /* ...mesma função... */ } //
    function openImageModal(imageSrc) { /* ...mesma função... */ } //
    if (imageModal) { /* ...mesma função... */ } //
    if (detailsModal) { /* ...mesma função... */ } //
    const closeEditModalBtn = editModal ? editModal.querySelector('.close-modal-btn') : null; //
    if (editModal && closeEditModalBtn) { /* ...mesma função... */ } //
    if (detailsModal) { /* ...mesma função para ações dentro do modal de detalhes ... */ } //
    if (editForm) { /* ...mesma função para submit do formulário de edição ... */ } //
    
    // --- LÓGICA PARA FINANÇAS ---
    if(addFinanceEntryBtn && financeMonthInput && financeRevenueInput && financeExpensesInput) { /* ...mesma função... */ } //
    if(cancelFinanceEditBtn) { /* ...mesma função... */ } //
    if(financeList) { /* ...mesma função... */ } //


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