// src/api/auth/register.js

require('dotenv').config(); //
const User = require('../../models/User'); //
const jwt = require('jsonwebtoken'); //

module.exports = async (req, res) => { //
    if (req.method !== 'POST') { //
        return res.status(405).json({ message: 'Método não permitido.' }); //
    }

    const { username, password } = req.body; //

    if (!username || !password) { //
        return res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios.' }); //
    }

    try {
        let user = await User.findOne({ username }); //
        if (user) { //
            return res.status(409).json({ message: 'Usuário já existe.' }); //
        }
        user = new User({ username, password }); //
        await user.save(); //
        const payload = { user: { userId: user.id } }; //
        jwt.sign( //
            payload, //
            process.env.JWT_SECRET, //
            { expiresIn: '1h' }, //
            (err, token) => { //
                if (err) throw err; //
                res.status(201).json({ //
                    message: 'Usuário registrado com sucesso!', //
                    token, //
                    userId: user.id //
                });
            }
        );
    } catch (error) {
        console.error('Erro detalhado no register.js:', error); //
        if (error.name === 'ValidationError') { //
            const messages = Object.values(error.errors).map(val => val.message); //
            return res.status(400).json({ message: 'Erro de validação:', details: messages }); //
        }
        res.status(500).json({ message: 'Erro interno do servidor ao registrar usuário.', errorDetails: error.message }); //
    }
};