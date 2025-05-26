// Elementos da UI - Serão null se não encontrados, verificado no DOMContentLoaded
const productUrlInput = document.getElementById('productUrl');
const addProductBtn = document.getElementById('addProductBtn');
const productListPending = document.getElementById('productListPending');
const productListPurchased = document.getElementById('productListPurchased');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessageDiv = document.getElementById('errorMessage');

// Abas
const pendingTab = document.getElementById('pendingTab');
const purchasedTab = document.getElementById('purchasedTab');
const financialTab = document.getElementById('financialTab');
const pendingContent = document.getElementById('pendingContent');
const purchasedContent = document.getElementById('purchasedContent');
const financialContent = document.getElementById('financialContent');

// Elementos Financeiros (necessários para a nova aba financeira)
const financeMonthInput = document.getElementById('finance-month');
const financeRevenueInput = document.getElementById('finance-revenue');
const financeExpensesInput = document.getElementById('finance-expenses');
const addFinanceEntryBtn = document.getElementById('add-finance-entry-btn');
const cancelFinanceEditBtn = document.getElementById('cancel-finance-edit-btn');
const financeList = document.getElementById('finance-list');
const financeTotalBalance = document.getElementById('finance-total-balance');
const financeChartCanvas = document.getElementById('finance-chart');

let financeChartInstance = null; // Para guardar a instância do Chart.js

const API_BASE_URL = 'http://localhost:3000/api';
const USER_ID = "hardcoded-test-user"; // TODO: Substituir por autenticação real

// --- Funções Auxiliares ---
function showLoading(show = true) {
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'block' : 'none';
    } else if (show) {
        console.warn("Tentativa de mostrar loading, mas loadingIndicator não foi encontrado.");
    }
}

function showError(message) {
    if (errorMessageDiv) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = message ? 'block' : 'none';
    } else {
        console.error("Div de erro não encontrada. Mensagem de erro: ", message);
        if (message) alert(`ERRO: ${message}`); // Último recurso
    }
    if (message) console.error(message); // Log no console também
}

async function handleApiResponse(response) {
    // --- CORREÇÃO: Tratamento robusto de erros HTTP ---
    if (!response.ok) {
        let errorBody = '';
        try {
            // Tenta ler o corpo da resposta como texto para pegar a mensagem de erro do backend
            errorBody = await response.text();
            // Se o corpo for um JSON de erro, tenta parseá-lo
            try {
                const jsonError = JSON.parse(errorBody);
                errorBody = jsonError.message || JSON.stringify(jsonError);
            } catch (e) {
                // Não é JSON, então mantém o texto puro
            }
        } catch (e) {
            // Não foi possível ler o corpo da resposta
            errorBody = 'Não foi possível ler o corpo da resposta do servidor.';
        }
        throw new Error(`Erro do servidor! Status: ${response.status} (${response.statusText}), Detalhes: ${errorBody}`);
    }
    // --- FIM CORREÇÃO ---

    if (response.status === 204) { // No Content
        return null;
    }
    return response.json();
}

// --- Renderização de Produtos (Pending e Purchased) ---
function renderProducts(products, containerElement) {
    if (!containerElement) {
        // Isso é uma verificação de segurança, mas os elementos já deveriam estar lá via DOMContentLoaded
        console.error(`Erro Crítico: Tentativa de renderizar produtos, mas o elemento container não foi fornecido ou não encontrado.`);
        showError(`Erro interno: Não foi possível atualizar a lista de produtos na interface.`);
        return;
    }

    containerElement.innerHTML = '';
    if (!products || products.length === 0) {
        containerElement.innerHTML = '<p>Nenhum produto encontrado.</p>';
        return;
    }

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        const price = typeof product.price === 'number' ? product.price.toFixed(2) : 'N/A';
        
        productCard.innerHTML = `
            <img src="${product.image || 'img/placeholder.png'}" alt="${product.name}" class="product-image" onerror="this.onerror=null;this.src='img/placeholder.png';">
            <div class="product-info">
                <h4>${product.name || 'Nome indisponível'}</h4>
                <p class="product-price">R$ ${price}</p>
                <p class="product-brand">Marca: ${product.brand || 'N/A'}</p>
                <p class="product-description">${product.description ? product.description.substring(0, 100) + (product.description.length > 100 ? '...' : '') : 'Sem descrição'}</p>
                <a href="${product.urlOrigin}" target="_blank" class="product-link">Ver produto original</a>
            </div>
            <div class="product-actions">
                ${product.status === 'pendente' ?
                `<button onclick="markAsPurchased('${product._id}')" class="action-btn purchase-btn">Marcar como Comprado</button>` :
                '<span class="status-purchased">Comprado em: '+ (product.purchasedAt ? new Date(product.purchasedAt).toLocaleDateString() : 'Data N/A') +'</span>'
            }
                <button onclick="editProduct('${product._id}')" class="action-btn edit-btn">Editar</button>
                <button onclick="deleteProduct('${product._id}')" class="action-btn delete-btn">Excluir</button>
            </div>
        `;
        containerElement.appendChild(productCard);
    });
}

