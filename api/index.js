console.log("[api/index.js] Script iniciado pela Vercel");
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose'); // Adicionado para verificar readyState e ConnectionStates

const connectDB = require('../src/database');
// const productRoutes = require('../src/api/products'); // Removido
// const financeRoutes = require('../src/api/finances'); // Removido
// const registerRoute = require('../src/api/auth/register'); // Removido
// const loginRoute = require('../src/api/auth/login'); // Removido

// Novas importações de rotas
const productRoutes = require('../src/routes/products');
const financeRoutes = require('../src/routes/finances');
const registerRoute = require('../src/routes/auth/register');
const loginRoute = require('../src/routes/auth/login');

const app = express();
console.log("[api/index.js] Express app inicializado.");

// Rota de Teste de Banco de Dados - MOVIDA PARA ANTES DO MIDDLEWARE DE DB
app.get('/api/test-db', async (req, res) => {
    console.log("[api/index.js - /api/test-db] Rota acessada (antes do middleware de DB).");
    try {
        // O middleware /api NÃO deve ter rodado para esta rota, então conectamos manualmente se necessário
        // ou apenas verificamos o estado se uma conexão já existir de um request anterior.
        await connectDB(); // Garante que há uma tentativa de conexão
        
        const dbState = mongoose.connection.readyState;
        const dbName = mongoose.connection.name;
        const readyStateDescription = mongoose.ConnectionStates[dbState] || 'Desconhecido';

        console.log(`[api/index.js - /api/test-db] Estado da conexão mongoose: ${dbState} (${readyStateDescription}), Nome do DB: ${dbName}`);

        if (dbState === 1) { // 1: connected
            res.status(200).json({
                message: 'Conexão MongoDB OK via Express em api/index.js (rota /api/test-db)!',
                dbName: dbName,
                readyState: dbState,
                readyStateDescription: readyStateDescription
            });
        } else {
            console.error(`[api/index.js - /api/test-db] DB não está conectado. Estado: ${dbState} (${readyStateDescription})`);
            res.status(503).json({
                message: 'Conexão MongoDB não está pronta na rota /api/test-db.',
                dbName: dbName,
                readyState: dbState,
                readyStateDescription: readyStateDescription,
                tip: 'Esta rota é para teste e não passa pelo middleware de DB principal.'
            });
        }
    } catch (error) {
        console.error('[api/index.js - /api/test-db] Erro ao testar conexão DB:', error);
        res.status(500).json({
            message: 'Erro interno do servidor ao testar conexão DB.',
            error: error.message,
            stack: error.stack,
        });
    }
});
console.log("[api/index.js] Rota /api/test-db registrada.");

// Middleware para logar o início de cada requisição
app.use((req, res, next) => {
    console.log(`[Vercel Request Log] START: ${req.method} ${req.originalUrl}`);
    next();
});

// Middleware para garantir a conexão ANTES de cada rota /api (EXCETO /api/test-db que foi movida)
app.use('/api', async (req, res, next) => {
    // Não aplicar este middleware para /api/test-db pois ela foi movida para antes
    if (req.originalUrl === '/api/test-db') {
        return next();
    }
    console.log(`[Vercel DB Middleware] Rota ${req.originalUrl} interceptada para verificação/conexão de DB.`);
    try {
        await connectDB();

        if (mongoose.connection.readyState === 1) {
            console.log(`[Vercel DB Middleware] Conexão DB OK para ${req.path}. Prosseguindo.`);
            next();
        } else {
            console.warn(`[Vercel DB Middleware] Conexão DB não estava pronta (readyState: ${mongoose.connection.readyState}) para ${req.path} após await connectDB(). Tentando novamente...`);
            await connectDB(); // Tentar conectar mais uma vez
            if (mongoose.connection.readyState === 1) {
                console.log(`[Vercel DB Middleware] Conexão DB OK após segunda tentativa para ${req.path}.`);
                next();
            } else {
                const stateDescription = mongoose.ConnectionStates[mongoose.connection.readyState] || 'Desconhecido';
                console.error(`[Vercel DB Middleware] FALHA DEFINITIVA na conexão DB para ${req.path} (readyState: ${mongoose.connection.readyState} - ${stateDescription}).`);
                res.status(503).json({ message: `Serviço temporariamente indisponível (DB Connection Error - State: ${stateDescription}).` });
            }
        }
    } catch (dbError) {
        console.error(`[Vercel DB Middleware] Erro pego pelo middleware de DB para ${req.path}:`, dbError.message, dbError.stack);
        res.status(503).json({ message: 'Serviço indisponível (DB Error during middleware processing).' });
    }
});

