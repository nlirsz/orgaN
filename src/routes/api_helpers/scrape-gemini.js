// src/routes/api_helpers/scrape-gemini.js - VERSÃO CORRIGIDA FINAL

const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY não configurada.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

async function scrapeProductDetails(productUrl) {
    console.log(`[scrape-gemini V4] Iniciando extração para a URL: ${productUrl}`);

    if (!productUrl || !productUrl.startsWith('http')) {
        throw new Error("URL do produto inválida ou não fornecida.");
    }
    
    // Usando um prompt que instrui a IA a analisar o conteúdo da página,
    // o que a incentiva a usar suas ferramentas internas de busca de forma mais eficaz.
    const prompt = `
        Analise o conteúdo da página web na URL "${productUrl}" para extrair os detalhes de um produto.
        Retorne um objeto JSON com as seguintes propriedades:
        - name (string): Nome completo do produto.
        - price (number): Preço do produto. Use ponto como separador decimal.
        - image (string, opcional): A URL da imagem principal do produto. Procure por tags como 'og:image'.
        - brand (string, opcional): A marca do produto.
        - category (string, opcional): Categorize o produto em uma destas opções: Eletrônicos, Roupas e Acessórios, Casa e Decoração, Livros e Mídia, Esportes e Lazer, Ferramentas e Construção, Alimentos e Bebidas, Saúde e Beleza, Automotivo, Pet Shop, Outros.
        - description (string, opcional): Uma breve descrição do produto.

        Se não conseguir encontrar os detalhes essenciais, retorne um JSON com "error": "Produto não encontrado".
    `;

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
        });
        
        const responseText = result.response.text();
        const jsonData = JSON.parse(responseText);

        console.log("[scrape-gemini V4] JSON recebido:", jsonData);

        if (jsonData.error || !jsonData.name || !jsonData.price) {
            throw new Error(jsonData.error || "IA não conseguiu extrair nome ou preço.");
        }
        
        jsonData.urlOrigin = productUrl;
        return jsonData;

    } catch (error) {
        console.error(`[scrape-gemini V4] Erro ao extrair detalhes: ${error.message}`);
        throw error;
    }
}

module.exports = { scrapeProductDetails };