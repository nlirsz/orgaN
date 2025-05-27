document.addEventListener('DOMContentLoaded', () => {

    // --- VARIÁVEIS GLOBAIS E CONFIGURAÇÃO ---
    const API_BASE_URL = 'http://localhost:3000/api';
    let currentUserId = null;
    let authToken = null;
    let scrapedProductData = null;
    let financeChartInstance = null;
    let financeOverviewChart = null;
    let categoryDistributionChart = null;
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

    // Elemento de Carregamento (Spinner)
    const loadingOverlay = getElem('loading-overlay');


    // Abas e Navegação do Dashboard
    const sidebar = document.querySelector('.sidebar');
    const tabButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Produtos (aba 'products')
    const productsTab = getElem('products-tab');
    const pendingList = getElem('pending-products-list');
    const purchasedList = getElem('purchased-products-list');
    const goToAddProductTabBtn = getElem('go-to-add-product-tab-btn');

    // Adicionar Produto (aba 'add-product')
    const addProductTab = getElem('add-product-tab');
    const productUrlInput = getElem('productUrlInput');
    const verifyUrlBtn = getElem('verifyUrlBtn');
    const verifiedProductInfoDiv = getElem('verifiedProductInfo');
    const addProductMessage = getElem('add-product-message');

    // Campos de entrada manual de produto (agora na aba 'add-product')
    const manualProductNameInput = getElem('manual-product-name');
    const manualProductPriceInput = getElem('manual-product-price');
    const manualProductUrlInput = getElem('manual-product-url');
    const manualProductImageUrlInput = getElem('manual-product-image-url');
    const manualProductCategorySelect = getElem('manual-product-category');
    const manualProductBrandInput = getElem('manual-product-brand');
    const manualProductDescriptionTextarea = getElem('manual-product-description');
    const saveProductBtn = getElem('save-product-btn');


    // Finanças
    const financeMonthInput = getElem('financeMonth');
    const financeRevenueInput = getElem('financeRevenue');
    const financeExpensesInput = getElem('financeExpenses');
    const addFinanceEntryBtn = getElem('add-finance-entry-btn');
    const cancelFinanceEditBtn = getElem('cancel-finance-edit-btn');
    const financeList = getElem('finance-list');
    const totalBalanceElem = getElem('finance-total-balance');
    const financeChartCanvas = getElem('financialLineChart');
    const financeEntryMessage = getElem('finance-entry-message');

    // Dashboard Principal
    const financeOverviewChartCanvasEl = getElem('financeOverviewChart');
    const categoryDistributionChartCanvasEl = getElem('categoryDistributionChart');

    // Modais
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


    // --- FUNÇÕES DE UTILIDADE ---

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
        element.textContent = message;
        element.className = 'auth-message ' + (isSuccess ? 'success' : 'error');
        setTimeout(() => {
            element.textContent = '';
            element.className = 'auth-message';
        }, 5000);
    }

    function showTabMessage(element, message, isSuccess = false) {
        element.textContent = message;
        element.className = 'tab-message ' + (isSuccess ? 'success' : 'error');
        setTimeout(() => {
            element.textContent = '';
            element.className = 'tab-message';
        }, 5000);
    }


    function showAuthSection() {
        if(authSection) authSection.classList.remove('hidden');
        if(dashboardLayout) dashboardLayout.classList.add('hidden');
        if(loadingOverlay) loadingOverlay.classList.add('hidden'); // Garante que o loading overlay esteja oculto

        currentUserId = null;
        authToken = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');

        if(loginUsernameInput) loginUsernameInput.value = '';
        if(loginPasswordInput) loginPasswordInput.value = '';
        if(registerUsernameInput) registerUsernameInput.value = '';
        if(registerPasswordInput) registerPasswordInput.value = '';

        authTabButtons.forEach(btn => btn.classList.remove('active'));
        const loginTabBtn = document.querySelector('[data-auth-tab="login"]');
        if(loginTabBtn) loginTabBtn.classList.add('active');

        authTabContents.forEach(tabContent => tabContent.classList.remove('active'));
        const loginTabContent = getElem('login-tab-content');
        if(loginTabContent) loginTabContent.classList.add('active');

        if(loginMessage) loginMessage.textContent = '';
        if(registerMessage) registerMessage.textContent = '';
    }

    async function showDashboard() {
        if(authSection) authSection.classList.add('hidden');
        if(dashboardLayout) dashboardLayout.classList.add('hidden'); // Garante que o dashboard esteja oculto ANTES do loading
        if(loadingOverlay) loadingOverlay.classList.remove('hidden'); // Mostra o spinner de carregamento

        try {
            // Garante que os dados iniciais do dashboard e produtos sejam carregados
            await fetchAndRenderDashboardStats();
            await fetchAndRenderProducts();
            await fetchAndRenderFinances(); // Carrega finanças também no início
            // Se tudo carregou, só então mostra o dashboard
            if(dashboardLayout) dashboardLayout.classList.remove('hidden');
            // Ativa a primeira aba do dashboard após todos os dados carregados
            const initialActiveTabButton = getElem('dashboard-main');
            if (initialActiveTabButton) {
                initialActiveTabButton.click();
            }
        } catch (error) {
            console.error("Erro ao carregar dados iniciais do dashboard:", error);
            showAuthMessage(loginMessage, 'Erro ao carregar dados. Tente fazer login novamente.', false);
            logoutUser();
        } finally {
            if(loadingOverlay) loadingOverlay.classList.add('hidden'); // Sempre esconde o spinner no final
        }
    }

    // --- LÓGICA DE AUTENTICAÇÃO ---
    authTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            authTabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            authTabContents.forEach(tabContent => tabContent.classList.remove('active'));
            getElem(`${button.dataset.authTab}-tab-content`).classList.add('active');
            if(loginUsernameInput) loginUsernameInput.value = '';
            if(loginPasswordInput) loginPasswordInput.value = '';
            if(registerUsernameInput) registerUsernameInput.value = '';
            if(registerPasswordInput) registerPasswordInput.value = '';
            if(loginMessage) loginMessage.textContent = '';
            if(registerMessage) registerMessage.textContent = '';
        });
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = loginUsernameInput.value.trim();
            const password = loginPasswordInput.value.trim();

            if (!username || !password) {
                showAuthMessage(loginMessage, 'Por favor, preencha todos os campos.');
                return;
            }

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
                    const rememberMeCheckbox = getElem('remember-me-checkbox');
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
                }
            } catch (error) {
                console.error('Erro de rede ao fazer login:', error);
                showAuthMessage(loginMessage, 'Erro de conexão com o servidor.');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = registerUsernameInput.value.trim();
            const password = registerPasswordInput.value.trim();

            if (!username || !password) {
                showAuthMessage(registerMessage, 'Por favor, preencha todos os campos.');
                return;
            }
            if (password.length < 6) {
                showAuthMessage(registerMessage, 'A senha deve ter no mínimo 6 caracteres.');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });
                const data = await response.json();

                if (response.ok) {
                    authToken = data.token;
                    currentUserId = data.userId;
                    localStorage.setItem('authToken', authToken);
                    localStorage.setItem('userId', currentUserId);
                    showAuthMessage(registerMessage, data.message, true);
                    await showDashboard();
                } else {
                    showAuthMessage(registerMessage, data.message || 'Erro ao registrar.');
                }
            } catch (error) {
                console.error('Erro de rede ao registrar:', error);
                showAuthMessage(registerMessage, 'Erro de conexão com o servidor.');
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

    // --- LÓGICA DE NAVEGAÇÃO (ABAS DO DASHBOARD) ---
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

            if (tabId === 'finance') {
                fetchAndRenderFinances();
            }
            if (tabId === 'dashboard-main') {
                fetchAndRenderDashboardStats();
            }
            if (tabId === 'products') {
                fetchAndRenderProducts();
            }
            if (tabId === 'history') {
                fetchAndRenderProducts();
            }
            // Navegar para aba de adicionar produto e limpar/redefinir o form
            if (tabId === 'add-product') {
                clearAddProductForm();
            }
        });
    }

    if (goToAddProductTabBtn) {
        goToAddProductTabBtn.addEventListener('click', () => {
            const addProductNavBtn = document.querySelector('.nav-btn[data-tab="add-product"]');
            if (addProductNavBtn) {
                addProductNavBtn.click();
            }
        });
    }

    // --- FUNÇÕES DE PRODUTOS ---
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

            pendingList.innerHTML = '';
            purchasedList.innerHTML = '';
            products.forEach(product => {
                const card = createProductCard(product);
                if (product.status === 'pendente') pendingList.appendChild(card);
                else if (product.status === 'comprado' || product.status === 'descartado') purchasedList.appendChild(card);
            });
        } catch (error) { console.error("Erro em fetchAndRenderProducts:", error); }
    };

    // --- FUNÇÕES DE DASHBOARD PRINCIPAL ---
    const fetchAndRenderDashboardStats = async () => {
        console.log("Buscando estatísticas do dashboard...");
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

        let financeOverviewData = [];
        try {
            const financeOverviewResponse = await authenticatedFetch(`${API_BASE_URL}/finances?userId=${currentUserId}`);
            if (financeOverviewResponse.ok) {
                financeOverviewData = await financeOverviewResponse.json();
                console.log("Dados financeiros para o dashboard:", financeOverviewData);
            } else {
                console.warn("API de finanças não retornou dados. Usando mocks para o gráfico financeiro do dashboard.");
                financeOverviewData = [];
            }
        } catch (err) {
            console.error("Erro ao buscar dados financeiros para o dashboard. Usando mocks:", err);
            financeOverviewData = [];
        }
        renderGenericChart(financeOverviewChartCanvasEl, 'line', financeOverviewData, financeOverviewChart, 'financeOverviewChart');


        let categoryData = { labels: [], data: [] };
        try {
            const categoryDistResponse = await authenticatedFetch(`${API_BASE_URL}/products/category-distribution?userId=${currentUserId}`);
            if (categoryDistResponse.ok) {
                categoryData = await categoryDistResponse.json();
                console.log("Dados de categoria para o dashboard:", categoryData);
            } else {
                console.warn("API de distribuição de categoria não retornou dados. Usando mocks.");
                categoryData = {
                    labels: ['Eletrônicos', 'Roupas', 'Casa', 'Livros', 'Outros'],
                    data: [5, 3, 2, 1, 4]
                };
            }
        } catch (err) {
            console.error("Erro ao buscar dados de categoria para o dashboard. Usando mocks:", err);
            categoryData = {
                labels: ['Eletrônicos', 'Roupas', 'Casa', 'Livros', 'Outros'],
                data: [5, 3, 2, 1, 4]
            };
        }
        renderGenericChart(categoryDistributionChartCanvasEl, 'doughnut', categoryData, categoryDistributionChart, 'categoryDistributionChart', true);
    };

    const renderGenericChart = (canvasEl, type, data, chartInstanceRef, chartIdForInstanceCheck, isCategory = false) => {
        if (!canvasEl) {
            console.warn(`Elemento canvas para o gráfico ${chartIdForInstanceCheck} não encontrado.`);
            return;
        }

        if (chartInstanceRef && chartInstanceRef.canvas.id === canvasEl.id) {
            chartInstanceRef.destroy();
        }

        let chartData, chartOptions;

        if (isCategory) {
            chartData = {
                labels: data.labels,
                datasets: [{
                    data: data.data,
                    backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6', '#F97316', '#8B5CF6'],
                    hoverOffset: 4
                }]
            };
            chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#F3F4F6'
                        }
                    },
                    title: {
                        display: true,
                        text: isCategory ? 'Distribuição por Categoria' : 'Visão Geral Financeira',
                        color: '#F3F4F6'
                    }
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
                        label: 'Receita Mensal',
                        data: revenueData,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'Gastos Mensais',
                        data: expensesData,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        fill: false,
                        tension: 0.1
                    }
                ]
            };
            chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: { color: '#E0E0E0' },
                        grid: { color: 'rgba(224, 224, 224, 0.1)' }
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Valor (R$)', color: '#E0E0E0' },
                        ticks: { color: '#E0E0E0' },
                        grid: { color: 'rgba(224, 224, 224, 0.1)' }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#F3F4F6' }
                    },
                    title: {
                        display: true,
                        text: isCategory ? 'Distribuição por Categoria' : 'Evolução Financeira Mensal',
                        color: '#F3F4F6'
                    }
                }
            };
        }

        const newChartInstance = new Chart(canvasEl.getContext('2d'), { type, data: chartData, options: chartOptions });

        if (canvasEl.id === 'financialLineChart') financeChartInstance = newChartInstance;
        else if (canvasEl.id === 'financeOverviewChart') financeOverviewChart = newChartInstance;
        else if (canvasEl.id === 'categoryDistributionChart') categoryDistributionChart = newChartInstance;
    };


    // --- FUNÇÕES DE FINANÇAS DETALHADO ---
    let financesData = [];

    const fetchAndRenderFinances = async () => {
        if (!financeList || !totalBalanceElem) return;
        if (!currentUserId) return;

        if (financeMonthInput) financeMonthInput.disabled = false;
        if (financeRevenueInput) financeRevenueInput.disabled = false;
        if (financeExpensesInput) financeExpensesInput.disabled = false;

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/finances?userId=${currentUserId}`);
            if (!response.ok) throw new Error(`Erro ao buscar finanças: ${response.statusText}`);
            financesData = await response.json();
            console.log("Finanças carregadas da API:", financesData);
        } catch (error) {
            console.error("Erro em fetchAndRenderFinances:", error);
            financesData = [];
            showTabMessage(financeEntryMessage, "Não foi possível carregar os dados financeiros. Verifique a conexão ou tente novamente.", false);
        }

        financeList.innerHTML = '';
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
                    <span>Receita: <span class="revenue">R$ ${entry.receita.toFixed(2)}</span></span>
                    <span>Gastos: <span class="expenses">R$ ${entry.gastos.toFixed(2)}</span></span>
                    <span>Balanço: <span class="balance">R$ ${balance.toFixed(2)}</span></span>
                </div>
                <div class="finance-item-actions">
                    <button class="edit-finance-btn" data-id="${entry._id}" title="Editar Registro"><i class="fa fa-pen"></i></button>
                    <button class="delete-finance-btn" data-id="${entry._id}" title="Excluir Registro"><i class="fa fa-trash"></i></button>
                </div>
            `;
            financeList.appendChild(li);
        });
        if(totalBalanceElem) totalBalanceElem.textContent = `R$ ${totalBalance.toFixed(2)}`;

        renderGenericChart(financeChartCanvas, 'line', financesData, financeChartInstance, 'financialLineChart');
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

    // --- LÓGICA DE EVENTOS (Cont.) ---

    // Verificar URL (Scraping)
    if (verifyUrlBtn && productUrlInput && verifiedProductInfoDiv) {
        verifyUrlBtn.addEventListener('click', async () => {
            const url = productUrlInput.value.trim();
            if (!url) return showTabMessage(addProductMessage, 'Por favor, insira uma URL.', false);
            verifyUrlBtn.disabled = true;
            verifyUrlBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
            if(addProductMessage) addProductMessage.textContent = '';

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

                const verifiedImgEl = getElem('verifiedProductImage');
                const verifiedNameEl = getElem('verifiedProductName');
                const verifiedPriceEl = getElem('verifiedProductPrice');

                if(verifiedImgEl) verifiedImgEl.src = scrapedProductData.image || 'https://via.placeholder.com/100?text=Sem+Imagem';
                if(verifiedNameEl) verifiedNameEl.textContent = scrapedProductData.name || 'Nome não encontrado';
                if(verifiedPriceEl) verifiedPriceEl.textContent = scrapedProductData.price ? `R$ ${parseFloat(scrapedProductData.price).toFixed(2)}` : 'Preço não encontrado';

                // NOVO: Preencher campos do formulário manual com dados raspados
                if (manualProductNameInput) manualProductNameInput.value = scrapedProductData.name || '';
                if (manualProductPriceInput) manualProductPriceInput.value = scrapedProductData.price || '';
                if (manualProductUrlInput) manualProductUrlInput.value = url;
                if (manualProductImageUrlInput) manualProductImageUrlInput.value = scrapedProductData.image || '';
                if (manualProductCategorySelect) manualProductCategorySelect.value = scrapedProductData.category || 'Outros';
                if (manualProductBrandInput) manualProductBrandInput.value = scrapedProductData.brand || '';
                if (manualProductDescriptionTextarea) manualProductDescriptionTextarea.value = scrapedProductData.description || '';


                if (verifiedProductInfoDiv) {
                    if (saveProductBtn) saveProductBtn.style.display = 'inline-flex';
                }
                showTabMessage(addProductMessage, 'Produto verificado com sucesso! Você pode ajustar os detalhes e salvar.', true);

            } catch (error) {
                showTabMessage(addProductMessage, `Erro na verificação: ${error.message}`, false);
                verifiedProductInfoDiv.classList.add('hidden');
                if (saveProductBtn) saveProductBtn.style.display = 'none';
            }
            finally { verifyUrlBtn.disabled = false; verifyUrlBtn.innerHTML = '<i class="fas fa-search-location"></i> Verificar URL'; }
        });
    }

    // NOVO: Salvar Produto (para scraping ou manual)
    if (saveProductBtn) {
        saveProductBtn.addEventListener('click', async () => {
            if (!currentUserId) { showTabMessage(addProductMessage, 'Você precisa estar logado para adicionar produtos.', false); return; }

            const name = manualProductNameInput.value.trim();
            const price = parseFloat(manualProductPriceInput.value);
            const urlOrigin = manualProductUrlInput.value.trim();
            const image = manualProductImageUrlInput.value.trim();
            const category = manualProductCategorySelect.value;
            const brand = manualProductBrandInput.value.trim();
            const description = manualProductDescriptionTextarea.value.trim();

            if (!name || isNaN(price) || price <= 0 || !urlOrigin) {
                return showTabMessage(addProductMessage, 'Nome, preço (positivo) e URL de origem são obrigatórios.', false);
            }

            const productToAdd = {
                name,
                price,
                urlOrigin,
                image: image || undefined,
                category: category || 'Outros',
                brand: brand || undefined,
                description: description || undefined,
                status: 'pendente'
            };

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
                showTabMessage(addProductMessage, "Produto salvo com sucesso!", true);
                clearAddProductForm();
                fetchAndRenderProducts();
                fetchAndRenderDashboardStats();
            } catch (error) {
                showTabMessage(addProductMessage, `Erro ao salvar produto: ${error.message}`, false);
                console.error("Erro ao salvar produto:", error);
            }
        });
    }

    // NOVO: Função para limpar o formulário de adição de produto
    function clearAddProductForm() {
        if (productUrlInput) productUrlInput.value = '';
        if (verifiedProductInfoDiv) verifiedProductInfoDiv.classList.add('hidden');
        if (saveProductBtn) saveProductBtn.style.display = 'none';
        scrapedProductData = null;

        if (manualProductNameInput) manualProductNameInput.value = '';
        if (manualProductPriceInput) manualProductPriceInput.value = '';
        if (manualProductUrlInput) manualProductUrlInput.value = '';
        if (manualProductImageUrlInput) manualProductImageUrlInput.value = '';
        if (manualProductCategorySelect) manualProductCategorySelect.value = 'Outros';
        if (manualProductBrandInput) manualProductBrandInput.value = '';
        if (manualProductDescriptionTextarea) manualProductDescriptionTextarea.value = '';

        if(addProductMessage) addProductMessage.textContent = '';
    }


    // Delegação de eventos no conteúdo principal para cards
    document.querySelector('.main-content-area').addEventListener('click', async (e) => {
        const target = e.target;
        const card = target.closest('.product-card');

        // Fechar Modais
        if (target.classList.contains('close-modal-btn') || target.classList.contains('modal-overlay')) {
            const activeModal = document.querySelector('.modal-overlay.active');
            if (activeModal) activeModal.classList.remove('active');
            if(editProductMessage) editProductMessage.textContent = '';
            return;
        }

        if (!card) return;

        const productId = card.dataset.productId;
        const productData = JSON.parse(card.dataset.productJson);

        // Ações dos Ícones no Card
        if (target.classList.contains('action-delete')) {
            e.stopPropagation();
            if (!confirm('Tem certeza que deseja excluir este produto?')) return;
            if (!currentUserId) { showTabMessage(addProductMessage, 'Você precisa estar logado para excluir produtos.', false); return; }

            try {
                const response = await authenticatedFetch(`${API_BASE_URL}/products/${productId}`, {
                    method: 'DELETE',
                });
                if (!response.ok) throw new Error(`Erro ao excluir: ${response.statusText}`);
                card.remove();
                fetchAndRenderDashboardStats();
                fetchAndRenderProducts();
                showTabMessage(addProductMessage, "Produto excluído com sucesso!", true);
            } catch (error) { showTabMessage(addProductMessage, `Erro ao excluir: ${error.message}`, false); }
        }
        else if (target.classList.contains('action-purchase')) {
            e.stopPropagation();
            if (!currentUserId) { showTabMessage(addProductMessage, 'Você precisa estar logado para marcar produtos.', false); return; }

            try {
                const response = await authenticatedFetch(`${API_BASE_URL}/products/${productId}/purchase`, {
                    method: 'PATCH',
                });
                if (!response.ok) throw new Error(`Erro ao marcar comprado: ${response.statusText}`);
                fetchAndRenderProducts();
                fetchAndRenderDashboardStats();
                showTabMessage(addProductMessage, "Produto marcado como comprado!", true);
            } catch (error) { showTabMessage(addProductMessage, `Erro ao marcar comprado: ${error.message}`, false); }
        }
        else if (target.classList.contains('action-edit')) {
            e.stopPropagation();
            if (!currentUserId) { showTabMessage(addProductMessage, 'Você precisa estar logado para editar produtos.', false); return; }

            if (editModal && editForm) {
                editProductIdInput.value = productData._id;
                editProductNameInput.value = productData.name || '';
                editProductPriceInput.value = productData.price || '';
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
                editModal.classList.add('active');
                if(editProductMessage) editProductMessage.textContent = '';
            }
        }
        // Clique no Card para ver Detalhes
        else {
            console.log("Card clicado, tentando mostrar modal de detalhes.");
            const allModalElementsFound = detailsModal && modalProductImage && modalProductName && modalProductPrice && modalProductStatus && modalProductCategory && modalProductBrand && modalProductAddedDate && modalProductDescription && modalProductTags && modalProductLink && modalProductPriority && modalProductNotes;

            if (!allModalElementsFound) {
                console.error("Um ou mais elementos do modal de detalhes não foram encontrados. Verifique seus IDs no index.html.");
                return;
            }

            try {
                modalProductImage.src = productData.image || 'https://via.placeholder.com/300x200?text=Sem+Imagem';
                modalProductName.textContent = productData.name || 'Nome Indisponível';
                modalProductPrice.textContent = productData.price ? `R$ ${parseFloat(productData.price).toFixed(2)}` : 'Preço Indisponível';
                modalProductStatus.textContent = (productData.status && productData.status.length > 0) ? productData.status.charAt(0).toUpperCase() + productData.status.slice(1) : 'N/A';
                modalProductCategory.textContent = productData.category || 'Não definida';
                modalProductBrand.textContent = productData.brand || 'Não informada';
                modalProductAddedDate.textContent = productData.createdAt ? new Date(productData.createdAt).toLocaleDateString('pt-BR') : 'Data indisponível';
                modalProductDescription.textContent = productData.description || 'Nenhuma descrição.';
                modalProductTags.textContent = (productData.tags && productData.tags.length > 0) ? productData.tags.join(', ') : 'Nenhuma';
                modalProductPriority.textContent = productData.priority || 'N/A';
                modalProductNotes.textContent = productData.notes || 'Nenhuma.';

                modalProductLink.href = productData.urlOrigin || '#'; // Garante que há um href padrão

                if (modalActionPurchaseBtn) modalActionPurchaseBtn.style.display = productData.status === 'pendente' ? 'inline-flex' : 'none';
                if(modalActionPurchaseBtn) modalActionPurchaseBtn.dataset.productId = productId;
                if(modalActionEditBtn) modalActionEditBtn.dataset.productId = productId;
                if(modalActionDeleteBtn) modalActionDeleteBtn.dataset.productId = productId;

                detailsModal.classList.add('active');
                console.log("Classe 'active' adicionada ao modal de detalhes.");
            } catch (modalPopulationError) {
                console.error("Erro ao popular ou exibir o modal de detalhes do produto:", modalPopulationError);
                console.error("Dados do produto que causaram o erro:", productData);
            }
        }
    });

    // Ações DENTRO do modal de detalhes
    if (detailsModal) {
        detailsModal.addEventListener('click', async (e) => {
            const target = e.target.closest('.modal-action-btn');
            if(!target) return;

            const productId = target.dataset.productId;
            if(!productId) return;
            if (!currentUserId) { showTabMessage(addProductMessage, 'Você precisa estar logado para realizar esta ação.', false); return; }

            if(target.id === 'modal-action-purchase') {
                try {
                    const response = await authenticatedFetch(`${API_BASE_URL}/products/${productId}/purchase`, {
                        method: 'PATCH',
                    });
                    if (!response.ok) throw new Error(`Erro ao marcar comprado: ${response.statusText}`);
                    detailsModal.classList.remove('active');
                    fetchAndRenderProducts();
                    fetchAndRenderDashboardStats();
                    showTabMessage(addProductMessage, "Produto marcado como comprado!", true);
                } catch (error) { showTabMessage(addProductMessage, `Erro ao marcar comprado: ${error.message}`, false); }
            } else if (target.id === 'modal-action-edit') {
                detailsModal.classList.remove('active');
                const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
                if (productCard) {
                    const productData = JSON.parse(productCard.dataset.productJson);
                    if (editModal && editForm) {
                        editProductIdInput.value = productData._id;
                        editProductNameInput.value = productData.name || '';
                        editProductPriceInput.value = productData.price || '';
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
                        editModal.classList.add('active');
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
                    detailsModal.classList.remove('active');
                    fetchAndRenderProducts();
                    fetchAndRenderDashboardStats();
                    showTabMessage(addProductMessage, "Produto excluído com sucesso!", true);
                }
                 catch (error) { showTabMessage(addProductMessage, `Erro ao excluir: ${error.message}`, false); }
            }
        });
    }


    // Salvar Edição do Produto
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
                if(editModal) editModal.classList.remove('active');
                fetchAndRenderProducts();
                showTabMessage(addProductMessage, "Produto atualizado com sucesso!", true);
            } catch (error) { showTabMessage(editProductMessage, `Erro ao atualizar: ${error.message}`, false); }
        });
    }

    // Adicionar/Editar Registro Financeiro
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

    // Delegação para botões de editar/excluir na lista de finanças
    if(financeList) {
        financeList.addEventListener('click', async (e) => {
            const editBtn = e.target.closest('.edit-finance-btn');
            const deleteBtn = e.target.closest('.delete-finance-btn');

            if (!currentUserId) { showTabMessage(financeEntryMessage, 'Você precisa estar logado para gerenciar finanças.', false); return; }

            if (editBtn) {
                const financeIdToEdit = editBtn.dataset.id;
                const entryElement = editBtn.closest('li');
                const financeEntry = JSON.parse(entryElement.dataset.financeJson);
                setupFinanceEdit(financeEntry);
            } else if (deleteBtn) {
                const financeIdToDelete = deleteBtn.dataset.id;
                if (confirm('Tem certeza que deseja excluir este registro financeiro?')) {
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


    // --- INICIALIZAÇÃO ---
    const storedAuthToken = localStorage.getItem('authToken');
    const storedUserId = localStorage.getItem('userId');

    if (storedAuthToken && storedUserId) {
        authToken = storedAuthToken;
        currentUserId = storedUserId;
        showDashboard(); // Chama showDashboard para carregar dados e exibir
    } else {
        showAuthSection(); // Mostra a tela de login
    }
});