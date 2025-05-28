const mongoose = require('mongoose');
require('dotenv').config();

let connectionInstance = null;

const connectDB = async () => {
    const currentReadyState = mongoose.connection.readyState;
    const stateDescription = mongoose.ConnectionStates[currentReadyState] || 'Desconhecido';

    if (currentReadyState === 1) { // 1: connected
        console.log(`MongoDB já está conectado (readyState 1 - ${stateDescription}). Reutilizando conexão.`);
        return mongoose.connection.asPromise();
    }
    if (currentReadyState === 2) { // 2: connecting
        console.log(`MongoDB já está no processo de conexão (readyState 2 - ${stateDescription}). Aguardando conexão existente.`);
        return connectionInstance || mongoose.connection.asPromise(); // Retorna a promessa existente se houver
    }

    if (!connectionInstance) {
        console.log(`Nenhuma promessa de conexão ativa ou estado não conectado (readyState ${currentReadyState} - ${stateDescription}), criando uma nova.`);
        
        const MONGODB_URI_FROM_ENV = process.env.MONGODB_URI;
        if (!MONGODB_URI_FROM_ENV) {
            console.error('ERRO CRÍTICO: MONGODB_URI não está definida nas variáveis de ambiente!');
            throw new Error('MONGODB_URI não está definida.');
        }
        
        console.log('Tentando conectar com MONGODB_URI:', MONGODB_URI_FROM_ENV.substring(0, MONGODB_URI_FROM_ENV.indexOf('@') > 0 ? MONGODB_URI_FROM_ENV.indexOf('@') : 30) + '...'); // Log ofuscado

        connectionInstance = mongoose.connect(MONGODB_URI_FROM_ENV, {
          serverSelectionTimeoutMS: 45000, // Aumentado para 45s
          bufferTimeoutMS: 45000,          // Aumentado para 45s
          // As opções useNewUrlParser, useUnifiedTopology, useCreateIndex, useFindAndModify
          // não são mais necessárias no Mongoose 6+ e podem causar erros se usadas.
        })
        .then(conn => {
            console.log(`MongoDB Conectado com Sucesso! DB Name: ${conn.connection.name}, ReadyState: ${conn.connection.readyState}`);
            return conn; // Retorna a instância de conexão do mongoose
        })
        .catch(err => {
            console.error('ERRO CRÍTICO ao conectar ao MongoDB em connectDB:', err.message);
            // console.error('Stack do erro em connectDB:', err.stack); // Descomente para mais detalhes do stack
            connectionInstance = null; // Limpa a promessa em caso de falha para permitir nova tentativa
            throw err; // Re-lança o erro para ser pego pelo chamador
        });
    } else {
        console.log(`Reutilizando promessa de conexão existente (readyState atual: ${currentReadyState} - ${stateDescription}).`);
    }
    return connectionInstance;
};

module.exports = connectDB;