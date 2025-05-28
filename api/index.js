const express = require('express');
const cors = require('cors');
require('dotenv').config();
// ... (outras importações e middlewares) ...
const mongoose = require('mongoose'); // Adicione esta linha no topo se ainda não estiver lá

// ... (suas rotas existentes como app.use('/api/products', productRoutes); etc.) ...


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
// Este é o ponto crucial para o Vercel
app.use('/api', async (req, res, next) => {
    console.log(`[Vercel DB Middleware] Rota ${req.path} interceptada.`);
    try {
        // Tenta conectar/reutilizar conexão
        await connectDB(); // connectDB agora retorna uma promessa
                           // e internamente gerencia para não reconectar desnecessariamente.

        if (require('mongoose').connection.readyState === 1) {
            console.log(`[Vercel DB Middleware] Conexão DB OK para ${req.path}. Prosseguindo.`);
            next();
        } else {
            console.warn(`[Vercel DB Middleware] Conexão DB não estava pronta (readyState: ${require('mongoose').connection.readyState}) para ${req.path} após await connectDB(). Isso pode indicar um problema.`);
            // Tentar conectar mais uma vez, explicitamente.
            // Isto é mais uma medida de segurança, o connectDB() já deveria ter resolvido.
            await connectDB();
            if (require('mongoose').connection.readyState === 1) {
                console.log(`[Vercel DB Middleware] Conexão DB OK após segunda tentativa para ${req.path}.`);
                next();
            } else {
                 console.error(`[Vercel DB Middleware] FALHA DEFINITIVA na conexão DB para ${req.path} (readyState: ${require('mongoose').connection.readyState}).`);
                res.status(503).json({ message: 'Serviço temporariamente indisponível (DB Connection Error).' });
            }
        }
    } catch (dbError) {
        console.error(`[Vercel DB Middleware] Erro pego pelo middleware de DB para ${req.path}:`, dbError.message, dbError.stack);
        res.status(503).json({ message: 'Serviço indisponível (DB Error).' });
    }
});

app.use(cors());
app.use(express.json());


app.get('/api', (req, res) => {
    res.send('API do OrgaN está funcionando via Vercel Function!');
});
app.use('/api/products', productRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/auth/register', registerRoute);
app.use('/api/auth/login', loginRoute);


app.get('/api/test-db', async (req, res) => {
    // O middleware de conexão '/api' já tentou conectar o DB.
    // Vamos apenas verificar o estado aqui.
    console.log('[api/index.js - /api/test-db] Rota de teste acessada.');
    try {
        const dbState = mongoose.connection.readyState;
        const dbName = mongoose.connection.name;
        const readyStateDescription = mongoose.ConnectionStates[dbState] || 'Desconhecido';

        console.log(`[api/index.js - /api/test-db] Estado da conexão mongoose: <span class="math-inline">\{dbState\} \(</span>{readyStateDescription}), Nome do DB: ${dbName}`);

        if (dbState === 1) { // 1: connected
            res.status(200).json({
                message: 'Conexão MongoDB OK via Express em api/index.js!',
                dbName: dbName,
                readyState: dbState,
                readyStateDescription: readyStateDescription
            });
        } else {
            // Tenta conectar novamente caso o middleware não tenha sido suficiente
            console.warn(`[api/index.js - /api/test-db] Conexão não estava pronta. Tentando conectar novamente...`);
            await connectDB(); // connectDB é sua função de src/database.js
            const newDbState = mongoose.connection.readyState;
            const newDbName = mongoose.connection.name;
            const newReadyStateDescription = mongoose.ConnectionStates[newDbState] || 'Desconhecido';
            console.log(`[api/index.js - /api/test-db] Novo estado da conexão: <span class="math-inline">\{newDbState\} \(</span>{newReadyStateDescription}), Nome do DB: ${newDbName}`);

            if (newDbState === 1) {
                 res.status(200).json({
                    message: 'Conexão MongoDB OK após nova tentativa na rota /api/test-db!',
                    dbName: newDbName,
                    readyState: newDbState,
                    readyStateDescription: newReadyStateDescription
                });
            } else {
                res.status(503).json({
                    message: 'Conexão MongoDB não está pronta, mesmo após nova tentativa na rota.',
                    dbName: newDbName,
                    readyState: newDbState,
                    readyStateDescription: newReadyStateDescription,
                    tip: 'Verifique os logs da função, URI/whitelist do DB e o middleware de conexão.'
                });
            }
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

// ... (seu if (process.env.NODE_ENV !== 'production') ... e module.exports = app;) ...



if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    connectDB().then(() => { // Garante conexão antes de iniciar localmente
        app.listen(PORT, () => {
            console.log(`Servidor da API rodando localmente na porta ${PORT} a partir de api/index.js`);
        });
    }).catch(err => {
        console.error("Falha ao iniciar servidor local devido a erro de conexão com DB:", err);
    });
}

// Middleware para logar o fim de cada requisição (após as rotas)
app.use((req, res) => {
    // Este middleware só será alcançado se nenhuma rota anterior enviar uma resposta.
    // Se uma rota enviou uma resposta, o ciclo da requisição termina lá.
    // Para logar após a resposta ser enviada, você usaria on-finished ou similar,
    // mas para serverless, o log de Vercel já cobre o término da função.
    console.log(`[Vercel Request Log] END: ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
});



module.exports = app;