// src/main.js
const { app, BrowserWindow, ipcMain, shell } = require('electron'); // Adicionado 'shell'
const path = require('path');
const chokidar = require('chokidar');
const mongoose = require('mongoose'); // Adicionado para validação de ObjectId
const Product = require('./models/Product'); // Caminho corrigido

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 820,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            devTools: !app.isPackaged,
        },
        icon: path.join(__dirname, 'assets', 'icons', 'icon.png')
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }

    if (!app.isPackaged && chokidar) {
        const watcher = chokidar.watch(path.join(__dirname, '..'), {
            ignored: [
                /(^|[\/\\])\../,
                path.join(__dirname, '..', 'node_modules', '**'),
                path.join(__dirname, '..', '.git', '**')
            ],
            persistent: true,
            ignoreInitial: true
        });

        watcher.on('change', (filePath) => {
            console.log(`Arquivo modificado: ${filePath}. Recarregando janela principal...`);
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.reloadIgnoringCache();
            }
        });
        console.log('Chokidar live reload ativado.');
    } else if (!app.isPackaged) {
        console.warn('Chokidar não encontrado ou app está empacotado. Live reload desativado.');
    }

    ipcMain.handle('db:get-product-price-history', async (event, productId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return []; // Retorna array vazio se o ID for inválido
    }
    const product = await Product.findById(productId).select('priceHistory').lean();
    if (!product) {
      return [];
    }
    // Ordena para que o gráfico mostre a evolução cronológica corretamente
    return product.priceHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch (error) {
    console.error('Erro ao buscar histórico de preços:', error);
    return []; // Retorna array vazio em caso de erro
  }
});

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    ipcMain.on('get-user-data-path', (event) => {
        event.returnValue = app.getPath('userData');
    });

    // Handler para abrir links externos
    ipcMain.on('open-external-link', (event, url) => {
        if (url.startsWith('http:') || url.startsWith('https://')) {
            shell.openExternal(url);
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

if (require('electron-squirrel-startup')) {
     app.quit();
}
