// src/api/test-db.js

// NÃO é necessário colocar require('dotenv').config(); aqui também.
// Isso porque 'src/database.js' já fará isso quando for importado e carregado.
// Se você mantiver aqui, não causará um problema grave, mas é redundante e pode ser removido para um código mais limpo.
// require('dotenv').config(); // <-- REMOVA OU MANTENHA COMENTADO ESTA LINHA PARA MAIOR CLAREZA

// Importa a função de conexão com o banco de dados do módulo database.js.
// O caminho '../../src/database' é correto porque test-db.js está em 'src/api' e database.js está em 'src'.
//
const { connectToDatabase } = require('../../src/database.js'); 

/**
 * Função principal para a Vercel Function test-db.
 * Responde a requisições GET para verificar a conexão com o MongoDB.
 * @param {Object} req O objeto de requisição HTTP.
 * @param {Object} res O objeto de resposta HTTP.
 */
module.exports = async (req, res) => {
    // Verifica se o método da requisição não é GET. Se não for, retorna um erro 405 (Method Not Allowed).
    if (req.method !== 'GET') {
        return res.status(405).json({
            message: 'Method Not Allowed',
            error: 'Somente requisições GET são permitidas para este endpoint de teste.'
        });
    }

    try {
        // Tenta conectar ao banco de dados usando a função importada de database.js.
        const db = await connectToDatabase();

        // Se a conexão for bem-sucedida, retorna um status 200 (OK) com uma mensagem de sucesso
        // e o nome do banco de dados conectado.
        res.status(200).json({
            message: 'Conexão MongoDB OK!',
            dbName: db.databaseName, // Retorna o nome do banco de dados ao qual você se conectou
        });

    } catch (error) {
        // Se ocorrer um erro durante a conexão, captura e retorna um status 500 (Erro Interno do Servidor).
        // `error.message` é útil para depurar o problema (ex: "MONGODB_URI não definida").
        console.error('Erro detalhado na conexão MongoDB (API):', error);
        res.status(500).json({
            message: 'Erro na conexão MongoDB',
            error: error.message,
            tip: 'Verifique se MONGODB_URI está configurada corretamente no seu arquivo .env local e nas variáveis de ambiente da Vercel.'
        });
    }
};