// src/routes/api_helpers/scrape-gemini.js - VERSÃO FINAL COM DOIS MODOS

const { GoogleGenerativeAI } = require("@google/generative-ai");
const fetch = require('node-fetch');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY não configurada.");

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

const generationConfig = {
    temperature: 0.3,
    responseMimeType: "application/json",
};

// --- MÉTODO 1: Analisando o HTML diretamente (ótimo para imagens) ---
async function scrapeByAnalyzingHtml(productUrl) {
    console.log(`[Gemini HTML Mode] Iniciando para: ${productUrl}`);
    
    const response = await fetch(productUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36' }
    });

    if (!response.ok) {
        // Se o site bloquear o acesso, esta função vai falhar, acionando o próximo método.
        throw new Error(`Acesso bloqueado ou falha ao buscar HTML. Status: ${response.status}`);
    }
    const htmlContent = await response.text();

    const prompt = `
        Analise o HTML fornecido para extrair os detalhes de um produto.
        Retorne um objeto JSON com: "name", "price", "image", "brand", "category", "description".
        - Para "image", priorize a URL na meta tag 'og:image'.
        - "price" deve ser um número.
        - Para a "category", use uma destas: Eletrônicos, Roupas e Acessórios, Casa e Decoração, Livros e Mídia, Esportes e Lazer, Ferramentas e Construção, Alimentos e Bebidas, Saúde e Beleza, Automotivo, Pet Shop, Outros.
        HTML: \`\`\`html\n${htmlContent.substring(0, 150000)}\n\`\`\`
    `;
    
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
    });
    
    return JSON.parse(result.response.text());
}

// --- MÉTODO 2: Usando a busca interna da IA (ótimo para textos em sites protegidos) ---
async function scrapeBySearching(productUrl) {
    console.log(`[Gemini Search Mode] Iniciando para: ${productUrl}`);

    const prompt = `
        Use sua ferramenta de busca para encontrar os detalhes do produto na URL: "${productUrl}".
        Retorne um objeto JSON com: "name", "price", "image", "brand", "category", "description".
        - Para "image", encontre a URL da imagem principal.
        - "price" deve ser um número.
    `;
    
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
    });

    return JSON.parse(result.response.text());
}

module.exports = { 
    scrapeByAnalyzingHtml,
    scrapeBySearching 
};