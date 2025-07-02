// src/routes/api_helpers/scrape-gemini.js - VERSÃO FORMATADA E CORRIGIDA

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { HarmBlockThreshold, HarmCategory } = require("@google/generative-ai");
const fetch = require('node-fetch');

console.log("[scrape-gemini.js V-Final-Corrigido] Módulo sendo carregado...");

const generationConfig = {
    temperature: 0.3,
    responseMimeType: "application/json",
};

let genAI; // 1. Declare a variável do cliente, mas não a inicialize.

/**
 * Inicializa e retorna o cliente do Gemini, garantindo que seja criado apenas uma vez.
 * Esta é uma prática de "lazy initialization" e "singleton" para ambientes serverless.
 * @returns {{model: import("@google/generative-ai").GenerativeModel}}
 */
function getClientAndModel() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Este erro será muito mais claro nos logs da Vercel.
      throw new Error("A variável de ambiente GEMINI_API_KEY não está definida no ambiente de produção.");
    }
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('[scrape-gemini.js] Cliente Gemini inicializado com sucesso.');
  }
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", // Usando o modelo mais recente e eficiente
    safetySettings: [ // Adicionando configurações de segurança para evitar bloqueios desnecessários
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  });
  return { model };
}

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
    const { model } = getClientAndModel(); // 2. Obtém o modelo aqui
    
    const response = await fetch(productUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36' }
    });
    if (!response.ok) {
        throw new Error(`Acesso bloqueado ao buscar HTML. Status: ${response.status}`);
    }
    const htmlContent = await response.text();

    const prompt = 'Analise o HTML a seguir para extrair os detalhes de um produto.' +
        ' Retorne um objeto JSON com: "name", "price", "image", "brand", "category", "description". Priorize a extração de dados do HTML em vez de inferências.' +
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
    const { model } = getClientAndModel(); // 2. Obtém o modelo aqui também

    const prompt = 'Use sua ferramenta de busca para encontrar os detalhes do produto na URL: "' + productUrl + '".' +
        ' Retorne um objeto JSON com: "name", "price", "image", "brand", "category", "description". Priorize a precisão dos dados encontrados na busca.' +
        ' Para "image", extraia a URL da imagem principal do produto *diretamente do conteúdo da página*. A imagem deve ser uma URL pública e acessível, não um placeholder ou de um banco de imagens interno.' +
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