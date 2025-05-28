// api/index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// --- CAMINHOS CORRIGIDOS ---
// Saindo da pasta 'api/' para a raiz do projeto (usando '../')
// e depois entrando em 'src/'
const connectDB = require('../src/database');
const productRoutes = require('../src/api/products');
const financeRoutes = require('../src/api/finances');
const registerRoute = require('../src/api/auth/register');
const loginRoute = require('../src/api/auth/login');
// const testDbRoute = require('../src/api/test-db'); // Se for usar

const app = express();

// Conecta ao MongoDB
connectDB();

// Middlewares Essenciais
app.use(cors());
app.use(express.json());

// Rota de Teste (opcional, mas útil)
app.get('/api', (req, res) => {
    res.send('API do OrgaN está funcionando via Vercel Function!');
});

// Define e usa as rotas da API
// O prefixo '/api' aqui é como a Vercel vai direcionar,
// e suas rotas internas já estão esperando por isso (ex: '/products', '/auth/login')
app.use('/api/products', productRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/auth/register', registerRoute); // Mantenha '/api/auth/register' se a rota em register.js for só '/'
app.use('/api/auth/login', loginRoute);       // Mantenha '/api/auth/login' se a rota em login.js for só '/'
// app.get('/api/test-db', testDbRoute);

// A Vercel gerencia a porta, então o app.listen é principalmente para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor da API rodando localmente na porta ${PORT} a partir de api/index.js`);
    });
}

// Exporta o app para a Vercel
module.exports = app;