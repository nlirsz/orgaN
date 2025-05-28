// src/config/db.js
const mongoose = require('mongoose');
// const dotenv = new require('dotenv') // dotenv.config() já é chamado no api/index.js, pode remover daqui
// dotenv.config() // Remova ou comente esta linha se já estiver no api/index.js

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('Erro Crítico: MONGO_URI não está definida nas variáveis de ambiente.');
      // Não chame process.exit(1) aqui para ver logs na Vercel
      // Você pode querer lançar um erro ou retornar para indicar falha
      throw new Error('MONGO_URI não definida.'); 
    }
    // Loga a URI ofuscando a senha para depuração.
    // Cuidado para não logar a URI completa com senha em produção se os logs forem públicos.
    const mongoUriToLog = process.env.MONGO_URI.replace(/:([^:@\n]+)@/, ':*****@');
    console.log('Tentando conectar ao MongoDB com URI (senha ofuscada):', mongoUriToLog);
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Conectado...');
  } catch (err) {
    console.error('Erro DETALHADO ao conectar ao MongoDB:', err); // Logar o objeto de erro inteiro
    // console.error('Stack do erro de conexão:', err.stack); // Adiciona o stack trace
    // console.error('Mensagem do erro de conexão:', err.message); // Redundante se logar o erro inteiro
    
    // Não chame process.exit(1) em ambientes serverless como Vercel.
    // Deixe a função falhar para que a Vercel possa lidar com isso e logar.
    // Você pode relançar o erro se quiser que a invocação da função falhe explicitamente.
    throw err; 
  }
};

module.exports = connectDB;