// Arquivo: src/renderer.js (FRONTEND DO ELECTRON - VERSÃO FINAL AJUSTADA PARA API)

// --- DADOS ---
let editingProductId = null; 
let finances = JSON.parse(localStorage.getItem("finances_local")) || [];
let editingFinanceIndex = -1;

// --- ELEMENTOS DO DOM ---
const productListEl = document.getElementById("product-list");
const totalProductsEl = document.getElementById("total-products");
const addProductBtn = document.getElementById("add-product-btn");
const updateProductBtn = document.getElementById("update-product-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const productLinkInput = document.getElementById("product-link");
const productNameInput = document.getElementById("product-name");
const productPriceInput = document.getElementById("product-price");
const productImageInput = document.getElementById("product-image");
const productActionButtonsDiv = document.querySelector('#products .form-group.action-buttons');

const historyListEl = document.getElementById("history-list");
const totalHistoryEl = document.getElementById("total-history");

const financeMonthInput = document.getElementById("finance-month");
const financeRevenueInput = document.getElementById("finance-revenue");
const financeExpensesInput = document.getElementById("finance-expenses");
const addFinanceEntryBtnEl = document.getElementById("add-finance-entry-btn");
const cancelFinanceEditBtnEl = document.getElementById("cancel-finance-edit-btn");
const financeListEl = document.getElementById("finance-list");
const financeTotalBalanceEl = document.getElementById("finance-total-balance");
const financeChartCanvas = document.getElementById("finance-chart");
let financeChartInstance = null;

const API_BASE_URL = 'http://localhost:3000/api';
let currentAuthToken = null; // Para login futuro

// --- FUNÇÕES AUXILIARES ---
async function handleApiResponse(response, callingFunctionName) {
    console.log(`renderer.js: ${callingFunctionName} - Status da Resposta da API:`, response.status);
    if (!response.ok) {
        const errText = await response.text();
        console.error(`renderer.js: ${callingFunctionName} - Texto do Erro da API:`, errText);
        let errData;
        try {
            errData = JSON.parse(errText);
        } catch (e) {
            errData = { error: `Erro HTTP: ${response.status}, resposta não JSON: ${errText.substring(0, 150)}` };
        }
        throw new Error(errData.error || `Erro na API: ${response.status}`);
    }
    if (response.status === 204) return null; 
    return response.json();
}

// --- FUNÇÕES DE PRODUTOS (API) ---
async function loadAndRenderPendingProducts() {
    console.log("renderer.js: loadAndRenderPendingProducts - Buscando...");
    if (!productListEl || !totalProductsEl) {
        console.error("renderer.js: loadAndRenderPendingProducts - Elementos não encontrados.");
        if (productListEl) productListEl.innerHTML = "<p style='text-align:center; width:100%; color:red;'>Erro: Elementos da UI não encontrados.</p>";
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/products?status=pendente`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' /*, 'x-auth-token': currentAuthToken */ }
        });
        const pendingProducts = await handleApiResponse(response, "loadAndRenderPendingProducts");
        console.log("renderer.js: loadAndRenderPendingProducts - Recebidos:", pendingProducts);

        productListEl.innerHTML = "";
        let total = 0;
        if (Array.isArray(pendingProducts) && pendingProducts.length > 0) {
            pendingProducts.forEach((product) => {
                const li = document.createElement("li");
                li.dataset.id = product._id;
                const imageUrl = product.imageUrl && String(product.imageUrl).startsWith('http') ? product.imageUrl : 'https://via.placeholder.com/100x100?text=Sem+Imagem';
                const productName = product.name || 'Produto sem nome';
                const productPrice = parseFloat(product.price || 0).toFixed(2);
                const productOriginalURL = product.originalURL || '#';
                li.innerHTML = `
                    <img src="${imageUrl}" alt="${productName}" class="product-image" onclick="openModal('${imageUrl}')">
                    <div class="info">
                        <a href="${productOriginalURL}" target="_blank" class="product-name">${productName}</a>
                        <span class="product-price">R$ ${productPrice}</span>
                    </div>
                    <div class="actions">
                        <button onclick="setupEditProduct('${product._id}')" title="Editar"><i class="fa fa-pen"></i></button>
                        <button onclick="handleDeleteProduct('${product._id}')" title="Excluir"><i class="fa fa-trash"></i></button>
                        <button onclick="handleMarkAsBought('${product._id}')" title="Marcar como comprado" class="buy-btn"><i class="fa fa-check"></i></button>
                        <button onclick="openGoogleSearch('${encodeURIComponent(productName)}', '${encodeURIComponent(imageUrl)}')" title="Pesquisar no Google" class="google-search-btn">
                            <i class="fa fa-search"></i>
                        </button>
                    </div>`;
                productListEl.appendChild(li);
                total += parseFloat(product.price || 0);
            });
        } else {
            console.log("renderer.js: loadAndRenderPendingProducts - Nenhum produto pendente.");
            productListEl.innerHTML = "<p style='text-align:center; width:100%;'>Nenhum produto na lista de desejos.</p>";
        }
        if (totalProductsEl) totalProductsEl.textContent = total.toFixed(2);
    } catch (error) {
        console.error("Erro ao carregar produtos pendentes:", error);
        alert(`Erro ao carregar lista de desejos: ${error.message}`);
        if (productListEl) productListEl.innerHTML = "<p style='text-align:center; width:100%; color:red;'>Falha ao carregar produtos.</p>";
    }
}

async function handleProductSubmit() {
    console.log("renderer.js: handleProductSubmit - Editing ID:", editingProductId);
    if (!productLinkInput || !productNameInput || !productPriceInput || !productImageInput) {
        alert("Erro interno: Elementos do formulário de produto não encontrados.");
        return;
    }

    const url = productLinkInput.value.trim();
    const name = productNameInput.value.trim();
    const priceStr = productPriceInput.value.trim();
    const imageUrl = productImageInput.value.trim();

    if (!url) { alert("A URL do produto é obrigatória."); return; }

    const productData = { url, name: name || null, price: priceStr ? parseFloat(priceStr.replace(',', '.')) : null, imageUrl: imageUrl || null };
    let requestMethod = 'POST', requestUrl = `${API_BASE_URL}/products`, mode = "adicionar";

    if (editingProductId) {
        requestMethod = 'PUT';
        requestUrl = `${API_BASE_URL}/products/${editingProductId}`;
        mode = "atualizar";
    }

    if (addProductBtn) addProductBtn.disabled = true;
    if (updateProductBtn) updateProductBtn.disabled = true;

    try {
        const response = await fetch(requestUrl, {
            method: requestMethod,
            headers: { 'Content-Type': 'application/json' /*, 'x-auth-token': currentAuthToken */ },
            body: JSON.stringify(productData),
        });
        const result = await handleApiResponse(response, `handleProductSubmit (${mode})`);
        
        console.log(`renderer.js: Produto ${mode} com sucesso!`, result.product); 
        alert(`Produto "${result.product.name}" ${mode === 'adicionar' ? 'adicionado' : 'atualizado'}!`);
        clearProductForm(); 
        await loadAndRenderPendingProducts(); 
    } catch (error) {
        console.error(`Erro ao ${mode} produto:`, error);
        alert(`Erro ao ${mode} produto: ${error.message}`);
    } finally {
        if (addProductBtn) addProductBtn.disabled = false;
        if (updateProductBtn) updateProductBtn.disabled = (editingProductId === null);
    }
}

async function setupEditProduct(productId) {
    console.log("renderer.js: setupEditProduct - ID:", productId);
    if (!productLinkInput || !productNameInput || !productPriceInput || !productImageInput) return;
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'GET', headers: { /* 'x-auth-token': currentAuthToken */ }
        });
        const product = await handleApiResponse(response, "setupEditProduct");
        productLinkInput.value = product.originalURL || '';
        productNameInput.value = product.name || '';
        productPriceInput.value = product.price ? parseFloat(product.price).toFixed(2) : '';
        productImageInput.value = product.imageUrl || '';
        editingProductId = product._id;
        toggleProductButtons(true);
    } catch (error) {
        console.error("Erro ao buscar produto para edição:", error);
        alert(`Erro ao carregar produto para edição: ${error.message}`);
    }
}

async function handleDeleteProduct(productId) {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
        console.log("renderer.js: handleDeleteProduct - ID:", productId);
        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                method: 'DELETE', headers: { /* 'x-auth-token': currentAuthToken */ }
            });
            await handleApiResponse(response, "handleDeleteProduct");
            if (editingProductId === productId) clearProductForm(); 
            await loadAndRenderPendingProducts();
            await loadAndRenderPurchasedProducts(); 
        } catch (error) {
            console.error("Erro ao deletar produto:", error);
            alert(`Erro ao deletar: ${error.message}`);
        }
    }
}

async function handleMarkAsBought(productId) {
    console.log("renderer.js: handleMarkAsBought - ID:", productId);
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}/purchase`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' /*, 'x-auth-token': currentAuthToken */ }
        });
        await handleApiResponse(response, "handleMarkAsBought");
        await loadAndRenderPendingProducts();
        await loadAndRenderPurchasedProducts();
    } catch (error) {
        console.error("Erro ao marcar produto como comprado:", error);
        alert(`Erro ao marcar como comprado: ${error.message}`);
    }
}

