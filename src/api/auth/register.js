// src/api/auth/register.js

// Garante que as variáveis de ambiente sejam carregadas.
// É uma boa prática tê-lo em cada arquivo que acessa process.env diretamente.
require('dotenv').config(); 

const { connectToDatabase } = require('../../database'); // Caminho: de 'api/auth' para 'src/database'
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
    // Para o endpoint de registro, esperamos apenas requisições POST.
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido. Utilize POST para registrar.' });
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection('users'); // Coleção onde os usuários serão armazenados

    const { username, password } = req.body;

    // Validação básica de entrada
    if (!username || !password) {
        return res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios.' });
    }

    try {
        // Verifica se o usuário já existe no banco de dados
        const existingUser = await usersCollection.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: 'Usuário já existe.' });
        }

        // Criptografa a senha antes de salvar no banco de dados
        const hashedPassword = await bcrypt.hash(password, 10); // '10' é o custo do salt, um bom padrão

        // Insere o novo usuário na coleção
        const result = await usersCollection.insertOne({ username, password: hashedPassword });

        // Retorna uma resposta de sucesso
        res.status(201).json({ 
            message: 'Usuário registrado com sucesso!', 
            userId: result.insertedId // Opcional: retorna o ID gerado pelo MongoDB
        });

    } catch (error) {
        // Captura e loga quaisquer erros durante o processo de registro
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao registrar usuário.', error: error.message });
    }
};