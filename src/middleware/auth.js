// Arquivo: src/middleware/auth.js

const jwt = require('jsonwebtoken'); //
require('dotenv').config(); //

module.exports = function(req, res, next) { //
    // Pega o token do cabeçalho da requisição 'x-auth-token'
    const token = req.header('x-auth-token'); //

    // Verifica se não há token
    if (!token) { //
        // 401: Unauthorized
        return res.status(401).json({ msg: 'Nenhum token, autorização negada.' }); //
    }

    // Verifica o token
    try {
        // Decodifica o token usando a chave secreta
        const decoded = jwt.verify(token, process.env.JWT_SECRET); //

        // Adiciona o usuário do payload do token ao objeto de requisição (req)
        // O payload do token contém { user: { userId: '...' } }
        req.user = decoded.user; //

        // Chama a próxima função no ciclo
        next(); //
    } catch (err) {
        // Se o token não for válido (expirado, malformado, etc.)
        res.status(401).json({ msg: 'Token não é válido.' }); //
    }
};