function clearProductForm() {
    if (productLinkInput) productLinkInput.value = "";
    if (productNameInput) productNameInput.value = "";
    if (productPriceInput) productPriceInput.value = "";
    if (productImageInput) productImageInput.value = "";
    editingProductId = null; 
    toggleProductButtons(false); 
}

function toggleProductButtons(isEditing) {
    if (!addProductBtn || !productActionButtonsDiv || !updateProductBtn || !cancelEditBtn) return;
    if (isEditing) {
        addProductBtn.style.display = "none";
        productActionButtonsDiv.style.display = "flex";
        updateProductBtn.disabled = false; 
    } else {
        addProductBtn.style.display = "block"; 
        productActionButtonsDiv.style.display = "none";
    }
}

async function loadAndRenderPurchasedProducts() {
    console.log("renderer.js: loadAndRenderPurchasedProducts - Buscando histórico...");
    if (!historyListEl || !totalHistoryEl) return;
    try {
        const response = await fetch(`${API_BASE_URL}/products?status=comprado`, {
            method: 'GET', headers: { /* 'x-auth-token': currentAuthToken */ }
        });
        const purchasedProducts = await handleApiResponse(response, "loadAndRenderPurchasedProducts");
        console.log("renderer.js: loadAndRenderPurchasedProducts - Produtos comprados:", purchasedProducts);

        historyListEl.innerHTML = "";
        let total = 0;
        if (Array.isArray(purchasedProducts) && purchasedProducts.length > 0) {
            purchasedProducts.forEach((product) => {
                const li = document.createElement("li");
                li.dataset.id = product._id;
                const imageUrl = product.imageUrl && String(product.imageUrl).startsWith('http') ? product.imageUrl : 'https://via.placeholder.com/100x100?text=Sem+Imagem';
                const productName = product.name || 'Produto sem nome';
                const productPrice = parseFloat(product.price || 0).toFixed(2);
                const productOriginalURL = product.originalURL || '#';
                li.innerHTML = `
                    <img src="${imageUrl}" alt="${productName}" class="history-image" onclick="openModal('${imageUrl}')">
                    <div class="info">
                        <a href="${productOriginalURL}" target="_blank" class="history-name">${productName}</a>
                        <span class="history-price">R$ ${productPrice}</span>
                    </div>
                    <div class="actions">
                        <button onclick="handleDeleteHistoryItem('${product._id}')" title="Remover do histórico (Excluir Produto)"><i class="fa fa-trash"></i></button>
                    </div>`;
                historyListEl.appendChild(li);
                total += parseFloat(product.price || 0);
            });
        } else {
            historyListEl.innerHTML = "<p style='text-align:center; width:100%;'>Nenhum produto no histórico.</p>";
        }
        if (totalHistoryEl) totalHistoryEl.textContent = total.toFixed(2);
    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
        alert(`Erro ao carregar histórico: ${error.message}`);
        if (historyListEl) historyListEl.innerHTML = "<p style='text-align:center; width:100%; color:red;'>Falha ao carregar histórico.</p>";
    }
}

