// Em RAIZ_DO_PROJETO/api/index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose'); // Adicionado para verificar readyState e ConnectionStates

// Caminhos CORRIGIDOS para a nova estrutura
const connectDB = require('../src/database'); // Este caminho parece continuar correto
// Em RAIZ_DO_PROJETO/api/index.js - ESTES DEVEM ESTAR CORRETOS
const productRoutes = require('../src/routes/products');
const financeRoutes = require('../src/routes/finances');
const registerRoute = require('../src/routes/auth/register');
const loginRoute = require('../src/routes/auth/login');


// Se productRoutes ou outros handlers importam scrape-gemini,
// os caminhos dentro DELES para scrape-gemini também podem precisar ser ajustados
// para apontar para '../api_helpers/scrape-gemini.js' (relativo a eles).
// Por exemplo, em src/routes/products.js:
// const { scrapeProductDetails } = require('./api_helpers/scrape-gemini');

const app = express();

// Middleware para logar o início de cada requisição
app.use((req, res, next) => {
    console.log(`[Vercel Request Log V3] START: ${req.method} ${req.originalUrl}`); // V3 para nova versão
    next();
});

// Middleware para garantir a conexão ANTES de cada rota /api
app.use('/api', async (req, res, next) => {
    console.log(`[Vercel DB Middleware V3] Rota ${req.path} interceptada.`);
    try {
        await connectDB();
        if (mongoose.connection.readyState === 1) {
            console.log(`[Vercel DB Middleware V3] Conexão DB OK para ${req.path}. Prosseguindo.`);
            next();
        } else {
            console.warn(`[Vercel DB Middleware V3] Conexão DB não estava pronta (readyState: ${mongoose.connection.readyState}) para ${req.path} após await connectDB(). Tentando novamente...`);
            await connectDB();
            if (mongoose.connection.readyState === 1) {
                console.log(`[Vercel DB Middleware V3] Conexão DB OK após segunda tentativa para ${req.path}.`);
                next();
            } else {
                const stateDescription = mongoose.ConnectionStates[mongoose.connection.readyState] || 'Desconhecido';
                console.error(`[Vercel DB Middleware V3] FALHA DEFINITIVA na conexão DB para ${req.path} (readyState: ${mongoose.connection.readyState} - ${stateDescription}).`);
                res.status(503).json({ message: `Serviço temporariamente indisponível (DB Connection Error - State: ${stateDescription}).` });
            }
        }
    } catch (dbError) {
        console.error(`[Vercel DB Middleware V3] Erro pego pelo middleware de DB para ${req.path}:`, dbError.message);
        // Evitar enviar o stack trace completo para o cliente em produção
        res.status(503).json({ message: 'Serviço indisponível (DB Error during middleware processing).' });
    }
});

app.use(cors());
app.use(express.json());

// Rota raiz da API
app.get('/api', (req, res) => {
    console.log('[API V3 - /api] Rota raiz da API acessada.');
    res.send('API do OrgaN V3 está funcionando via Vercel Function!');
});

// Rota de Teste de Banco de Dados
app.get('/api/test-db', async (req, res) => {
    console.log('[API V3 - /api/test-db] Rota de teste acessada.');
    try {
        const dbState = mongoose.connection.readyState;
        const dbName = mongoose.connection.name;
        const readyStateDescription = mongoose.ConnectionStates[dbState] || 'Desconhecido';
        console.log(`[API V3 - /api/test-db] Estado da conexão mongoose: <span class="math-inline">\{dbState\} \(</span>{readyStateDescription}), Nome do DB: ${dbName}`);        if (dbState === 1) {
            res.status(200).json({
                message: 'Conexão MongoDB OK via Express em api/index.js V3!',
                dbName: dbName,
                readyState: dbState,
                readyStateDescription: readyStateDescription
            });
        } else {
        console.error(`[API V3 - /api/test-db] Chegou na rota de teste, mas DB não está conectado. Estado: <span class="math-inline">\{dbState\} \(</span>{readyStateDescription})`);            res.status(503).json({
                message: 'Conexão MongoDB não está pronta na rota /api/test-db V3.',
                dbName: dbName,
                readyState: dbState,
                readyStateDescription: readyStateDescription,
            });
        }
    } catch (error) {
        console.error('[API V3 - /api/test-db] Erro ao testar conexão DB:', error.message);
        res.status(500).json({
            message: 'Erro interno do servidor ao testar conexão DB V3.',
            error: error.message,
        });
    }
});

// Rotas da Aplicação
app.use('/api/products', productRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/auth/register', registerRoute);
app.use('/api/auth/login', loginRoute);

// Para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor da API V3 rodando localmente na porta ${PORT} a partir de api/index.js`);
        });
    }).catch(err => {
        console.error("Falha ao iniciar servidor local V3 devido a erro de conexão com DB:", err);
    });
}

// Fallback para rotas /api não encontradas DENTRO deste app Express
app.use('/api', (req, res, next) => {
    console.log(`[API V3] Rota API não encontrada dentro do Express: ${req.method} ${req.originalUrl}`);
    if (!res.headersSent) {
        res.status(404).json({ error: 'Rota API não encontrada neste servidor Express V3' });
    } else {
        next();
    }
});

module.exports = app;