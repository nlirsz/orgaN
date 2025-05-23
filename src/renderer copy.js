// --- DADOS ---
let products = JSON.parse(localStorage.getItem("products")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];
let editingProductIndex = -1; // -1 significa que não estamos editando, >= 0 é o índice do produto em edição

// --- ELEMENTOS DO DOM ---
// Produtos
const productListEl = document.getElementById("product-list");
const totalProductsEl = document.getElementById("total-products");
const addProductBtn = document.getElementById("add-product-btn");
// CORREÇÃO DOS IDs DOS BOTÕES:
const updateProductBtn = document.getElementById("update-product-btn"); // ID CORRIGIDO
const cancelEditBtn = document.getElementById("cancel-edit-btn");     // ID CORRIGIDO
const productLinkInput = document.getElementById("product-link");
const productNameInput = document.getElementById("product-name");
const productPriceInput = document.getElementById("product-price");
const productImageInput = document.getElementById("product-image");
const productActionButtonsDiv = document.querySelector('#products .form-group.action-buttons'); // Seletor mais específico

// Histórico
const historyListEl = document.getElementById("history-list");
const totalHistoryEl = document.getElementById("total-history");


// --- FUNÇÕES ---

// --- Funções de Busca de Produto (Scraper) ---
async function fetchProductDetailsFromBackend(productLink) {
    const backendUrl = 'http://localhost:3000/api/extract-product';
    console.log("fetchProductDetailsFromBackend: Buscando", productLink);

    // Validação dos botões antes de usar .disabled
    if (addProductBtn) addProductBtn.disabled = true;
    if (updateProductBtn) updateProductBtn.disabled = true; // Agora updateProductBtn não deve ser null
    if (productLinkInput) productLinkInput.disabled = true;

    try {
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: productLink }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Erro do servidor: ${errorData.error || response.statusText}`);
        }
        const data = await response.json();
        console.log("fetchProductDetailsFromBackend: Dados recebidos", data);

        if (productNameInput) productNameInput.value = data.name || '';
        if (productPriceInput) {
            // Lógica de parse de preço refinada (adaptada da sua sugestão anterior)
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
        // Habilita updateBtn apenas se estiver editando E o botão existir
        if (updateProductBtn) updateProductBtn.disabled = (editingProductIndex === -1);
        if (productLinkInput) productLinkInput.disabled = false;
        console.log("fetchProductDetailsFromBackend: Finalizado.");
    }
}

// --- Funções de Produtos ---
function renderProducts() {
    if (!productListEl || !totalProductsEl) {
        console.error("renderProducts: Elementos da lista ou total não encontrados.");
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
        console.error("addProduct: Inputs do formulário não encontrados.");
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

    if (editingProductIndex >= 0) { // Atualizando um produto existente
        products[editingProductIndex] = newProduct;
        editingProductIndex = -1; // Reseta o modo de edição
    } else { // Adicionando novo produto
        products.push(newProduct);
    }
    saveData();
    renderProducts();
    clearProductForm();
    toggleProductButtons(false); // Mostra botão 'Adicionar', esconde 'Atualizar/Cancelar'
    console.log("addProduct: Produto adicionado/atualizado e UI renderizada.");
}

function updateProduct() { // Esta função é chamada pelo botão "Atualizar"
    console.log("updateProduct: Iniciado");
    if (editingProductIndex < 0) {
        console.warn("updateProduct: Chamado sem estar em modo de edição.");
        return; // Não deveria ser chamado se não estiver editando
    }
    // A lógica de pegar os valores e atualizar já está em addProduct quando editingProductIndex >=0
    // Para evitar duplicação, podemos apenas chamar addProduct.
    // Ou, melhor, renomear addProduct para saveOrUpdateProduct e ter uma lógica clara.
    // Por ora, vamos manter sua estrutura e garantir que os valores sejam pegos aqui também.
     const link = productLinkInput.value.trim();
    const name = productNameInput.value.trim();
    const price = parseFloat(productPriceInput.value);
    const image = productImageInput.value.trim();

    if (!name || isNaN(price) || price <= 0 || (!link && !image)) {
        alert("Por favor, preencha o nome do produto, um preço válido e o link ou URL da imagem para atualizar.");
        return;
    }
    const updatedProduct = { link, name, price, image };
    products[editingProductIndex] = updatedProduct;
    
    saveData();
    editingProductIndex = -1;
    clearProductForm();
    toggleProductButtons(false);
    renderProducts();
    console.log("updateProduct: Produto atualizado e UI renderizada.");
}


function editProduct(index) {
    console.log("editProduct: Editando índice", index);
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
    toggleProductButtons(true); // Mostra 'Atualizar/Cancelar', esconde 'Adicionar'
}

function deleteProduct(index) {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
        products.splice(index, 1);
        saveData();
        renderProducts();
        // Se o produto deletado era o que estava sendo editado, limpa o formulário
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
    // Não resetar editingProductIndex aqui, pois pode ser chamado após uma atualização bem-sucedida
    // O reset do editingProductIndex é feito em addProduct/updateProduct e cancelEdit
}

function toggleProductButtons(isEditing) {
    if (!addProductBtn || !productActionButtonsDiv) {
        console.warn("toggleProductButtons: Botão de adicionar ou div de botões de ação não encontrados.");
        return;
    }
    if (isEditing) {
        addProductBtn.style.display = "none";
        productActionButtonsDiv.style.display = "flex";
        if (updateProductBtn) updateProductBtn.disabled = false; // Habilita botão de atualizar
    } else {
        addProductBtn.style.display = "block";
        productActionButtonsDiv.style.display = "none";
    }
}

function saveData() {
    localStorage.setItem("products", JSON.stringify(products));
    localStorage.setItem("history", JSON.stringify(history));
    console.log("saveData: Dados salvos no localStorage.");
}

// --- Funções de Histórico ---
function renderHistory() {
    if (!historyListEl || !totalHistoryEl) {
        console.error("renderHistory: Elementos da lista de histórico ou total não encontrados.");
        return;
    }
    historyListEl.innerHTML = "";
    let total = 0;
    history.forEach((product, index) => { // Adicionado 'index' para o botão de deletar
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

// --- Outras Funções (Modal, Google Search) ---
function openGoogleSearch(productNameEncoded, imageUrlEncoded) { // Nomes ajustados para clareza
    const decodedProductName = decodeURIComponent(productNameEncoded);
    // const decodedImageUrl = decodeURIComponent(imageUrlEncoded); // Não usado no momento

    // A lógica original para adicionar imagem à query foi removida, pois você a removeu.
    // Se precisar de volta:
    // let query = decodedProductName;
    // if (decodedImageUrl) {
    //     query += ` ${decodedImageUrl}`;
    // }
    // const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
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

// Mover a configuração de listeners para DENTRO de DOMContentLoaded
// para garantir que todos os elementos do DOM existam.

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM completamente carregado e parseado.");

    // Verificar se os elementos essenciais para os listeners foram encontrados
    if (!addProductBtn || !updateProductBtn || !cancelEditBtn || !productLinkInput) {
        console.error("Um ou mais botões de formulário de produto não foram encontrados. Funcionalidade pode ser afetada.");
        // Não retornar aqui, pois a troca de abas ainda pode funcionar.
    } else {
        // Eventos para os botões do formulário de produto
        addProductBtn.addEventListener("click", (e) => {
            e.preventDefault(); // Bom ter para botões em formulários
            console.log("Botão Adicionar Produto clicado");
            addProduct();
        });

        updateProductBtn.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("Botão Atualizar Produto clicado");
            updateProduct(); // Chama a função updateProduct corrigida
        });

        cancelEditBtn.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("Botão Cancelar Edição clicado");
            editingProductIndex = -1; // Reseta o modo de edição
            clearProductForm();
            toggleProductButtons(false); // Volta para o estado de "adicionar"
        });
        
        // Event Listener para o Campo de Link do Produto
        if (productLinkInput) {
            productLinkInput.addEventListener("change", (event) => {
                const link = event.target.value.trim();
                console.log("Link do produto alterado:", link);
                if (link) {
                    fetchProductDetailsFromBackend(link);
                } else {
                    clearProductForm(); // Limpa se o link for removido
                }
            });
        }
    }

    // Alternância de abas
    const navButtons = document.querySelectorAll('.nav-btn');
    if (navButtons.length > 0) {
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                console.log("Botão de navegação clicado:", button.dataset.tab);
                // Remove 'active' de todos os botões de navegação
                navButtons.forEach(btn => btn.classList.remove('active'));
                // Esconde todos os conteúdos de aba
                document.querySelectorAll('.tab-content').forEach(tab => {
                    if (tab) tab.style.display = 'none';
                });

                // Adiciona 'active' ao botão clicado
                button.classList.add('active');
                // Mostra o conteúdo da aba selecionada
                const selectedTabId = button.getAttribute('data-tab');
                const selectedTabContent = document.getElementById(selectedTabId);
                if (selectedTabContent) {
                    selectedTabContent.style.display = 'block';
                    console.log("Mostrando aba:", selectedTabId);
                } else {
                    console.error("Conteúdo da aba não encontrado para ID:", selectedTabId);
                }
            });
        });
        // Ativa a primeira aba por padrão (se existir)
        const firstNavButton = document.querySelector('.nav-btn[data-tab="products"]');
        if (firstNavButton) {
            console.log("Ativando aba inicial 'products'.");
            firstNavButton.click(); // Simula um clique para ativar a aba e o conteúdo
        } else {
            console.warn("Botão da aba 'products' não encontrado para ativação inicial.");
        }
    } else {
        console.warn("Nenhum botão de navegação (.nav-btn) encontrado.");
    }

    // Renderização inicial
    renderProducts();
    renderHistory();
    toggleProductButtons(false); // Garante que o botão de adicionar esteja visível no início

    console.log("Inicialização do renderer.js completa.");
});