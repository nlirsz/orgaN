// src/routes/api_helpers/scrape-gemini.js - VERSÃO COMPLETA E CORRIGIDA

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

// A importação do 'node-fetch' não é mais necessária, pois não vamos mais buscar o HTML manualmente.
// const fetch = require('node-fetch'); 

console.log("[scrape-gemini.js V2] Módulo sendo carregado...");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("***************************************************************************");
    console.error("[scrape-gemini.js] ERRO FATAL: GEMINI_API_KEY não está definida!");
    console.error("Configure a variável de ambiente GEMINI_API_KEY para o backend funcionar.");
    console.error("***************************************************************************");
    throw new Error("GEMINI_API_KEY não configurada. O serviço de scraping não pode iniciar.");
}

let genAI;
let model;

try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // *** ATUALIZAÇÃO IMPORTANTE AQUI ***
    // Habilitamos a ferramenta de busca e definimos o modelo.
    model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest",
        tools: { "googleSearch": {} } // Habilita a busca interna da IA
    });
    console.log("[scrape-gemini.js V2] API Gemini inicializada com a ferramenta de busca.");
} catch (initError) {
    console.error("[scrape-gemini.js V2] Erro ao inicializar a API Gemini:", initError);
    throw new Error(`Falha ao inicializar o modelo Gemini: ${initError.message}`);
}

// Configurações de segurança que você já tinha (mantidas)
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// *** NOVA FUNÇÃO `scrapeProductDetails` ***
// Esta função substitui toda a sua lógica antiga de buscar HTML e analisar.
async function scrapeProductDetails(productUrl) {
    console.log(`[scrape-gemini V2] Iniciando extração para a URL: ${productUrl}`);

    if (!model) {
        throw new Error("Modelo Gemini não inicializado.");
    }
    if (!productUrl || !productUrl.startsWith('http')) {
        throw new Error("URL do produto inválida ou não fornecida.");
    }
    
    // O novo prompt é muito mais simples. Ele diz à IA para usar a busca.
    const prompt = `
        Usando sua ferramenta de busca, encontre os detalhes do produto na seguinte URL: "${productUrl}".
        Extraia as seguintes informações:
        - name (string): O nome completo e exato do produto.
        - price (number): O preço principal do produto, como um número com ponto decimal.
        - image (string, opcional): A URL da imagem principal do produto.
        - brand (string, opcional): A marca do produto. Se não encontrar, use o nome do site (ex: "Zara", "Nike").
        - category (string, opcional): Categorize o produto em uma das seguintes opções: Eletrônicos, Roupas e Acessórios, Casa e Decoração, Livros e Mídia, Esportes e Lazer, Ferramentas e Construção, Alimentos e Bebidas, Saúde e Beleza, Automotivo, Pet Shop, Outros.
        - description (string, opcional): Uma breve descrição do produto (máximo de 200 caracteres).

        Retorne a resposta EXCLUSIVAMENTE como um objeto JSON. Se não conseguir encontrar a URL ou os detalhes, retorne um JSON com "error": "Produto não encontrado".
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const responseText = response.text();

        // Extrai o JSON da resposta, que pode vir dentro de ```json ... ```
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
        if (!jsonMatch) {
            throw new Error("Formato de resposta da IA inesperado. JSON não encontrado.");
        }
        
        const jsonData = JSON.parse(jsonMatch[1] || jsonMatch[2]);
        console.log("[scrape-gemini V2] JSON recebido:", jsonData);

        if (jsonData.error || !jsonData.name || !jsonData.price) {
            throw new Error(jsonData.error || "IA não conseguiu extrair nome ou preço.");
        }
        
        jsonData.urlOrigin = productUrl; // Garante que a URL original seja mantida
        return jsonData;

    } catch (error) {
        console.error(`[scrape-gemini V2] Erro ao extrair detalhes: ${error.message}`);
        // Re-lança o erro para que a lógica de fallback em products.js possa pegá-lo
        throw error;
    }
}

module.exports = {
    scrapeProductDetails
};