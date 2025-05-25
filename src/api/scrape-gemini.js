// src/api/scrape-gemini.js
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const fetch = require('node-fetch'); // Certifique-se que está instalado (npm install node-fetch@2)

console.log("[scrape-gemini.js] Módulo sendo carregado..."); // Log inicial

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("***************************************************************************");
    console.error("[scrape-gemini.js] ERRO FATAL: GEMINI_API_KEY não está definida!");
    console.error("Configure a variável de ambiente GEMINI_API_KEY para o backend funcionar.");
    console.error("***************************************************************************");
    // Lançar um erro aqui pode ser uma boa ideia para parar a inicialização se a chave for crucial.
    // throw new Error("GEMINI_API_KEY não configurada. O serviço de scraping não pode iniciar.");
}

// Mova a inicialização do genAI e model para depois da verificação da chave,
// e envolva em try-catch se a inicialização puder falhar mesmo com a chave (improvável mas seguro)
let genAI;
let model;

try {
    if (GEMINI_API_KEY) { // Só tenta inicializar se a chave existir
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest",
        });
        console.log("[scrape-gemini.js] API Gemini inicializada com sucesso.");
    } else {
        console.warn("[scrape-gemini.js] API Gemini NÃO inicializada devido à ausência da GEMINI_API_KEY.");
    }
} catch (initError) {
    console.error("[scrape-gemini.js] Erro ao inicializar a API Gemini:", initError);
    // Se a inicialização falhar, scrapeProductDetails provavelmente não funcionará.
    // Você pode querer que scrapeProductDetails lance um erro imediatamente se model for undefined.
}


const generationConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

const safetySettings = [
    // ... (configurações de segurança) ...
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

async function scrapeProductDetails(productUrl) {
    console.log(`[scrape-gemini.js] scrapeProductDetails chamada para URL: ${productUrl}`);
    
    if (!model) { // Verifica se o modelo foi inicializado
        console.error("[scrape-gemini.js] Modelo Gemini não inicializado. Verifique a GEMINI_API_KEY e erros de inicialização.");
        throw new Error("Serviço de extração indisponível: Modelo Gemini não carregado.");
    }
    if (!productUrl || !productUrl.startsWith('http')) {
        console.error("[scrape-gemini.js] URL inválida fornecida:", productUrl);
        throw new Error("URL do produto inválida ou não fornecida.");
    }

    try {
        let htmlContent = '';
        try {
            console.log(`[scrape-gemini.js] Buscando HTML de: ${productUrl}`);
            const response = await fetch(productUrl, { /* headers */ });
            if (!response.ok) throw new Error(`Falha ao buscar HTML. Status: ${response.status}`);
            htmlContent = await response.text();
            console.log(`[scrape-gemini.js] HTML obtido. Tamanho: ${htmlContent.length}`);
        } catch (fetchError) {
            console.error(`[scrape-gemini.js] Erro ao buscar HTML (${productUrl}):`, fetchError.message);
            throw new Error(`Não foi possível acessar o conteúdo da URL: ${fetchError.message}`);
        }
        
        const maxHtmlLength = 200000; 
        if (htmlContent.length > maxHtmlLength) {
            htmlContent = htmlContent.substring(0, maxHtmlLength);
            console.warn(`[scrape-gemini.js] HTML truncado.`);
        }

        const prompt = `Analise o HTML... (seu prompt aqui) ... Conteúdo HTML:\n${htmlContent}`;

        console.log("[scrape-gemini.js] Enviando prompt para Gemini...");
        const chatSession = model.startChat({ generationConfig, safetySettings, history: [] });
        const result = await chatSession.sendMessage(prompt);
        const geminiResponseText = result.response.text();
        console.log("[scrape-gemini.js] Resposta crua da Gemini:", geminiResponseText.substring(0,200) + "...");

        let jsonData;
        try {
            const jsonMatch = geminiResponseText.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
            if (!jsonMatch || !(jsonMatch[1] || jsonMatch[2])) throw new Error("JSON não encontrado na resposta.");
            const jsonString = jsonMatch[1] || jsonMatch[2];
            jsonData = JSON.parse(jsonString.trim());
            console.log("[scrape-gemini.js] JSON parseado:", jsonData);
        } catch (parseError) {
            console.error("[scrape-gemini.js] Erro parseando JSON da Gemini:", parseError.message, "Resposta:", geminiResponseText);
            throw new Error(`Formato de resposta inválido do serviço de extração: ${parseError.message}`);
        }
        
        if (jsonData.price !== null && typeof jsonData.price !== 'undefined') {
            let priceStr = String(jsonData.price).replace(/[^\d,.-]/g, '').replace(/\.(?![^.]*$)/g, '').replace(',', '.');
            const priceNum = parseFloat(priceStr);
            jsonData.price = !isNaN(priceNum) ? priceNum : null;
            if (jsonData.price === null) console.warn(`[scrape-gemini.js] Preço "${jsonData.price}" inválido, usando null.`);
        } else {
             jsonData.price = null;
        }

        if (!jsonData.name || jsonData.price === null) {
             console.warn("[scrape-gemini.js] Nome ou preço não extraídos:", jsonData);
        }
        return jsonData;

    } catch (error) {
        console.error("[scrape-gemini.js] Erro em scrapeProductDetails:", error.message);
        error.message = `Erro no serviço de scraping (Gemini): ${error.message}`;
        throw error;
    }
}

console.log("[scrape-gemini.js] Definindo module.exports...");
// ESTA É A EXPORTAÇÃO. GARANTA QUE NADA ACIMA ESTÁ QUEBRANDO ANTES DESTA LINHA.
module.exports = { 
    scrapeProductDetails  // A função scrapeProductDetails DEVE estar definida e acessível aqui.
};
console.log("[scrape-gemini.js] module.exports definido. Conteúdo de scrapeProductDetails:", typeof scrapeProductDetails);