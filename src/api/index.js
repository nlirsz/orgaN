// src/api/index.js

// 1. Carrega as variáveis de ambiente do ficheiro .env
require('dotenv').config();
const mongoose = require('mongoose'); // Import mongoose to check connection state

// 2. Importa as bibliotecas necessárias
const express = require('express');
const cors = require('cors');
const connectDB = require('../database'); // O seu ficheiro de conexão com o MongoDB

// 3. Importa TODAS as suas rotas
const productRoutes = require('../routes/products');
const financeRoutes = require('../routes/finances');
const authRoutes = require('../routes/auth');
const userRoutes = require('../routes/user');
const belvoRoutes = require('../routes/belvo'); // A nossa nova rota da Belvo
const listRoutes = require('../routes/lists'); // 1. Importe as novas rotas


// 4. Cria a aplicação Express
const app = express();

// 5. Conecta-se à base de dados
connectDB();

// 6. Aplica os middlewares essenciais
app.use(cors()); // Permite que o seu frontend comunique com o backend
app.use(express.json()); // Permite que o servidor entenda JSON

// --- ROTAS DE VERIFICAÇÃO DE SAÚDE (HEALTH CHECK) ---

// Rota de verificação de saúde básica da API
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rota de verificação de saúde do banco de dados
app.get('/api/db-health', async (req, res) => {
    try {
        const state = mongoose.connection.readyState;
        const stateName = mongoose.ConnectionStates[state];
        
        if (state === 1) { // 1 === connected
            res.status(200).json({ status: 'ok', dbState: stateName, dbStateCode: state });
        } else {
            res.status(503).json({ status: 'error', message: 'Database not connected.', dbState: stateName, dbStateCode: state });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to check database status.', error: error.message });
    }
});

// 7. Define as rotas da sua API
app.use('/api/products', productRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/belvo', belvoRoutes); // Diz ao servidor para usar a rota da Belvo
app.use('/api/lists', listRoutes);

// Rota raiz para verificar se a API está online
app.get('/api', (req, res) => {
    res.send('API do orgaN está a funcionar!');
});

// 8. Inicia o servidor (apenas para desenvolvimento local)
// A Vercel ignora esta parte e gere o servidor automaticamente.
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor da API a rodar localmente na porta ${PORT}`);
    });
}

// 9. Exporta a aplicação para a Vercel
module.exports = app;
