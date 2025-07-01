// src/api/index.js

// 1. Carrega as variáveis de ambiente do ficheiro .env
require('dotenv').config();

// 2. Importa as bibliotecas necessárias
const express = require('express');
const cors = require('cors');
const connectDB = require('../database'); // O seu ficheiro de conexão com o MongoDB

// 3. Importa TODAS as suas rotas
const productRoutes = require('../routes/products');
const financeRoutes = require('../routes/finances');
const registerRoute = require('../routes/auth/register');
const loginRoute = require('../routes/auth/login');
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

// 7. Define as rotas da sua API
app.use('/api/products', productRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/auth/register', registerRoute);
app.use('/api/auth/login', loginRoute);
app.use('/api/user', userRoutes);
app.use('/api/belvo', belvoRoutes); // Diz ao servidor para usar a rota da Belvo
app.use('/api/lists', listRoutes); // 2. Use as novas rotas


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
