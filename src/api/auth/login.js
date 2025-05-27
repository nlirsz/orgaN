// src/api/auth/login.js

require('dotenv').config();
const User = require('../../../src/models/User'); // Importa o modelo de usuário
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("ERRO: JWT_SECRET não definida nas variáveis de ambiente! O login não funcionará.");
    // Em um ambiente de produção real, você poderia querer parar o processo ou notificar.
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido. Utilize POST para login.' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios.' });
    }

    try {
        // Procura o usuário no banco de dados
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // Compara a senha fornecida com a senha criptografada no banco de dados
        const passwordMatch = await user.comparePassword(password); // Usando o método do schema

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // Se as credenciais forem válidas, gera um token JWT
        const payload = {
            user: {
                userId: user.id // MongoDB _id é acessível via .id no Mongoose
            }
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' }, // Token expira em 1 hora
            (err, token) => {
                if (err) throw err;
                res.status(200).json({
                    message: 'Login bem-sucedido.',
                    token,
                    userId: user.id // Retorna o userId para o frontend
                });
            }
        );

    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao fazer login.', error: error.message });
    }
};