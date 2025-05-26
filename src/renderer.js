document.addEventListener('DOMContentLoaded', () => {

    // --- VARIÁVEIS GLOBAIS E CONFIGURAÇÃO ---
    const API_BASE_URL = 'http://localhost:3000/api';
    let currentUserId = '66452182570e88024d2d4411'; // Provisório
    let scrapedProductData = null;
    let financeChartInstance = null; // Para o gráfico detalhado de finanças
    let financeOverviewChart = null; // Para o gráfico na aba Dashboard Principal
    let categoryDistributionChart = null; // Para o gráfico de categorias
    let editingFinanceId = null;

    // --- SELETORES DE ELEMENTOS ---
    const getElem = (id) => document.getElementById(id);

    // Abas e Navegação
    const sidebar = document.querySelector('.sidebar');
    const tabContents = document.querySelectorAll('.tab-content');

    // Produtos
    const pendingList = getElem('pending-products-list');
    const purchasedList = getElem('purchased-products-list');
    const verifyUrlBtn = getElem('verifyUrlBtn');
    const productUrlInput = getElem('productUrlInput');
    const verifiedProductInfoDiv = getElem('verifiedProductInfo');
    
    // Finanças
    const financeMonthInput = getElem('financeMonth');
    const financeRevenueInput = getElem('financeRevenue');
    const financeExpensesInput = getElem('financeExpenses');
    const addFinanceEntryBtn = getElem('add-finance-entry-btn');
    const cancelFinanceEditBtn = getElem('cancel-finance-edit-btn');
    const financeList = getElem('finance-list');
    const totalBalanceElem = getElem('finance-total-balance');
    const financeChartCanvas = getElem('financialLineChart'); // Canvas da aba Finanças
    
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


    // --- LÓGICA DE NAVEGAÇÃO (ABAS) ---
    if (sidebar && tabContents.length > 0) {
        sidebar.addEventListener('click', (e) => {
            const navBtn = e.target.closest('.nav-btn');
            if (!navBtn) return;
            const tabId = navBtn.dataset.tab;

            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            navBtn.classList.add('active');

            tabContents.forEach(tab => {
                tab.classList.toggle('active', tab.id === `${tabId}-tab`);
            });

            if (tabId === 'finance' && financeChartCanvas) {
                fetchAndRenderFinances();
            }
            if (tabId === 'dashboard-main') {
                fetchAndRenderDashboardStats();
            }
        });
    }

    // --- FUNÇÕES DE PRODUTOS ---
    const createProductCard = (product) => {
        const card = document.createElement('li');
        card.className = 'product-card';
        card.dataset.productId = product._id;
        card.dataset.productJson = JSON.stringify(product); 

        const formattedPrice = `R$ ${parseFloat(product.price || 0).toFixed(2)}`; // Garante que price não seja undefined
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
        try {
            const response = await fetch(`${API_BASE_URL}/products?userId=${currentUserId}`);
            if (!response.ok) throw new Error(`Erro ao buscar produtos: ${response.statusText}`);
            const products = await response.json();
            
            pendingList.innerHTML = '';
            purchasedList.innerHTML = '';
            products.forEach(product => {
                const card = createProductCard(product);
                if (product.status === 'pendente') pendingList.appendChild(card);
                else if (product.status === 'comprado') purchasedList.appendChild(card);
            });
        } catch (error) { console.error("Erro em fetchAndRenderProducts:", error); }
    };
    
    // --- FUNÇÕES DE DASHBOARD PRINCIPAL ---
    const fetchAndRenderDashboardStats = async () => {
        // TODO: Implementar chamadas reais à API para buscar estatísticas
        console.log("Buscando estatísticas do dashboard...");
        if(getElem('total-products-stat')) getElem('total-products-stat').textContent = "0";
        if(getElem('purchased-products-stat')) getElem('purchased-products-stat').textContent = "0";
        if(getElem('pending-products-stat')) getElem('pending-products-stat').textContent = "0";
        if(getElem('total-spent-stat')) getElem('total-spent-stat').textContent = "R$ 0,00";

        // Mock data (substituir por chamadas de API reais)
        try {
            const response = await fetch(`${API_BASE_URL}/products?userId=${currentUserId}`);
            const products = await response.json();
            const purchasedProducts = products.filter(p => p.status === 'comprado');
            const pendingProducts = products.filter(p => p.status === 'pendente');
            
            if(getElem('total-products-stat')) getElem('total-products-stat').textContent = products.length;
            if(getElem('purchased-products-stat')) getElem('purchased-products-stat').textContent = purchasedProducts.length;
            if(getElem('pending-products-stat')) getElem('pending-products-stat').textContent = pendingProducts.length;
            if(getElem('total-spent-stat')) {
                const totalSpent = purchasedProducts.reduce((sum, p) => sum + (p.price || 0), 0);
                getElem('total-spent-stat').textContent = `R$ ${totalSpent.toFixed(2)}`;
            }
        } catch(err) { console.error("Erro ao buscar produtos para stats:", err); }


        const mockFinanceOverview = [ /* ... seus dados mockados ... */ ];
        renderGenericChart(financeOverviewChartCanvasEl, 'line', mockFinanceOverview, financeOverviewChart, 'financeOverviewChart');
        
        // TODO: Buscar dados de categoria da API
        const mockCategoryData = {
            labels: ['Eletrônicos', 'Roupas', 'Casa', 'Livros', 'Outros'],
            data: [5, 3, 2, 1, 4] 
        };
        renderGenericChart(categoryDistributionChartCanvasEl, 'doughnut', mockCategoryData, categoryDistributionChart, 'categoryDistributionChart', true);
    };

    const renderGenericChart = (canvasEl, type, data, chartInstanceVariable, chartIdForInstanceCheck, isCategory = false) => {
        if (chartInstanceVariable && chartInstanceVariable.canvas.id === canvasEl.id) {
            chartInstanceVariable.destroy();
        }
        if (!canvasEl) return;

        let chartData, chartOptions;

        if (isCategory) {
            chartData = {
                labels: data.labels,
                datasets: [{
                    data: data.data,
                    backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1'],
                }]
            };
            chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }}};
        } else { // Gráfico de linha para finanças
            const labels = data.map(e => e.mes_ano).sort();
            const sortedEntries = [...data].sort((a,b) => a.mes_ano.localeCompare(b.mes_ano));
            const revenueData = sortedEntries.map(e => e.receita);
            const expensesData = sortedEntries.map(e => e.gastos);
            chartData = {
                labels: labels,
                datasets: [
                    { label: 'Receita', data: revenueData, borderColor: 'rgba(75, 192, 192, 1)', tension: 0.1 },
                    { label: 'Gastos', data: expensesData, borderColor: 'rgba(255, 99, 132, 1)', tension: 0.1 }
                ]
            };
            chartOptions = { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } };
        }
        
        const newChartInstance = new Chart(canvasEl.getContext('2d'), { type, data: chartData, options: chartOptions });
        
        if (canvasEl.id === 'financialLineChart') financeChartInstance = newChartInstance;
        else if (canvasEl.id === 'financeOverviewChart') financeOverviewChart = newChartInstance;
        else if (canvasEl.id === 'categoryDistributionChart') categoryDistributionChart = newChartInstance;
    };


    // --- FUNÇÕES DE FINANÇAS DETALHADO ---
    const fetchAndRenderFinances = async () => {
        if (!financeList || !totalBalanceElem) return;
        
        // TODO: Substituir por chamada real à API de finanças
        const mockFinances = [
            { _id: '1', mes_ano: '2025-01', receita: 5000, gastos: 3500 },
            { _id: '2', mes_ano: '2025-02', receita: 5500, gastos: 4000 },
            { _id: '3', mes_ano: '2025-03', receita: 6000, gastos: 3800 },
        ];
        
        financeList.innerHTML = '';
        let totalBalance = 0;
        mockFinances.forEach(entry => {
            const balance = entry.receita - entry.gastos;
            totalBalance += balance;
            const li = document.createElement('li');
            li.dataset.financeId = entry._id;
            li.innerHTML = `
                <div class="finance-item-details">
                    <strong>${entry.mes_ano}</strong>
                    <span>Receita: <span class="revenue">R$ ${entry.receita.toFixed(2)}</span></span>
                    <span>Gastos: <span class="expenses">R$ ${entry.gastos.toFixed(2)}</span></span>
                    <span>Balanço: <span class="balance">R$ ${balance.toFixed(2)}</span></span>
                </div>
            `;
            financeList.appendChild(li);
        });
        if(totalBalanceElem) totalBalanceElem.textContent = `R$ ${totalBalance.toFixed(2)}`;
        renderGenericChart(financeChartCanvas, 'line', mockFinances, financeChartInstance, 'financialLineChart');
    };

    // --- LÓGICA DE EVENTOS ---

    // Verificar URL
    if (verifyUrlBtn && productUrlInput && verifiedProductInfoDiv) {
        verifyUrlBtn.addEventListener('click', async () => {
            const url = productUrlInput.value.trim();
            if (!url) return alert('Por favor, insira uma URL.');
            verifyUrlBtn.disabled = true;
            verifyUrlBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
            try {
                const response = await fetch(`${API_BASE_URL}/products/scrape-url`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url }),
                });
                if (!response.ok) throw new Error((await response.json()).message || `Erro HTTP ${response.status}`);
                scrapedProductData = await response.json();
                
                const verifiedImgEl = getElem('verifiedProductImage');
                const verifiedNameEl = getElem('verifiedProductName');
                const verifiedPriceEl = getElem('verifiedProductPrice');

                if(verifiedImgEl) verifiedImgEl.src = scrapedProductData.image || 'https://via.placeholder.com/100?text=Sem+Imagem';
                if(verifiedNameEl) verifiedNameEl.textContent = scrapedProductData.name || 'Nome não encontrado';
                if(verifiedPriceEl) verifiedPriceEl.textContent = scrapedProductData.price ? `R$ ${parseFloat(scrapedProductData.price).toFixed(2)}` : 'Preço não encontrado';
                
                const existingAddButton = getElem('finalAddProductBtn');
                if (!existingAddButton && verifiedProductInfoDiv.querySelector('button#finalAddProductBtn') === null) {
                    const addButton = document.createElement('button');
                    addButton.id = 'finalAddProductBtn';
                    addButton.className = 'primary-btn';
                    addButton.innerHTML = '<i class="fas fa-plus"></i> Adicionar à Lista';
                    verifiedProductInfoDiv.appendChild(addButton);
                }
                verifiedProductInfoDiv.classList.remove('hidden');
            } catch (error) { 
                alert(`Erro na verificação: ${error.message}`);
                verifiedProductInfoDiv.classList.add('hidden'); 
            }
            finally { verifyUrlBtn.disabled = false; verifyUrlBtn.innerHTML = '<i class="fas fa-search-location"></i> Verificar URL'; }
        });
    }

    // Adicionar Produto (após verificação)
    if(verifiedProductInfoDiv) {
        verifiedProductInfoDiv.addEventListener('click', async (e) => {
            if (e.target.id !== 'finalAddProductBtn' && !e.target.closest('#finalAddProductBtn')) return;
            if (!scrapedProductData) return alert('Dados do produto não encontrados.');
            
            const productToAdd = {
                name: scrapedProductData.name, price: parseFloat(scrapedProductData.price),
                image: scrapedProductData.image, brand: scrapedProductData.brand,
                description: scrapedProductData.description, urlOrigin: productUrlInput.value.trim(),
                userId: currentUserId, status: 'pendente' 
            };
            try {
                const response = await fetch(`${API_BASE_URL}/products`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productToAdd),
                });
                if (!response.ok) throw new Error((await response.json()).message);
                productUrlInput.value = '';
                verifiedProductInfoDiv.classList.add('hidden');
                verifiedProductInfoDiv.innerHTML = ` <img id="verifiedProductImage" src="#" alt="Imagem Verificada">
                    <p><strong>Nome:</strong> <span id="verifiedProductName"></span></p>
                    <p><strong>Preço:</strong> <span id="verifiedProductPrice"></span></p>
                `; 
                scrapedProductData = null;
                fetchAndRenderProducts();
            } catch (error) { alert(`Erro ao adicionar: ${error.message}`); }
        });
    }

    // Delegação de eventos no conteúdo principal para cards
    document.querySelector('.main-content-area').addEventListener('click', async (e) => {
        const target = e.target;
        const card = target.closest('.product-card');
        
        // Fechar Modais
        if (target.classList.contains('close-modal-btn') || target.classList.contains('modal-overlay')) {
            const activeModal = document.querySelector('.modal-overlay.active');
            if (activeModal) activeModal.classList.remove('active');
            return;
        }

        if (!card) return; 

        const productId = card.dataset.productId;
        const productData = JSON.parse(card.dataset.productJson);

        // Ações dos Ícones no Card
        if (target.classList.contains('action-delete')) {
            e.stopPropagation(); 
            if (!confirm('Tem certeza que deseja excluir este produto?')) return;
            try {
                const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                    method: 'DELETE', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUserId }) 
                });
                if (!response.ok) throw new Error(`Erro ao excluir: ${response.statusText}`);
                card.remove();
                fetchAndRenderDashboardStats(); // Atualiza stats após excluir
            } catch (error) { alert(error.message); }
        }
        else if (target.classList.contains('action-purchase')) {
            e.stopPropagation();
            try {
                const response = await fetch(`${API_BASE_URL}/products/${productId}/purchase`, {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUserId })
                });
                if (!response.ok) throw new Error(`Erro ao marcar comprado: ${response.statusText}`);
                fetchAndRenderProducts(); 
                fetchAndRenderDashboardStats(); // Atualiza stats
            } catch (error) { alert(error.message); }
        }
        else if (target.classList.contains('action-edit')) {
            e.stopPropagation();
            if (editModal && editForm && editProductIdInput && editProductNameInput && editProductPriceInput) {
                editProductIdInput.value = productData._id;
                editProductNameInput.value = productData.name;
                editProductPriceInput.value = productData.price;
                if(editProductUrlInput) editProductUrlInput.value = productData.urlOrigin || '';
                if(editProductImageUrlInput) editProductImageUrlInput.value = productData.image || '';
                if(editProductCategorySelect) editProductCategorySelect.value = productData.category || 'Outros';
                if(editProductStatusSelect) editProductStatusSelect.value = productData.status || 'pendente';
                if(editProductTagsInput) editProductTagsInput.value = (productData.tags || []).join(', ');
                if(editProductDescriptionTextarea) editProductDescriptionTextarea.value = productData.description || '';
                if(editProductPreviewImage) {
                    editProductPreviewImage.src = productData.image || '#';
                    editProductPreviewImage.classList.toggle('hidden', !productData.image);
                }
                editModal.classList.add('active');
            }
        }
        // Clique no Card para ver Detalhes
        else {
             if (detailsModal && modalProductImage && modalProductName && modalProductPrice && modalProductStatus && modalProductCategory && modalProductBrand && modalProductAddedDate && modalProductDescription && modalProductTags && modalProductLink) {
                modalProductImage.src = productData.image || 'https://via.placeholder.com/300x200?text=Sem+Imagem';
                modalProductName.textContent = productData.name;
                modalProductPrice.textContent = `R$ ${parseFloat(productData.price).toFixed(2)}`;
                modalProductStatus.textContent = productData.status.charAt(0).toUpperCase() + productData.status.slice(1);
                modalProductCategory.textContent = productData.category || 'Não definida';
                modalProductBrand.textContent = productData.brand || 'Não informada';
                modalProductAddedDate.textContent = productData.createdAt ? new Date(productData.createdAt).toLocaleDateString('pt-BR') : 'Data indisponível';
                modalProductDescription.textContent = productData.description || 'Nenhuma descrição.';
                modalProductTags.textContent = (productData.tags && productData.tags.length > 0) ? productData.tags.join(', ') : 'Nenhuma';
                modalProductLink.href = productData.urlOrigin;

                if (modalActionPurchaseBtn) modalActionPurchaseBtn.style.display = productData.status === 'pendente' ? 'inline-flex' : 'none';
                // Adiciona data-product-id aos botões do modal para fácil acesso
                if(modalActionPurchaseBtn) modalActionPurchaseBtn.dataset.productId = productId;
                if(modalActionEditBtn) modalActionEditBtn.dataset.productId = productId;
                if(modalActionDeleteBtn) modalActionDeleteBtn.dataset.productId = productId;
                
                detailsModal.classList.add('active');
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

            if(target.id === 'modal-action-purchase') {
                // Lógica de compra do modal
                try {
                    const response = await fetch(`${API_BASE_URL}/products/${productId}/purchase`, {
                        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: currentUserId })
                    });
                    if (!response.ok) throw new Error(`Erro ao marcar comprado: ${response.statusText}`);
                    detailsModal.classList.remove('active');
                    fetchAndRenderProducts(); 
                    fetchAndRenderDashboardStats();
                } catch (error) { alert(error.message); }
            } else if (target.id === 'modal-action-edit') {
                detailsModal.classList.remove('active');
                // Abre o modal de edição, precisa dos dados do produto
                const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
                if (productCard) {
                    const productData = JSON.parse(productCard.dataset.productJson);
                    if (editModal && editForm && editProductIdInput && editProductNameInput && editProductPriceInput) {
                        editProductIdInput.value = productData._id;
                        editProductNameInput.value = productData.name;
                        editProductPriceInput.value = productData.price;
                        if(editProductUrlInput) editProductUrlInput.value = productData.urlOrigin || '';
                        if(editProductImageUrlInput) editProductImageUrlInput.value = productData.image || '';
                        if(editProductCategorySelect) editProductCategorySelect.value = productData.category || 'Outros';
                        if(editProductStatusSelect) editProductStatusSelect.value = productData.status || 'pendente';
                        if(editProductTagsInput) editProductTagsInput.value = (productData.tags || []).join(', ');
                        if(editProductDescriptionTextarea) editProductDescriptionTextarea.value = productData.description || '';
                        if(editProductPreviewImage) {
                            editProductPreviewImage.src = productData.image || '#';
                            editProductPreviewImage.classList.toggle('hidden', !productData.image);
                        }
                        editModal.classList.add('active');
                    }
                }
            } else if (target.id === 'modal-action-delete') {
                if (!confirm('Tem certeza que deseja excluir este produto?')) return;
                try {
                    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: currentUserId }) 
                    });
                    if (!response.ok) throw new Error(`Erro ao excluir: ${response.statusText}`);
                    detailsModal.classList.remove('active');
                    fetchAndRenderProducts();
                    fetchAndRenderDashboardStats();
                } catch (error) { alert(error.message); }
            }
        });
    }


    // Salvar Edição do Produto
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!editProductIdInput || !editProductNameInput || !editProductPriceInput) return;

            const productId = editProductIdInput.value;
            const updatedData = {
                name: editProductNameInput.value,
                price: parseFloat(editProductPriceInput.value),
                urlOrigin: getElem('edit-product-url') ? getElem('edit-product-url').value : undefined,
                image: getElem('edit-product-image-url') ? getElem('edit-product-image-url').value : undefined,
                category: getElem('edit-product-category') ? getElem('edit-product-category').value : undefined,
                status: getElem('edit-product-status') ? getElem('edit-product-status').value : undefined,
                tags: getElem('edit-product-tags') ? getElem('edit-product-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag) : undefined,
                description: getElem('edit-product-description') ? getElem('edit-product-description').value : undefined,
                userId: currentUserId
            };
            Object.keys(updatedData).forEach(key => updatedData[key] === undefined && delete updatedData[key]);

            try {
                const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData)
                });
                if (!response.ok) throw new Error(`Erro ao atualizar: ${response.statusText}`);
                if(editModal) editModal.classList.remove('active');
                fetchAndRenderProducts();
            } catch (error) { alert(error.message); }
        });
    }
    
    // Adicionar/Editar Registro Financeiro
    if(addFinanceEntryBtn && financeMonthInput && financeRevenueInput && financeExpensesInput) {
        addFinanceEntryBtn.addEventListener('click', () => {
            const month = financeMonthInput.value;
            const revenue = parseFloat(financeRevenueInput.value) || 0;
            const expenses = parseFloat(financeExpensesInput.value) || 0;

            if (!month) return alert("Selecione o mês e ano.");
            
            const financeData = { mes_ano: month, receita: revenue, gastos: expenses, userId: currentUserId };
            
            console.log("Tentando salvar/atualizar registro financeiro:", financeData, "ID Edição:", editingFinanceId);
            //TODO: Chamar API POST ou PUT para /api/finances
            //Exemplo mockado para atualizar a UI:
            if (editingFinanceId !== null) {
            mockFinances[editingFinanceId] = {...mockFinances[editingFinanceId], ...financeData}; // Precisa do array real
            } else {
            mockFinances.push({ _id: `mock_${Date.now()}`, ...financeData }); // Precisa do array real
            }
            fetchAndRenderFinances(); // Esta função deve buscar os dados da API após salvar
            clearFinanceForm();
            alert("Funcionalidade de salvar finanças ainda precisa da API real.");
        });
    }
    if(cancelFinanceEditBtn) {
        cancelFinanceEditBtn.addEventListener('click', () => {
            clearFinanceForm();
        });
    }

    // --- INICIALIZAÇÃO ---
    fetchAndRenderProducts();
    
    const initialActiveTabButton = document.querySelector('.sidebar .nav-btn.active') || document.querySelector('.sidebar .nav-btn');
    if (initialActiveTabButton) {
        const initialTabId = initialActiveTabButton.dataset.tab;
        const initialTabContent = getElem(`${initialTabId}-tab`);
        
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        initialActiveTabButton.classList.add('active');
        
        tabContents.forEach(tab => tab.classList.remove('active'));
        if (initialTabContent) initialTabContent.classList.add('active');

        if (initialTabId === 'finance') fetchAndRenderFinances();
        if (initialTabId === 'dashboard-main') fetchAndRenderDashboardStats();
    }
});