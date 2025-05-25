// src/main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const chokidar = require('chokidar'); // Para live reload, opcional mas útil

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280, // Ajustado para um tamanho comum
        height: 820,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Essencial para expor APIs seguras ao renderer
            contextIsolation: true,  // Recomendado: true
            nodeIntegration: false,  // Recomendado: false (o renderer não precisa de acesso direto ao Node.js)
            devTools: !app.isPackaged, // Habilita DevTools em desenvolvimento
        },
        icon: path.join(__dirname, 'assets', 'icons', 'icon.png') // Exemplo de caminho para ícone
    });

    // Carrega o index.html do seu aplicativo.
    // __dirname aponta para a pasta atual (onde main.js está, ou seja, src/)
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Abre o DevTools automaticamente se não estiver em produção (empacotado)
    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }

    // Configuração de Live Reload (opcional, mas útil para desenvolvimento)
    // Ignora node_modules e arquivos ocultos
    if (!app.isPackaged && chokidar) {
        const watcher = chokidar.watch(path.join(__dirname, '..'), { // Observa a pasta raiz do projeto
            ignored: [
                /(^|[\/\\])\../, // Arquivos ocultos
                path.join(__dirname, '..', 'node_modules', '**'), // node_modules
                path.join(__dirname, '..', '.git', '**') // .git
            ], 
            persistent: true,
            ignoreInitial: true // Não dispara na primeira varredura
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


    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Este método será chamado quando o Electron terminar a inicialização
// e estiver pronto para criar janelas do navegador.
// Algumas APIs só podem ser usadas depois que este evento ocorre.
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        // No macOS, é comum recriar uma janela no aplicativo quando o
        // ícone do dock é clicado e não há outras janelas abertas.
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Encerra quando todas as janelas são fechadas, exceto no macOS. Lá, é comum
// para aplicativos e sua barra de menu permanecerem ativos até que o usuário
// saia explicitamente com Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Neste arquivo, você pode incluir o resto do código específico do
// processo principal do seu aplicativo. Você também pode colocar manipulações
// de IPC aqui se precisar de alguma comunicação do renderer para o main
// que não seja diretamente relacionada a chamadas de API (ex: abrir diálogo de arquivo).
// Para a arquitetura atual, não precisamos dos handlers IPC de banco de dados aqui.

// Se você planeja usar electron-builder ou electron-forge para empacotar:
if (require('electron-squirrel-startup')) {
     app.quit();
}