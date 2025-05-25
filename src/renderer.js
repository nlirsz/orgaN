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
        // Fallback se até o errorMessageDiv estiver faltando
        console.error("Div de erro não encontrada. Mensagem de erro: ", message);
        if (message) alert(`ERRO: ${message}`); // Último recurso
    }
    if (message) console.error(message); // Log no console também
}

async function handleApiResponse(response) {
    if (!response.ok) {
        let errorText = `HTTP error! status: ${response.status}`;
        try {
            const errorBody = await response.text();
            errorText += `, message: ${errorBody}`;
        } catch (e) {
            // Ignora
        }
        throw new Error(errorText);
    }
    if (response.status === 204) {
        return null;
    }
    return response.json();
}

// --- Renderização ---
function renderProducts(products, containerElement) {
    if (!containerElement) {
        const containerId = Object.keys({productListPending, productListPurchased}).find(key => 
            (key === 'productListPending' && containerElement === productListPending) || 
            (key === 'productListPurchased' && containerElement === productListPurchased)
        ) || "desconhecido";

        console.error(`Erro Crítico: Tentativa de renderizar produtos, mas o elemento container (esperado como ${containerId}) não foi encontrado no DOM.`);
        showError(`Erro interno: Não foi possível atualizar a lista de produtos na interface (elemento ${containerId} ausente).`);
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

// --- Funções da API ---
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
        const newProduct = await handleApiResponse(response);
        console.log('Produto adicionado:', newProduct);
        if (productUrlInput) productUrlInput.value = '';
        await loadAndRenderPendingProducts();
        showTab('pending');
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
        // A verificação de productListPending já foi feita acima, mas é bom ser defensivo aqui também
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

async function markAsPurchased(productId) {
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
    } catch (error) {
        console.error(`Erro ao marcar produto ${productId} como comprado:`, error);
        showError(`Erro ao marcar produto como comprado: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

async function deleteProduct(productId) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

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
        
        // Recarregar a lista da aba atualmente ativa ou ambas
        let reloaded = false;
        if (pendingContent && pendingContent.style.display === 'block') {
            await loadAndRenderPendingProducts();
            reloaded = true;
        }
        if (purchasedContent && purchasedContent.style.display === 'block') { // Use 'else if' se as abas forem mutuamente exclusivas
            await loadAndRenderPurchasedProducts();
            reloaded = true;
        }
        if (!reloaded && productListPending) { // Fallback se nenhuma aba específica estiver claramente visível
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

    const newName = prompt("Novo nome do produto:", productToEdit.name);
    const newPriceStr = prompt("Novo preço do produto (ex: 29.99):", productToEdit.price);
    const newBrand = prompt("Nova marca do produto:", productToEdit.brand || "");
    const newDescription = prompt("Nova descrição do produto:", productToEdit.description || "");

    if (newName === null || newPriceStr === null) {
        return;
    }

    const newPrice = parseFloat(newPriceStr);
    if (isNaN(newPrice) || newPrice <= 0) {
        showError("Preço inválido.");
        return;
    }
    
    const updateData = {
        name: newName, price: newPrice, brand: newBrand, description: newDescription,
        userId: USER_ID
    };

    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        await handleApiResponse(response);
        console.log(`Produto ${productId} atualizado.`);
        
        if (productToEdit.status === 'pendente' && productListPending) {
            await loadAndRenderPendingProducts();
        } else if (productToEdit.status === 'comprado' && productListPurchased) {
            await loadAndRenderPurchasedProducts();
        }
    } catch (error) {
       console.error(`Erro ao editar produto ${productId}:`, error);
       showError(`Erro ao editar produto: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

// --- Navegação por Abas ---
function showTab(tabName) {
    // Esconder todos os conteúdos
    if (pendingContent) pendingContent.style.display = 'none';
    else console.warn("Elemento pendingContent não encontrado para ocultar.");
    
    if (purchasedContent) purchasedContent.style.display = 'none';
    else console.warn("Elemento purchasedContent não encontrado para ocultar.");

    if (financialContent) financialContent.style.display = 'none';
    else console.warn("Elemento financialContent não encontrado para ocultar.");

    // Remover classe 'active' de todas as abas
    if (pendingTab) pendingTab.classList.remove('active');
    if (purchasedTab) purchasedTab.classList.remove('active');
    if (financialTab) financialTab.classList.remove('active');

    showError('');

    if (tabName === 'pending') {
        if (pendingContent) pendingContent.style.display = 'block';
        else { showError("Conteúdo da aba de pendentes não encontrado."); return; }
        if (pendingTab) pendingTab.classList.add('active');
        loadAndRenderPendingProducts();
    } else if (tabName === 'purchased') {
        if (purchasedContent) purchasedContent.style.display = 'block';
        else { showError("Conteúdo da aba de comprados não encontrado."); return; }
        if (purchasedTab) purchasedTab.classList.add('active');
        loadAndRenderPurchasedProducts();
    } else if (tabName === 'financial') {
        if (financialContent) financialContent.style.display = 'block';
        else { showError("Conteúdo da aba financeira não encontrado."); return; }
        if (financialTab) financialTab.classList.add('active');
        if (financialContent) financialContent.innerHTML = "<p>Dashboard Financeiro (Em desenvolvimento)</p>";
    }
}

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
    // As constantes globais (productUrlInput, addProductBtn, etc.) já foram inicializadas.
    // Os logs de erro abaixo são para confirmar se foram encontradas.

    if (addProductBtn) {
        addProductBtn.addEventListener('click', addProduct);
    } else {
        console.error("Elemento 'addProductBtn' não encontrado no DOM durante a inicialização.");
    }

    if (pendingTab) pendingTab.addEventListener('click', () => showTab('pending'));
    else console.error("Elemento 'pendingTab' não encontrado no DOM.");
    
    if (purchasedTab) purchasedTab.addEventListener('click', () => showTab('purchased'));
    else console.error("Elemento 'purchasedTab' não encontrado no DOM.");

    if (financialTab) financialTab.addEventListener('click', () => showTab('financial'));
    else console.error("Elemento 'financialTab' não encontrado no DOM.");

    // Verificações adicionais que já estavam presentes e são úteis:
    if (!pendingContent) console.error("Elemento 'pendingContent' não encontrado.");
    if (!purchasedContent) console.error("Elemento 'purchasedContent' não encontrado.");
    if (!financialContent) console.error("Elemento 'financialContent' não encontrado.");
    if (!productListPending) console.error("Elemento 'productListPending' não encontrado.");
    if (!productListPurchased) console.error("Elemento 'productListPurchased' não encontrado.");
    if (!loadingIndicator) console.warn("Elemento 'loadingIndicator' não encontrado.");
    if (!errorMessageDiv) console.warn("Elemento 'errorMessageDiv' não encontrado.");

    // Exibe a aba de pendentes por padrão, apenas se os elementos existirem
    if (pendingTab && pendingContent && productListPending) {
        showTab('pending');
    } else {
        showError("Erro crítico: Elementos essenciais da aba inicial não foram encontrados. Verifique o HTML.");
        console.error("Não foi possível inicializar a aba 'pending' devido a elementos ausentes.");
    }
});

// Expor funções para o HTML
window.markAsPurchased = markAsPurchased;
window.deleteProduct = deleteProduct;
// window.editProduct já está global