app.use(cors());
app.use(express.json());

// Rota raiz da API
app.get('/api', (req, res) => {
    res.send('API do OrgaN está funcionando via Vercel Function!');
});
console.log("[api/index.js] Rota raiz /api registrada.");

// Rotas da Aplicação
// Rotas da Aplicação - Montadas após o middleware de conexão DB
// Os routers em src/routes/ definem caminhos relativos ao seu ponto de montagem
// Ex: src/routes/auth/login.js define router.post('/', ...) que será /api/auth/login/
app.use('/api/products', productRoutes);
console.log("[api/index.js] Rotas de produtos montadas em /api/products");
app.use('/api/finances', financeRoutes);
console.log("[api/index.js] Rotas de finanças montadas em /api/finances");
app.use('/api/auth/register', registerRoute);
console.log("[api/index.js] Rota de registro montada em /api/auth/register");
app.use('/api/auth/login', loginRoute);
console.log("[api/index.js] Rota de login montada em /api/auth/login");


// Para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    // A conexão com o DB para desenvolvimento local agora é tratada pelo middleware de DB ou individualmente pelas rotas.
    // No entanto, para garantir que o servidor local inicie corretamente e o DB esteja acessível,
    // uma tentativa de conexão inicial pode ser mantida, mas não é estritamente necessária
    // se todas as rotas relevantes estiverem protegidas pelo middleware de DB.
    // Por simplicidade e para manter o comportamento de tentativa de conexão no início local,
    // podemos manter uma chamada a connectDB() aqui.
    connectDB().then(() => { // Garante que o DB está conectado antes de iniciar o servidor local
        app.listen(PORT, () => {
            console.log(`[api/index.js] Servidor da API rodando localmente na porta ${PORT}.`);
        });
    }).catch(err => {
        console.error("[api/index.js] Falha ao conectar ao DB ao iniciar servidor local:", err);
        // Considerar não iniciar o servidor se o DB não conectar: process.exit(1);
        // Ou iniciar mesmo assim, dependendo da estratégia de resiliência desejada.
        // Por ora, vamos iniciar o servidor mesmo com falha no DB local para permitir testes de rotas que não dependem de DB.
        app.listen(PORT, () => {
            console.warn(`[api/index.js] Servidor da API rodando localmente na porta ${PORT}, MAS A CONEXÃO INICIAL COM DB FALHOU.`);
        });
    });
} else {
    console.log("[api/index.js] Script configurado para ambiente de produção (Vercel).");
}

// Middleware de log final (pode não ser sempre alcançado em Vercel se a resposta já foi enviada)
// Este log é útil para debuggar "rotas não encontradas" na API.
app.use((req, res, next) => {
    if (!res.headersSent) {
      // Se nenhuma rota da API correspondeu e nenhuma resposta foi enviada,
      // isso significa que a requisição não foi tratada por nenhuma das rotas da API definidas acima.
      // Pode ser um 404 dentro do contexto da API.
      console.log(`[Vercel Request Log - API Fallthrough] Nenhuma rota da API correspondeu para: ${req.method} ${req.originalUrl}. Status HTTP será 404 (Not Found) se não for tratado por outras regras (ex: SPA).`);
    }
    // Para logar após a resposta ser enviada, seria necessário 'on-finished' ou similar.
    // Em Vercel, a plataforma já loga o término da função.
    next(); // Chamar next() é importante caso haja outros middlewares globais após este.
});

module.exports = app;
console.log("[api/index.js] Exportando o app Express. Script concluído.");