// --- Renderização de Finanças ---
async function loadAndRenderFinanceEntries() {
    if (!financeList || !financeTotalBalance || !financeChartCanvas) {
        console.error("loadAndRenderFinanceEntries: Elementos da UI de finanças não encontrados.");
        showError("Erro interno: Elementos da dashboard financeira ausentes.");
        return;
    }
    showLoading();
    showError('');
    try {
        // Supondo que você terá um endpoint para finanças também
        // Por enquanto, vamos simular dados ou usar o localStorage como no seu copy 2.js
        // Se você tiver uma API de finanças, você faria:
        // const response = await fetch(`${API_BASE_URL}/finances?userId=${USER_ID}`);
        // const financeEntries = await handleApiResponse(response);
        
        // SIMULAÇÃO DE DADOS OU BUSCA DO LOCALSTORAGE (como no seu renderer copy 2.js)
        let financeEntries = JSON.parse(localStorage.getItem("finances_local")) || [];
        
        financeList.innerHTML = "";
        let accumulatedBalance = 0;

        // Garante que financeEntries é um array, mesmo que localStorage esteja corrompido
        if (!Array.isArray(financeEntries)) {
            console.warn("Finances no localStorage não é um array. Resetando.");
            financeEntries = [];
            localStorage.setItem("finances_local", JSON.stringify([])); // Limpa localStorage
        }
        
        const sortedFinances = [...financeEntries].sort((a, b) => {
            // Ordena por mês/ano para o gráfico
            const dateAValid = a.mes_ano && typeof a.mes_ano === 'string' && a.mes_ano.match(/^\d{4}-\d{2}$/);
            const dateBValid = b.mes_ano && typeof b.mes_ano === 'string' && b.mes_ano.match(/^\d{4}-\d{2}$/);
            if (!dateAValid && !dateBValid) return 0;
            if (!dateAValid) return 1; // Coloca inválidos no final
            if (!dateBValid) return -1; // Coloca inválidos no final
            const dateA = new Date(a.mes_ano + "-02"); // Adiciona "-02" para evitar problemas de fuso horário com o último dia do mês
            const dateB = new Date(b.mes_ano + "-02");
            return dateA - dateB;
        });

        const chartLabels = [];
        const chartRevenueData = [];
        const chartExpensesData = [];
        const chartAccumulatedBalanceData = [];
        let currentAccumulatedForChart = 0;

        sortedFinances.forEach((entry, index) => {
            const li = document.createElement("li");
            li.dataset.index = index; // Para referência, se for necessário editar/deletar via índice local

            const monthYearDateValid = entry.mes_ano && typeof entry.mes_ano === 'string' && entry.mes_ano.match(/^\d{4}-\d{2}$/);
            const formattedMonthYear = monthYearDateValid ? 
                new Date(entry.mes_ano + "-02").toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 
                "Mês Inválido";
            
            const revenue = parseFloat(entry.receita || 0);
            const expenses = parseFloat(entry.gastos || 0);
            const balance = revenue - expenses;
            accumulatedBalance += balance; 
            currentAccumulatedForChart += balance;

            // Adicionar dados para o gráfico
            if (monthYearDateValid) { // Use o formato curto para o rótulo do gráfico
                chartLabels.push(new Date(entry.mes_ano + "-02").toLocaleDateString('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' }));
                chartRevenueData.push(revenue);
                chartExpensesData.push(expenses);
                chartAccumulatedBalanceData.push(currentAccumulatedForChart);
            }

            li.innerHTML = `
                <div class="finance-item-details">
                    <span><strong>Mês/Ano:</strong> ${formattedMonthYear}</span>
                    <span class="revenue"><strong>Receita:</strong> R$ ${revenue.toFixed(2)}</span>
                    <span class="expenses"><strong>Gastos:</strong> R$ ${expenses.toFixed(2)}</span>
                    <span class="balance"><strong>Saldo do Mês:</strong> R$ ${balance.toFixed(2)}</span>
                </div>
                <div class="finance-item-actions">
                    <button onclick="setupFinanceEdit(${index})" title="Editar Registro"><i class="fa fa-pen"></i></button>
                    <button onclick="deleteFinanceEntry(${index})" class="delete-finance-btn" title="Excluir Registro"><i class="fa fa-trash"></i></button>
                </div>
            `;
            financeList.appendChild(li);
        });

        financeTotalBalance.textContent = accumulatedBalance.toFixed(2);
        renderOrUpdateFinanceChart({
            labels: chartLabels,
            revenue: chartRevenueData,
            expenses: chartExpensesData,
            accumulatedBalance: chartAccumulatedBalanceData
        });

    } catch (error) {
        console.error('Erro ao carregar registros financeiros:', error);
        showError(`Erro ao carregar finanças: ${error.message}`);
        if(financeList) financeList.innerHTML = `<p class="error-message">Não foi possível carregar os registros financeiros. ${error.message}</p>`;
    } finally {
        showLoading(false);
    }
}

