const express = require('express');
const cors = require('cors');
require('dotenv').config();

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