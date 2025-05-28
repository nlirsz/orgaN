// src/api/auth/login.js

require('dotenv').config(); //
const User = require('../../models/User'); //
const jwt = require('jsonwebtoken'); //

const JWT_SECRET = process.env.JWT_SECRET; //
if (!JWT_SECRET) { //
    console.error("ERRO: JWT_SECRET não definida nas variáveis de ambiente! O login não funcionará."); //
}

module.exports = async (req, res) => { //
    if (req.method !== 'POST') { //
        return res.status(405).json({ message: 'Método não permitido.' }); //
    }

    const { username, password } = req.body; //

    if (!username || !password) { //
        return res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios.' }); //
    }

    try {
        // AQUI é onde o erro de timeout ocorre
        const user = await User.findOne({ username }); //
        if (!user) { //
            return res.status(401).json({ message: 'Credenciais inválidas.' }); //
        }
        const passwordMatch = await user.comparePassword(password); //
        if (!passwordMatch) { //
            return res.status(401).json({ message: 'Credenciais inválidas.' }); //
        }
        const payload = { user: { userId: user.id } }; //
        jwt.sign( //
            payload, //
            JWT_SECRET, //
            { expiresIn: '1h' }, //
            (err, token) => { //
                if (err) throw err; //
                res.status(200).json({ //
                    message: 'Login bem-sucedido.', //
                    token, //
                    userId: user.id //
                });
            }
        );
    } catch (error) {
        console.error('Erro detalhado no login.js:', error); //
        res.status(500).json({ message: 'Erro interno do servidor ao fazer login.', errorDetails: error.message }); //
    }
};