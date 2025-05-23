const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const chokidar = require('chokidar'); // Para live reload

// Importar funções do banco de dados
const dbManager = require('./database'); // Alterado para dbManager para clareza

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200, // Aumentado para acomodar melhor o layout
        height: 800, // Aumentado
        webPreferences: {
            // nodeIntegration: true, // Mantenha false por segurança
            // contextIsolation: false, // Mantenha true por segurança
            preload: path.join(__dirname, 'preload.js'),
            // Habilitar devTools por padrão em desenvolvimento
            devTools: !app.isPackaged,
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Open the DevTools.
    if (!app.isPackaged) { // Abre DevTools apenas se não estiver empacotado
        mainWindow.webContents.openDevTools();
    }

    // Live reload ao modificar arquivos no diretório do projeto
    if (!app.isPackaged) {
        chokidar.watch(__dirname, { ignored: /(^|[\/\\])\../ }).on('change', (filePath) => {
            console.log(`Arquivo modificado: ${filePath}. Recarregando...`);
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.reloadIgnoringCache();
            }
        });
    }
}

// --- Manipuladores IPC para o Banco de Dados ---
// Produtos
ipcMain.handle('db:get-products', async () => {
    try {
        return await dbManager.listarProdutos();
    } catch (error) {
        console.error('IPC Error - db:get-products:', error);
        throw error; // Re-throw para que o renderer possa tratar
    }
});
ipcMain.handle('db:add-product', async (event, product) => {
    try {
        return await dbManager.adicionarProduto(product);
    } catch (error) {
        console.error('IPC Error - db:add-product:', error);
        throw error;
    }
});
ipcMain.handle('db:update-product', async (event, product) => {
    try {
        return await dbManager.atualizarProduto(product);
    } catch (error) {
        console.error('IPC Error - db:update-product:', error);
        throw error;
    }
});
ipcMain.handle('db:delete-product', async (event, productId) => {
    try {
        return await dbManager.removerProduto(productId);
    } catch (error) {
        console.error('IPC Error - db:delete-product:', error);
        throw error;
    }
});

// Histórico
ipcMain.handle('db:get-history', async () => {
    try {
        return await dbManager.listarHistorico();
    } catch (error) {
        console.error('IPC Error - db:get-history:', error);
        throw error;
    }
});
ipcMain.handle('db:add-to-history', async (event, product) => {
    try {
        return await dbManager.adicionarAoHistorico(product);
    } catch (error) {
        console.error('IPC Error - db:add-to-history:', error);
        throw error;
    }
});
ipcMain.handle('db:delete-from-history', async (event, productId) => {
    try {
        return await dbManager.removerDoHistorico(productId);
    } catch (error) {
        console.error('IPC Error - db:delete-from-history:', error);
        throw error;
    }
});

// Finanças
ipcMain.handle('db:get-finances', async () => {
    try {
        return await dbManager.listarFinancas();
    } catch (error) {
        console.error('IPC Error - db:get-finances:', error);
        throw error;
    }
});
ipcMain.handle('db:add-finance-entry', async (event, entry) => {
    try {
        return await dbManager.adicionarRegistroFinanceiro(entry);
    } catch (error) {
        console.error('IPC Error - db:add-finance-entry:', error);
        throw error;
    }
});
ipcMain.handle('db:delete-finance-entry', async (event, entryId) => {
    try {
        return await dbManager.removerRegistroFinanceiro(entryId);
    } catch (error) {
        console.error('IPC Error - db:delete-finance-entry:', error);
        throw error;
    }
});

// Handler para obter o caminho userData
ipcMain.on('get-user-data-path', (event) => {
    event.returnValue = app.getPath('userData');
});


// --- Ciclo de Vida do App Electron ---
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Fechar a conexão com o banco de dados antes de sair
        dbManager.db.close((err) => {
            if (err) {
                console.error("Erro ao fechar o banco de dados", err.message);
            } else {
                console.log("Conexão com o banco de dados SQLite fechada.");
            }
            app.quit();
        });
    }
});

// Este trecho if (require('electron-squirrel-startup')) app.quit();
// geralmente vai no início do arquivo se você estiver usando electron-forge ou similar
// para lidar com eventos de instalação no Windows. Se não estiver usando, pode ser omitido.
// Se for necessário, coloque-o antes de qualquer outra lógica do app.
// if (require('electron-squirrel-startup')) {
//   app.quit();
// }