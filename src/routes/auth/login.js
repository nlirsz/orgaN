// src/routes/auth/login.js
const express = require('express');
const router = express.Router();
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../../models/User');
const List = require('../../models/List');
const Product = require('../../models/Product');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("[login.js] ERRO: JWT_SECRET não definida nas variáveis de ambiente! O login não funcionará.");
}

// @route   POST /api/auth/login
// @desc    Autentica o utilizador, retorna o token e associa produtos órfãos à lista "Geral"
// @access  Public
router.post('/', async (req, res) => {
    console.log(`[login.js] Rota POST / acessada (montada em /api/auth/login) com método: ${req.method}`);
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios.' });
    }

    try {
        // 1. Encontrar o utilizador
        console.log('[login.js] Verificando estado da conexão Mongoose antes de User.findOne(). ReadyState:', mongoose.connection.readyState, '(' + (mongoose.ConnectionStates[mongoose.connection.readyState] || 'Desconhecido') + ')');
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas (usuário não encontrado).' });
        }

        // 2. Comparar a senha
        const passwordMatch = await user.comparePassword(password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas (senha incorreta).' });
        }

        // 3. Lógica da Lista "Geral" e migração de produtos
        let geralList = await List.findOne({ userId: user._id, name: 'Geral' });

        // Se a lista "Geral" não existir, cria-a
        if (!geralList) {
            geralList = new List({
                name: 'Geral',
                description: 'Sua lista de desejos principal.',
                userId: user._id,
            });
            await geralList.save();
            console.log(`Lista 'Geral' criada para o utilizador ${user.username} durante o login.`);
        }

        // Migra produtos órfãos (sem listId) para a lista "Geral"
        const migrationResult = await Product.updateMany(
            { userId: user.id, listId: { $exists: false } },
            { $set: { listId: geralList._id } }
        );

        if (migrationResult.modifiedCount > 0) {
            console.log(`${migrationResult.modifiedCount} produtos órfãos foram migrados para a lista 'Geral' para o utilizador ${user.username}.`);
        }

        // 4. Criar e retornar o token JWT
        const payload = { user: { userId: user.id } };
        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '30d' },
            (err, token) => {
                if (err) {
                    console.error('[login.js] Erro ao gerar token JWT:', err);
                    return res.status(500).json({ message: 'Erro interno ao gerar token.' });
                }
                res.status(200).json({
                    message: 'Login bem-sucedido.',
                    token,
                    userId: user.id
                });
            }
        );
    } catch (error) {
        console.error('[login.js] Erro detalhado no login:', error.name, '-', error.message);
        if (error.stack) {
            console.error('[login.js] Stack do erro:', error.stack);
        }
        if (error.reason) {
            console.error('[login.js] Razão do erro (Mongoose):', error.reason);
        }
        res.status(500).json({ message: 'Erro interno do servidor ao fazer login.', errorName: error.name, errorMessage: error.message });
    }
});

module.exports = router;