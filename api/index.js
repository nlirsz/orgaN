// api/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('../src/database');
const productRoutes = require('../src/api/products');
const financeRoutes = require('../src/api/finances');
const registerRoute = require('../src/api/auth/register');
const loginRoute = require('../src/api/auth/login');

const app = express();

let connectionPromise = null;

const ensureDBConnection = async () => {
    if (connectionPromise === null) { // Só inicia uma nova tentativa se não houver uma em andamento ou se a anterior falhou
        console.log("Iniciando nova tentativa de conexão com o DB...");
        connectionPromise = connectDB()
            .then(() => {
                console.log("Conexão com DB estabelecida com sucesso pela ensureDBConnection.");
                // Não precisa fazer nada aqui, a promessa resolve.
            })
            .catch(err => {
                console.error("Falha na promessa de conexão do DB em ensureDBConnection:", err);
                connectionPromise = null; // Importante: reseta para permitir nova tentativa na próxima requisição
                throw err; // Propaga o erro para ser tratado pelo chamador
            });
    } else {
        console.log("Aguardando promessa de conexão existente...");
    }
    return connectionPromise;
};

// Inicia a conexão ao carregar o módulo.
// Não bloqueia a exportação do app, mas as rotas vão aguardar.
ensureDBConnection();


app.use(cors());
app.use(express.json());

// Middleware para garantir a conexão ANTES de cada rota /api
app.use('/api', async (req, res, next) => {
    try {
        await ensureDBConnection();
        next();
    } catch (dbError) {
        console.error(`Erro de conexão com DB bloqueando rota ${req.path}:`, dbError.message);
        res.status(503).json({ message: 'Serviço temporariamente indisponível. Tente novamente mais tarde.' });
    }
});

app.get('/api', (req, res) => { // Esta rota agora também passará pelo middleware acima
    res.send('API do OrgaN está funcionando via Vercel Function!');
});
app.use('/api/products', productRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/auth/register', registerRoute);
app.use('/api/auth/login', loginRoute);


if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    ensureDBConnection().then(() => { // Garante conexão antes de iniciar localmente
        app.listen(PORT, () => {
            console.log(`Servidor da API rodando localmente na porta ${PORT} a partir de api/index.js`);
        });
    }).catch(err => {
        console.error("Falha ao iniciar servidor local devido a erro de conexão com DB:", err);
    });
}

module.exports = app;