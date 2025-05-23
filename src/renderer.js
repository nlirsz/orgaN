// --- DADOS ---
let products = JSON.parse(localStorage.getItem("products")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];
let finances = JSON.parse(localStorage.getItem("finances_local")) || [];
let editingProductIndex = -1;
let editingFinanceIndex = -1; // Usaremos índice para finanças com localStorage

// --- ELEMENTOS DO DOM ---
// Produtos
const productListEl = document.getElementById("product-list");
const totalProductsEl = document.getElementById("total-products");
const addProductBtn = document.getElementById("add-product-btn");
const updateProductBtn = document.getElementById("update-product-btn"); // ID CORRIGIDO no seu código original
const cancelEditBtn = document.getElementById("cancel-edit-btn");     // ID CORRIGIDO no seu código original
const productLinkInput = document.getElementById("product-link");
const productNameInput = document.getElementById("product-name");
const productPriceInput = document.getElementById("product-price");
const productImageInput = document.getElementById("product-image");
const productActionButtonsDiv = document.querySelector('#products .form-group.action-buttons');

// Histórico
const historyListEl = document.getElementById("history-list");
const totalHistoryEl = document.getElementById("total-history");

// Finanças
const financeMonthInput = document.getElementById("finance-month");
const financeRevenueInput = document.getElementById("finance-revenue");
const financeExpensesInput = document.getElementById("finance-expenses");
const addFinanceEntryBtnEl = document.getElementById("add-finance-entry-btn");
const cancelFinanceEditBtnEl = document.getElementById("cancel-finance-edit-btn");
const financeEntryIdInputEl = document.getElementById("finance-entry-id"); // Usado para guardar índice em edição
const financeListEl = document.getElementById("finance-list");
const financeTotalBalanceEl = document.getElementById("finance-total-balance");
const financeChartCanvas = document.getElementById("finance-chart");

let financeChartInstance = null; // Para guardar a instância do gráfico e poder atualizá-la

// --- FUNÇÕES ---

