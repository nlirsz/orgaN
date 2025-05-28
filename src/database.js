// Arquivo: src/database.js

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    // Verifica se já existe uma conexão ativa ou conectando
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (mongoose.connection.readyState === 1) {
        console.log('MongoDB já está conectado.');
        return;
    }
    if (mongoose.connection.readyState === 2) {
        console.log('MongoDB já está conectando...');
        // Aguarda a conexão existente ser resolvida
        return mongoose.connection.asPromise();
    }

    try {
        console.log('Tentando conectar ao MongoDB Atlas...'); // Adicione este log
        await mongoose.connect(process.env.MONGODB_URI, {
            // Opções de conexão podem ser adicionadas aqui se necessário,
            // por exemplo, para aumentar timeouts, mas o padrão geralmente é bom.
            // serverSelectionTimeoutMS: 30000, // Exemplo: aumentar timeout de seleção de servidor
        });
        console.log('Conectado ao MongoDB Atlas!');
    } catch (err) {
        console.error('Erro CRÍTICO ao conectar ao MongoDB:', err.message);
        console.error('Detalhes do erro:', err); // Logar o erro completo
        // Em vez de process.exit(1), lance o erro para que a função serverless falhe e o Vercel registre.
        throw err;
    }
};

module.exports = connectDB;