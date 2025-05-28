// Arquivo: src/database.js
const mongoose = require('mongoose'); //
require('dotenv').config(); // Garante que as variáveis de ambiente sejam carregadas

const connectDB = async () => { //
    if (mongoose.connection.readyState === 1) {
        console.log('MongoDB já está conectado.');
        return;
    }
    if (mongoose.connection.readyState === 2) {
        console.log('MongoDB já está conectando...');
        return mongoose.connection.asPromise();
    }

    try {
        console.log('Tentando conectar ao MongoDB Atlas com URI:', process.env.MONGODB_URI ? 'URI Presente' : 'URI NÃO PRESENTE');
        await mongoose.connect(process.env.MONGODB_URI); //
        console.log('Conectado ao MongoDB Atlas!'); //
    } catch (err) {
        console.error('Erro CRÍTICO ao conectar ao MongoDB:', err.message); //
        console.error('Stack do erro:', err.stack);
        throw err; // Re-lança o erro para ser capturado pelo chamador (ensureDBConnection)
    }
};

module.exports = connectDB; //