// --- Funções de Busca de Produto (Scraper) ---
async function fetchProductDetailsFromBackend(productLink) {
    const backendUrl = 'http://localhost:3000/api/extract-product';
    console.log("fetchProductDetailsFromBackend: Buscando", productLink);

    if (addProductBtn) addProductBtn.disabled = true;
    if (updateProductBtn) updateProductBtn.disabled = true;
    if (productLinkInput) productLinkInput.disabled = true;

    try {
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: productLink }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Erro do servidor de scraping: ${errorData.error || response.statusText}`);
        }
        const data = await response.json();
        console.log("fetchProductDetailsFromBackend: Dados recebidos", data);

        if (productNameInput) productNameInput.value = data.name || '';
        if (productPriceInput) {
            let priceStr = String(data.price || data.preco || '');
            if (priceStr) {
                priceStr = priceStr.replace(/[^\d,.-]/g, '');
                if (priceStr.includes('.') && priceStr.includes(',')) {
                    if (priceStr.lastIndexOf('.') < priceStr.lastIndexOf(',')) {
                        priceStr = priceStr.replace(/\./g, ''); 
                        priceStr = priceStr.replace(',', '.');
                    } else { priceStr = priceStr.replace(/,/g, ''); }
                } else if (priceStr.includes(',')) { priceStr = priceStr.replace(',', '.'); }
                const numericPrice = parseFloat(priceStr);
                productPriceInput.value = !isNaN(numericPrice) ? numericPrice.toFixed(2) : '';
            } else { productPriceInput.value = ''; }
        }
        if (productImageInput) productImageInput.value = data.image || '';

    } catch (error) {
        console.error("Erro ao buscar detalhes do produto:", error);
        alert(`Não foi possível obter os detalhes do produto automaticamente: ${error.message || 'Verifique o link ou preencha manualmente.'}`);
        if (productNameInput) productNameInput.value = '';
        if (productPriceInput) productPriceInput.value = '';
        if (productImageInput) productImageInput.value = '';
    } finally {
        if (addProductBtn) addProductBtn.disabled = false;
        if (updateProductBtn) updateProductBtn.disabled = (editingProductIndex === -1);
        if (productLinkInput) productLinkInput.disabled = false;
        console.log("fetchProductDetailsFromBackend: Finalizado.");
    }
}

// --- Funções de Produtos ---
function renderProducts() {
    if (!productListEl || !totalProductsEl) {
        console.error("renderProducts: Elementos da lista de produtos ou total não encontrados.");
        return;
    }
    productListEl.innerHTML = "";
    let total = 0;
    products.forEach((product, index) => {
        const li = document.createElement("li");
        const imageUrl = product.image && product.image.startsWith('http') ? product.image : 'https://via.placeholder.com/100x100?text=Sem+Imagem';
        li.innerHTML = `
            <img src="${imageUrl}" alt="${product.name || 'Produto'}" class="product-image" onclick="openModal('${imageUrl}')">
            <div class="info">
                <a href="${product.link || '#'}" target="_blank" class="product-name">${product.name || 'Produto sem nome'}</a>
                <span class="product-price">R$ ${parseFloat(product.price || 0).toFixed(2)}</span>
            </div>
            <div class="actions">
                <button onclick="editProduct(${index})" title="Editar"><i class="fa fa-pen"></i></button>
                <button onclick="deleteProduct(${index})" title="Excluir"><i class="fa fa-trash"></i></button>
                <button onclick="markAsBought(${index})" title="Marcar como comprado" class="buy-btn"><i class="fa fa-check"></i></button>
                <button onclick="openGoogleSearch('${encodeURIComponent(product.name || '')}', '${encodeURIComponent(product.image || '')}')" title="Pesquisar no Google" class="google-search-btn">
                    <i class="fa fa-search"></i>
                </button>
            </div>
        `;
        productListEl.appendChild(li);
        total += parseFloat(product.price || 0);
    });
    totalProductsEl.textContent = total.toFixed(2);
}

function addProduct() {
    console.log("addProduct: Iniciado");
    if (!productNameInput || !productPriceInput || !productLinkInput || !productImageInput) {
        console.error("addProduct: Inputs do formulário de produto não encontrados.");
        return;
    }
    const link = productLinkInput.value.trim();
    const name = productNameInput.value.trim();
    const price = parseFloat(productPriceInput.value);
    const image = productImageInput.value.trim();

    if (!name || isNaN(price) || price <= 0 || (!link && !image)) {
        alert("Por favor, preencha o nome do produto, um preço válido e o link ou URL da imagem.");
        return;
    }
    const newProduct = { link, name, price, image };

    if (editingProductIndex >= 0) { 
        products[editingProductIndex] = newProduct;
        editingProductIndex = -1; 
    } else { 
        products.push(newProduct);
    }
    saveData();
    renderProducts();
    clearProductForm();
    toggleProductButtons(false); 
    console.log("addProduct: Produto adicionado/atualizado e UI renderizada.");
}

function updateProduct() { 
    console.log("updateProduct: Iniciado");
    if (editingProductIndex < 0) {
        console.warn("updateProduct: Chamado sem estar em modo de edição.");
        return; 
    }
    const link = productLinkInput.value.trim();
    const name = productNameInput.value.trim();
    const price = parseFloat(productPriceInput.value);
    const image = productImageInput.value.trim();

    if (!name || isNaN(price) || price <= 0 || (!link && !image)) {
        alert("Por favor, preencha o nome do produto, um preço válido e o link ou URL da imagem para atualizar.");
        return;
    }
    const updatedProductData = { link, name, price, image };
    products[editingProductIndex] = updatedProductData;
    
    saveData();
    editingProductIndex = -1;
    clearProductForm();
    toggleProductButtons(false);
    renderProducts();
    console.log("updateProduct: Produto atualizado e UI renderizada.");
}

function editProduct(index) {
    console.log("editProduct: Editando índice de produto", index);
    if (!productLinkInput || !productNameInput || !productPriceInput || !productImageInput) return;
    const product = products[index];
    if (!product) {
        console.error("editProduct: Produto não encontrado no índice", index);
        return;
    }
    productLinkInput.value = product.link || '';
    productNameInput.value = product.name || '';
    productPriceInput.value = product.price || '';
    productImageInput.value = product.image || '';
    editingProductIndex = index;
    toggleProductButtons(true); 
}

function deleteProduct(index) {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
        products.splice(index, 1);
        saveData();
        renderProducts();
        if (editingProductIndex === index) {
            editingProductIndex = -1;
            clearProductForm();
            toggleProductButtons(false);
        }
        console.log("deleteProduct: Produto no índice", index, "deletado.");
    }
}

function markAsBought(index) {
    const boughtProduct = products.splice(index, 1)[0];
    if (boughtProduct) {
        history.push(boughtProduct);
        saveData();
        renderProducts();
        renderHistory();
        console.log("markAsBought: Produto movido para histórico.");
    }
}

function clearProductForm() {
    if (!productLinkInput || !productNameInput || !productPriceInput || !productImageInput) return;
    productLinkInput.value = "";
    productNameInput.value = "";
    productPriceInput.value = "";
    productImageInput.value = "";
    // editingProductIndex é resetado em addProduct, updateProduct e no listener de cancelEditBtn
}

function toggleProductButtons(isEditing) {
    if (!addProductBtn || !productActionButtonsDiv) {
        console.warn("toggleProductButtons: Elementos de botões de produto não encontrados.");
        return;
    }
    if (isEditing) {
        addProductBtn.style.display = "none";
        productActionButtonsDiv.style.display = "flex";
        if (updateProductBtn) updateProductBtn.disabled = false; 
    } else {
        addProductBtn.style.display = "block";
        productActionButtonsDiv.style.display = "none";
    }
}

function saveData() {
    try {
        localStorage.setItem("products", JSON.stringify(products));
        localStorage.setItem("history", JSON.stringify(history));
        localStorage.setItem("finances_local", JSON.stringify(finances));
        console.log("saveData: Dados salvos no localStorage.");
    } catch (e) {
        console.error("saveData: Erro ao salvar no localStorage:", e);
        alert("Erro ao salvar os dados. O localStorage pode estar cheio ou indisponível.");
    }
}

// --- Funções de Histórico ---
function renderHistory() {
    if (!historyListEl || !totalHistoryEl) {
        console.error("renderHistory: Elementos da lista de histórico ou total não encontrados.");
        return;
    }
    historyListEl.innerHTML = "";
    let total = 0;
    history.forEach((product, index) => { 
        const li = document.createElement("li");
        const imageUrl = product.image && product.image.startsWith('http') ? product.image : 'https://via.placeholder.com/100x100?text=Sem+Imagem';
        li.innerHTML = `
            <img src="${imageUrl}" alt="${product.name || 'Produto'}" class="history-image" onclick="openModal('${imageUrl}')">
            <div class="info">
                <a href="${product.link || '#'}" target="_blank" class="history-name">${product.name || 'Produto sem nome'}</a>
                <span class="history-price">R$ ${parseFloat(product.price || 0).toFixed(2)}</span>
            </div>
            <div class="actions">
                <button onclick="deleteHistoryItem(${index})" title="Remover do histórico"><i class="fa fa-trash"></i></button>
            </div>
        `;
        historyListEl.appendChild(li);
        total += parseFloat(product.price || 0);
    });
    totalHistoryEl.textContent = total.toFixed(2);
}

function deleteHistoryItem(index) {
    if (confirm("Remover este item do histórico?")) {
        history.splice(index, 1);
        saveData();
        renderHistory();
        console.log("deleteHistoryItem: Item do histórico no índice", index, "deletado.");
    }
}

function renderFinances() { // Ou renderFinancesSimple, dependendo de qual você está usando
    console.log("renderFinances: Iniciando. Dados atuais de finanças:", JSON.parse(JSON.stringify(finances)));
    if (!financeListEl || !financeTotalBalanceEl) {
        console.error("renderFinances: Elementos da lista ou total não encontrados.");
        return;
    }
    financeListEl.innerHTML = "";
    let accumulatedBalance = 0;

    if (!Array.isArray(finances)) {
        console.warn("renderFinances: 'finances' não é um array. Resetando para [].");
        finances = [];
    }

    const sortedFinances = [...finances].sort((a, b) => {
   const dateAValid = a.mes_ano && typeof a.mes_ano === 'string' && a.mes_ano.match(/^\d{4}-\d{2}$/);
        const dateBValid = b.mes_ano && typeof b.mes_ano === 'string' && b.mes_ano.match(/^\d{4}-\d{2}$/);
        if (!dateAValid && !dateBValid) return 0;
        if (!dateAValid) return 1;
        if (!dateBValid) return -1;
        const dateA = new Date(a.mes_ano + "-02");
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
        li.dataset.index = index;

        const monthYearDateValid = entry.mes_ano && typeof entry.mes_ano === 'string' && entry.mes_ano.match(/^\d{4}-\d{2}$/);
        const formattedMonthYear = monthYearDateValid ? 
            new Date(entry.mes_ano + "-02").toLocaleDateString('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : // Mês curto para o gráfico
            "Inválida";
        
        const revenue = parseFloat(entry.receita || 0);
        const expenses = parseFloat(entry.gastos || 0);
        const balance = revenue - expenses;
        accumulatedBalance += balance; // Para o total geral
        currentAccumulatedForChart += balance; // Para o saldo acumulado no gráfico

        // Adicionar dados para o gráfico
        if (monthYearDateValid) {
            chartLabels.push(formattedMonthYear);
            chartRevenueData.push(revenue);
            chartExpensesData.push(expenses);
            chartAccumulatedBalanceData.push(currentAccumulatedForChart);
        }


li.innerHTML = `
            <div class="finance-item-details">
                <span><strong>Mês/Ano:</strong> ${new Date(entry.mes_ano + "-02").toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</span>
                <span class="revenue"><strong>Receita:</strong> R$ ${revenue.toFixed(2)}</span>
                <span class="expenses"><strong>Gastos:</strong> R$ ${expenses.toFixed(2)}</span>
                <span class="balance"><strong>Saldo do Mês:</strong> R$ ${balance.toFixed(2)}</span>
            </div>
            <div class="finance-item-actions">
                <button onclick="setupFinanceEdit(${finances.indexOf(entry)})" title="Editar Registro"><i class="fa fa-pen"></i></button>
                <button onclick="deleteFinanceEntry(${finances.indexOf(entry)})" title="Excluir Registro"><i class="fa fa-trash"></i></button>
            </div>
        `;
        financeListEl.appendChild(li);
    });

    financeTotalBalanceEl.textContent = accumulatedBalance.toFixed(2);
    console.log("renderFinances: Renderização da lista completa. Saldo acumulado:", accumulatedBalance);

    // Chamar a função para renderizar/atualizar o gráfico
    renderOrUpdateFinanceChart({
        labels: chartLabels,
        revenue: chartRevenueData,
        expenses: chartExpensesData,
        accumulatedBalance: chartAccumulatedBalanceData
    });
}

function renderOrUpdateFinanceChart(chartData) {
    if (typeof Chart === 'undefined') {
        console.warn("Chart.js não está carregado. O gráfico não será renderizado.");
        if (financeChartCanvas) financeChartCanvas.style.display = 'none'; // Esconder o canvas
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
                tension: 0.1
                // yAxisID: 'y' // Opcional, pois 'y' é o padrão se não especificado
            },
            {
                label: 'Gastos Mensais',
                data: chartData.expenses,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: false,
                tension: 0.1
                // yAxisID: 'y' // Opcional
            },
            {
                label: 'Saldo Acumulado',
                data: chartData.accumulatedBalance,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                type: 'line',
                fill: false,
                tension: 0.1
            }
        ]
    };

    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { // Adicionando configuração para o eixo X também (para cor dos ticks e grid)
                    ticks: {
                        color: '#E0E0E0'
                    },
                    grid: {
                        color: 'rgba(224, 224, 224, 0.1)'
                    }
                },
                y: { // Apenas o eixo Y principal agora
                    beginAtZero: false, // Permitir que comece abaixo de zero se os saldos ou gastos forem muito altos
                    title: {
                        display: true,
                        text: 'Valor (R$)'
                    },
                    ticks: {
                        color: '#E0E0E0'
                    },
                    grid: {
                        color: 'rgba(224, 224, 224, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#E0E0E0'
                    }
                },
                title: {
                    display: true,
                    text: 'Evolução Financeira Mensal',
                    color: '#E0E0E0'
                }
            }
        }
    };



    // Se já existe uma instância do gráfico, atualize-a. Senão, crie uma nova.
    if (financeChartInstance) {
        financeChartInstance.data = data; // Atualiza os dados
        financeChartInstance.options = config.options; // Atualiza opções se necessário
        financeChartInstance.update();
        console.log("Gráfico de finanças atualizado.");
    } else {
        financeChartInstance = new Chart(financeChartCanvas, config);
        console.log("Gráfico de finanças criado.");
    }
}


function addOrUpdateFinanceEntry() {
    console.log("addOrUpdateFinanceEntry: Iniciado. Índice em edição:", editingFinanceIndex);
    if (!financeMonthInput || !financeRevenueInput || !financeExpensesInput || !addFinanceEntryBtnEl) return;

    const mes_ano = financeMonthInput.value;
    const receita = parseFloat(financeRevenueInput.value);
    const gastos = parseFloat(financeExpensesInput.value);

    if (!mes_ano || !mes_ano.match(/^\d{4}-\d{2}$/)) { // Validação do formato YYYY-MM
        alert("Por favor, preencha o Mês/Ano no formato AAAA-MM (ex: 2023-12).");
        return;
    }
    if (isNaN(receita) || isNaN(gastos)) {
        alert("Por favor, preencha valores numéricos válidos para Receita e Gastos.");
        return;
    }

    const newEntry = { mes_ano, receita, gastos };

    if (editingFinanceIndex >= 0 && editingFinanceIndex < finances.length) { // Atualizando
        finances[editingFinanceIndex] = newEntry;
        console.log("addOrUpdateFinanceEntry: Registro atualizado no índice", editingFinanceIndex, newEntry);
    } else { // Adicionando novo
        finances.push(newEntry);
        console.log("addOrUpdateFinanceEntry: Novo registro adicionado", newEntry);
    }
    
    saveData();
    renderFinances();
    clearFinanceForm();
}

function deleteFinanceEntry(indexInOriginalArray) { // Recebe o índice do array 'finances' original
    if (confirm(`Tem certeza que deseja excluir o registro de ${finances[indexInOriginalArray]?.mes_ano || 'inválido'}?`)) {
        console.log("deleteFinanceEntry: Deletando registro no índice original", indexInOriginalArray);
        if (indexInOriginalArray > -1 && indexInOriginalArray < finances.length) {
            finances.splice(indexInOriginalArray, 1);
            saveData();
            renderFinances();
            if (editingFinanceIndex === indexInOriginalArray) {
                clearFinanceForm();
            }
        } else {
            console.error("deleteFinanceEntry: Índice inválido para exclusão:", indexInOriginalArray)
        }
    }
}

// --- Outras Funções (Modal, Google Search) ---
function openGoogleSearch(productNameEncoded, imageUrlEncoded) { 
    const decodedProductName = decodeURIComponent(productNameEncoded);    
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(decodedProductName)}`;
    window.open(googleSearchUrl, '_blank');
}

function openModal(imageSrc) {
    const modal = document.createElement('div');
    modal.id = 'image-modal';
    modal.style.cssText = `display: block;position: fixed;z-index: 1000;left: 0;top: 0;width: 100%;height: 100%;overflow: auto;background-color: rgba(0,0,0,0.9);display: flex;align-items: center;justify-content: center;`;
    modal.innerHTML = `<span id="modal-close" style="position: absolute;top: 20px;right: 35px;color: #f1f1f1;font-size: 40px;font-weight: bold;transition: 0.3s;cursor: pointer;">×</span><img id="modal-image" src="${imageSrc}" style="margin: auto;display: block;max-width: 80%;max-height: 80%;animation-name: zoom;animation-duration: 0.6s;"><style>@keyframes zoom {from {transform:scale(0)} to {transform:scale(1)}}</style>`;
    document.body.appendChild(modal);
    const closeModalBtn = document.getElementById("modal-close");
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
}

function closeModal() {
    const modal = document.getElementById("image-modal");
    if (modal) modal.remove();
}

// --- CONFIGURAÇÃO DE EVENT LISTENERS E INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM completamente carregado e parseado.");

    // Verificar e configurar listeners de produtos
    if (addProductBtn && updateProductBtn && cancelEditBtn && productLinkInput) {
        addProductBtn.addEventListener("click", (e) => { e.preventDefault(); addProduct(); });
        updateProductBtn.addEventListener("click", (e) => { e.preventDefault(); updateProduct(); });
        cancelEditBtn.addEventListener("click", (e) => {
            e.preventDefault();
            editingProductIndex = -1;
            clearProductForm();
            toggleProductButtons(false);
        });
        productLinkInput.addEventListener("change", (event) => {
            const link = event.target.value.trim();
            if (link) fetchProductDetailsFromBackend(link); else clearProductForm();
        });
    } else {
        console.error("Um ou mais elementos do formulário de produto não foram encontrados no DOM.");
    }

    // Verificar e configurar listeners de finanças
    if (addFinanceEntryBtnEl && cancelFinanceEditBtnEl) {
        addFinanceEntryBtnEl.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("Botão Salvar/Atualizar Registro Financeiro clicado");
            addOrUpdateFinanceEntry();
        });
        cancelFinanceEditBtnEl.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("Botão Cancelar Edição Finanças clicado");
            clearFinanceForm();
        });
    } else {
        console.error("Um ou mais botões do formulário de finanças não foram encontrados no DOM.");
    }

    // Alternância de abas
    const navButtons = document.querySelectorAll('.nav-btn');
    if (navButtons.length > 0) {
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                console.log("Botão de navegação clicado:", button.dataset.tab);
                navButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(tab => {
                    if (tab) tab.style.display = 'none';
                });
                button.classList.add('active');
                const selectedTabId = button.getAttribute('data-tab');
                const selectedTabContent = document.getElementById(selectedTabId);
                if (selectedTabContent) {
                    selectedTabContent.style.display = 'block';
                    if (selectedTabId === 'finances') { // Re-renderiza finanças ao mudar para a aba
                        renderFinances();
                    }
                } else {
                    console.error("Conteúdo da aba não encontrado para ID:", selectedTabId);
                }
            });
        });
        const firstNavButton = document.querySelector('.nav-btn[data-tab="products"]');
        if (firstNavButton) {
            firstNavButton.click(); 
        } else {
            console.warn("Botão da aba 'products' não encontrado para ativação inicial.");
            // Se a aba de produtos não for encontrada, tenta ativar a primeira aba disponível
            if (navButtons.length > 0) navButtons[0].click();
        }
    } else {
        console.warn("Nenhum botão de navegação (.nav-btn) encontrado.");
    }

    // Renderização inicial
    renderProducts();
    renderHistory();
    renderFinances(); // Renderiza finanças na inicialização
    toggleProductButtons(false); 
    clearFinanceForm();

    console.log("Inicialização do renderer.js completa.");
});