function renderOrUpdateFinanceChart(chartData) {
    if (typeof Chart === 'undefined') {
        console.warn("Chart.js não está carregado. O gráfico financeiro não será renderizado.");
        if (financeChartCanvas) financeChartCanvas.style.display = 'none'; // Esconder o canvas se Chart.js não existe
        return;
    }
    if (!financeChartCanvas) {
        console.error("Elemento canvas do gráfico de finanças não encontrado!");
        return;
    }
    financeChartCanvas.style.display = 'block'; // Garantir que o canvas está visível

    const data = {
        labels: chartData.labels,
        datasets: [
            {
                label: 'Receita Mensal',
                data: chartData.revenue,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: false,
                tension: 0.3 // Curvatura da linha
            },
            {
                label: 'Gastos Mensais',
                data: chartData.expenses,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: false,
                tension: 0.3
            },
            {
                label: 'Saldo Acumulado',
                data: chartData.accumulatedBalance,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                type: 'line', // Linha para o saldo acumulado
                fill: false,
                tension: 0.3
            }
        ]
    };

    const config = {
        type: 'line', // Tipo padrão, mas datasets individuais podem ter type diferente
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { color: '#E0E0E0' },
                    grid: { color: 'rgba(224, 224, 224, 0.1)' }
                },
                y: {
                    beginAtZero: false,
                    title: { display: true, text: 'Valor (R$)', color: '#E0E0E0' },
                    ticks: { color: '#E0E0E0' },
                    grid: { color: 'rgba(224, 224, 224, 0.1)' }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#E0E0E0' }
                },
                title: {
                    display: true,
                    text: 'Evolução Financeira Mensal',
                    color: '#E0E0E0'
                }
            }
        }
    };

    if (financeChartInstance) {
        financeChartInstance.data = data;
        financeChartInstance.options = config.options;
        financeChartInstance.update();
        console.log("Gráfico de finanças atualizado.");
    } else {
        financeChartInstance = new Chart(financeChartCanvas, config);
        console.log("Gráfico de finanças criado.");
    }
}

let editingFinanceIndex = -1; // Para rastrear qual entrada de finanças está sendo editada

function setupFinanceEdit(index) {
    let financeEntries = JSON.parse(localStorage.getItem("finances_local")) || [];
    const entry = financeEntries[index];
    if (entry && financeMonthInput && financeRevenueInput && financeExpensesInput && addFinanceEntryBtn && cancelFinanceEditBtn) {
        financeMonthInput.value = entry.mes_ano;
        financeRevenueInput.value = parseFloat(entry.receita).toFixed(2);
        financeExpensesInput.value = parseFloat(entry.gastos).toFixed(2);
        editingFinanceIndex = index; // Armazena o índice para atualização
        addFinanceEntryBtn.textContent = 'Atualizar Registro';
        cancelFinanceEditBtn.style.display = 'inline-block'; // Mostra o botão de cancelar
    } else {
        console.error("Erro ao configurar edição financeira ou entrada não encontrada.");
    }
}

