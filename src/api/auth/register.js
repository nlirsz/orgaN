// src/api/auth/register.js

require('dotenv').config();
const User = require('../../models/User'); // Importa o modelo de usuário
const jwt = require('jsonwebtoken'); // Para gerar token após o registro

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido. Utilize POST para registrar.' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios.' });
    }

    try {
        // Verifica se o usuário já existe
        let user = await User.findOne({ username });
        if (user) {
            return res.status(409).json({ message: 'Usuário já existe.' });
        }

        // Cria um novo usuário (o middleware 'pre' do User.js fará o hash da senha)
        user = new User({ username, password });
        await user.save();

        // Gera um token JWT para o novo usuário
        const payload = {
            user: {
                userId: user.id // MongoDB _id é acessível via .id no Mongoose
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({
                    message: 'Usuário registrado com sucesso!',
                    token,
                    userId: user.id // Retorna o userId para o frontend
                });
            }
        );

    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        // Erro de validação do Mongoose, por exemplo, minlength
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: 'Erro de validação:', details: messages });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao registrar usuário.', error: error.message });
    }
};