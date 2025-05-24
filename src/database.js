// Arquivo: src/database.js

const mongoose = require('mongoose');
require('dotenv').config(); // Garante que as variáveis de ambiente sejam carregadas

const connectDB = async () => {
    try {
        // Usa a variável de ambiente MONGODB_URI para conectar
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado ao MongoDB Atlas!');
    } catch (err) {
        console.error('Erro ao conectar ao MongoDB:', err.message);
        // Encerra o processo com falha se não conseguir conectar ao banco
        process.exit(1);
    }
};

// A LINHA MAIS IMPORTANTE: Exporta a função para que ela possa ser usada em outros arquivos
module.exports = connectDB;