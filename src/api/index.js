// Em RAIZ_DO_PROJETO/api/index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = require('../database');
const productRoutes = require('../routes/products'); // Caminho corrigido
const financeRoutes = require('../routes/finances');   // Caminho corrigido
const registerRoute = require('../routes/auth/register'); // Caminho corrigido
const loginRoute = require('../routes/auth/login');
const userRoutes = require('../routes/user'); // <-- ADICIONE ESTA LINHA
const belvoRoutes = require('../routes/belvo'); // ADICIONE ESTA LINHA
const connectionStates = mongoose.STATES || { 
  0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting'
};
const stateDescription = connectionStates[mongoose.connection.readyState] || 'Desconhecido';
console.log(`[Vercel DB Middleware V4] Estado inicial da conexão mongoose: ${mongoose.connection.readyState} (${stateDescription})`);

const app = express();

// Middleware para logar o início de cada requisição
app.use((req, res, next) => {
    console.log(`[Vercel Request Log V4] START: ${req.method} ${req.originalUrl}`);
    next();
});

// Middleware para garantir a conexão ANTES de cada rota /api
app.use('/api', async (req, res, next) => {
    console.log(`[Vercel DB Middleware V4] Rota ${req.path} interceptada.`);
    try {
        await connectDB();
        if (mongoose.connection.readyState === 1) {
            console.log(`[Vercel DB Middleware V4] Conexão DB OK para ${req.path}. Prosseguindo.`);
            next();
        } else {
            console.warn(`[Vercel DB Middleware V4] Conexão DB não estava pronta (readyState: ${mongoose.connection.readyState}) para ${req.path} após await connectDB(). Tentando novamente...`);
            await connectDB();
            if (mongoose.connection.readyState === 1) {
                console.log(`[Vercel DB Middleware V4] Conexão DB OK após segunda tentativa para ${req.path}.`);
                next();
            } else {
                const stateDescription = mongoose.ConnectionStates[mongoose.connection.readyState] || 'Desconhecido';
                console.error(`[Vercel DB Middleware V4] FALHA DEFINITIVA na conexão DB para ${req.path} (readyState: ${mongoose.connection.readyState} - ${stateDescription}).`);
                res.status(503).json({ message: `Serviço temporariamente indisponível (DB Connection Error - State: ${stateDescription}).` });
            }
        }
    } catch (dbError) {
        console.error(`[Vercel DB Middleware V4] Erro pego pelo middleware de DB para ${req.path}:`, dbError.message);
        res.status(503).json({ message: 'Serviço indisponível (DB Error during middleware processing).' });
    }
});

app.use(cors());
app.use(express.json());

// Rota raiz da API
app.get('/api', (req, res) => {
    console.log('[API V4 - /api] Rota raiz da API acessada.');
    res.send('API do OrgaN V4 está funcionando via Vercel Function!');
});

// Rota de Teste de Banco de Dados (pode ser removida se não for mais necessária para depuração)
app.get('/api/test-db', async (req, res) => {
    console.log('[API V4 - /api/test-db] Rota de teste acessada.');
    try {
        const dbState = mongoose.connection.readyState;
        const dbName = mongoose.connection.name;
        const readyStateDescription = mongoose.ConnectionStates[dbState] || 'Desconhecido';
        console.log(`[API V4 - /api/test-db] Estado da conexão mongoose: ${dbState} (${readyStateDescription}), Nome do DB: ${dbName}`);
        if (dbState === 1) {
            res.status(200).json({
                message: 'Conexão MongoDB OK via Express em api/index.js V4!',
                dbName: dbName,
                readyState: dbState,
                readyStateDescription: readyStateDescription
            });
        } else {
            console.error(`[API V4 - /api/test-db] Chegou na rota de teste, mas DB não está conectado. Estado: ${dbState} (${readyStateDescription})`);
            res.status(503).json({
                message: 'Conexão MongoDB não está pronta na rota /api/test-db V4.',
                dbName: dbName,
                readyState: dbState,
                readyStateDescription: readyStateDescription,
            });
        }
    } catch (error) {
        console.error('[API V4 - /api/test-db] Erro ao testar conexão DB:', error.message);
        res.status(500).json({
            message: 'Erro interno do servidor ao testar conexão DB V4.',
            error: error.message,
        });
    }
});

// Rotas da Aplicação
app.use('/api/products', productRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/auth/register', registerRoute);
app.use('/api/auth/login', loginRoute);
app.use('/api/user', userRoutes);
app.use('/api/belvo', belvoRoutes); // ADICIONE ESTA LINHA



// Para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor da API V4 rodando localmente na porta ${PORT} a partir de api/index.js`);
        });
    }).catch(err => {
        console.error("Falha ao iniciar servidor local V4 devido a erro de conexão com DB:", err);
    });
}

// Fallback para rotas /api não encontradas DENTRO deste app Express
app.use('/api', (req, res, next) => {
    console.log(`[API V4] Rota API não encontrada dentro do Express: ${req.method} ${req.originalUrl}`);
    if (!res.headersSent) {
        res.status(404).json({ error: 'Rota API não encontrada neste servidor Express V4' });
    } else {
        next();
    }
});

module.exports = app;