// src/routes/api_helpers/scrape-gemini.js - VERSÃO FORMATADA E CORRIGIDA

const { GoogleGenerativeAI } = require("@google/generative-ai");
const fetch = require('node-fetch');

console.log("[scrape-gemini.js V-Final-Corrigido] Módulo sendo carregado...");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY não está definida!");

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const generationConfig = {
    temperature: 0.3,
    responseMimeType: "application/json",
};

function normalizePrice(price) {
    if (typeof price === 'number') return price;
    if (typeof price !== 'string') return null;
    const priceStr = price.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
    const priceNum = parseFloat(priceStr);
    return isNaN(priceNum) ? null : priceNum;
}

// --- MÉTODO 1: Analisa o HTML diretamente ---
async function scrapeByAnalyzingHtml(productUrl) {
    console.log(`[Gemini HTML Mode] Iniciando para: ${productUrl}`);
    
    const response = await fetch(productUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36' }
    });
    if (!response.ok) {
        throw new Error(`Acesso bloqueado ao buscar HTML. Status: ${response.status}`);
    }
    const htmlContent = await response.text();

    const prompt = 'Analise o HTML a seguir para extrair os detalhes de um produto.' +
        ' Retorne um objeto JSON com: "name", "price", "image", "brand", "category", "description".' +
        ' - Para "image", priorize a URL na meta tag \'og:image\'.' +
        ' - "price" deve ser um número ou um texto que inclua o valor numérico.' +
        ' - Categoria: Eletrônicos, Roupas e Acessórios, Casa e Decoração, Livros e Mídia, Esportes e Lazer, Ferramentas e Construção, Alimentos e Bebidas, Saúde e Beleza, Automotivo, Pet Shop, Outros.' +
        ' HTML: ```html\n' + htmlContent.substring(0, 250000) + '\n```';
    
    const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig });
    let jsonData = JSON.parse(result.response.text());
    
    if (jsonData && jsonData.price) {
        jsonData.price = normalizePrice(jsonData.price);
    }
    
    return jsonData;
}

// --- MÉTODO 2: Usa a busca interna da IA ---
async function scrapeBySearching(productUrl) {
    console.log(`[Gemini Search Mode] Iniciando para: ${productUrl}`);

    const prompt = 'Use sua ferramenta de busca para encontrar os detalhes do produto na URL: "' + productUrl + '".' +
        ' Retorne um objeto JSON com: "name", "price", "image", "brand", "category", "description".' +
        ' Para "image", encontre uma URL de imagem pública e de alta resolução.' +
        ' "price" deve ser um número ou um texto que inclua o valor numérico.';
    
    const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig });
    let jsonData = JSON.parse(result.response.text());

    if (jsonData && jsonData.price) {
        jsonData.price = normalizePrice(jsonData.price);
    }

    return jsonData;
}

module.exports = { 
    scrapeByAnalyzingHtml,
    scrapeBySearching 
};