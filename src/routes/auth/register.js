// src/routes/auth/register.js
const express = require('express');
const router = express.Router();
require('dotenv').config();
const User = require('../../models/User'); // CORRIGIDO
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); // Adicionado para logs de conexão

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("[register.js] ERRO: JWT_SECRET não definida nas variáveis de ambiente! O registro não funcionará.");
}

// Rota agora é POST / (relativo ao ponto de montagem /api/auth/register)
router.post('/', async (req, res) => {
    console.log(`[register.js] Rota POST / acessada (montada em /api/auth/register) com método: ${req.method}`);

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios.' });
    }

    try {
        console.log('[register.js] Verificando estado da conexão Mongoose antes de User.findOne(). ReadyState:', mongoose.connection.readyState, '(' + (mongoose.ConnectionStates[mongoose.connection.readyState] || 'Desconhecido') + ')');
        let user = await User.findOne({ username });
        if (user) {
            return res.status(409).json({ message: 'Usuário já existe.' });
        }
        user = new User({ username, password });
        await user.save();
        
        const payload = { user: { userId: user.id } };
        jwt.sign(
            payload,
            JWT_SECRET, // Usar a constante definida acima
            { expiresIn: '1h' },
            (err, token) => {
                if (err) {
                    console.error('[register.js] Erro ao gerar token JWT:', err);
                    return res.status(500).json({ message: 'Erro interno ao gerar token.' });
                }
                res.status(201).json({
                    message: 'Usuário registrado com sucesso!',
                    token,
                    userId: user.id
                });
            }
        );
    } catch (error) {
        console.error('[register.js] Erro detalhado no registro:', error.name, '-', error.message);
        if (error.stack) {
            console.error('[register.js] Stack do erro:', error.stack);
        }
        if (error.reason) { // Alguns erros do Mongoose podem ter uma propriedade 'reason'
            console.error('[register.js] Razão do erro (Mongoose):', error.reason);
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: 'Erro de validação:', details: messages, errorName: error.name });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao registrar usuário.', errorName: error.name, errorMessage: error.message });
    }
});

module.exports = router;