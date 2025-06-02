const mongoose = require('mongoose');
require('dotenv').config();

let connectionInstance = null;

const connectDB = async () => {
    console.log('[database.js] connectDB chamado.');
    console.log('[database.js] Estado atual mongoose.connection.readyState:', mongoose.connection.readyState, '(' + (mongoose.ConnectionStates[mongoose.connection.readyState] || 'Desconhecido') + ')');
    console.log('[database.js] Valor de connectionInstance no início:', connectionInstance ? 'Existe (promessa pendente ou resolvida)' : 'Nulo');

    const currentReadyState = mongoose.connection.readyState;
    const stateDescription = mongoose.ConnectionStates[currentReadyState] || 'Desconhecido';

    if (currentReadyState === 1) { // 1: connected
        console.log(`[database.js] MongoDB já está conectado (readyState 1 - ${stateDescription}). Reutilizando conexão.`);
        return mongoose.connection.asPromise();
    }
    if (currentReadyState === 2) { // 2: connecting
        console.log(`[database.js] MongoDB já está no processo de conexão (readyState 2 - ${stateDescription}). Aguardando conexão existente.`);
        return connectionInstance || mongoose.connection.asPromise(); // Retorna a promessa existente se houver
    }

    if (!connectionInstance) {
        console.log(`[database.js] Nenhuma promessa de conexão ativa ou estado não conectado (readyState ${currentReadyState} - ${stateDescription}), criando uma nova.`);
        
        const MONGODB_URI_FROM_ENV = process.env.MONGODB_URI;
        if (!MONGODB_URI_FROM_ENV) {
            console.error('[database.js] ERRO CRÍTICO: MONGODB_URI não está definida nas variáveis de ambiente!');
            throw new Error('MONGODB_URI não está definida.');
        }
        
            console.log('[database.js] Tentando conectar com MONGODB_URI: **** (oculto por segurança)');
        
        const connectionOptions = {
            connectTimeoutMS: 10000,
            serverSelectionTimeoutMS: 45000,
            bufferTimeoutMS: 45000,
            // As opções useNewUrlParser, useUnifiedTopology, useCreateIndex, useFindAndModify
            // não são mais necessárias no Mongoose 6+ e podem causar erros se usadas.
        };
        console.log('[database.js] Tentando conectar com timeouts:', connectionOptions);

        connectionInstance = mongoose.connect(MONGODB_URI_FROM_ENV, connectionOptions)
        .then(conn => {
            console.log(`[database.js] MongoDB Conectado com Sucesso! DB Name: ${conn.connection.name}, Host: ${conn.connection.host}, Port: ${conn.connection.port}, ReadyState: ${conn.connection.readyState}`);
            return conn; // Retorna a instância de conexão do mongoose
        })
        .catch(err => {
            console.error('[database.js] ERRO CRÍTICO ao conectar ao MongoDB em connectDB:', err.name, '-', err.message);
            // console.error('[database.js] Stack do erro em connectDB:', err.stack); // Descomente para mais detalhes do stack
            connectionInstance = null; // Limpa a promessa em caso de falha para permitir nova tentativa
            console.log('[database.js] connectionInstance resetada para null devido a erro na conexão.');
            throw err; // Re-lança o erro para ser pego pelo chamador
        });
    } else {
        console.log(`[database.js] Reutilizando promessa de conexão existente (readyState atual: ${currentReadyState} - ${stateDescription}).`);
    }
    return connectionInstance;
};

module.exports = connectDB;