async function handleDeleteHistoryItem(productId) {
    if (confirm("Remover este item do histórico irá excluí-lo permanentemente. Deseja continuar?")) {
        await handleDeleteProduct(productId); 
        await loadAndRenderPurchasedProducts();
    }
}

// --- Funções de Finanças (Mantendo localStorage como no seu original do GitHub) ---
function saveDataLocalFinances() {
    try {
        localStorage.setItem("finances_local", JSON.stringify(finances));
        console.log("renderer.js: saveDataLocalFinances - Dados de finanças salvos.");
    } catch (e) {
        console.error("renderer.js: saveDataLocalFinances - Erro:", e);
        alert("Erro ao salvar os dados de finanças. O localStorage pode estar cheio ou indisponível.");
    }
}

function renderFinances() { 
    console.log("renderer.js: renderFinances (localStorage). Dados:", JSON.parse(JSON.stringify(finances)));
    if (!financeListEl || !financeTotalBalanceEl || !financeChartCanvas || !addFinanceEntryBtnEl || !cancelFinanceEditBtnEl || !financeMonthInput || !financeRevenueInput || !financeExpensesInput) {
        console.warn("renderer.js: renderFinances - Um ou mais elementos da UI de finanças não encontrados. Funcionalidade pode ser limitada.");
    }
    
    if (financeListEl) financeListEl.innerHTML = ""; 
    let accumulatedBalance = 0;
    if (!Array.isArray(finances)) finances = [];

    const sortedFinances = [...finances].sort((a, b) => {
        const dateAValid = a.mes_ano && typeof a.mes_ano === 'string' && a.mes_ano.match(/^\d{4}-\d{2}$/);
        const dateBValid = b.mes_ano && typeof b.mes_ano === 'string' && b.mes_ano.match(/^\d{4}-\d{2}$/);
        if (!dateAValid && !dateBValid) return 0;
        if (!dateAValid) return 1;
        if (!dateBValid) return -1;
        return new Date(a.mes_ano + "-02") - new Date(b.mes_ano + "-02");
    });

    const chartLabels = [], chartRevenueData = [], chartExpensesData = [], chartAccumulatedBalanceData = [];
    let currentAccumulatedForChart = 0;

    sortedFinances.forEach((entry) => {
        const li = document.createElement("li");
        const originalIndex = finances.indexOf(entry);
        li.dataset.index = originalIndex; 

        const monthYearDateValid = entry.mes_ano && typeof entry.mes_ano === 'string' && entry.mes_ano.match(/^\d{4}-\d{2}$/);
        const formattedMonthYearForDisplay = monthYearDateValid ? new Date(entry.mes_ano + "-02").toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : "Data Inválida";
        const formattedMonthYearForChart = monthYearDateValid ? new Date(entry.mes_ano + "-02").toLocaleDateString('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : "Inválida";
        
        const revenue = parseFloat(entry.receita || 0);
        const expenses = parseFloat(entry.gastos || 0);
        const balance = revenue - expenses;
        accumulatedBalance += balance;
        currentAccumulatedForChart += balance;

        if (monthYearDateValid) {
            chartLabels.push(formattedMonthYearForChart);
            chartRevenueData.push(revenue);
            chartExpensesData.push(expenses);
            chartAccumulatedBalanceData.push(currentAccumulatedForChart);
        }

        li.innerHTML = `
            <div class="finance-item-details">
                <span><strong>Mês/Ano:</strong> ${formattedMonthYearForDisplay}</span>
                <span class="revenue"><strong>Receita:</strong> R$ ${revenue.toFixed(2)}</span>
                <span class="expenses"><strong>Gastos:</strong> R$ ${expenses.toFixed(2)}</span>
                <span class="balance"><strong>Saldo do Mês:</strong> R$ ${balance.toFixed(2)}</span>
            </div>
            <div class="finance-item-actions">
                <button onclick="setupFinanceEdit(${originalIndex})" title="Editar Registro"><i class="fa fa-pen"></i></button>
                <button onclick="deleteFinanceEntry(${originalIndex})" title="Excluir Registro" class="delete-finance-btn"><i class="fa fa-trash"></i></button>
            </div>
        `;
        if(financeListEl) financeListEl.appendChild(li); else console.warn("renderFinances: financeListEl é null");
    });
    if(financeTotalBalanceEl) financeTotalBalanceEl.textContent = accumulatedBalance.toFixed(2); else console.warn("renderFinances: financeTotalBalanceEl é null");
    renderOrUpdateFinanceChart({ labels: chartLabels, revenue: chartRevenueData, expenses: chartExpensesData, accumulatedBalance: chartAccumulatedBalanceData });
}

function renderOrUpdateFinanceChart(chartData) {
    if (typeof Chart === 'undefined') { console.warn("Chart.js não carregado."); if (financeChartCanvas) financeChartCanvas.style.display = 'none'; return; }
    if (!financeChartCanvas) { console.error("Canvas do gráfico não encontrado."); return; }
    
    financeChartCanvas.style.display = chartData.labels.length > 0 ? 'block' : 'none';
    const data = {
        labels: chartData.labels,
        datasets: [
            { label: 'Receita Mensal', data: chartData.revenue, borderColor: 'rgba(75, 192, 192, 1)', backgroundColor: 'rgba(75, 192, 192, 0.2)', fill: false, tension: 0.1 },
            { label: 'Gastos Mensais', data: chartData.expenses, borderColor: 'rgba(255, 99, 132, 1)', backgroundColor: 'rgba(255, 99, 132, 0.2)', fill: false, tension: 0.1 },
            { label: 'Saldo Acumulado', data: chartData.accumulatedBalance, borderColor: 'rgba(54, 162, 235, 1)', backgroundColor: 'rgba(54, 162, 235, 0.2)', type: 'line', fill: false, tension: 0.1 }
        ]
    };
    const config = {
        type: 'line', data: data,
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: '#E0E0E0' }, grid: { color: 'rgba(224, 224, 224, 0.1)' }},
                y: { beginAtZero: false, title: { display: true, text: 'Valor (R$)', color: '#E0E0E0' }, ticks: { color: '#E0E0E0' }, grid: { color: 'rgba(224, 224, 224, 0.1)' }}
            },
            plugins: { legend: { position: 'top', labels: { color: '#E0E0E0' }}, title: { display: true, text: 'Evolução Financeira Mensal', color: '#E0E0E0' }}
        }
    };
    if (financeChartInstance) { financeChartInstance.data = data; financeChartInstance.options = config.options; financeChartInstance.update(); }
    else { financeChartInstance = new Chart(financeChartCanvas, config); }
}

