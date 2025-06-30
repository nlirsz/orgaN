// --- CONFIGURAÇÃO DO RECAPTCHA ---
let recaptchaRegisterWidgetId = null;
const RECAPTCHA_SITE_KEY = '6Lfin1MrAAAAAKoExa3uVksnMFHyJasKJbj8htsA'; // A sua Site Key

// Função para renderizar o reCAPTCHA de registo. Chamada pelo 'onload' da API do Google.
window.renderRegistrationRecaptcha = () => {
    console.log('API do reCAPTCHA carregada, a renderizar o widget de registo...');
    
    const registerContainer = document.getElementById('recaptcha-register-container');
    if (registerContainer && recaptchaRegisterWidgetId === null) {
        recaptchaRegisterWidgetId = grecaptcha.render('recaptcha-register-container', {
            'sitekey' : RECAPTCHA_SITE_KEY
        });
        console.log('Widget reCAPTCHA de Registo renderizado com ID:', recaptchaRegisterWidgetId);
    }
};


document.addEventListener('DOMContentLoaded', () => {

    // --- VARIÁVEIS GLOBAIS E CONFIGURAÇÃO ---
    const API_BASE_URL = '/api';
    let currentUserId = null;
    let authToken = null;
    let scrapedProductData = null;
    let financeChartInstance = null;
    let financeOverviewChart = null;
    let categoryDistributionChart = null;
    let financialLineChart = null;
    let editingFinanceId = null;

    // --- SELETORES DE ELEMENTOS ---
    const getElem = (id) => document.getElementById(id);

    // Seção de Autenticação
    const authSection = getElem('auth-section');
    const dashboardLayout = document.querySelector('.dashboard-layout');
    const authTabButtons = document.querySelectorAll('.auth-tab-btn');
    const authTabContents = document.querySelectorAll('.auth-tab-content');
    const loginForm = getElem('login-form');
    const registerForm = getElem('register-form');
    const loginUsernameInput = getElem('login-username');
    const loginPasswordInput = getElem('login-password');
    const registerUsernameInput = getElem('register-username');
    const registerPasswordInput = getElem('register-password');
    const loginMessage = getElem('login-message');
    const registerMessage = getElem('register-message');
    const logoutBtn = getElem('logout-btn');
    const rememberMeCheckbox = getElem('remember-me-checkbox');
    const passwordStrengthIndicator = getElem('password-strength-indicator');
    const loadingOverlay = getElem('loading-overlay');
    const sidebar = document.querySelector('.sidebar');
    const tabButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const pendingList = getElem('pending-products-list');
    const purchasedList = getElem('purchased-products-list');
    const productUrlInputAddTab = getElem('productUrlInput-add-tab');
    const verifyUrlBtnAddTab = getElem('verifyUrlBtn-add-tab');
    const verifiedProductInfoDivAddTab = getElem('verifiedProductInfo-add-tab');
    const addProductMessageAddTab = getElem('add-product-message-add-tab');
    const saveProductBtnAddTab = getElem('save-product-btn-add-tab');
    const manualProductNameInput = getElem('manual-product-name');
    const manualProductPriceInput = getElem('manual-product-price');
    const manualProductUrlInput = getElem('manual-product-url');
    const manualProductImageUrlInput = getElem('manual-product-image-url');
    const manualProductCategorySelect = getElem('manual-product-category');
    const manualProductBrandInput = getElem('manual-product-brand');
    const manualProductDescriptionTextarea = getElem('manual-product-description');
    const productUrlInputProductsTab = getElem('productUrlInput-products-tab');
    const verifyUrlBtnProductsTab = getElem('verifyUrlBtn-products-tab');
    const verifiedProductInfoDivProductsTab = getElem('verifiedProductInfo-products-tab');
    const addProductMessageProductsTab = getElem('add-product-message-products-tab');
    const saveProductBtnProductsTab = getElem('save-product-btn-products-tab');
    const financeMonthInput = getElem('financeMonth');
    const financeRevenueInput = getElem('financeRevenue');
    const financeExpensesInput = getElem('financeExpenses');
    const addFinanceEntryBtn = getElem('add-finance-entry-btn');
    const cancelFinanceEditBtn = getElem('cancel-finance-edit-btn');
    const financeList = getElem('finance-list');
    const totalBalanceElem = getElem('finance-total-balance');
    const financeChartCanvas = getElem('financialLineChart');
    const financeEntryMessage = getElem('finance-entry-message');
    const financeFormContainer = document.querySelector('.finance-form-container');
    const financeOverviewChartCanvasEl = getElem('financeOverviewChart');
    const categoryDistributionChartCanvasEl = getElem('categoryDistributionChart');
    const detailsModal = getElem('product-details-modal');
    const modalProductImage = getElem('modal-product-image');
    const modalProductName = getElem('modal-product-name');
    const modalProductPrice = getElem('modal-product-price');
    const modalProductStatus = getElem('modal-product-status');
    const modalProductCategory = getElem('modal-product-category');
    const modalProductBrand = getElem('modal-product-brand');
    const modalProductAddedDate = getElem('modal-product-addedDate');
    const modalProductTags = getElem('modal-product-tags');
    const modalProductPriority = getElem('modal-product-priority');
    const modalProductNotes = getElem('modal-product-notes');
    const modalProductLink = getElem('modal-product-link');
    const modalActionPurchaseBtn = getElem('modal-action-purchase');
    const modalActionEditBtn = getElem('modal-action-edit');
    const modalActionDeleteBtn = getElem('modal-action-delete');
    const editModal = getElem('edit-product-modal');
    const editForm = getElem('edit-product-form');
    const editProductIdInput = getElem('edit-product-id');
    const editProductNameInput = getElem('edit-product-name');
    const editProductPriceInput = getElem('edit-product-price');
    const editProductUrlInput = getElem('edit-product-url');
    const editProductImageUrlInput = getElem('edit-product-image-url');
    const editProductCategorySelect = getElem('edit-product-category');
    const editProductStatusSelect = getElem('edit-product-status');
    const editProductTagsInput = getElem('edit-product-tags');
    const editProductDescriptionTextarea = getElem('edit-product-description');
    const editProductPreviewImage = getElem('edit-product-preview-image');
    const editProductPrioritySelect = getElem('edit-product-priority');
    const editProductNotesTextarea = getElem('edit-product-notes');
    const editProductMessage = getElem('edit-product-message');
    const imageModal = getElem('image-modal');
    const modalImageContent = getElem('modal-image-content');
    const pendingTotalValueEl = getElem('pending-total-value');
    const purchasedTotalValueEl = getElem('purchased-total-value');
    const pendingEmptyState = getElem('pending-empty-state');
    const purchasedEmptyState = getElem('purchased-empty-state');
    const goToBtnFromEmpty = getElem('go-to-add-product-tab-btn-from-empty');
    const changePasswordForm = getElem('change-password-form');
    const currentPasswordInput = getElem('current-password');
    const newPasswordInput = getElem('new-password');
    const confirmNewPasswordInput = getElem('confirm-new-password');
    const changePasswordMessage = getElem('change-password-message');
    const financeEmptyState = getElem('finance-empty-state');
    const themeSwitch = document.getElementById('theme-switch');

    // --- FUNÇÕES DE UTILIDADE ---
    async function authenticatedFetch(url, options = {}) {
        if (!authToken) {
            console.error("Token de autenticação não disponível. A redirecionar para o login.");
            showAuthSection();
            throw new Error("Não autenticado.");
        }
        const headers = {
            'Content-Type': 'application/json',
            'x-auth-token': authToken,
            ...options.headers,
        };
        const response = await fetch(url, { ...options, headers });

        if (response.status === 401 || response.status === 403) {
            showAuthMessage(loginMessage, 'Sessão expirada ou não autorizado. Por favor, faça o login novamente.', false);
            logoutUser();
            throw new Error("Não autorizado ou sessão expirada.");
        }
        return response;

    }
    function showAuthMessage(element, message, isSuccess = false) {
        if (element) {
            element.textContent = message;
            element.className = 'auth-message ' + (isSuccess ? 'success' : 'error');
            setTimeout(() => {
                element.textContent = '';
                element.className = 'auth-message';
            }, 5000);
        }
    }

    function showTabMessage(element, message, isSuccess = false) {
         if (element) {
            element.textContent = message;
            element.className = 'tab-message ' + (isSuccess ? 'success' : 'error');
            setTimeout(() => {
                element.textContent = '';
                element.className = 'tab-message';
            }, 5000);
        }
    }

    function showModal(modalElement) {
        if (modalElement) {
            modalElement.classList.remove('hidden');
            modalElement.classList.add('active');
        }
    }

    function hideModalWithDelay(modalElement, messageElement = null) {
        if (modalElement) {
            modalElement.classList.remove('active');
            setTimeout(() => {
                modalElement.classList.add('hidden');
                if (messageElement) messageElement.textContent = '';
            }, 300);
        }
    }

    function showAuthSection() {
        if(authSection) authSection.classList.remove('hidden');
        if(dashboardLayout) dashboardLayout.classList.add('hidden');
        if(loadingOverlay) loadingOverlay.classList.add('hidden');

        currentUserId = null;
        authToken = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');

        if(loginUsernameInput) loginUsernameInput.value = '';
        if(loginPasswordInput) loginPasswordInput.value = '';
        if(registerUsernameInput) registerUsernameInput.value = '';
        if(registerPasswordInput) registerPasswordInput.value = '';

        if(authTabButtons) authTabButtons.forEach(btn => btn.classList.remove('active'));
        const loginTabBtn = document.querySelector('[data-auth-tab="login"]');
        if(loginTabBtn) loginTabBtn.classList.add('active');

        if(authTabContents) authTabContents.forEach(tabContent => tabContent.classList.remove('active'));
        const loginTabContent = getElem('login-tab-content');
        if(loginTabContent) loginTabContent.classList.add('active');

        if(loginMessage) loginMessage.textContent = '';
        if(registerMessage) registerMessage.textContent = '';
        if(loadingOverlay) loadingOverlay.classList.add('hidden');
    }
    const togglePasswordVisibilityBtn = getElem('toggle-password-visibility');

    if (togglePasswordVisibilityBtn && registerPasswordInput) {
        togglePasswordVisibilityBtn.addEventListener('click', () => {
            const type = registerPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            registerPasswordInput.setAttribute('type', type);
            const icon = togglePasswordVisibilityBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }

    async function showDashboard() {
        if (authSection) authSection.classList.add('hidden');
        if (dashboardLayout) dashboardLayout.classList.add('hidden'); 
        if (loadingOverlay) loadingOverlay.classList.remove('hidden');

        try {
            await Promise.all([
                fetchAndRenderDashboardStats(),
                fetchAndRenderProducts(),
                fetchAndRenderFinances()
            ]);
            document.body.classList.add('app-logged-in');
            if (dashboardLayout) dashboardLayout.classList.remove('hidden');

        } catch (error) {
            console.error("Erro ao carregar dados iniciais do dashboard:", error);
            showAuthMessage(loginMessage, 'Erro ao carregar dados. Tente fazer o login novamente.', false);
            logoutUser();
        } finally {
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
        }
    }

    // --- LÓGICA DE AUTENTICAÇÃO ---
    if (authTabButtons) authTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            authTabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            authTabContents.forEach(tabContent => tabContent.classList.remove('active'));
            const tabContentElement = getElem(`${button.dataset.authTab}-tab-content`);
            if (tabContentElement) tabContentElement.classList.add('active');

            if(loginUsernameInput) loginUsernameInput.value = '';
            if(loginPasswordInput) loginPasswordInput.value = '';
            if(registerUsernameInput) registerUsernameInput.value = '';
            if(registerPasswordInput) registerPasswordInput.value = '';
            if(loginMessage) loginMessage.textContent = '';
            if(registerMessage) registerMessage.textContent = '';
        });
    });

    if (registerPasswordInput && passwordStrengthIndicator) {
        registerPasswordInput.addEventListener('input', () => {
            const password = registerPasswordInput.value;
            let strengthText = 'Força: ';
            let strengthColor = 'grey';
            let score = 0;

            if (password.length >= 8) score++;
            if (password.length >= 10) score++;
            if (/[A-Z]/.test(password)) score++;
            if (/[a-z]/.test(password)) score++;
            if (/[0-9]/.test(password)) score++;
            if (/[^A-Za-z0-9]/.test(password)) score++;

            switch (score) {
                case 0: case 1: case 2:
                    strengthText += 'Fraca';
                    strengthColor = 'red';
                    break;
                case 3: case 4:
                    strengthText += 'Média';
                    strengthColor = 'orange';
                    break;
                case 5: case 6:
                    strengthText += 'Forte';
                    strengthColor = 'green';
                    break;
                default:
                    strengthText += 'Muito Fraca';
                    strengthColor = 'darkred';
            }
            passwordStrengthIndicator.textContent = strengthText;
            passwordStrengthIndicator.style.color = strengthColor;
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = loginUsernameInput.value.trim();
            const password = loginPasswordInput.value.trim();

            if (!username || !password) {
                showAuthMessage(loginMessage, 'Por favor, preencha todos os campos.');
                return;
            }
            
            if (loadingOverlay) loadingOverlay.classList.remove('hidden');

            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });
                
                const data = await response.json();

                if (response.ok) {
                    authToken = data.token;
                    currentUserId = data.userId;
                    
                    if (rememberMeCheckbox && rememberMeCheckbox.checked) {
                        localStorage.setItem('authToken', authToken);
                        localStorage.setItem('userId', currentUserId);
                    } else {
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('userId');
                    }
                    
                    await showDashboard();

                } else {
                    if (loadingOverlay) loadingOverlay.classList.add('hidden');
                    showAuthMessage(loginMessage, data.message || 'Erro ao fazer o login.');
                }
            } catch (error) {
                if (loadingOverlay) loadingOverlay.classList.add('hidden');
                console.error('Erro de rede ao fazer o login:', error);
                showAuthMessage(loginMessage, 'Erro de conexão com o servidor.');
            }
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = registerUsernameInput.value.trim();
            const password = registerPasswordInput.value.trim();

            const recaptchaResponse = (typeof grecaptcha !== 'undefined' && recaptchaRegisterWidgetId !== null) 
                ? grecaptcha.getResponse(recaptchaRegisterWidgetId) 
                : '';

            if (!username || !password) {
                showAuthMessage(registerMessage, 'Por favor, preencha todos os campos.');
                return;
            }

            const passwordMinLength = 8;
            if (password.length < passwordMinLength) {
                showAuthMessage(registerMessage, `A senha deve ter no mínimo ${passwordMinLength} caracteres.`);
                return;
            }

            if (typeof grecaptcha !== 'undefined' && !recaptchaResponse) {
                showAuthMessage(registerMessage, 'Por favor, complete o reCAPTCHA.');
                return;
            }

            try {
                const bodyPayload = {
                    username,
                    password,
                    'g-recaptcha-response': recaptchaResponse
                };

                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bodyPayload),
                });

                const data = await response.json();

                if (response.ok) {
                    registerForm.reset();
                    if (passwordStrengthIndicator) {
                        passwordStrengthIndicator.textContent = 'Força: ';
                        passwordStrengthIndicator.style.color = 'grey';
                    }

                    showAuthMessage(registerMessage, data.message + ' A redirecionar para o login...', true);
                    if (typeof grecaptcha !== 'undefined' && recaptchaRegisterWidgetId !== null) grecaptcha.reset(recaptchaRegisterWidgetId);

                    setTimeout(() => {
                        const loginTabButton = document.querySelector('[data-auth-tab="login"]');
                        if (loginTabButton) loginTabButton.click();
                        
                        if (loginUsernameInput) loginUsernameInput.value = username;
                        if (loginPasswordInput) loginPasswordInput.focus();

                    }, 2000);

                } else {
                    showAuthMessage(registerMessage, data.message || 'Ocorreu um erro ao registar.');
                    if (typeof grecaptcha !== 'undefined' && recaptchaRegisterWidgetId !== null) grecaptcha.reset(recaptchaRegisterWidgetId);
                }
            } catch (error) {
                console.error('Erro de rede ao registar:', error);
                showAuthMessage(registerMessage, 'Não foi possível ligar ao servidor. Tente novamente.');
                if (typeof grecaptcha !== 'undefined' && recaptchaRegisterWidgetId !== null) grecaptcha.reset(recaptchaRegisterWidgetId);
            }
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
    }

    function logoutUser() {
        authToken = null;
        currentUserId = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        showAuthSection();
    }

    // --- LÓGICA DE NAVEGAÇÃO ---
    if (sidebar && tabButtons.length > 0) {
        sidebar.addEventListener('click', (e) => {
            const navBtn = e.target.closest('.nav-btn');
            if (!navBtn || navBtn.id === 'logout-btn') return;
            const tabId = navBtn.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            navBtn.classList.add('active');

            tabContents.forEach(tabContent => {
                tabContent.classList.toggle('active', tabContent.id === `${tabId}-tab`);
            });

            if (tabId === 'dashboard-main') fetchAndRenderDashboardStats();
            if (tabId === 'products' || tabId === 'history') fetchAndRenderProducts();
            if (tabId === 'finance') fetchAndRenderFinances();
            if (tabId === 'add-product') clearAddProductFormAddTab();
        });
    }

    if (goToBtnFromEmpty) {
        goToBtnFromEmpty.addEventListener('click', () => {
            const addProductTabButton = document.querySelector('.nav-btn[data-tab="add-product"]');
            if (addProductTabButton) addProductTabButton.click();
        });
    }
    
    const createProductCard = (product, cardType = 'product') => {
        const card = document.createElement('li');
        card.className = 'product-card';
        card.dataset.productId = product._id;
        card.dataset.productJson = JSON.stringify(product);

        if (cardType === 'history') {
            card.innerHTML = `
                <div class="card-image-container">
                    <img src="${product.image || 'https://via.placeholder.com/200x150?text=Indisponível'}" alt="${product.name || 'Produto'}" class="card-image">
                </div>
                <div class="card-content">
                    <h3 class="card-title">${product.name || 'Nome Indisponível'}</h3>
                </div>
                
                <div class="card-plastic-overlay"></div>
                <div class="card-shine-overlay"></div>
                <div class="card-border-overlay"></div>
            `;
        } else {
            const categoryColor = categoryColors[product.category] || categoryColors['Outros'];
            card.style.setProperty('--category-color', categoryColor);
            card.innerHTML = `
                ${product.category ? `<div class="card-category-badge">${product.category}</div>` : ''}
                <div class="card-image-container">
                    <img src="${product.image || 'https://via.placeholder.com/200x150?text=Indisponível'}" alt="${product.name || 'Produto'}" class="card-image">
                </div>
                <div class="card-content">
                    <h3 class="card-title">${product.name || 'Nome Indisponível'}</h3>
                    <p class="card-price">${product.price ? `R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}` : 'Preço Indisponível'}</p>
                </div>
                <div class="card-actions">
                     ${product.status === 'pendente' ? '<i class="fas fa-check-circle action-purchase" title="Marcar como Comprado"></i>' : ''}
                     <i class="fas fa-edit action-edit" title="Editar"></i>
                     <i class="fab fa-google action-search" title="Pesquisar produto na web"></i>
                     <i class="fas fa-trash-alt action-delete" title="Excluir"></i>
                </div>
            `;
            if (typeof VanillaTilt !== 'undefined') {
                VanillaTilt.init(card, { max: 10, speed: 200, glare: true, "max-glare": 0.2 });
            }
        }
        
        return card;
    };

    const fetchAndRenderProducts = async () => {
        if (!pendingList || !purchasedList || !pendingTotalValueEl || !purchasedTotalValueEl) return;
        if (!currentUserId) return;

        const smallSpinner = '<div class="spinner" style="width: 18px; height: 18px;"></div>';
        const listLoader = '<div class="content-loader"><div class="spinner"></div></div>';
        
        pendingTotalValueEl.innerHTML = smallSpinner;
        purchasedTotalValueEl.innerHTML = smallSpinner;
        
        pendingList.innerHTML = listLoader;
        purchasedList.innerHTML = ''; 

        if (pendingEmptyState) pendingEmptyState.style.display = 'none';
        if (purchasedEmptyState) purchasedEmptyState.style.display = 'none';

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/products?userId=${currentUserId}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || 'Erro ao buscar produtos');
            }
            
            const products = await response.json();
            const pendingProducts = products.filter(p => p.status === 'pendente');
            const historyProducts = products.filter(p => p.status === 'comprado' || p.status === 'descartado');

            pendingList.innerHTML = '';
            purchasedList.innerHTML = '';

            const pendingTotal = pendingProducts.reduce((sum, product) => sum + (product.price || 0), 0);
            pendingTotalValueEl.textContent = `R$ ${pendingTotal.toFixed(2).replace('.', ',')}`;

            const purchasedTotal = products.filter(p => p.status === 'comprado').reduce((sum, product) => sum + (product.price || 0), 0);
            purchasedTotalValueEl.textContent = `R$ ${purchasedTotal.toFixed(2).replace('.', ',')}`;

            if (pendingProducts.length === 0) {
                if (pendingEmptyState) pendingEmptyState.style.display = 'block';
            } else {
                pendingProducts.forEach(product => {
                    const card = createProductCard(product, 'product'); 
                    pendingList.appendChild(card);
                });
            }
            
            if (historyProducts.length === 0) {
                if (purchasedEmptyState) purchasedEmptyState.style.display = 'block';
            } else {
                historyProducts.forEach(product => {
                    const card = createProductCard(product, 'history'); 
                    purchasedList.appendChild(card);
                });
            }
            
            const historyCards = document.querySelectorAll("#history-tab .product-card");

            historyCards.forEach(card => {
                card.addEventListener("mousemove", e => {
                    const rect = card.getBoundingClientRect();
                    const { width, height, top, left } = rect;
                    const mouseX = e.clientX - left;
                    const mouseY = e.clientY - top;
                    const xPct = mouseX / width - 0.5;
                    const yPct = mouseY / height - 0.5;

                    card.style.setProperty("--rx", yPct * -20);
                    card.style.setProperty("--ry", xPct * 20);
                    card.style.setProperty("--pos", (mouseX / width) * 100);
                    card.style.setProperty("--mx", mouseX);
                    card.style.setProperty("--my", mouseY);
                });

                card.addEventListener("mouseleave", () => {
                    card.style.setProperty("--rx", 0);
                    card.style.setProperty("--ry", 0);
                });
            });

        } catch (error) {
            console.error("Erro em fetchAndRenderProducts:", error);
            const errorHtml = '<span class="error-message" style="font-size: 0.9em;">Erro!</span>';
            pendingTotalValueEl.innerHTML = errorHtml;
            purchasedTotalValueEl.innerHTML = errorHtml;
            
            const listError = '<div class="content-loader"><span class="error-message"><i class="fas fa-exclamation-triangle"></i> Não foi possível carregar.</span></div>';
            pendingList.innerHTML = listError;
            purchasedList.innerHTML = listError;
        }
    };

    function setContentState(wrapperElement, contentElement, state, errorMessage = 'Erro ao carregar.') {
        if (!wrapperElement || !contentElement) return;

        wrapperElement.innerHTML = '';
        contentElement.style.display = 'none';

        if (state === 'loading') {
            const loaderDiv = document.createElement('div');
            loaderDiv.className = 'content-loader';
            loaderDiv.innerHTML = '<div class="spinner"></div>';
            wrapperElement.appendChild(loaderDiv);
        } else if (state === 'error') {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'content-loader';
            errorDiv.innerHTML = `<span class="error-message"><i class="fas fa-exclamation-triangle"></i> ${errorMessage}</span>`;
            wrapperElement.appendChild(errorDiv);
        } else if (state === 'success') {
            contentElement.style.display = '';
        }
    }

    const getTextColor = () => getComputedStyle(document.body).getPropertyValue('--text-primary').trim();

    const updateChartColors = () => {
        const textColor = getTextColor();
        const chartInstances = [financeOverviewChart, categoryDistributionChart, financialLineChart];
        
        chartInstances.forEach(chart => {
            if (chart) {
                if (chart.options.plugins.legend) {
                    chart.options.plugins.legend.labels.color = textColor;
                }
                if (chart.options.scales) {
                    if (chart.options.scales.x) {
                        chart.options.scales.x.ticks.color = textColor;
                        chart.options.scales.x.grid.color = 'rgba(128, 128, 128, 0.1)';
                    }
                    if (chart.options.scales.y) {
                        chart.options.scales.y.ticks.color = textColor;
                        chart.options.scales.y.grid.color = 'rgba(128, 128, 128, 0.1)';
                    }
                }
                chart.update();
            }
        });
    };

    const categoryColors = {
        'Eletrônicos': '#3B82F6',
        'Roupas e Acessórios': '#8B5CF6',
        'Casa e Decoração': '#10B981',
        'Livros e Mídia': '#F59E0B',
        'Esportes e Lazer': '#EF4444',
        'Ferramentas e Construção': '#71717A',
        'Alimentos e Bebidas': '#F97316',
        'Saúde e Beleza': '#EC4899',
        'Automotivo': '#14B8A6',
        'Pet Shop': '#A16207',
        'Outros': '#6B7280'
    };

    const applySavedTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        if (themeSwitch) {
            themeSwitch.checked = savedTheme === 'dark';
        }
        setTimeout(updateChartColors, 50);
    };

    if (themeSwitch) {
        themeSwitch.addEventListener('change', () => {
            if (themeSwitch.checked) {
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
            }
            updateChartColors();
        });
    }

    applySavedTheme();

    function clearAddProductFormAddTab() {
        if (productUrlInputAddTab) productUrlInputAddTab.value = '';
        if (verifiedProductInfoDivAddTab) verifiedProductInfoDivAddTab.classList.add('hidden');
        if (manualProductNameInput) manualProductNameInput.value = '';
        if (manualProductPriceInput) manualProductPriceInput.value = '';
        if (manualProductUrlInput) manualProductUrlInput.value = '';
        if (manualProductImageUrlInput) manualProductImageUrlInput.value = '';
        if (manualProductCategorySelect) manualProductCategorySelect.value = 'Outros';
        if (manualProductBrandInput) manualProductBrandInput.value = '';
        if (manualProductDescriptionTextarea) manualProductDescriptionTextarea.value = '';
        if(addProductMessageAddTab) addProductMessageAddTab.textContent = '';
    }

    function clearProductScrapeFormProductsTab() {
        if (productUrlInputProductsTab) productUrlInputProductsTab.value = '';
        if (verifiedProductInfoDivProductsTab) verifiedProductInfoDivProductsTab.classList.add('hidden');
        if (saveProductBtnProductsTab) saveProductBtnProductsTab.style.display = 'none';
        if(addProductMessageProductsTab) addProductMessageProductsTab.textContent = '';
    }

    const setAppHeight = () => {
      const doc = document.documentElement;
      doc.style.setProperty('--app-height', `${window.innerHeight}px`);
    }
    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', setAppHeight); 
    setAppHeight(); 

    const fetchAndRenderDashboardStats = async () => {
        if (!currentUserId) return;

        const cardElements = {
            totalProducts: getElem('total-products-stat'),
            purchasedProducts: getElem('purchased-products-stat'),
            pendingProducts: getElem('pending-products-stat'),
            totalSpent: getElem('total-spent-stat'),
            avgSpent: getElem('avg-spent-stat'),
            currentMonthBalance: getElem('current-month-balance-stat')
        };

        const chartCanvases = {
            financeOverview: getElem('financeOverviewChart'),
            categoryDistribution: getElem('categoryDistributionChart'),
            priorityDistribution: getElem('priorityDistributionChart')
        };
        
        const spinnerHtml = '<div class="spinner"></div>';
        for (const key in cardElements) {
            if (cardElements[key]) {
                cardElements[key].innerHTML = spinnerHtml;
            }
        }

        try {
            const [
                statsResponse,
                financeResponse,
                categoryDistResponse,
                priorityDistResponse
            ] = await Promise.all([
                authenticatedFetch(`${API_BASE_URL}/products/stats?userId=${currentUserId}`),
                authenticatedFetch(`${API_BASE_URL}/finances?userId=${currentUserId}`),
                authenticatedFetch(`${API_BASE_URL}/products/category-distribution?userId=${currentUserId}`),
                authenticatedFetch(`${API_BASE_URL}/products/priority-distribution?userId=${currentUserId}`)
            ]);

            if (statsResponse.ok) {
                const stats = await statsResponse.json();
                cardElements.totalProducts.textContent = stats.totalProducts;
                cardElements.purchasedProducts.textContent = stats.purchasedProducts;
                cardElements.pendingProducts.textContent = stats.pendingProducts;
                cardElements.totalSpent.textContent = `R$ ${stats.totalSpent.toFixed(2).replace('.', ',')}`;
                const avgSpent = stats.purchasedProducts > 0 ? (stats.totalSpent / stats.purchasedProducts) : 0;
                if(cardElements.avgSpent) cardElements.avgSpent.textContent = `R$ ${avgSpent.toFixed(2).replace('.', ',')}`;
            } else {
                throw new Error("Falha ao buscar estatísticas dos produtos.");
            }

            if (financeResponse.ok) {
                const financeData = await financeResponse.json();
                const now = new Date();
                const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
                const currentMonthEntry = financeData.find(e => e.mes_ano === currentMonthStr);
                const balance = currentMonthEntry ? currentMonthEntry.receita - currentMonthEntry.gastos : 0;
                if(cardElements.currentMonthBalance) {
                    cardElements.currentMonthBalance.textContent = `R$ ${balance.toFixed(2).replace('.', ',')}`;
                    cardElements.currentMonthBalance.style.color = balance < 0 ? 'var(--error-color)' : 'var(--success-color)';
                }
                renderGenericChart(chartCanvases.financeOverview, 'line', financeData);
            } else {
                throw new Error("Falha ao buscar dados financeiros.");
            }

            const categoryData = categoryDistResponse.ok ? await categoryDistResponse.json() : { labels: [], data: [] };
            const priorityData = priorityDistResponse.ok ? await priorityDistResponse.json() : { labels: [], data: [] };
            renderGenericChart(chartCanvases.categoryDistribution, 'doughnut', categoryData, true);
            renderGenericChart(chartCanvases.priorityDistribution, 'pie', priorityData, true, ['#EF4444', '#F59E0B', '#10B981']);

        } catch (err) {
            console.error("Erro ao carregar dados do dashboard:", err);
            const errorHtml = '<span class="error-message" title="Erro ao carregar"><i class="fas fa-times-circle"></i></span>';
            for (const key in cardElements) {
                if (cardElements[key]) {
                    cardElements[key].innerHTML = errorHtml;
                }
            }
            for (const key in chartCanvases) {
                 const chartCanvas = chartCanvases[key];
                 if(chartCanvas) {
                    const existingChart = Chart.getChart(chartCanvas);
                    if (existingChart) existingChart.destroy();
                    const ctx = chartCanvas.getContext('2d');
                    ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
                 }
            }
        }
    };

    const renderGenericChart = (canvasEl, type, data, isPieOrDoughnut = false, customColors = null) => {
        if (!canvasEl) {
            return;
        }

        const existingChart = Chart.getChart(canvasEl);
        if (existingChart) {
            existingChart.destroy();
        }

        let chartData, chartOptions;

        if (isPieOrDoughnut) {
            chartData = {
                labels: data.labels,
                datasets: [{
                    data: data.data,
                    backgroundColor: customColors || ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6', '#F97316', '#8B5CF6'],
                    hoverOffset: 10
                }]
            };
            chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: getTextColor() }
                    },
                }
            };
        } else {
            const sortedEntries = [...data].sort((a, b) => a.mes_ano.localeCompare(b.mes_ano));
            const labels = sortedEntries.map(e => {
                const [year, month] = e.mes_ano.split('-');
                const date = new Date(year, month - 1);
                return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
            });
            const revenueData = sortedEntries.map(e => e.receita);
            const expensesData = sortedEntries.map(e => e.gastos);

            chartData = {
                labels: labels,
                datasets: [
                    {
                        label: 'Receita',
                        data: revenueData,
                        borderColor: 'rgb(62, 235, 103)',
                        backgroundColor: 'rgba(62, 235, 103, 0.5)',
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'Gastos',
                        data: expensesData,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        fill: false,
                        tension: 0.1
                    }
                ]
            };
            chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: getTextColor() }, grid: { color: 'rgba(128, 128, 128, 0.1)' } },
                    y: { beginAtZero: true, ticks: { color: getTextColor() }, grid: { color: 'rgba(128, 128, 128, 0.1)' } }
                },
                plugins: {
                    legend: { position: 'top', labels: { color: getTextColor() } }
                }
            };
        }

        new Chart(canvasEl.getContext('2d'), { type, data: chartData, options: chartOptions });
    };

    let financesData = [];
    const fetchAndRenderFinances = async () => {
        if (!financeList || !totalBalanceElem) return;
        if (!currentUserId) return;

        const financeEmptyState = getElem('finance-empty-state');

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/finances?userId=${currentUserId}`);
            if (!response.ok) throw new Error(`Erro ao buscar finanças: ${response.statusText}`);
            
            financesData = await response.json();
        } catch (error) {
            console.error("Erro em fetchAndRenderFinances:", error);
            financesData = []; 
            showTabMessage(financeEntryMessage, "Não foi possível carregar os dados financeiros.", false);
        }

        if (financeList) financeList.innerHTML = ''; 

        if (financesData.length === 0) {
            if (financeEmptyState) financeEmptyState.style.display = 'block';
            if (financeList) financeList.style.display = 'none'; 
            if (totalBalanceElem) totalBalanceElem.textContent = 'R$ 0,00';
        } else {
            if (financeEmptyState) financeEmptyState.style.display = 'none';
            if (financeList) financeList.style.display = 'block'; 

            let totalBalance = 0;
            const sortedFinancesForList = [...financesData].sort((a, b) => b.mes_ano.localeCompare(a.mes_ano));

            sortedFinancesForList.forEach(entry => {
                const balance = entry.receita - entry.gastos;
                totalBalance += balance;
                const li = document.createElement('li');
                li.dataset.financeId = entry._id;
                li.dataset.financeJson = JSON.stringify(entry);

                const formattedMonthYear = new Date(entry.mes_ano + "-02").toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

                li.innerHTML = `
                    <div class="finance-item-details">
                        <strong>${formattedMonthYear}</strong>
                        <span>Receita: <span class="revenue">R$ ${entry.receita.toFixed(2).replace('.', ',')}</span></span>
                        <span>Gastos: <span class="expenses">R$ ${entry.gastos.toFixed(2).replace('.', ',')}</span></span>
                        <span>Balanço: <span class="balance">R$ ${balance.toFixed(2).replace('.', ',')}</span></span>
                    </div>
                    <div class="finance-item-actions">
                        <button class="edit-finance-btn" data-id="${entry._id}" title="Editar Registro"><i class="fa fa-pen"></i></button>
                        <button class="delete-finance-btn" data-id="${entry._id}" title="Excluir Registro"><i class="fa fa-trash"></i></button>
                    </div>
                `;
                if (financeList) financeList.appendChild(li);
            });

            if (totalBalanceElem) totalBalanceElem.textContent = `R$ ${totalBalance.toFixed(2).replace('.', ',')}`;
        }

        renderGenericChart(financeChartCanvas, 'line', financesData, false, null);
    };

    const clearFinanceForm = () => { 
        if(financeMonthInput) financeMonthInput.value = ''; 
        if(financeRevenueInput) financeRevenueInput.value = ''; 
        if(financeExpensesInput) financeExpensesInput.value = ''; 
        if(addFinanceEntryBtn) addFinanceEntryBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Registro'; 
        if(cancelFinanceEditBtn) cancelFinanceEditBtn.classList.add('hidden'); 
        editingFinanceId = null; 
        if(financeEntryMessage) financeEntryMessage.textContent = ''; 
    };

    const setupFinanceEdit = (financeEntry) => { 
        if(financeMonthInput) financeMonthInput.value = financeEntry.mes_ano; 
        if(financeRevenueInput) financeRevenueInput.value = financeEntry.receita; 
        if(financeExpensesInput) financeExpensesInput.value = financeEntry.gastos; 
        if(addFinanceEntryBtn) addFinanceEntryBtn.innerHTML = '<i class="fas fa-save"></i> Atualizar Registro'; 
        if(cancelFinanceEditBtn) cancelFinanceEditBtn.classList.remove('hidden'); 
        editingFinanceId = financeEntry._id; 
        if(financeEntryMessage) financeEntryMessage.textContent = ''; 
    };
    
    function setupScrapeEventListeners(urlInputEl, verifyBtnEl, infoDivEl, messageEl, saveBtnEl) {
        if (verifyBtnEl && urlInputEl) {
            verifyBtnEl.addEventListener('click', async () => {
                const url = urlInputEl.value.trim();
                if (!url) {
                    showTabMessage(messageEl, 'Por favor, insira uma URL.', false);
                    return;
                }

                verifyBtnEl.disabled = true;
                verifyBtnEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
                if (messageEl) messageEl.textContent = '';
                if (infoDivEl) infoDivEl.classList.add('hidden'); 
                if (saveBtnEl) saveBtnEl.style.display = 'none';

                try {
                    const response = await fetch(`${API_BASE_URL}/products/scrape-url`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url }),
                    });

                    const data = await response.json();
                    if (!response.ok) {
                        throw new Error(data.message || `Erro HTTP ${response.status}`);
                    }
                    scrapedProductData = data; 

                    const verifiedImgEl = infoDivEl.querySelector('img[id^="verifiedProductImage"]');
                    const verifiedNameEl = infoDivEl.querySelector('span[id^="verifiedProductName"]');
                    const verifiedPriceEl = infoDivEl.querySelector('span[id^="verifiedProductPrice"]');

                    if (verifiedImgEl) verifiedImgEl.src = scrapedProductData.image || 'https://via.placeholder.com/200x150?text=Sem+Imagem';
                    if (verifiedNameEl) verifiedNameEl.textContent = scrapedProductData.name || 'Nome não encontrado';
                    if (verifiedPriceEl) verifiedPriceEl.textContent = scrapedProductData.price ? `R$ ${parseFloat(scrapedProductData.price).toFixed(2).replace('.',',')}` : 'Preço não encontrado';

                    if (urlInputEl.id === 'productUrlInput-add-tab') {
                        if (manualProductNameInput) manualProductNameInput.value = scrapedProductData.name || '';
                        if (manualProductPriceInput) manualProductPriceInput.value = scrapedProductData.price || '';
                        if (manualProductUrlInput) manualProductUrlInput.value = url;
                        if (manualProductImageUrlInput) manualProductImageUrlInput.value = scrapedProductData.image || '';
                        if (manualProductCategorySelect) manualProductCategorySelect.value = scrapedProductData.category || 'Outros';
                        if (manualProductBrandInput) manualProductBrandInput.value = scrapedProductData.brand || '';
                        if (manualProductDescriptionTextarea) manualProductDescriptionTextarea.value = scrapedProductData.description || '';
                    }

                    if (infoDivEl) infoDivEl.classList.remove('hidden');
                    if (saveBtnEl) saveBtnEl.style.display = 'inline-flex';
                    
                    showTabMessage(messageEl, 'Produto verificado! Você pode salvar o produto agora.', true);

                } catch (error) {
                    showTabMessage(messageEl, `Erro na verificação: ${error.message}`, false);
                    if (infoDivEl) infoDivEl.classList.add('hidden');
                } finally {
                    verifyBtnEl.disabled = false;
                    verifyBtnEl.innerHTML = '<i class="fas fa-search"></i> Verificar URL';
                }
            });
        }
    }
    
    if (productUrlInputAddTab && verifyUrlBtnAddTab) {
        setupScrapeEventListeners(productUrlInputAddTab, verifyUrlBtnAddTab, verifiedProductInfoDivAddTab, addProductMessageAddTab, saveProductBtnAddTab); 
    }

    if (productUrlInputProductsTab && verifyUrlBtnProductsTab) {
        setupScrapeEventListeners(productUrlInputProductsTab, verifyUrlBtnProductsTab, verifiedProductInfoDivProductsTab, addProductMessageProductsTab, saveProductBtnProductsTab);
    }
    
    if (saveProductBtnAddTab) {
        saveProductBtnAddTab.addEventListener('click', () => {
            let payload = {};
            if (scrapedProductData && scrapedProductData.name) {
                payload = { ...scrapedProductData, status: 'pendente' };
            } else {
                payload = {
                    name: manualProductNameInput.value.trim(), price: manualProductPriceInput.value.trim(),
                    urlOrigin: manualProductUrlInput.value.trim(), image: manualProductImageUrlInput.value.trim(),
                    category: manualProductCategorySelect.value, brand: manualProductBrandInput.value.trim(),
                    description: manualProductDescriptionTextarea.value.trim(), status: 'pendente'
                };
            }
            scrapedProductData = null;
            saveProductToDB(payload, addProductMessageAddTab);
        });
    }

    if (saveProductBtnProductsTab) {
        saveProductBtnProductsTab.addEventListener('click', () => {
            if (scrapedProductData && scrapedProductData.name) {
                const payload = { ...scrapedProductData, status: 'pendente' };
                scrapedProductData = null;
                saveProductToDB(payload, addProductMessageProductsTab);
            } else {
                showTabMessage(addProductMessageProductsTab, 'Não há informações de produto para salvar. Verifique a URL novamente.', false);
            }
        });
    }

    async function saveProductToDB(productPayload, messageElement) {
        if (!productPayload || !productPayload.name || !productPayload.price) {
            showTabMessage(messageElement, 'Informações do produto estão incompletas para salvar.', false);
            return;
        }
        try {
            await authenticatedFetch(`${API_BASE_URL}/products`, {
                method: 'POST',
                body: JSON.stringify(productPayload),
            });
            showTabMessage(messageElement, "Produto salvo com sucesso!", true);
            clearAddProductFormAddTab();
            clearProductScrapeFormProductsTab();
            await fetchAndRenderProducts();
            await fetchAndRenderDashboardStats();
        } catch (error) {
            console.error("Erro em saveProductToDB:", error);
            showTabMessage(messageElement, `Erro ao salvar: ${error.message}`, false);
        }
    }

    const mainContentArea = document.querySelector('.main-content-area');

    if (mainContentArea) {
        mainContentArea.addEventListener('click', async (e) => {
            const target = e.target;
            const card = target.closest('.product-card');

            if (!card) return;

            const productId = card.dataset.productId;
            const productData = JSON.parse(card.dataset.productJson);

            if (target.classList.contains('action-delete')) {
                e.stopPropagation();
                if (!confirm('Tem certeza que deseja excluir este produto?')) return;
                if (!currentUserId) { showTabMessage(addProductMessageAddTab, 'Você precisa estar logado para excluir produtos.', false); return; }

                try {
                    const response = await authenticatedFetch(`${API_BASE_URL}/products/${productId}`, {
                        method: 'DELETE',
                    });
                    if (!response.ok) throw new Error(`Erro ao excluir: ${response.statusText}`);
                    card.remove();
                    fetchAndRenderDashboardStats();
                    fetchAndRenderProducts();
                    showTabMessage(addProductMessageAddTab, "Produto excluído com sucesso!", true);
                } catch (error) {
                    showTabMessage(addProductMessageAddTab, `Erro ao excluir: ${error.message}`, false);
                }
            }
            else if (target.classList.contains('action-purchase')) {
                e.stopPropagation();
                if (!currentUserId) {
                    showTabMessage(addProductMessageAddTab, 'Você precisa estar logado.', false);
                    return;
                }

                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'card-loading-overlay';
                loadingDiv.innerHTML = '<i class="fas fa-spinner"></i>';
                card.appendChild(loadingDiv);

                try {
                    const response = await authenticatedFetch(`${API_BASE_URL}/products/${productId}/purchase`, {
                        method: 'PATCH',
                    });
                    if (!response.ok) throw new Error(`Erro ao marcar comprado: ${response.statusText}`);
                    
                    fetchAndRenderProducts();
                    fetchAndRenderDashboardStats();
                    showTabMessage(addProductMessageAddTab, "Produto marcado como comprado!", true);
                } catch (error) {
                    showTabMessage(addProductMessageAddTab, `Erro ao marcar comprado: ${error.message}`, false);
                    card.removeChild(loadingDiv);
                }
            }
            else if (target.classList.contains('action-edit')) {
                e.stopPropagation();
                if (!currentUserId) { showTabMessage(addProductMessageAddTab, 'Você precisa estar logado para editar produtos.', false); return; }

                if (editModal && editForm) {
                    if (editProductIdInput) editProductIdInput.value = productData._id;
                    if (editProductNameInput) editProductNameInput.value = productData.name || '';
                    if (editProductPriceInput) editProductPriceInput.value = productData.price || '';
                    if (editProductUrlInput) editProductUrlInput.value = productData.urlOrigin || '';
                    if (editProductImageUrlInput) editProductImageUrlInput.value = productData.image || '';
                    if (editProductCategorySelect) editProductCategorySelect.value = productData.category || 'Outros';
                    if (editProductStatusSelect) editProductStatusSelect.value = productData.status || 'pendente';
                    if (editProductTagsInput) editProductTagsInput.value = (productData.tags || []).join(', ');
                    if (editProductDescriptionTextarea) editProductDescriptionTextarea.value = productData.description || '';
                    if (editProductPrioritySelect) editProductPrioritySelect.value = productData.priority || 'Baixa';
                    if (editProductNotesTextarea) editProductNotesTextarea.value = productData.notes || '';

                    if (editProductPreviewImage) {
                        editProductPreviewImage.src = productData.image || '#';
                        editProductPreviewImage.classList.toggle('hidden', !productData.image);
                    }
                    showModal(editModal);
                    if (editProductMessage) editProductMessage.textContent = '';
                }
            }
            else if (target.classList.contains('action-search')) {
                e.stopPropagation();
                if (productData.name) {
                    const query = encodeURIComponent(productData.name);
                    const searchUrl = `https://www.google.com/search?tbm=shop&q=${query}`;

                    if (window.electronAPI && typeof window.electronAPI.openExternalLink === 'function') {
                        window.electronAPI.openExternalLink(searchUrl);
                    } else {
                        window.open(searchUrl, '_blank', 'noopener,noreferrer');
                    }
                }
            }
            else if (target.closest('.card-image-container')) {
                e.stopPropagation();
                if (productData.image) {
                    openImageModal(productData.image);
                }
            }
            else if (card) { 
                e.stopPropagation();
                const allModalElementsFound = detailsModal && modalProductImage && modalProductName && modalProductPrice && modalProductStatus && modalProductCategory && modalProductBrand && modalProductAddedDate &&  modalProductTags && modalProductLink && modalProductPriority && modalProductNotes;

                if (!allModalElementsFound) {
                    console.error("Um ou mais elementos do modal de detalhes não foram encontrados. Verifique seus IDs no index.html.");
                    return;
                }

                try {
                    const setDetail = (element, value, defaultValue = 'Não informado') => {
                        if (element) {
                            const hasValue = value && value.toString().trim() !== '';
                            element.textContent = hasValue ? value.toString() : defaultValue;
                            element.classList.toggle('data-missing', !hasValue);
                        }
                    };
                    
                    if (modalProductImage) modalProductImage.src = productData.image || 'https://via.placeholder.com/300x200?text=Sem+Imagem';
                    
                    setDetail(modalProductName, productData.name, 'Nome Indisponível');
                    setDetail(modalProductPrice, productData.price ? `R$ ${parseFloat(productData.price).toFixed(2)}` : '', 'Preço Indisponível');
                    setDetail(modalProductStatus, (productData.status && productData.status.length > 0) ? productData.status.charAt(0).toUpperCase() + productData.status.slice(1) : '');
                    setDetail(modalProductCategory, productData.category, 'Não definida');
                    setDetail(modalProductBrand, productData.brand);
                    setDetail(modalProductAddedDate, productData.createdAt ? new Date(productData.createdAt).toLocaleDateString('pt-BR') : '', 'Data indisponível');
                    setDetail(modalProductTags, (productData.tags && productData.tags.length > 0) ? productData.tags.join(', ') : '', 'Nenhuma');
                    setDetail(modalProductPriority, productData.priority, 'Não definida');
                    setDetail(modalProductNotes, productData.notes, 'Nenhuma.');

                    if (modalProductLink) modalProductLink.href = productData.urlOrigin || '#';

                    if (modalActionPurchaseBtn) modalActionPurchaseBtn.style.display = productData.status === 'pendente' ? 'inline-flex' : 'none';
                    if (modalActionPurchaseBtn) modalActionPurchaseBtn.dataset.productId = productId;
                    if (modalActionEditBtn) modalActionEditBtn.dataset.productId = productId;
                    if (modalActionDeleteBtn) modalActionDeleteBtn.dataset.productId = productId;

                    showModal(detailsModal);

                } catch (modalPopulationError) {
                    console.error("Erro ao popular ou exibir o modal de detalhes do produto:", modalPopulationError);
                    console.error("Dados do produto que causaram o erro:", productData);
                }
            }
        });
    }

    if (detailsModal && modalProductImage) { 
        modalProductImage.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            if (modalProductImage.src) { 
                openImageModal(modalProductImage.src); 
            }
        });
    }

    function openImageModal(imageSrc) { 
        if (!imageModal || !modalImageContent) { 
            console.error("Elementos do modal de imagem não encontrados. Verifique IDs."); 
            return; 
        }
        if(modalImageContent) modalImageContent.src = imageSrc; 
        showModal(imageModal); 
    }

    if (imageModal) { 
        imageModal.addEventListener('click', (e) => { 
            if (e.target === imageModal || e.target.classList.contains('close-modal-btn')) { 
                hideModalWithDelay(imageModal); 
            }
        });
    }
    
    if (detailsModal) { 
        detailsModal.addEventListener('click', (e) => { 
            if (e.target === detailsModal || e.target.classList.contains('close-modal-btn')) { 
                hideModalWithDelay(detailsModal); 
            }
        });
    }
    
    const closeEditModalBtn = editModal ? editModal.querySelector('.close-modal-btn') : null; 
    if (editModal && closeEditModalBtn) { 
        editModal.addEventListener('click', (e) => { 
            if (e.target === editModal || e.target === closeEditModalBtn) { 
                hideModalWithDelay(editModal, editProductMessage); 
            }
        });
    }

    if (detailsModal) { 
        detailsModal.addEventListener('click', async (e) => { 
            const target = e.target.closest('.modal-action-btn'); 
            if(!target) return; 

            const productId = target.dataset.productId; 
            if(!productId) return; 
            if (!currentUserId) { showTabMessage(addProductMessageAddTab, 'Você precisa estar logado para realizar esta ação.', false); return; } 

            if(target.id === 'modal-action-purchase') { 
                try {
                    const response = await authenticatedFetch(`${API_BASE_URL}/products/${productId}/purchase`, { 
                        method: 'PATCH', 
                    });
                    if (!response.ok) throw new Error(`Erro ao marcar comprado: ${response.statusText}`); 
                    hideModalWithDelay(detailsModal); 
                    fetchAndRenderProducts(); 
                    fetchAndRenderDashboardStats(); 
                    showTabMessage(addProductMessageAddTab, "Produto marcado como comprado!", true); 
                } catch (error) { showTabMessage(addProductMessageAddTab, `Erro ao marcar comprado: ${error.message}`, false); } 
            } else if (target.id === 'modal-action-edit') { 
                hideModalWithDelay(detailsModal); 
                const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`); 
                if (productCard) { 
                    const productData = JSON.parse(productCard.dataset.productJson); 
                    if (editModal && editForm) { 
                        if(editProductIdInput) editProductIdInput.value = productData._id; 
                        if(editProductNameInput) editProductNameInput.value = productData.name || ''; 
                        if(editProductPriceInput) editProductPriceInput.value = productData.price || ''; 
                        if(editProductUrlInput) editProductUrlInput.value = productData.urlOrigin || ''; 
                        if(editProductImageUrlInput) editProductImageUrlInput.value = productData.image || ''; 
                        if(editProductCategorySelect) editProductCategorySelect.value = productData.category || 'Outros'; 
                        if(editProductStatusSelect) editProductStatusSelect.value = productData.status || 'pendente'; 
                        if(editProductTagsInput) editProductTagsInput.value = (productData.tags || []).join(', '); 
                        if(editProductDescriptionTextarea) editProductDescriptionTextarea.value = productData.description || ''; 
                        if(editProductPrioritySelect) editProductPrioritySelect.value = productData.priority || 'Baixa'; 
                        if(editProductNotesTextarea) editProductNotesTextarea.value = productData.notes || ''; 
                        if(editProductPreviewImage) { 
                            editProductPreviewImage.src = productData.image || '#'; 
                            editProductPreviewImage.classList.toggle('hidden', !productData.image); 
                        }
                        showModal(editModal); 
                        if(editProductMessage) editProductMessage.textContent = ''; 
                    }
                }
            } else if (target.id === 'modal-action-delete') { 
                if (!confirm('Tem certeza que deseja excluir este produto?')) return; 
                try {
                    const response = await authenticatedFetch(`${API_BASE_URL}/products/${productId}`, { 
                        method: 'DELETE', 
                    });
                    if (!response.ok) throw new Error(`Erro ao excluir: ${response.statusText}`); 
                    hideModalWithDelay(detailsModal); 
                    fetchAndRenderProducts(); 
                    fetchAndRenderDashboardStats(); 
                    showTabMessage(addProductMessageAddTab, "Produto excluído com sucesso!", true); 
                }
                 catch (error) { showTabMessage(addProductMessageAddTab, `Erro ao excluir: ${error.message}`, false); } 
            }
        });
    }

    if (editForm) { 
        editForm.addEventListener('submit', async (e) => { 
            e.preventDefault(); 
            if (!editProductIdInput || !editProductNameInput || !editProductPriceInput) return; 
            if (!currentUserId) { showTabMessage(editProductMessage, 'Você precisa estar logado para salvar edições.', false); return; } 

            const productId = editProductIdInput.value; 
            const updatedData = { 
                name: editProductNameInput.value, 
                price: parseFloat(editProductPriceInput.value), 
                urlOrigin: editProductUrlInput ? editProductUrlInput.value : undefined, 
                image: editProductImageUrlInput ? editProductImageUrlInput.value : undefined, 
                category: editProductCategorySelect ? editProductCategorySelect.value : undefined, 
                status: editProductStatusSelect ? editProductStatusSelect.value : undefined, 
                tags: editProductTagsInput ? editProductTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag) : undefined, 
                description: editProductDescriptionTextarea ? editProductDescriptionTextarea.value : undefined, 
                priority: editProductPrioritySelect ? editProductPrioritySelect.value : undefined, 
                notes: editProductNotesTextarea ? editProductNotesTextarea.value : undefined, 
            };
            Object.keys(updatedData).forEach(key => { 
                if (updatedData[key] === undefined || updatedData[key] === '' || (Array.isArray(updatedData[key]) && updatedData[key].length === 0)) { 
                    delete updatedData[key]; 
                }
            });

            try {
                const response = await authenticatedFetch(`${API_BASE_URL}/products/${productId}`, { 
                    method: 'PUT', 
                    body: JSON.stringify(updatedData) 
                });
                if (!response.ok) { 
                    const errorData = await response.json(); 
                    throw new Error(errorData.message || response.statusText); 
                }
                hideModalWithDelay(editModal, editProductMessage); 
                fetchAndRenderProducts(); 
                showTabMessage(addProductMessageAddTab, "Produto atualizado com sucesso!", true); 
            } catch (error) { showTabMessage(editProductMessage, `Erro ao atualizar: ${error.message}`, false); } 
        });
    }
            if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmNewPassword = confirmNewPasswordInput.value;

        showTabMessage(changePasswordMessage, '', false);

        if (newPassword !== confirmNewPassword) {
            showTabMessage(changePasswordMessage, 'A nova senha e a confirmação não correspondem.', false);
            return;
        }

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/user/change-password`, {
                method: 'POST',
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                showTabMessage(changePasswordMessage, data.message, true);
                changePasswordForm.reset(); 
            } else {
                throw new Error(data.message || 'Não foi possível alterar a senha.');
            }
        } catch (error) {
            showTabMessage(changePasswordMessage, error.message, false);
        }
    });
}
    
    if(addFinanceEntryBtn && financeMonthInput && financeRevenueInput && financeExpensesInput) { 
        addFinanceEntryBtn.addEventListener('click', async () => { 
            if (!currentUserId) { showTabMessage(financeEntryMessage, 'Você precisa estar logado para gerenciar finanças.', false); return; } 

            const month = financeMonthInput.value; 
            const revenue = parseFloat(financeRevenueInput.value) || 0; 
            const expenses = parseFloat(financeExpensesInput.value) || 0; 

            if (!month) return showTabMessage(financeEntryMessage, "Selecione o mês e ano.", false); 
            if (isNaN(revenue) || isNaN(expenses)) return showTabMessage(financeEntryMessage, "Por favor, preencha valores numéricos válidos para Receita e Gastos.", false); 

            const financeData = { mes_ano: month, receita: revenue, gastos: expenses }; 

            try {
                let response; 
                if (editingFinanceId) { 
                    response = await authenticatedFetch(`${API_BASE_URL}/finances/${editingFinanceId}`, { 
                        method: 'PUT', 
                        body: JSON.stringify(financeData), 
                    });
                } else { 
                    response = await authenticatedFetch(`${API_BASE_URL}/finances`, { 
                        method: 'POST', 
                        body: JSON.stringify(financeData), 
                    });
                }

                if (!response.ok) { 
                    const errorData = await response.json(); 
                    throw new Error(errorData.message || response.statusText); 
                }

                showTabMessage(financeEntryMessage, `Registro financeiro ${editingFinanceId ? 'atualizado' : 'adicionado'} com sucesso!`, true); 
                fetchAndRenderFinances(); 
                fetchAndRenderDashboardStats(); 
                clearFinanceForm(); 
            } catch (error) { 
                showTabMessage(financeEntryMessage, `Erro ao salvar/atualizar finanças: ${error.message}`, false); 
                console.error("Erro financeiro:", error); 
            }
        });
    }
    if(cancelFinanceEditBtn) { 
        cancelFinanceEditBtn.addEventListener('click', () => { 
            clearFinanceForm(); 
        });
    }
    
    if(financeList) { 
        financeList.addEventListener('click', async (e) => { 
            const editBtn = e.target.closest('.edit-finance-btn'); 
            const deleteBtn = e.target.closest('.delete-finance-btn'); 

            if (!currentUserId) { showTabMessage(financeEntryMessage, 'Você precisa estar logado para gerenciar finanças.', false); return; } 

            if (editBtn) { 
                            const financeIdToEdit = editBtn.dataset.id; 
                            const entryElement = editBtn.closest('li'); 
                            if (entryElement && entryElement.dataset.financeJson) {
                                const financeEntry = JSON.parse(entryElement.dataset.financeJson); 
                                setupFinanceEdit(financeEntry); 
    
                                if (financeFormContainer) { 
                                    financeFormContainer.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
                                }
                            }

 } else if (deleteBtn) {
            const financeIdToDelete = deleteBtn.dataset.id;
            
            if (confirm('Tem certeza que deseja excluir este registro financeiro? Esta ação não pode ser desfeita.')) {
                try {
                    const response = await authenticatedFetch(`${API_BASE_URL}/finances/${financeIdToDelete}`, {
                        method: 'DELETE',
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || response.statusText);
                    }
                    showTabMessage(financeEntryMessage, "Registro financeiro excluído com sucesso!", true);
                    fetchAndRenderFinances();
                    fetchAndRenderDashboardStats();
                    clearFinanceForm();
                } catch (error) {
                    showTabMessage(financeEntryMessage, `Erro ao excluir registro financeiro: ${error.message}`, false);
                    console.error("Erro financeiro:", error);
                }
            }
                    }
        });
    }

    const storedAuthToken = localStorage.getItem('authToken'); 
    const storedUserId = localStorage.getItem('userId'); 

    if (storedAuthToken && storedUserId) { 
        authToken = storedAuthToken; 
        currentUserId = storedUserId; 
        showDashboard(); 
    } else { 
        showAuthSection(); 
    }

    // =========================================================================
    // --- INÍCIO DA LÓGICA OPEN FINANCE (INTEGRAÇÃO REAL BELVO) ---
    // Esta secção agora está DENTRO do DOMContentLoaded principal.
    // =========================================================================
    
    const connectNewAccountBtn = document.getElementById('connect-new-account-btn');
    const financeTabButton = document.querySelector('.nav-btn[data-tab="finance"]');
    
    const startBelvoConnection = async () => {
        const connectionsMessage = document.getElementById('connections-message');
        if (!currentUserId) {
            if (connectionsMessage) showTabMessage(connectionsMessage, 'Você precisa estar logado para conectar uma conta.', false);
            return;
        }

        if (connectNewAccountBtn) {
            connectNewAccountBtn.disabled = true;
            connectNewAccountBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A conectar...';
        }

        try {
            const tokenResponse = await authenticatedFetch(`${API_BASE_URL}/belvo/get-widget-token`, { method: 'POST' });
            
            if (!tokenResponse.ok) {
                const errorData = await tokenResponse.json().catch(() => ({}));
                throw new Error(errorData.message || 'Falha ao obter token do widget do servidor.');
            }

            const { access } = await tokenResponse.json();

            const belvoWidget = window.belvo.createWidget(access, {
                locale: 'pt-BR',
                country_codes: ['BR'],
            });

            belvoWidget.build({
                onSuccess: async (link) => {
                    await authenticatedFetch(`${API_BASE_URL}/belvo/register-link`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ linkId: link.id, userId: currentUserId })
                    });
                    
                    if (connectionsMessage) showTabMessage(connectionsMessage, 'Conta conectada com sucesso!', true);
                    if (window.renderFinanceDashboard) window.renderFinanceDashboard();
                    belvoWidget.destroy();
                },
                onExit: () => {
                    console.log('Utilizador fechou o widget.');
                    belvoWidget.destroy();
                },
                onEvent: (event) => console.log('Evento do Widget:', event)
            });

        } catch (error) {
            console.error("Erro ao iniciar conexão Belvo:", error);
            if (connectionsMessage) showTabMessage(connectionsMessage, `Erro: ${error.message}`, false);
        } finally {
            if (connectNewAccountBtn) {
                connectNewAccountBtn.disabled = false;
                connectNewAccountBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Conectar Nova Conta';
            }
        }
    };

    const renderFinanceDashboardWithBelvo = async () => {
        console.log("A renderizar o Painel Financeiro com dados da Belvo...");
        if (!currentUserId) return;

        try {
            const productsResponse = await authenticatedFetch(`${API_BASE_URL}/products?userId=${currentUserId}`);
            const allProducts = await productsResponse.json();
            const purchasedThisMonth = allProducts.filter(p => p.status === 'comprado' && new Date(p.purchasedAt).getMonth() === new Date().getMonth());
            const productExpenses = purchasedThisMonth.reduce((sum, p) => sum + (p.price || 0), 0);

            const belvoResponse = await authenticatedFetch(`${API_BASE_URL}/belvo/financial-data?userId=${currentUserId}`);
            const belvoData = await belvoResponse.json();
            
            const totalBalance = belvoData.accounts.reduce((sum, acc) => sum + acc.balance.current, 0);
            const belvoExpenses = belvoData.transactions.filter(t => t.amount < 0 && t.type === 'OUTFLOW').reduce((sum, t) => sum + Math.abs(t.amount), 0);
            const belvoRevenue = belvoData.transactions.filter(t => t.amount > 0 && t.type === 'INFLOW').reduce((sum, t) => sum + t.amount, 0);
            
            const totalExpenses = productExpenses + belvoExpenses;
            
            const revenueStatEl = document.getElementById('finance-revenue-stat');
            if (revenueStatEl) revenueStatEl.textContent = formatCurrency(belvoRevenue);
            
            const expensesStatEl = document.getElementById('finance-expenses-stat');
            if (expensesStatEl) expensesStatEl.textContent = formatCurrency(totalExpenses);

            const balanceStatEl = document.getElementById('finance-balance-stat');
            if (balanceStatEl) {
                balanceStatEl.textContent = formatCurrency(totalBalance);
                balanceStatEl.style.color = totalBalance < 0 ? 'var(--error-color)' : 'var(--success-color)';
            }
            
            const itemsPurchasedStatEl = document.getElementById('finance-items-purchased-stat');
            if (itemsPurchasedStatEl) itemsPurchasedStatEl.textContent = purchasedThisMonth.length;
            
        } catch (error) {
            console.error("Erro ao renderizar painel financeiro:", error);
        }
    };
    
    window.renderFinanceDashboard = renderFinanceDashboardWithBelvo;

    if (connectNewAccountBtn) {
        connectNewAccountBtn.addEventListener('click', startBelvoConnection);
    }

    if (financeTabButton) {
        financeTabButton.addEventListener('click', renderFinanceDashboardWithBelvo);
    }
    
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };
    // =========================================================================
    // --- FIM DA LÓGICA OPEN FINANCE ---
    // =========================================================================


    // --- INICIALIZAÇÃO DO APP ---
    // (Removido: duplicado de storedAuthToken e storedUserId)

    // A inicialização já foi feita anteriormente.

// --- FIM DO BLOCO ÚNICO E PRINCIPAL ---
});
