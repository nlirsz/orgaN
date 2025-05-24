// Arquivo: test-vertex.js

require('dotenv').config();
const { VertexAI } = require('@google-cloud/vertexai');

// Função de teste auto-executável
async function runTest() {
    console.log('-------------------------------------------');
    console.log('Iniciando teste de conexão com Vertex AI...');
    console.log(`Usando Projeto ID: ${process.env.GOOGLE_CLOUD_PROJECT_ID}`);
    console.log('-------------------------------------------');

    try {
        // 1. Inicializa o cliente, como no nosso código
        const vertex_ai = new VertexAI({
            project: process.env.GOOGLE_CLOUD_PROJECT_ID,
            location: 'us-central1', // A região que estamos tentando usar
        });

        // 2. Tenta pegar o modelo mais básico
        const model = vertex_ai.getGenerativeModel({ model: 'gemini-pro' });

        console.log('Modelo instanciado com sucesso. Enviando um prompt simples...');
        
        // 3. Envia a requisição mais simples possível
        const result = await model.generateContent("Diga apenas 'Olá, Mundo!'");
        const response = await result.response;
        const text = response.text();

        console.log('\n✅ SUCESSO! Conexão com Vertex AI funcionou!');
        console.log('Resposta do Gemini:', text);

    } catch (error) {
        console.error('\n❌ FALHA NO TESTE ❌');
        console.error('Este erro confirma que o problema é de configuração ou permissão no Google Cloud, e não na lógica do nosso aplicativo.');
        console.error('Detalhes do Erro:', error.message);
    }
}

// Executa o teste
runTest();