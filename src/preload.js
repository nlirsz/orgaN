// src/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// API para interações seguras com o processo principal (como abrir links)
contextBridge.exposeInMainWorld("electronAPI", {
    openExternalLink: (url) => ipcRenderer.send('open-external-link', url)
});

// API para o banco de dados (mantendo a original)
contextBridge.exposeInMainWorld("db", {
    // Produtos
    getProducts: () => ipcRenderer.invoke('db:get-products'),
    addProduct: (product) => ipcRenderer.invoke('db:add-product', product),
    updateProduct: (product) => ipcRenderer.invoke('db:update-product', product),
    deleteProduct: (productId) => ipcRenderer.invoke('db:delete-product', productId),
    getProductPriceHistory: (productId) => ipcRenderer.invoke('db:get-product-price-history', productId),
    refreshPrices: (payload) => ipcRenderer.invoke('db:refresh-prices', payload),
    getDashboardHighlights: (userId) => ipcRenderer.invoke('db:get-dashboard-highlights', userId),

    // Listas
    getLists: (userId) => ipcRenderer.invoke('db:get-lists', userId),
    addList: (listData) => ipcRenderer.invoke('db:add-list', listData),
    deleteList: (listData) => ipcRenderer.invoke('db:delete-list', listData),

    // Histórico
    getHistory: () => ipcRenderer.invoke('db:get-history'),
    addToHistory: (product) => ipcRenderer.invoke('db:add-to-history', product),
    deleteFromHistory: (productId) => ipcRenderer.invoke('db:delete-from-history', productId),

    // Finanças
    getFinances: () => ipcRenderer.invoke('db:get-finances'),
    addFinanceEntry: (entry) => ipcRenderer.invoke('db:add-finance-entry', entry),
    deleteFinanceEntry: (entryId) => ipcRenderer.invoke('db:delete-finance-entry', entryId),
    
    sendMessage: (channel, data) => {
        ipcRenderer.send(channel, data);
    },
    receiveMessage: (channel, callback) => {
        const listener = (event, ...args) => callback(...args);
        ipcRenderer.on(channel, listener);
        return () => ipcRenderer.removeListener(channel, listener);
    }
});

// Expor o caminho do userData para o renderer se necessário
contextBridge.exposeInMainWorld('electronPaths', {
    userData: ipcRenderer.sendSync('get-user-data-path')
});