// src/api/auth/login.js

require('dotenv').config();
const User = require('../../models/User'); // <--- CAMINHO CORRIGIDO
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("ERRO: JWT_SECRET não definida nas variáveis de ambiente! O login não funcionará.");
}

module.exports = async (req, res) => {
    // Seu código original de login aqui...
    // Nenhuma mudança na lógica, apenas o require acima.
    if (req.method !== 'POST') { // Adicionando verificação do método só por garantia, embora o router principal já faça isso
        return res.status(405).json({ message: 'Método não permitido.' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios.' });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
        const passwordMatch = await user.comparePassword(password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
        const payload = { user: { userId: user.id } };
        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err; // Este erro vai para o catch abaixo
                res.status(200).json({
                    message: 'Login bem-sucedido.',
                    token,
                    userId: user.id
                });
            }
        );
    } catch (error) {
        console.error('Erro detalhado no login.js:', error); // Log mais específico
        res.status(500).json({ message: 'Erro interno do servidor ao fazer login.', errorDetails: error.message });
    }
};