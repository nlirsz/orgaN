// api/index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config(); 

// Caminhos ajustados para apontar para a pasta 'src'
const connectDB = require('../src/database'); 
const productRoutes = require('../src/api/products'); 
const financeRoutes = require('../src/api/finances');   
const registerRoute = require('../src/api/auth/register'); 
const loginRoute = require('../src/api/auth/login');       
// const testDbRoute = require('../src/api/test-db'); // Se você usou

const app = express();
connectDB();
app.use(cors()); 
app.use(express.json()); 

// Mantenha suas rotas como estão, pois elas já têm o prefixo /api internamente
// ou são chamadas com ele (ex: app.use('/api/products', productRoutes))
app.use('/api/products', productRoutes);
app.use('/api/finances', financeRoutes);
app.post('/api/auth/register', registerRoute); 
app.post('/api/auth/login', loginRoute); 
// app.get('/api/test-db', testDbRoute);

// A Vercel gerencia a porta, então o app.listen não é necessário para produção lá
// Mas você pode manter para desenvolvimento local se rodar este arquivo diretamente
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor da API rodando localmente na porta ${PORT} a partir de api/index.js`);
    });
}

module.exports = app; // Exporta o app para a Vercel