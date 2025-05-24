// src/api/auth/login.js

// Garante que as variáveis de ambiente sejam carregadas.
// É uma boa prática tê-lo em cada arquivo que acessa process.env diretamente.
require('dotenv').config(); 

const { connectToDatabase } = require('../../../src/database'); // Caminho: de 'api/auth' para 'src/database'
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Obtém o JWT_SECRET no carregamento do módulo.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("ERRO: JWT_SECRET não definida nas variáveis de ambiente! O login não funcionará.");
    // Em um ambiente de produção real, você poderia querer parar o processo ou notificar.
}

module.exports = async (req, res) => {
    // Para o endpoint de login, esperamos apenas requisições POST.
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido. Utilize POST para login.' });
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection('users'); // Coleção onde os usuários estão armazenados

    const { username, password } = req.body;

    // Validação básica de entrada
    if (!username || !password) {
        return res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios.' });
    }

    try {
        // Procura o usuário no banco de dados
        const user = await usersCollection.findOne({ username });

        // Verifica se o usuário existe
        if (!user) {
            // É uma boa prática não especificar se é o usuário ou a senha que está errada por segurança
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // Compara a senha fornecida com a senha criptografada no banco de dados
        const passwordMatch = await bcrypt.compare(password, user.password);

        // Verifica se a senha corresponde
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // Se as credenciais forem válidas, gera um token JWT
        // Inclui _id e username no payload do token
        const token = jwt.sign(
            { userId: user._id, username: user.username }, 
            JWT_SECRET, 
            { expiresIn: '1h' } // Token expira em 1 hora
        );

        // Retorna uma resposta de sucesso com o token JWT
        res.status(200).json({ 
            message: 'Login bem-sucedido.', 
            token 
        });

    } catch (error) {
        // Captura e loga quaisquer erros durante o processo de login
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao fazer login.', error: error.message });
    }
};