function clearFinanceForm() {
    if (financeMonthInput && financeRevenueInput && financeExpensesInput && addFinanceEntryBtn && cancelFinanceEditBtn) {
        financeMonthInput.value = '';
        financeRevenueInput.value = '';
        financeExpensesInput.value = '';
        editingFinanceIndex = -1; // Reseta o índice
        addFinanceEntryBtn.textContent = 'Salvar Registro';
        cancelFinanceEditBtn.style.display = 'none'; // Esconde o botão de cancelar
    }
}

function addOrUpdateFinanceEntry() {
    if (!financeMonthInput || !financeRevenueInput || !financeExpensesInput || !addFinanceEntryBtn) {
        showError("Um ou mais campos de finanças não foram encontrados.");
        return;
    }

    const mes_ano = financeMonthInput.value;
    const receita = parseFloat(financeRevenueInput.value);
    const gastos = parseFloat(financeExpensesInput.value);

    if (!mes_ano || !mes_ano.match(/^\d{4}-\d{2}$/)) {
        showError("Por favor, preencha o Mês/Ano no formato AAAA-MM (ex: 2023-12).");
        return;
    }
    if (isNaN(receita) || isNaN(gastos)) {
        showError("Por favor, preencha valores numéricos válidos para Receita e Gastos.");
        return;
    }

    const newEntry = { mes_ano, receita, gastos };
    let financeEntries = JSON.parse(localStorage.getItem("finances_local")) || [];

    if (editingFinanceIndex >= 0 && editingFinanceIndex < financeEntries.length) {
        financeEntries[editingFinanceIndex] = newEntry; // Atualiza a entrada existente
        console.log("Registro financeiro atualizado:", newEntry);
    } else {
        financeEntries.push(newEntry); // Adiciona nova entrada
        console.log("Novo registro financeiro adicionado:", newEntry);
    }
    localStorage.setItem("finances_local", JSON.stringify(financeEntries));
    loadAndRenderFinanceEntries(); // Recarrega e renderiza a lista e o gráfico
    clearFinanceForm();
}

function deleteFinanceEntry(index) {
    if (!confirm('Tem certeza que deseja excluir este registro financeiro?')) return;

    let financeEntries = JSON.parse(localStorage.getItem("finances_local")) || [];
    if (index >= 0 && index < financeEntries.length) {
        financeEntries.splice(index, 1);
        localStorage.setItem("finances_local", JSON.stringify(financeEntries));
        console.log("Registro financeiro excluído no índice:", index);
        loadAndRenderFinanceEntries();
        if (editingFinanceIndex === index) { // Se a entrada excluída era a que estava sendo editada
            clearFinanceForm();
        }
    } else {
        console.error("Índice de registro financeiro inválido para exclusão:", index);
    }
}


