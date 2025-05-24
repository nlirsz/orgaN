// Arquivo: src/middleware/auth.js

const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware é uma função que tem acesso aos objetos de requisição (req), resposta (res),
// e à próxima função de middleware no ciclo de requisição-resposta do aplicativo (next).
module.exports = function(req, res, next) {
    // Pega o token do cabeçalho da requisição
    const token = req.header('x-auth-token');

    // Verifica se não há token
    if (!token) {
        // 401: Unauthorized
        return res.status(401).json({ msg: 'Nenhum token, autorização negada.' });
    }

    // Verifica o token
    try {
        // Decodifica o token usando a chave secreta
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Adiciona o usuário do payload do token ao objeto de requisição (req)
        req.user = decoded.user;
        
        // Chama a próxima função no ciclo
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token não é válido.' });
    }
};