function addOrUpdateFinanceEntry() {
    if (!financeMonthInput || !financeRevenueInput || !financeExpensesInput || !addFinanceEntryBtnEl ) return;
    const mes_ano = financeMonthInput.value;
    const receita = parseFloat(financeRevenueInput.value);
    const gastos = parseFloat(financeExpensesInput.value);

    if (!mes_ano || !mes_ano.match(/^\d{4}-\d{2}$/)) { alert("Formato AAAA-MM para Mês/Ano."); return; }
    if (isNaN(receita) || isNaN(gastos)) { alert("Valores numéricos para Receita e Gastos."); return; }

    const entryData = { mes_ano, receita, gastos };
    if (editingFinanceIndex >= 0 && editingFinanceIndex < finances.length) {
        finances[editingFinanceIndex] = { ...finances[editingFinanceIndex], ...entryData };
    } else {
        finances.push({ id_local: `fin_${Date.now()}`, ...entryData }); 
    }
    saveDataLocalFinances();
    renderFinances();
    clearFinanceForm();
}

function setupFinanceEdit(index) {
    if (!financeMonthInput || !financeRevenueInput || !financeExpensesInput || !addFinanceEntryBtnEl || !cancelFinanceEditBtnEl) return;
    if (index < 0 || index >= finances.length) { 
        console.error("setupFinanceEdit: Índice inválido", index);
        return;
    }
    const entry = finances[index];
    financeMonthInput.value = entry.mes_ano;
    financeRevenueInput.value = entry.receita;
    financeExpensesInput.value = entry.gastos;
    editingFinanceIndex = index;
    addFinanceEntryBtnEl.innerHTML = '<i class="fa fa-check"></i> Atualizar Registro';
    if(cancelFinanceEditBtnEl) cancelFinanceEditBtnEl.style.display = 'inline-block';
}

