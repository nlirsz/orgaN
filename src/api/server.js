// api/server.js  (OU api/index.js)

const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Garante que as variáveis de ambiente sejam carregadas

// IMPORTANTE: Ajuste os caminhos para seus arquivos de database, rotas e modelos
// Eles agora serão relativos à pasta 'api' na raiz, e não mais 'src/api'.
// Se você moveu src/index.js para api/index.js (na raiz), os caminhos podem precisar de '../src/...'
const connectDB = require('../database'); // Ajuste conforme sua estrutura final

// Importa as rotas
const productRoutes = require('./products'); // Ajuste se a estrutura de pastas mudou
const financeRoutes = require('./finances');   // Ajuste
const registerRoute = require('./auth/register'); // Ajuste
const loginRoute = require('./auth/login');       // Ajuste

const testDbRoute = require('./test-db'); // Se você quiser manter essa rota de teste

// Cria a aplicação Express
const app = express();

// Conecta ao MongoDB
connectDB();

// Middlewares Essenciais
app.use(cors()); 
app.use(express.json()); 

// Rota de Teste (opcional, mas útil)
app.get('/api', (req, res) => { // Adicionei /api para não conflitar com o frontend
    res.send('API do Finance Dashboard está funcionando via Vercel Function!');
});

// Define e usa as rotas da API
// Todas as suas rotas já começam com /api/... internamente nos arquivos de rotas, o que é bom.
// A Vercel vai rotear requisições para /api/NOMEDAROTA para esta função.
app.use('/api/products', productRoutes);
app.use('/api/finances', financeRoutes);
app.post('/api/auth/register', registerRoute); 
app.post('/api/auth/login', loginRoute);
app.get('/api/test-db', testDbRoute); // Exemplo para a rota de teste

// Define a porta do servidor (A Vercel ignora isso, mas é bom para desenvolvimento local)
const PORT = process.env.PORT || 3000;

// Localmente, você ainda pode querer rodar com 'node api/server.js'
if (process.env.NODE_ENV !== 'production') { // Para não tentar iniciar o listener na Vercel
    app.listen(PORT, () => {
        console.log(`Servidor da API rodando localmente na porta ${PORT}`);
    });
}

// Exporta o app para a Vercel
module.exports = app;