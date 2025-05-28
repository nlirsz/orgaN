const mongoose = require('mongoose');
require('dotenv').config();

let connectionInstance = null; // Para reutilizar a promessa de conexão

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        console.log('MongoDB já está conectado (readyState 1).');
        return mongoose.connection.asPromise(); // Retorna a promessa da conexão existente
    }
    if (mongoose.connection.readyState === 2) { // 2 = connecting
        console.log('MongoDB já está no processo de conexão (readyState 2)...');
        return mongoose.connection.asPromise(); // Aguarda a conexão em progresso
    }

    // Se não houver uma promessa de conexão ativa, cria uma nova.
    // Isso ajuda a evitar múltiplas tentativas de conexão simultâneas em ambientes serverless.
    if (!connectionInstance) {
        console.log('Nenhuma promessa de conexão ativa, criando uma nova.');
        connectionInstance = mongoose.connect(process.env.MONGODB_URI)
            .then(conn => {
                console.log('MongoDB Conectado com Sucesso!');
                // Uma vez conectado, podemos limpar a promessa para futuras chamadas,
                // ou deixar que o readyState gerencie isso. Para serverless,
                // manter a promessa resolvida pode ser útil para reuso rápido.
                // No entanto, readyState é mais canônico.
                return conn; // Retorna a instância de conexão do mongoose
            })
            .catch(err => {
                console.error('ERRO CRÍTICO ao conectar ao MongoDB em connectDB:', err.message);
                console.error('Stack do erro em connectDB:', err.stack);
                connectionInstance = null; // Limpa a promessa em caso de falha para permitir nova tentativa
                throw err; // Re-lança o erro
            });
    } else {
        console.log('Reutilizando promessa de conexão existente.');
    }
    return connectionInstance;
};

module.exports = connectDB;