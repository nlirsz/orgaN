// api/index.js (raiz do projeto)
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000; // Embora a Vercel gerencie a porta, é bom ter para consistência.

console.log('[api/index.js ROOT] Script simplificado iniciado pela Vercel.');
console.log(`[api/index.js ROOT] Ambiente (NODE_ENV): ${process.env.NODE_ENV}`);

// Middleware simples para logar todas as requisições /api/* que chegam aqui
app.use('/api', (req, res, next) => {
    console.log(`[api/index.js ROOT] Middleware /api: Recebida requisição para ${req.method} ${req.originalUrl}`);
    next();
});

app.get('/api/ping', (req, res) => {
    console.log('[api/index.js ROOT] Rota /api/ping acessada');
    res.status(200).send('Pong from /api/ping (root api/index.js)!');
});

app.get('/api/another-test', (req, res) => {
    console.log('[api/index.js ROOT] Rota /api/another-test acessada');
    res.status(200).json({ message: 'Another test route from root api/index.js reached!', timestamp: new Date() });
});

// Handler para rotas /api/* não encontradas por este handler simplificado
app.all('/api/*', (req, res) => {
    console.log(`[api/index.js ROOT] Rota /api${req.path} acessada - não implementada neste handler simplificado.`);
    res.status(404).send(`Route /api${req.path} not found in simplified handler (api/index.js ROOT).`);
});

// Handler para a rota raiz "/" (opcional, mas pode ajudar a ver se o app Express está vivo)
app.get('/', (req, res) => {
    console.log('[api/index.js ROOT] Rota / (raiz) acessada');
    res.status(200).send('Hello from simplified Express app (api/index.js ROOT)!');
});

// Exportar o app para a Vercel
module.exports = app;

// Log para desenvolvimento local (não será executado na Vercel da mesma forma)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`[api/index.js ROOT] Servidor local (simplificado) rodando na porta ${PORT}`);
    });
}
