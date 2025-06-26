// src/routes/api_helpers/scrape-gemini.js - VERSÃO FINAL ATUALIZADA

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const fetch = require('node-fetch');

console.log("[scrape-gemini.js V-Final] Módulo sendo carregado...");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("***************************************************************************");
    console.error("[scrape-gemini.js] ERRO FATAL: GEMINI_API_KEY não está definida!");
    console.error("***************************************************************************");
    throw new Error("GEMINI_API_KEY não configurada. O serviço de scraping não pode iniciar.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash", // Usando o modelo mais novo
});

// Configuração de geração pedindo JSON, o que é mais robusto
const generationConfig = {
    temperature: 0.4,
    responseMimeType: "application/json",
};

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];


// ===================================================================================
// MÉTODO 1: ANÁLISE DE HTML (SEU PROMPT PREFERIDO)
// ===================================================================================
async function scrapeByAnalyzingHtml(productUrl) {
    console.log(`[Gemini HTML Mode] Iniciando para: ${productUrl}`);
    
    let htmlContent = '';
    try {
        const response = await fetch(productUrl, {
             headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36' }
        });
        if (!response.ok) {
            throw new Error(`Acesso ao site bloqueado ou falhou. Status: ${response.status}`);
        }
        htmlContent = await response.text();
    } catch (fetchError) {
        console.error(`[Gemini HTML Mode] Falha ao buscar HTML: ${fetchError.message}`);
        throw fetchError; // Lança o erro para que a rota em products.js tente o próximo método
    }

    // Usando o seu prompt detalhado
    const prompt = `Analise o HTML a seguir para extrair os detalhes de um produto.
        Retorne um objeto JSON com as seguintes propriedades:
        - name (string): Nome completo do produto.
        - price (number): Preço do produto. Use ponto como separador decimal.
        - image (string, opcional): URL da imagem principal do produto.
        - brand (string, opcional): Marca do produto.
        - category (string, opcional): Categorize o produto em uma das seguintes opções: Eletrônicos, Roupas e Acessórios, Casa e Decoração, Livros e Mídia, Esportes e Lazer, Ferramentas e Construção, Alimentos e Bebidas, Saúde e Beleza, Automotivo, Pet Shop, Outros.
        - description (string, opcional): Uma breve descrição do produto (máximo 200 caracteres).
        Se não encontrar alguma informação, omita a propriedade ou defina-a como null.
        Conteúdo HTML:
        ${htmlContent.substring(0, 250000)}`;

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig,
            safetySettings,
        });
        const responseText = result.response.text();
        return JSON.parse(responseText);
    } catch(e) {
        console.error("[Gemini HTML Mode] Erro ao analisar HTML com IA:", e);
        throw e;
    }
}


// ===================================================================================
// MÉTODO 2: BUSCA COM IA (PLANO B PARA SITES BLOQUEADOS)
// ===================================================================================
async function scrapeBySearching(productUrl) {
    console.log(`[Gemini Search Mode] Iniciando para: ${productUrl}`);

    const prompt = `Use sua ferramenta de busca para encontrar os detalhes do produto na URL: "${productUrl}". Retorne um objeto JSON com: "name", "price", "image", "brand", "category", "description". Para "image", encontre uma URL de imagem pública e de alta resolução.`;
    
    try {
         const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig,
            safetySettings,
        });
        const responseText = result.response.text();
        return JSON.parse(responseText);
    } catch(e) {
        console.error("[Gemini Search Mode] Erro ao buscar com IA:", e);
        throw e;
    }
}

// Exporta as duas funções para serem usadas no products.js
module.exports = { 
    scrapeByAnalyzingHtml,
    scrapeBySearching 
};