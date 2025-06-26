// src/routes/api_helpers/scrape-gemini.js - VERSÃO FINAL

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY não configurada.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Modelo com a ferramenta de busca habilitada
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest",
});

// Nova configuração de geração, pedindo JSON
const generationConfig = {
    temperature: 0.2,
    responseMimeType: "application/json", // <<-- CORRIGIDO AQUI
};

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

async function scrapeProductDetails(productUrl) {
    console.log(`[scrape-gemini V3] Iniciando extração para a URL: ${productUrl}`);

    if (!productUrl || !productUrl.startsWith('http')) {
        throw new Error("URL do produto inválida ou não fornecida.");
    }
    
    // Prompt atualizado, mais direto
    const prompt = `
        Analise o conteúdo da página web na seguinte URL: "${productUrl}".
        Extraia as seguintes informações do produto e retorne um objeto JSON com estas chaves: "name", "price", "image", "brand", "category", "description".
        - "price" deve ser um número.
        - Para a "category", use uma destas: Eletrônicos, Roupas e Acessórios, Casa e Decoração, Livros e Mídia, Esportes e Lazer, Ferramentas e Construção, Alimentos e Bebidas, Saúde e Beleza, Automotivo, Pet Shop, Outros.
        Se não conseguir encontrar a URL ou os detalhes, retorne um JSON com "error": "Produto não encontrado".
    `;

    try {
        const chat = model.startChat({
            generationConfig,
            safetySettings,
            // A ferramenta de busca é implicitamente usada pela IA quando necessário
        });

        const result = await chat.sendMessage(prompt);
        const response = result.response;
        const responseText = response.text();
        
        console.log("[scrape-gemini V3] Resposta da IA:", responseText);

        const jsonData = JSON.parse(responseText);

        if (jsonData.error || !jsonData.name || !jsonData.price) {
            throw new Error(jsonData.error || "IA não conseguiu extrair nome ou preço.");
        }
        
        jsonData.urlOrigin = productUrl;
        return jsonData;

    } catch (error) {
        console.error(`[scrape-gemini V3] Erro ao extrair detalhes: ${error.message}`);
        throw error;
    }
}

module.exports = { scrapeProductDetails };