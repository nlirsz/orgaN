// Importa os pacotes necessários
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env

// Importa a função de conexão com o banco de dados
const connectDB = require('./database');

// Importa as rotas
const productRoutes = require('./api/products');
const financeRoutes = require('./api/finances');
// NOVO: Importa as rotas de autenticação
const registerRoute = require('./api/auth/register'); //
const loginRoute = require('./api/auth/login'); //

// Cria a aplicação Express
const app = express();

// Conecta ao MongoDB
connectDB();

// Middlewares Essenciais
app.use(cors()); // Habilita o CORS
app.use(express.json()); // Habilita o Express a entender JSON

// Rota de Teste
app.get('/', (req, res) => {
    res.send('API do Finance Dashboard está funcionando!');
});

// Define e usa as rotas da API
app.use('/api/products', productRoutes); // Rotas de produtos
app.use('/api/finances', financeRoutes); // Rotas de finanças

// NOVO: Rotas de autenticação
app.post('/api/auth/register', registerRoute); // Rota de registro
app.post('/api/auth/login', loginRoute);     // Rota de login

// Define a porta do servidor
const PORT = process.env.PORT || 3000;

// Inicia o servidor e o faz "escutar" por requisições na porta definida
app.listen(PORT, () => {
    console.log(`Servidor da API rodando na porta ${PORT}`);
});

module.exports = app;