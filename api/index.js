const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose'); // Adicionado para verificar readyState e ConnectionStates

const connectDB = require('../src/database');
const productRoutes = require('../src/api/products');
const financeRoutes = require('../src/api/finances');
const registerRoute = require('../src/api/auth/register');
const loginRoute = require('../src/api/auth/login');

const app = express();

// Middleware para logar o início de cada requisição
app.use((req, res, next) => {
    console.log(`[Vercel Request Log] START: ${req.method} ${req.originalUrl}`);
    next();
});

// Middleware para garantir a conexão ANTES de cada rota /api
app.use('/api', async (req, res, next) => {
    console.log(`[Vercel DB Middleware] Rota ${req.path} interceptada.`);
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

// Rota de Teste de Banco de Dados
app.get('/api/test-db', async (req, res) => {
    console.log('[api/index.js - /api/test-db] Rota de teste acessada.');
    try {
        // O middleware /api já tentou a conexão. Vamos verificar o estado.
        const dbState = mongoose.connection.readyState;
        const dbName = mongoose.connection.name;
        const readyStateDescription = mongoose.ConnectionStates[dbState] || 'Desconhecido';

        console.log(`[api/index.js - /api/test-db] Estado da conexão mongoose: ${dbState} (${readyStateDescription}), Nome do DB: ${dbName}`);

        if (dbState === 1) { // 1: connected
            res.status(200).json({
                message: 'Conexão MongoDB OK via Express em api/index.js!',
                dbName: dbName,
                readyState: dbState,
                readyStateDescription: readyStateDescription
            });
        } else {
             // Se não estiver conectado aqui, o middleware já deveria ter retornado erro 503.
             // Mas, por segurança, podemos logar e retornar um estado.
            console.error(`[api/index.js - /api/test-db] Chegou na rota de teste, mas DB não está conectado. Estado: ${dbState} (${readyStateDescription})`);
            res.status(503).json({
                message: 'Conexão MongoDB não está pronta na rota /api/test-db.',
                dbName: dbName,
                readyState: dbState,
                readyStateDescription: readyStateDescription,
                tip: 'Verifique os logs do middleware de conexão DB.'
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
            console.log(`Servidor da API rodando localmente na porta ${PORT} a partir de api/index.js`);
        });
    }).catch(err => {
        console.error("Falha ao iniciar servidor local devido a erro de conexão com DB:", err);
        // process.exit(1); // Considerar sair se a conexão com DB falhar localmente
    });
}

// Middleware de log final (pode não ser sempre alcançado em Vercel se a resposta já foi enviada)
app.use((req, res, next) => {
    if (!res.headersSent) {
      // Se nenhuma rota da API correspondeu e nenhuma resposta foi enviada,
      // pode ser um 404 da API ou a requisição passará para as regras de SPA do vercel.json
      console.log(`[Vercel Request Log] API route not found or no response sent for: ${req.method} ${req.originalUrl}`);
    }
    // Para logar após a resposta ser enviada, precisaria de 'on-finished'
    // Mas para Vercel, o log da plataforma já cobre o término da função.
    next();
});

module.exports = app;