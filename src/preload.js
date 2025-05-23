const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("db", {
    // Produtos
    getProducts: () => ipcRenderer.invoke('db:get-products'),
    addProduct: (product) => ipcRenderer.invoke('db:add-product', product),
    updateProduct: (product) => ipcRenderer.invoke('db:update-product', product),
    deleteProduct: (productId) => ipcRenderer.invoke('db:delete-product', productId),

    // Histórico
    getHistory: () => ipcRenderer.invoke('db:get-history'),
    addToHistory: (product) => ipcRenderer.invoke('db:add-to-history', product),
    deleteFromHistory: (productId) => ipcRenderer.invoke('db:delete-from-history', productId),

    // Finanças
    getFinances: () => ipcRenderer.invoke('db:get-finances'),
    addFinanceEntry: (entry) => ipcRenderer.invoke('db:add-finance-entry', entry),
    deleteFinanceEntry: (entryId) => ipcRenderer.invoke('db:delete-finance-entry', entryId),

    // Mantendo a API genérica caso precise para outras coisas não-DB
    sendMessage: (channel, data) => {
        ipcRenderer.send(channel, data);
    },
    receiveMessage: (channel, callback) => {
        // Garante que o listener seja removido se o callback mudar ou o componente for destruído (boa prática em frameworks)
        const listener = (event, ...args) => callback(...args);
        ipcRenderer.on(channel, listener);
        return () => ipcRenderer.removeListener(channel, listener); // Retorna uma função para remover o listener
    }
});

// Expor o caminho do userData para o renderer se necessário (ex: para debug ou caminhos de arquivo)
contextBridge.exposeInMainWorld('electronPaths', {
    userData: ipcRenderer.sendSync('get-user-data-path') // Precisará de um handler no main.js
});