function clearFinanceForm() {
    if (!financeMonthInput || !financeRevenueInput || !financeExpensesInput || !addFinanceEntryBtnEl || !cancelFinanceEditBtnEl) return;
    financeMonthInput.value = "";
    financeRevenueInput.value = "";
    financeExpensesInput.value = "";
    editingFinanceIndex = -1;
    addFinanceEntryBtnEl.innerHTML = '<i class="fa fa-save"></i> Salvar Registro';
    if(cancelFinanceEditBtnEl) cancelFinanceEditBtnEl.style.display = 'none';
}

function deleteFinanceEntry(index) {
    if (index < 0 || index >= finances.length) { console.error("deleteFinanceEntry: Índice inválido", index); return; }
    if (confirm(`Tem certeza que deseja excluir o registro de ${finances[index]?.mes_ano || 'inválido'}?`)) {
        finances.splice(index, 1);
        saveDataLocalFinances();
        renderFinances();
        if (editingFinanceIndex === index) clearFinanceForm();
    }
}
// --- FIM DAS FUNÇÕES DE FINANÇAS ---

// --- Outras Funções (Modal, Google Search - Mantidas como estavam no seu original) ---
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
document.addEventListener("DOMContentLoaded", async () => {
    console.log("renderer.js: DOM completamente carregado e parseado.");

    // Listeners de Produtos
    if (addProductBtn) {
        addProductBtn.addEventListener("click", (e) => { e.preventDefault(); handleProductSubmit(); });
    } else { console.error("renderer.js: Botão addProductBtn não encontrado.");}

    if (updateProductBtn) {
        updateProductBtn.addEventListener("click", (e) => { e.preventDefault(); handleProductSubmit(); });
    } else { console.error("renderer.js: Botão updateProductBtn não encontrado.");}

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", (e) => {
            e.preventDefault();
            clearProductForm(); 
        });
    } else { console.error("renderer.js: Botão cancelEditBtn não encontrado.");}
    
    // Listeners de Finanças
    if (addFinanceEntryBtnEl) {
        addFinanceEntryBtnEl.addEventListener("click", (e) => { e.preventDefault(); addOrUpdateFinanceEntry(); });
    } else { console.error("renderer.js: Botão addFinanceEntryBtnEl não encontrado."); }

    if (cancelFinanceEditBtnEl) {
        cancelFinanceEditBtnEl.addEventListener("click", (e) => { e.preventDefault(); clearFinanceForm(); });
    }

    const navButtons = document.querySelectorAll('.nav-btn');
    if (navButtons.length > 0) {
        navButtons.forEach(button => {
            button.addEventListener('click', async () => {
                console.log("renderer.js: Navegação para aba:", button.dataset.tab);
                navButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(tab => {
                    if(tab) tab.style.display = 'none';
                });
                button.classList.add('active');
                const selectedTabId = button.getAttribute('data-tab');
                const selectedTabEl = document.getElementById(selectedTabId);

                if (selectedTabEl) {
                    selectedTabEl.style.display = 'block';
                    if (selectedTabId === 'products') await loadAndRenderPendingProducts();
                    if (selectedTabId === 'history') await loadAndRenderPurchasedProducts();
                    if (selectedTabId === 'finances') renderFinances(); 
                } else {
                    console.error(`renderer.js: Conteúdo da aba não encontrado: ${selectedTabId}`);
                }
            });
        });
        
        clearProductForm(); 
        renderFinances(); 
        
        const firstNavButton = document.querySelector('.nav-btn[data-tab="products"]');
        if (firstNavButton) {
            firstNavButton.classList.add('active'); 
            const productsTabContent = document.getElementById('products');
            if (productsTabContent) productsTabContent.style.display = 'block';
            await loadAndRenderPendingProducts(); 
        } else if (navButtons.length > 0) {
            navButtons[0].click(); 
        }
    } else {
        console.warn("renderer.js: Nenhum botão de navegação encontrado.");
         // Se não há botões de navegação, tenta carregar produtos pendentes de qualquer forma
        await loadAndRenderPendingProducts();
    }
    console.log("renderer.js: Inicialização completa.");
});