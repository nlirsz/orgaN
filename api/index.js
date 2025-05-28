// api/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('../src/database');
const productRoutes = require('../src/api/products');
const financeRoutes = require('../src/api/finances');
const registerRoute = require('../src/api/auth/register');
const loginRoute = require('../src/api/auth/login');
// const testDbRoute = require('../src/api/test-db');

const app = express();

// Variável para rastrear o status da promessa de conexão
let connectionPromise = null;

const ensureDBConnection = async () => {
    if (!connectionPromise) {
        connectionPromise = connectDB().catch(err => {
            console.error("Falha na promessa de conexão inicial do DB:", err);
            connectionPromise = null; // Permite nova tentativa
            throw err; // Relança o erro para a chamada atual
        });
    }
    return connectionPromise;
};

// Tenta conectar na inicialização da instância da função serverless
ensureDBConnection();

app.use(cors());
app.use(express.json());

// Middleware para garantir que o DB esteja conectado antes de cada requisição à API
// Isso é útil para cold starts ou se a conexão inicial falhar/demorar.
app.use('/api', async (req, res, next) => {
    try {
        await ensureDBConnection();
        next();
    } catch (dbError) {
        // Se ensureDBConnection() lançar um erro (porque connectDB falhou)
        res.status(503).json({ message: 'Serviço indisponível devido a problema no banco de dados.' });
    }
});

// Rotas
app.get('/api', (req, res) => {
    res.send('API do OrgaN está funcionando via Vercel Function!');
});
app.use('/api/products', productRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/auth/register', registerRoute);
app.use('/api/auth/login', loginRoute);
// app.use('/api/test-db', testDbRoute);


if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    // Garante que o DB conecte antes de iniciar o servidor localmente
    ensureDBConnection().then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor da API rodando localmente na porta ${PORT} a partir de api/index.js`);
        });
    }).catch(err => {
        console.error("Falha ao iniciar o servidor local devido a erro no DB:", err);
        // process.exit(1); // Pode sair se não conseguir conectar localmente também
    });
}

module.exports = app;