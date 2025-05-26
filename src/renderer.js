document.addEventListener('DOMContentLoaded', () => {

    // --- VARIÁVEIS GLOBAIS E CONFIGURAÇÃO ---
    const API_BASE_URL = 'http://localhost:3000/api';
    let currentUserId = '66452182570e88024d2d4411'; // Provisório
    let scrapedProductData = null;
    let financeChartInstance = null;
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
    const financeChartCanvas = getElem('financialChart');
    
    // Modais
    const detailsModal = getElem('details-modal');
    const detailsModalContent = getElem('modal-product-details-content'); // Div interna do modal de detalhes
    const editModal = getElem('edit-product-modal');
    const editForm = getElem('edit-product-form');
    const editProductIdInput = getElem('edit-product-id');
    const editProductNameInput = getElem('edit-product-name');
    const editProductPriceInput = getElem('edit-product-price');

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
                fetchAndRenderFinances(); // Recarrega dados da aba de finanças
            }
        });
    }

    // --- FUNÇÕES DE PRODUTOS ---
    const createProductCard = (product) => {
        const card = document.createElement('li');
        card.className = 'product-card';
        card.dataset.productId = product._id;
        card.dataset.productJson = JSON.stringify(product); 

        const formattedPrice = `R$ ${parseFloat(product.price).toFixed(2)}`;
        card.innerHTML = `
            <div class="card-image-container">
                <img src="${product.image || 'https://via.placeholder.com/200x150?text=Sem+Imagem'}" alt="${product.name}" class="card-image">
            </div>
            <div class="card-content">
                <span class="card-title">${product.name}</span>
                <span class="card-price">${formattedPrice}</span>
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
        if (!pendingList || !purchasedList) return;
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
    
    // --- FUNÇÕES DE FINANÇAS ---
    const renderFinanceChart = (entries) => {
        if (financeChartInstance) financeChartInstance.destroy();
        if (!financeChartCanvas) return;

        const labels = entries.map(e => e.mes_ano).sort();
        const sortedEntries = [...entries].sort((a,b) => a.mes_ano.localeCompare(b.mes_ano));
        const revenueData = sortedEntries.map(e => e.receita);
        const expensesData = sortedEntries.map(e => e.gastos);

        const ctx = financeChartCanvas.getContext('2d');
        financeChartInstance = new Chart(ctx, {
            type: 'line', 
            data: {
                labels: labels,
                datasets: [
                    { label: 'Receita', data: revenueData, borderColor: 'rgba(75, 192, 192, 1)', backgroundColor: 'rgba(75, 192, 192, 0.2)', fill: true, tension: 0.4 },
                    { label: 'Gastos', data: expensesData, borderColor: 'rgba(255, 99, 132, 1)', backgroundColor: 'rgba(255, 99, 132, 0.2)', fill: true, tension: 0.4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
        });
    };

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
        renderFinanceChart(mockFinances);
    };

    // --- LÓGICA DE EVENTOS ---

    // Verificar URL
    if (verifyUrlBtn && productUrlInput && verifiedProductInfoDiv) {
        verifyUrlBtn.addEventListener('click', async () => {
            const url = productUrlInput.value.trim();
            if (!url) return alert('Por favor, insira uma URL.');
            verifyUrlBtn.disabled = true;
            verifyUrlBtn.textContent = 'Verificando...';
            try {
                const response = await fetch(`${API_BASE_URL}/products/scrape-url`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url }),
                });
                if (!response.ok) throw new Error((await response.json()).message);
                scrapedProductData = await response.json();
                
                // Preenche a div de informações verificadas
                const verifiedImg = getElem('verifiedProductImage');
                const verifiedName = getElem('verifiedProductName');
                const verifiedPrice = getElem('verifiedProductPrice');

                if(verifiedImg) verifiedImg.src = scrapedProductData.image || 'https://via.placeholder.com/100?text=Sem+Imagem';
                if(verifiedName) verifiedName.textContent = scrapedProductData.name || 'Nome não encontrado';
                if(verifiedPrice) verifiedPrice.textContent = scrapedProductData.price ? `R$ ${parseFloat(scrapedProductData.price).toFixed(2)}` : 'Preço não encontrado';
                
                // Adiciona o botão de "Adicionar Produto" se ele não existir
                if (!getElem('finalAddProductBtn')) {
                    const addButton = document.createElement('button');
                    addButton.id = 'finalAddProductBtn';
                    addButton.className = 'primary-btn';
                    addButton.textContent = 'Adicionar Produto à Lista';
                    verifiedProductInfoDiv.appendChild(addButton);
                }
                verifiedProductInfoDiv.classList.remove('hidden');
            } catch (error) { 
                alert(`Erro na verificação: ${error.message}`);
                verifiedProductInfoDiv.classList.add('hidden'); 
            }
            finally { verifyUrlBtn.disabled = false; verifyUrlBtn.textContent = 'Verificar'; }
        });
    }

    // Adicionar Produto (após verificação) - Listener na div que contém o botão
    if(verifiedProductInfoDiv) {
        verifiedProductInfoDiv.addEventListener('click', async (e) => {
            if (e.target.id !== 'finalAddProductBtn') return;
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
                verifiedProductInfoDiv.innerHTML = ''; // Limpa para o próximo
                scrapedProductData = null;
                fetchAndRenderProducts();
            } catch (error) { alert(`Erro ao adicionar: ${error.message}`); }
        });
    }

    // Delegação de eventos no conteúdo principal para ações dos cards
    document.querySelector('.content').addEventListener('click', async (e) => {
        const target = e.target;
        const card = target.closest('.product-card');
        
        if (!card) return; 

        const productId = card.dataset.productId;
        const productData = JSON.parse(card.dataset.productJson);

        // Ação de Excluir
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
            } catch (error) { alert(error.message); }
        }
        // Marcar como Comprado
        else if (target.classList.contains('action-purchase')) {
            e.stopPropagation();
            try {
                const response = await fetch(`${API_BASE_URL}/products/${productId}/purchase`, {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUserId })
                });
                if (!response.ok) throw new Error(`Erro ao marcar comprado: ${response.statusText}`);
                fetchAndRenderProducts(); 
            } catch (error) { alert(error.message); }
        }
        // Editar (Abrir Modal)
        else if (target.classList.contains('action-edit')) {
            e.stopPropagation();
            if (editModal && editForm && editProductIdInput && editProductNameInput && editProductPriceInput) {
                editProductIdInput.value = productData._id;
                editProductNameInput.value = productData.name;
                editProductPriceInput.value = productData.price;
                // Adicione outros campos se existirem no seu modal de edição
                // Ex: getElem('edit-product-brand').value = productData.brand || '';
                editModal.classList.add('active');
            } else {
                console.error("Elementos do modal de edição não encontrados.");
            }
        }
        // Clique no Card para ver Detalhes (se não foi um ícone de ação)
        else {
             if (detailsModal && detailsModalContent) {
                detailsModalContent.innerHTML = `
                    <img id="modal-product-image" src="${productData.image || 'https://via.placeholder.com/300x200?text=Sem+Imagem'}" alt="${productData.name}">
                    <h3 id="modal-product-name">${productData.name}</h3>
                    <p><strong>Preço Atual:</strong> R$ ${parseFloat(productData.price).toFixed(2)}</p>
                    <p><strong>Marca:</strong> ${productData.brand || 'N/A'}</p>
                    <p><strong>Status:</strong> ${productData.status}</p>
                    <p><strong>Descrição:</strong> ${productData.description || 'N/A'}</p>
                    <a href="${productData.urlOrigin}" target="_blank" class="product-link">Ver na Loja</a>
                `;
                detailsModal.classList.add('active');
            }
        }
    });

    // Salvar Edição do Produto
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!editProductIdInput || !editProductNameInput || !editProductPriceInput) return;

            const productId = editProductIdInput.value;
            const updatedData = {
                name: editProductNameInput.value,
                price: parseFloat(editProductPriceInput.value),
                userId: currentUserId
                // Adicione outros campos aqui se o seu formulário de edição tiver mais
            };
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

    // Fechar Modais
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('close-modal')) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Adicionar/Editar Registro Financeiro
    if(addFinanceEntryBtn && financeMonthInput && financeRevenueInput && financeExpensesInput) {
        addFinanceEntryBtn.addEventListener('click', () => {
            const month = financeMonthInput.value;
            const revenue = parseFloat(financeRevenueInput.value) || 0;
            const expenses = parseFloat(financeExpensesInput.value) || 0;

            if (!month) return alert("Selecione o mês e ano.");
            
            console.log(`Registro Financeiro: Mês=${month}, Receita=${revenue}, Gastos=${expenses}`);
            // TODO: Implementar lógica de salvar/atualizar na API de Finanças
            // Exemplo: se for salvar um novo:
            // const financeData = { mes_ano: month, receita: revenue, gastos: expenses, userId: currentUserId };
            // fetch(`${API_BASE_URL}/finances`, { method: 'POST', headers:{...}, body: JSON.stringify(financeData) })
            // .then(...)
            // .then(() => fetchAndRenderFinances());
            
            // Limpar campos
            financeMonthInput.value = '';
            financeRevenueInput.value = '';
            financeExpensesInput.value = '';
            // if(cancelFinanceEditBtn) cancelFinanceEditBtn.classList.add('hidden');
            // addFinanceEntryBtn.textContent = 'Salvar Registro';
        });
    }

    // --- INICIALIZAÇÃO ---
    fetchAndRenderProducts();
    
    // Define a aba de produtos como ativa por padrão e carrega finanças se ela for ativada
    const initialActiveTabButton = document.querySelector('.sidebar .nav-btn.active') || document.querySelector('.sidebar .nav-btn');
    if (initialActiveTabButton) {
        const initialTabId = initialActiveTabButton.dataset.tab;
        const initialTabContent = getElem(`${initialTabId}-tab`);
        
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        initialActiveTabButton.classList.add('active');
        
        tabContents.forEach(tab => tab.classList.remove('active'));
        if (initialTabContent) initialTabContent.classList.add('active');

        if (initialTabId === 'finance') {
            fetchAndRenderFinances();
        }
    }
});