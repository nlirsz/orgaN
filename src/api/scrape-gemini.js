// Arquivo: src/api/scrape-gemini.js - VERSÃO FINAL COM MODELO CORRETO

const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function extractProductDataFromUrl(url) {
    try {
        console.log(`[Etapa 1/2] Baixando HTML da URL: ${url}`);
        const { data: html } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });

        const bodyHtml = html.substring(html.indexOf('<body'), html.lastIndexOf('</body>') + 7);

        console.log('[Etapa 2/2] Enviando request para a API do Google AI...');
        
        // A ÚNICA ALTERAÇÃO ESTÁ AQUI: O nome do modelo
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
        
        const prompt = `
            Você é um assistente especialista em análise de e-commerce. Sua tarefa é analisar o código HTML de uma página de produto e extrair informações detalhadas de forma estruturada.
            Instruções:
            1. Para o campo "preco", normalize o valor para um NÚMERO. Remova "R$", pontos de milhar e converta a vírgula do decimal para um ponto.
            2. Retorne APENAS e SOMENTE um objeto JSON válido.
            HTML para analisar:
            ${bodyHtml}
            Estrutura JSON de saída esperada:
            { "nome": "string", "marca": "string | null", "preco": "number | null", "imagemUrl": "string | null" }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();

        console.log("--- RESPOSTA BRUTA DO GEMINI ---");
        console.log(responseText);
        console.log("--- FIM DA RESPOSTA BRUTA ---");

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            throw new Error("Nenhum objeto JSON válido foi encontrado na resposta do Gemini.");
        }

    } catch (error) {
        console.error("[ERRO GERAL] Falha no processo de extração:", error);
        return { error: `Falha ao processar a URL: ${error.message}` };
    }
}

module.exports = { extractProductDataFromUrl };