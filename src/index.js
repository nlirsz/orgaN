// Importa os pacotes necessários
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env

// Importa a função de conexão com o banco de dados
const connectDB = require('./database');

// Cria a aplicação Express
const app = express();

// Conecta ao MongoDB
connectDB();

// Middlewares Essenciais
// Habilita o CORS para permitir requisições de diferentes origens (importante para o desenvolvimento)
app.use(cors());
// Habilita o Express a entender JSON no corpo das requisições
app.use(express.json());

// Rota de Teste - para verificar se o servidor está no ar
app.get('/', (req, res) => {
    res.send('API do Finance Dashboard está funcionando!');
});

// Define e usa as rotas da API
// Todas as rotas definidas em 'products.js' serão acessíveis a partir de '/api/products'
app.use('/api/products', require('./api/products'));
// Adicione outras rotas aqui no futuro (ex: app.use('/api/auth', require('./api/auth'));)

// Define a porta do servidor
const PORT = process.env.PORT || 3000;

// Inicia o servidor e o faz "escutar" por requisições na porta definida
app.listen(PORT, () => {
    console.log(`Servidor da API rodando na porta ${PORT}`);
});

// Exporta o app para ser usado pelo Vercel (se necessário)
module.exports = app;