document.addEventListener('DOMContentLoaded', () => {

    // --- VARIÁVEIS GLOBAIS E CONFIGURAÇÃO ---
    const API_BASE_URL = '/api';
    let currentUserId = null;
    let authToken = null;
    let scrapedProductData = null;
    // let financeChartInstance = null; // REMOVIDO - Finanças
    let financeOverviewChart = null; // Mantido para o painel, mas o gráfico específico de finanças foi removido do HTML
    let categoryDistributionChart = null;
    // let editingFinanceId = null; // REMOVIDO - Finanças

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
    const tabButtons = document.querySelectorAll('.nav-btn'); // Todos os botões de navegação
    const tabContents = document.querySelectorAll('.tab-content');
    const productsTab = getElem('products-tab');
    const pendingList = getElem('pending-products-list');
    const purchasedList = getElem('purchased-products-list');
    const goToAddProductTabBtn = getElem('go-to-add-product-tab-btn');
    const addProductTab = getElem('add-product-tab');
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
    // Seletores de Finanças REMOVIDOS ou serão ignorados se não existirem no HTML
    // const financeMonthInput = getElem('financeMonth');
    // const financeRevenueInput = getElem('financeRevenue');
    // const financeExpensesInput = getElem('financeExpenses');
    // const addFinanceEntryBtn = getElem('add-finance-entry-btn');
    // const cancelFinanceEditBtn = getElem('cancel-finance-edit-btn');
    // const financeList = getElem('finance-list');
    // const totalBalanceElem = getElem('finance-total-balance');
    // const financeChartCanvas = getElem('financialLineChart'); // Este era para a aba de finanças
    // const financeEntryMessage = getElem('finance-entry-message');
    // const financeFormContainer = document.querySelector('.finance-form-container'); 
    
    // Gráficos do Painel Principal (o de finanças foi removido do HTML)
    // const financeOverviewChartCanvasEl = getElem('financeOverviewChart'); // REMOVIDO do HTML
    const categoryDistributionChartCanvasEl = getElem('categoryDistributionChart');

    const detailsModal = getElem('product-details-modal');
    const modalProductImage = getElem('modal-product-image');
    const modalProductName = getElem('modal-product-name');
    const modalProductPrice = getElem('modal-product-price');
    const modalProductStatus = getElem('modal-product-status');
    const modalProductCategory = getElem('modal-product-category');
    const modalProductBrand = getElem('modal-product-brand');
    const modalProductAddedDate = getElem('modal-product-addedDate');
    const modalProductDescription = getElem('modal-product-description');
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
    
    // REMOVIDO - Lógica do menu mobile deslizante
    // const mobileMenu = document.getElementById('mobileMenu');
    // const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    // const logoParaAbrirMenu = document.getElementById('triggerMobileMenu'); // AJUSTE O ID AQUI


    async function authenticatedFetch(url, options = {}) {
        if (!authToken) {
            console.error("Token de autenticação não disponível. Redirecionando para login.");
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
            showAuthMessage(loginMessage, 'Sessão expirada ou não autorizado. Por favor, faça login novamente.', false);
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
        if(authSection) authSection.classList.add('hidden');
        if(dashboardLayout) dashboardLayout.classList.add('hidden');
        if(loadingOverlay) loadingOverlay.classList.remove('hidden');

        try {
            await fetchAndRenderDashboardStats();
            await fetchAndRenderProducts();
            // await fetchAndRenderFinances(); // REMOVIDO - Finanças
            
            if(dashboardLayout) dashboardLayout.classList.remove('hidden');

            const initialActiveTabButton = document.querySelector('.nav-btn[data-tab="dashboard-main"]');
            if (initialActiveTabButton) {
                initialActiveTabButton.click();
            }
        } catch (error) {
            console.error("Erro ao carregar dados iniciais do dashboard:", error);
            showAuthMessage(loginMessage, 'Erro ao carregar dados. Tente fazer login novamente.', false);
            logoutUser();
        } finally {
            if(loadingOverlay) loadingOverlay.classList.add('hidden');
        }
    }

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
                    strengthText += 'Fraca'; strengthColor = 'red'; break;
                case 3: case 4:
                    strengthText += 'Média'; strengthColor = 'orange'; break;
                case 5: case 6:
                    strengthText += 'Forte'; strengthColor = 'green'; break;
                default:
                    strengthText += 'Muito Fraca'; strengthColor = 'darkred';
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
            const recaptchaResponse = (typeof grecaptcha !== 'undefined') ? grecaptcha.getResponse(0) : '';

            if (!username || !password) {
                showAuthMessage(loginMessage, 'Por favor, preencha todos os campos.');
                return;
            }
            if (typeof grecaptcha !== 'undefined' && !recaptchaResponse) {
                showAuthMessage(loginMessage, 'Por favor, complete o reCAPTCHA.');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, recaptchaToken: recaptchaResponse }),
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
                    showAuthMessage(loginMessage, data.message, true);
                    await showDashboard();
                } else {
                    showAuthMessage(loginMessage, data.message || 'Erro ao fazer login.');
                    if (typeof grecaptcha !== 'undefined') grecaptcha.reset(0);
                }
            } catch (error) {
                console.error('Erro de rede ao fazer login:', error);
                showAuthMessage(loginMessage, 'Erro de conexão com o servidor.');
                if (typeof grecaptcha !== 'undefined') grecaptcha.reset(0);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = registerUsernameInput.value.trim();
            const password = registerPasswordInput.value.trim();
            const recaptchaResponse = (typeof grecaptcha !== 'undefined') ? grecaptcha.getResponse(1) : '';

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
                const bodyPayload = { username, password, recaptchaToken: recaptchaResponse };
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bodyPayload),
                });
                const data = await response.json();

                if (response.ok) {
                    showAuthMessage(registerMessage, data.message, true);
                    if (typeof grecaptcha !== 'undefined') grecaptcha.reset(1);
                    registerForm.reset();
                    if(passwordStrengthIndicator) {
                        passwordStrengthIndicator.textContent = 'Força: ';
                        passwordStrengthIndicator.style.color = 'grey';
                    }
                } else {
                    showAuthMessage(registerMessage, data.message || 'Erro ao registrar.');
                    if (typeof grecaptcha !== 'undefined') grecaptcha.reset(1);
                }
            } catch (error) {
                console.error('Erro de rede ao registrar:', error);
                showAuthMessage(registerMessage, 'Erro de conexão com o servidor.');
                if (typeof grecaptcha !== 'undefined') grecaptcha.reset(1);
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

    if (sidebar && tabButtons.length > 0) {
        sidebar.addEventListener('click', (e) => {
            const navBtn = e.target.closest('.nav-btn');
            if (!navBtn || navBtn.id === 'logout-btn') return; // Ignora o botão de logout principal aqui
            
            const tabId = navBtn.dataset.tab;

            // Se o botão clicado for o de logout específico do mobile (se existir e for diferente)
            if (navBtn.id === 'logout-btn-mobile') {
                logoutUser();
                return;
            }

            tabButtons.forEach(btn => btn.classList.remove('active'));
            navBtn.classList.add('active');

            tabContents.forEach(tabContent => {
                tabContent.classList.toggle('active', tabContent.id === `${tabId}-tab`);
            });

            // REMOVIDO - if (tabId === 'finance') { fetchAndRenderFinances(); }
            if (tabId === 'dashboard-main') {
                fetchAndRenderDashboardStats();
            }
            if (tabId === 'products') {
                fetchAndRenderProducts();
                clearProductScrapeFormProductsTab();
            }
            if (tabId === 'history') {
                fetchAndRenderProducts(); // Mostra comprados/descartados
            }
            if (tabId === 'add-product') {
                clearAddProductFormAddTab();
            }
        });
    }
    
    // Adicionar listener para o botão de logout mobile se ele for diferente do desktop
    // e estiver dentro da estrutura do menu mobile (que não é mais o caso aqui,
    // o logoutBtn já captura o logout da barra inferior)


    if (goToAddProductTabBtn) {
        goToAddProductTabBtn.addEventListener('click', () => {
            const addProductNavBtn = document.querySelector('.nav-btn[data-tab="add-product"]');
            if (addProductNavBtn) {
                addProductNavBtn.click();
            }
        });
    }
    
    const createProductCard = (product) => {
        const card = document.createElement('li');
        card.className = 'product-card';
        card.dataset.productId = product._id;
        card.dataset.productJson = JSON.stringify(product);

        const formattedPrice = `R$ ${parseFloat(product.price || 0).toFixed(2)}`;
        card.innerHTML = `
            <div class="card-image-container">
                <img src="${product.image || 'https://via.placeholder.com/200x150?text=Indisponível'}" alt="${product.name || 'Produto'}" class="card-image">
            </div>
            <div class="card-content">
                <span class="card-title">${product.name || 'Nome Indisponível'}</span>
                <span class="card-price">${product.price ? formattedPrice : 'Preço Indisponível'}</span>
            </div>
            <div class="card-actions">
                ${product.status === 'pendente' ? '<i class="fas fa-check-circle action-purchase" title="Marcar como Comprado"></i>' : ''}
                <i class="fas fa-edit action-edit" title="Editar"></i>
                <i class="fas fa-trash-alt action-delete" title="Excluir"></i>
            </div>
        `;
        return card;
    };

    const fetchAndRenderProducts = async () => {
        if (!pendingList || !purchasedList) {
            console.warn("Elementos das listas de produtos não encontrados.");
            return;
        }
        if (!currentUserId) return;

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/products?userId=${currentUserId}`);
            if (!response.ok) throw new Error(`Erro ao buscar produtos: ${response.statusText}`);
            const products = await response.json();

            if(pendingList) pendingList.innerHTML = '';
            if(purchasedList) purchasedList.innerHTML = '';
            products.forEach(product => {
                const card = createProductCard(product);
                if (product.status === 'pendente' && pendingList) pendingList.appendChild(card);
                else if ((product.status === 'comprado' || product.status === 'descartado') && purchasedList) purchasedList.appendChild(card);
            });
        } catch (error) { console.error("Erro em fetchAndRenderProducts:", error); }
    };

    const fetchAndRenderDashboardStats = async () => {
        if (!currentUserId) return;

        if(getElem('total-products-stat')) getElem('total-products-stat').textContent = "0";
        if(getElem('purchased-products-stat')) getElem('purchased-products-stat').textContent = "0";
        if(getElem('pending-products-stat')) getElem('pending-products-stat').textContent = "0";
        if(getElem('total-spent-stat')) getElem('total-spent-stat').textContent = "R$ 0,00";

        try {
            const statsResponse = await authenticatedFetch(`${API_BASE_URL}/products/stats?userId=${currentUserId}`);
            if (!statsResponse.ok) throw new Error(`Erro ao buscar estatísticas: ${statsResponse.statusText}`);
            const stats = await statsResponse.json();

            if(getElem('total-products-stat')) getElem('total-products-stat').textContent = stats.totalProducts;
            if(getElem('purchased-products-stat')) getElem('purchased-products-stat').textContent = stats.purchasedProducts;
            if(getElem('pending-products-stat')) getElem('pending-products-stat').textContent = stats.pendingProducts;
            if(getElem('total-spent-stat')) {
                getElem('total-spent-stat').textContent = `R$ ${stats.totalSpent.toFixed(2)}`;
            }
        } catch(err) { console.error("Erro ao buscar produtos para stats:", err); }

        // REMOVIDO - Lógica do gráfico de visão geral financeira do painel
        // let financeOverviewData = []; 
        // try { ... }
        // renderGenericChart(financeOverviewChartCanvasEl, 'line', financeOverviewData, financeOverviewChart, 'financeOverviewChart');


        let categoryData = { labels: [], data: [] };
        try {
            const categoryDistResponse = await authenticatedFetch(`${API_BASE_URL}/products/category-distribution?userId=${currentUserId}`);
            if (categoryDistResponse.ok) {
                categoryData = await categoryDistResponse.json();
            } else {
                categoryData = { labels: ['Eletrônicos', 'Roupas', 'Outros'], data: [0,0,0] }; // Default
            }
        } catch (err) {
            console.error("Erro ao buscar dados de categoria para o dashboard. Usando mocks:", err);
            categoryData = { labels: ['Eletrônicos', 'Roupas', 'Outros'], data: [0,0,0] }; // Default
        }
        // Garantir que as cores do texto do gráfico de categorias sejam claras, pois o card é escuro
        const textColorForDarkBg = '#E0E0E0'; // Cor clara para texto em fundo escuro
        renderGenericChart(categoryDistributionChartCanvasEl, 'doughnut', categoryData, categoryDistributionChart, 'categoryDistributionChart', true, textColorForDarkBg);
    };
    
    // Ajustar renderGenericChart para aceitar cor de texto como parâmetro
    const renderGenericChart = (canvasEl, type, data, chartInstanceRef, chartIdForInstanceCheck, isCategory = false, textColor = '#666') => {
        if (!canvasEl) {
            return;
        }
        let currentChartInstance;
        if (chartIdForInstanceCheck === 'financeOverviewChart') currentChartInstance = financeOverviewChart;
        else if (chartIdForInstanceCheck === 'categoryDistributionChart') currentChartInstance = categoryDistributionChart;
        // else if (chartIdForInstanceCheck === 'financialLineChart') currentChartInstance = financeChartInstance; // REMOVIDO - Finanças

        if (currentChartInstance && currentChartInstance.canvas && currentChartInstance.canvas.id === canvasEl.id) {
            currentChartInstance.destroy();
        }

        let chartData, chartOptions;

        if (isCategory) { // Gráfico de Donut (Categorias)
            chartData = {
                labels: data.labels,
                datasets: [{
                    data: data.data,
                    backgroundColor: ['#007BFF', '#28A745', '#FFC107', '#DC3545', '#6F42C1', '#20C997', '#FD7E14', '#6610F2'],
                    hoverOffset: 8
                }]
            };
            chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor } }, // Usar textColor
                    title: { display: true, text: 'Distribuição por Categoria', color: textColor } // Usar textColor
                }
            };
        } else { // Gráfico de Linha (Visão Geral Financeira - agora removido do HTML, mas a lógica pode ser adaptada se voltar)
            // Esta parte não será chamada se financeOverviewChartCanvasEl for null
            const sortedEntries = [...data].sort((a, b) => b.mes_ano.localeCompare(a.mes_ano));
            const labels = sortedEntries.map(e => {
                const [year, month] = e.mes_ano.split('-');
                const date = new Date(year, month - 1);
                return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
            }).reverse();
            const revenueData = sortedEntries.map(e => e.receita).reverse();
            const expensesData = sortedEntries.map(e => e.gastos).reverse();

            chartData = {
                labels: labels,
                datasets: [
                    { label: 'Receita Mensal', data: revenueData, borderColor: '#28a745', backgroundColor: 'rgba(40, 167, 69, 0.1)', fill: true, tension: 0.1 },
                    { label: 'Gastos Mensais', data: expensesData, borderColor: '#dc3545', backgroundColor: 'rgba(220, 53, 69, 0.1)', fill: true, tension: 0.1 }
                ]
            };
            chartOptions = {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: textColor }, grid: { color: 'rgba(200, 200, 200, 0.1)' } },
                    y: { beginAtZero: true, title: { display: true, text: 'Valor (R$)', color: textColor }, ticks: { color: textColor }, grid: { color: 'rgba(200, 200, 200, 0.1)' } }
                },
                plugins: {
                    legend: { position: 'top', labels: { color: textColor } },
                    title: { display: true, text: 'Evolução Financeira Mensal', color: textColor }
                }
            };
        }
        
        if (!canvasEl.getContext) {
            console.error("Canvas context não encontrado para o gráfico:", canvasEl.id);
            return;
        }

        const newChartInstance = new Chart(canvasEl.getContext('2d'), { type, data: chartData, options: chartOptions });

        if (canvasEl.id === 'financeOverviewChart') financeOverviewChart = newChartInstance;
        else if (canvasEl.id === 'categoryDistributionChart') categoryDistributionChart = newChartInstance;
        // else if (canvasEl.id === 'financialLineChart') financeChartInstance = newChartInstance; // REMOVIDO - Finanças
    };
    
    // REMOVIDO - Variável e Funções de Finanças
    // let financesData = [];
    // const fetchAndRenderFinances = async () => { ... };
    // const clearFinanceForm = () => { ... };
    // const setupFinanceEdit = (financeEntry) => { ... };
    
    function setupScrapeEventListeners(urlInputEl, verifyBtnEl, infoDivEl, messageEl, saveBtnEl) {
        if (verifyBtnEl && urlInputEl && infoDivEl) {
            verifyBtnEl.addEventListener('click', async () => {
                const url = urlInputEl.value.trim();
                if (!url) return showTabMessage(messageEl, 'Por favor, insira uma URL.', false);
                verifyBtnEl.disabled = true;
                verifyBtnEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
                if(messageEl) messageEl.textContent = '';

                try {
                    const response = await fetch(`${API_BASE_URL}/products/scrape-url`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url }),
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || `Erro HTTP ${response.status}`);
                    }
                    scrapedProductData = await response.json();

                    const verifiedImgEl = infoDivEl.querySelector('img[id^="verifiedProductImage"]');
                    const verifiedNameEl = infoDivEl.querySelector('span[id^="verifiedProductName"]');
                    const verifiedPriceEl = infoDivEl.querySelector('span[id^="verifiedProductPrice"]');

                    if(verifiedImgEl) verifiedImgEl.src = scrapedProductData.image || 'https://via.placeholder.com/100?text=Sem+Imagem';
                    if(verifiedNameEl) verifiedNameEl.textContent = scrapedProductData.name || 'Nome não encontrado';
                    if(verifiedPriceEl) verifiedPriceEl.textContent = scrapedProductData.price ? `R$ ${parseFloat(scrapedProductData.price).toFixed(2)}` : 'Preço não encontrado';

                    if (manualProductNameInput) manualProductNameInput.value = scrapedProductData.name || '';
                    if (manualProductPriceInput) manualProductPriceInput.value = scrapedProductData.price || '';
                    if (manualProductUrlInput) manualProductUrlInput.value = url;
                    if (manualProductImageUrlInput) manualProductImageUrlInput.value = scrapedProductData.image || '';
                    if (manualProductCategorySelect) manualProductCategorySelect.value = scrapedProductData.category || 'Outros';
                    if (manualProductBrandInput) manualProductBrandInput.value = scrapedProductData.brand || '';
                    if (manualProductDescriptionTextarea) manualProductDescriptionTextarea.value = scrapedProductData.description || '';

                    if (infoDivEl) {
                        infoDivEl.classList.remove('hidden');
                        if (saveBtnEl) saveBtnEl.style.display = 'inline-flex';
                    }
                    showTabMessage(messageEl, 'Produto verificado com sucesso! Você pode ajustar os detalhes e salvar.', true);

                } catch (error) {
                    showTabMessage(messageEl, `Erro na verificação: ${error.message}`, false);
                    if (infoDivEl) infoDivEl.classList.add('hidden');
                    if (saveBtnEl) saveBtnEl.style.display = 'none';
                }
                finally { verifyBtnEl.disabled = false; verifyBtnEl.innerHTML = '<i class="fas fa-search-location"></i> Verificar URL'; }
            });
        }
    }
    
    if (productUrlInputAddTab && verifyUrlBtnAddTab && verifiedProductInfoDivAddTab && addProductMessageAddTab && saveProductBtnAddTab) {
        setupScrapeEventListeners(productUrlInputAddTab, verifyUrlBtnAddTab, verifiedProductInfoDivAddTab, addProductMessageAddTab, saveProductBtnAddTab);
    }
    if (productUrlInputProductsTab && verifyUrlBtnProductsTab && verifiedProductInfoDivProductsTab && addProductMessageProductsTab && saveProductBtnProductsTab) {
        setupScrapeEventListeners(productUrlInputProductsTab, verifyUrlBtnProductsTab, verifiedProductInfoDivProductsTab, addProductMessageProductsTab, saveProductBtnProductsTab);
    }

    if (saveProductBtnAddTab) {
        saveProductBtnAddTab.addEventListener('click', async () => {
            await handleSaveProduct(addProductMessageAddTab);
        });
    }

    if (saveProductBtnProductsTab) {
        saveProductBtnProductsTab.addEventListener('click', async () => {
            await handleSaveProduct(addProductMessageProductsTab);
        });
    }

    async function handleSaveProduct(messageElement) {
        if (!currentUserId) { showTabMessage(messageElement, 'Você precisa estar logado para adicionar produtos.', false); return; }

        const name = manualProductNameInput.value.trim();
        const price = parseFloat(manualProductPriceInput.value);
        const urlOrigin = manualProductUrlInput.value.trim();
        const image = manualProductImageUrlInput.value.trim();
        const category = manualProductCategorySelect.value;
        const brand = manualProductBrandInput.value.trim();
        const description = manualProductDescriptionTextarea.value.trim();

        if (!name || isNaN(price) || price <= 0 || !urlOrigin) {
            return showTabMessage(messageElement, 'Nome, preço (positivo) e URL de origem são obrigatórios.', false);
        }

        const productToAdd = { name, price, urlOrigin, image: image || undefined, category: category || 'Outros', brand: brand || undefined, description: description || undefined, status: 'pendente' };
        Object.keys(productToAdd).forEach(key => productToAdd[key] === undefined && delete productToAdd[key]);

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/products`, {
                method: 'POST',
                body: JSON.stringify(productToAdd),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || response.statusText);
            }
            showTabMessage(messageElement, "Produto salvo com sucesso!", true);
            clearAddProductFormAddTab();
            clearProductScrapeFormProductsTab();
            fetchAndRenderProducts();
            fetchAndRenderDashboardStats();
        } catch (error) {
            showTabMessage(messageElement, `Erro ao salvar produto: ${error.message}`, false);
            console.error("Erro ao salvar produto:", error);
        }
    }
    
    // REMOVIDO - Lógica do menu mobile deslizante
    // function toggleMobileMenu() { ... }
    // if (logoParaAbrirMenu) { ... }
    // if (mobileMenuOverlay) { ... }
    // const navButtonsMobile = mobileMenu.querySelectorAll('.nav-btn'); ...
    
    function clearAddProductFormAddTab() {
        if (productUrlInputAddTab) productUrlInputAddTab.value = '';
        if (verifiedProductInfoDivAddTab) verifiedProductInfoDivAddTab.classList.add('hidden');
        if (saveProductBtnAddTab) saveProductBtnAddTab.style.display = 'none';
        scrapedProductData = null;

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
                    const response = await authenticatedFetch(`${API_BASE_URL}/products/${productId}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error(`Erro ao excluir: ${response.statusText}`);
                    card.remove();
                    fetchAndRenderDashboardStats();
                    fetchAndRenderProducts();
                    showTabMessage(addProductMessageAddTab, "Produto excluído com sucesso!", true);
                } catch (error) { showTabMessage(addProductMessageAddTab, `Erro ao excluir: ${error.message}`, false); }
            }
            else if (target.classList.contains('action-purchase')) {
                e.stopPropagation();
                if (!currentUserId) { showTabMessage(addProductMessageAddTab, 'Você precisa estar logado para marcar produtos.', false); return; }

                try {
                    const response = await authenticatedFetch(`${API_BASE_URL}/products/${productId}/purchase`, { method: 'PATCH' });
                    if (!response.ok) throw new Error(`Erro ao marcar comprado: ${response.statusText}`);
                    fetchAndRenderProducts();
                    fetchAndRenderDashboardStats();
                    showTabMessage(addProductMessageAddTab, "Produto marcado como comprado!", true);
                } catch (error) { showTabMessage(addProductMessageAddTab, `Erro ao marcar comprado: ${error.message}`, false); }
            }
            else if (target.classList.contains('action-edit')) {
                e.stopPropagation();
                if (!currentUserId) { showTabMessage(addProductMessageAddTab, 'Você precisa estar logado para editar produtos.', false); return; }

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
            else if (target.closest('.card-image')) {
                e.stopPropagation();
                openImageModal(productData.image);
            }
            else if (target.closest('.card-title')) {
                e.stopPropagation();
                const allModalElementsFound = detailsModal && modalProductImage && modalProductName && modalProductPrice && modalProductStatus && modalProductCategory && modalProductBrand && modalProductAddedDate && modalProductDescription && modalProductTags && modalProductLink && modalProductPriority && modalProductNotes;

                if (!allModalElementsFound) {
                    console.error("Um ou mais elementos do modal de detalhes não foram encontrados.");
                    return;
                }
                try {
                    if(modalProductImage) modalProductImage.src = productData.image || 'https://via.placeholder.com/300x200?text=Sem+Imagem';
                    if(modalProductName) modalProductName.textContent = productData.name || 'Nome Indisponível';
                    if(modalProductPrice) modalProductPrice.textContent = productData.price ? `R$ ${parseFloat(productData.price).toFixed(2)}` : 'Preço Indisponível';
                    if(modalProductStatus) modalProductStatus.textContent = (productData.status && productData.status.length > 0) ? productData.status.charAt(0).toUpperCase() + productData.status.slice(1) : 'N/A';
                    if(modalProductCategory) modalProductCategory.textContent = productData.category || 'Não definida';
                    if(modalProductBrand) modalProductBrand.textContent = productData.brand || 'Não informada';
                    if(modalProductAddedDate) modalProductAddedDate.textContent = productData.createdAt ? new Date(productData.createdAt).toLocaleDateString('pt-BR') : 'Data indisponível';
                    if(modalProductDescription) modalProductDescription.textContent = productData.description || 'Nenhuma descrição.';
                    if(modalProductTags) modalProductTags.textContent = (productData.tags && productData.tags.length > 0) ? productData.tags.join(', ') : 'Nenhuma';
                    if(modalProductPriority) modalProductPriority.textContent = productData.priority || 'N/A';
                    if(modalProductNotes) modalProductNotes.textContent = productData.notes || 'Nenhuma.';
                    if(modalProductLink) modalProductLink.href = productData.urlOrigin || '#';
                    if (modalActionPurchaseBtn) modalActionPurchaseBtn.style.display = productData.status === 'pendente' ? 'inline-flex' : 'none';
                    if(modalActionPurchaseBtn) modalActionPurchaseBtn.dataset.productId = productId;
                    if(modalActionEditBtn) modalActionEditBtn.dataset.productId = productId;
                    if(modalActionDeleteBtn) modalActionDeleteBtn.dataset.productId = productId;
                    showModal(detailsModal);
                } catch (modalPopulationError) {
                    console.error("Erro ao popular ou exibir o modal de detalhes do produto:", modalPopulationError);
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
                    const response = await authenticatedFetch(`${API_BASE_URL}/products/${productId}/purchase`, { method: 'PATCH' });
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
                        // ... (restante do preenchimento do formulário de edição)
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
                    const response = await authenticatedFetch(`${API_BASE_URL}/products/${productId}`, { method: 'DELETE' });
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
    
    // REMOVIDO - Listeners de Finanças
    // if(addFinanceEntryBtn && financeMonthInput && financeRevenueInput && financeExpensesInput) { ... }
    // if(cancelFinanceEditBtn) { ... }
    // if(financeList) { ... }

    const storedAuthToken = localStorage.getItem('authToken');
    const storedUserId = localStorage.getItem('userId');

    if (storedAuthToken && storedUserId) {
        authToken = storedAuthToken;
        currentUserId = storedUserId;
        showDashboard();
    } else {
        showAuthSection();
    }
});