// --- Funções da API para Produtos ---
async function addProduct() {
    if (!productUrlInput) {
        showError("Campo de URL do produto não encontrado.");
        return;
    }
    const url = productUrlInput.value.trim();
    if (!url) {
        showError('Por favor, insira a URL do produto.');
        return;
    }

    showLoading();
    showError('');

    try {
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify({ url: url, userId: USER_ID }),
        });
        const newProduct = await handleApiResponse(response); // Usa o handler atualizado
        console.log('Produto adicionado:', newProduct);
        if (productUrlInput) productUrlInput.value = '';
        await loadAndRenderPendingProducts();
        showTab('pending'); // Volta para a aba de pendentes
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        showError(`Erro ao adicionar produto: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

async function loadAndRenderPendingProducts() {
    if (!productListPending) {
        showError("Erro crítico: Elemento da lista de produtos pendentes não encontrado na página.");
        console.error("loadAndRenderPendingProducts chamado, mas productListPending é null.");
        return;
    }
    showLoading();
    showError('');
    try {
        const response = await fetch(`${API_BASE_URL}/products?status=pendente&userId=${USER_ID}`);
        const products = await handleApiResponse(response);
        renderProducts(products, productListPending);
    } catch (error) {
        console.error('Erro ao carregar produtos pendentes:', error);
        showError(`Erro ao carregar produtos pendentes: ${error.message}`);
        if(productListPending) productListPending.innerHTML = `<p class="error-message">Não foi possível carregar os produtos pendentes. ${error.message}</p>`;
    } finally {
        showLoading(false);
    }
}

async function loadAndRenderPurchasedProducts() {
    if (!productListPurchased) {
        showError("Erro crítico: Elemento da lista de produtos comprados não encontrado na página.");
        console.error("loadAndRenderPurchasedProducts chamado, mas productListPurchased é null.");
        return;
    }
    showLoading();
    showError('');
    try {
        const response = await fetch(`${API_BASE_URL}/products?status=comprado&userId=${USER_ID}`);
        const products = await handleApiResponse(response);
        renderProducts(products, productListPurchased);
    } catch (error) {
        console.error('Erro ao carregar produtos comprados:', error);
        showError(`Erro ao carregar produtos comprados: ${error.message}`);
        if(productListPurchased) productListPurchased.innerHTML = `<p class="error-message">Não foi possível carregar o histórico de compras. ${error.message}</p>`;
    } finally {
        showLoading(false);
    }
}

window.markAsPurchased = async function(productId) {
    if (!confirm('Deseja marcar este produto como comprado?')) return;

    showLoading();
    showError('');
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}/purchase`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: USER_ID })
        });
        await handleApiResponse(response);
        console.log(`Produto ${productId} marcado como comprado.`);
        await loadAndRenderPendingProducts();
        await loadAndRenderPurchasedProducts();
        showTab('pending'); // Mantém o usuário na aba de pendentes ou o direciona
    } catch (error) {
        console.error(`Erro ao marcar produto ${productId} como comprado:`, error);
        showError(`Erro ao marcar produto como comprado: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

window.deleteProduct = async function(productId) {
    if (!confirm('Tem certeza que deseja excluir este produto? Esta ação é irreversível.')) return;

    showLoading();
    showError('');
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: USER_ID })
        });
        await handleApiResponse(response);
        console.log(`Produto ${productId} excluído.`);
        
        // Recarrega a lista da aba atualmente ativa
        if (pendingContent && pendingContent.style.display === 'block') {
            await loadAndRenderPendingProducts();
        } else if (purchasedContent && purchasedContent.style.display === 'block') {
            await loadAndRenderPurchasedProducts();
        } else {
            // Fallback: se não sabe qual aba ativa, recarrega pendentes
            await loadAndRenderPendingProducts();
        }

    } catch (error) {
        console.error(`Erro ao excluir produto ${productId}:`, error);
        showError(`Erro ao excluir produto: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

async function getProductById(productId) {
    showLoading();
    showError('');
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}?userId=${USER_ID}`);
        return await handleApiResponse(response);
    } catch (error) {
        console.error(`Erro ao buscar produto ${productId}:`, error);
        showError(`Erro ao buscar dados do produto para edição: ${error.message}`);
        return null;
    } finally {
        showLoading(false);
    }
}

window.editProduct = async function(productId) {
    showError('');
    const productToEdit = await getProductById(productId);
    if (!productToEdit) {
        showError("Produto não encontrado para edição.");
        return;
    }

    // Usando prompts simples para demonstração. Em um app real, use um modal/formulário de edição.
    const newName = prompt("Novo nome do produto:", productToEdit.name);
    const newPriceStr = prompt("Novo preço do produto (ex: 29.99):", productToEdit.price);
    const newBrand = prompt("Nova marca do produto:", productToEdit.brand || "");
    const newDescription = prompt("Nova descrição do produto:", productToEdit.description || "");

    // Se o usuário cancelar qualquer prompt, interrompe a edição
    if (newName === null || newPriceStr === null || newBrand === null || newDescription === null) {
        showError("Edição cancelada.");
        return;
    }

    const newPrice = parseFloat(newPriceStr);
    if (isNaN(newPrice) || newPrice <= 0) {
        showError("Preço inválido. Por favor, insira um número positivo.");
        return;
    }
    
    const updateData = {
        name: newName, 
        price: newPrice, 
        brand: newBrand, 
        description: newDescription,
        userId: USER_ID
    };

    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'PUT', // Ou PATCH, dependendo da sua API
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        await handleApiResponse(response);
        console.log(`Produto ${productId} atualizado.`);
        
        // Recarrega a lista correta após a atualização
        if (productToEdit.status === 'pendente') {
            await loadAndRenderPendingProducts();
        } else if (productToEdit.status === 'comprado') {
            await loadAndRenderPurchasedProducts();
        }
        showError('Produto atualizado com sucesso!'); // Feedback de sucesso
    } catch (error) {
       console.error(`Erro ao editar produto ${productId}:`, error);
       showError(`Erro ao editar produto: ${error.message}`);
    } finally {
        showLoading(false);
    }
}


// --- Navegação por Abas ---
function showTab(tabName) {
    // Esconder todos os conteúdos e remover a classe 'active'
    [pendingContent, purchasedContent, financialContent].forEach(el => {
        if (el) el.style.display = 'none';
    });
    [pendingTab, purchasedTab, financialTab].forEach(el => {
        if (el) el.classList.remove('active');
    });

    showError(''); // Limpa mensagens de erro ao trocar de aba

    // Mostrar o conteúdo da aba selecionada e adicionar 'active'
    if (tabName === 'pending') {
        if (pendingContent) pendingContent.style.display = 'block';
        if (pendingTab) pendingTab.classList.add('active');
        loadAndRenderPendingProducts();
    } else if (tabName === 'purchased') {
        if (purchasedContent) purchasedContent.style.display = 'block';
        if (purchasedTab) purchasedTab.classList.add('active');
        loadAndRenderPurchasedProducts();
    } else if (tabName === 'financial') {
        if (financialContent) financialContent.style.display = 'block';
        if (financialTab) financialTab.classList.add('active');
        loadAndRenderFinanceEntries(); // Carrega e renderiza finanças
    }
}

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
    // Adiciona event listeners para os botões e inputs após o DOM estar carregado
    if (addProductBtn) {
        addProductBtn.addEventListener('click', addProduct);
    } else {
        console.error("Elemento 'addProductBtn' não encontrado no DOM.");
    }
    
    // Listener para o input de URL para buscar detalhes
    if (productUrlInput) {
        productUrlInput.addEventListener('change', async () => {
            const url = productUrlInput.value.trim();
            if (url) {
                showLoading();
                showError('');
                try {
                    // Chamada para a API do backend para extrair detalhes
                    // A API do backend já usa scrape-gemini, então chamamos o endpoint do backend
                    const response = await fetch(`${API_BASE_URL}/products/extract-details`, { // Exemplo de endpoint, ajuste se for diferente
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: url })
                    });
                    const data = await handleApiResponse(response);
                    
                    // Preenche os campos do formulário (você pode precisar adicionar esses inputs no seu HTML ou usar um modal de edição)
                    // Atualmente, este renderer.js não tem campos para preencher além da URL.
                    // Se você tiver um modal de edição ou formulário de adição com esses campos, você os preencheria aqui.
                    console.log("Detalhes extraídos da URL:", data);
                    // Exemplo: se tivesse productNameInput, productPriceInput, etc.
                    // if (document.getElementById('productName')) document.getElementById('productName').value = data.name || '';
                    // if (document.getElementById('productPrice')) document.getElementById('productPrice').value = data.price || '';
                    // if (document.getElementById('productImage')) document.getElementById('productImage').value = data.image || '';
                    showError(`Detalhes extraídos: ${data.name} - R$ ${data.price}. Agora você pode adicionar.`);

                } catch (error) {
                    console.error('Erro ao extrair detalhes da URL:', error);
                    showError(`Não foi possível extrair detalhes da URL: ${error.message}. Por favor, verifique o link.`);
                } finally {
                    showLoading(false);
                }
            }
        });
    }

    // Event Listeners para botões de aba
    if (pendingTab) pendingTab.addEventListener('click', () => showTab('pending'));
    if (purchasedTab) purchasedTab.addEventListener('click', () => showTab('purchased'));
    if (financialTab) financialTab.addEventListener('click', () => showTab('financial'));

    // Event Listeners para formulário de finanças
    if (addFinanceEntryBtn) addFinanceEntryBtn.addEventListener('click', addOrUpdateFinanceEntry);
    if (cancelFinanceEditBtn) cancelFinanceEditBtn.addEventListener('click', clearFinanceForm);


    // Exibe a aba de pendentes por padrão na inicialização
    if (pendingTab && pendingContent && productListPending) {
        showTab('pending');
    } else {
        showError("Erro crítico: Elementos essenciais da aba inicial não foram encontrados. Verifique o HTML.");
        console.error("Não foi possível inicializar a aba 'pending' devido a elementos ausentes.");
    }
});

// Expor funções globalmente para serem acessíveis do HTML (onclick)
window.markAsPurchased = markAsPurchased;
window.deleteProduct = deleteProduct;
window.editProduct = editProduct; // Já exposto
window.setupFinanceEdit = setupFinanceEdit; // Expõe para o HTML
window.deleteFinanceEntry = deleteFinanceEntry; // Expõe para o HTML