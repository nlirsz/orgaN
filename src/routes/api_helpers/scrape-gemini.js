// src/routes/api_helpers/scrape-gemini.js - VERSÃO FINAL E DEFINITIVA

const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY não configurada.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

async function scrapeProductDetails(productUrl) {
    console.log(`[scrape-gemini V5] Iniciando extração para a URL: ${productUrl}`);

    if (!productUrl || !productUrl.startsWith('http')) {
        throw new Error("URL do produto inválida ou não fornecida.");
    }
    
    const prompt = `
        Analise o conteúdo da página web na URL "${productUrl}" para extrair os detalhes de um produto.
        Retorne um objeto JSON com as seguintes chaves: "name", "price", "image", "brand", "category", "description".

        INSTRUÇÕES IMPORTANTES:
        1. Para a chave "image", procure especificamente pela URL contida na meta tag 'og:image' ou 'twitter:image'. Esta é a fonte mais confiável para a imagem principal.
        2. "price" deve ser um número (float).
        3. Para a "category", use uma destas: Eletrônicos, Roupas e Acessórios, Casa e Decoração, Livros e Mídia, Esportes e Lazer, Ferramentas e Construção, Alimentos e Bebidas, Saúde e Beleza, Automotivo, Pet Shop, Outros.

        Se não conseguir encontrar os detalhes essenciais, retorne um JSON com a chave "error".
    `;

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
        });
        
        const responseText = result.response.text();
        const jsonData = JSON.parse(responseText);

        console.log("[scrape-gemini V5] JSON recebido:", jsonData);

        if (jsonData.error || !jsonData.name || !jsonData.price) {
            throw new Error(jsonData.error || "IA não conseguiu extrair nome ou preço.");
        }
        
        jsonData.urlOrigin = productUrl;
        return jsonData;

    } catch (error) {
        console.error(`[scrape-gemini V5] Erro ao extrair detalhes: ${error.message}`);
        throw error;
    }
}

module.exports = { scrapeProductDetails };