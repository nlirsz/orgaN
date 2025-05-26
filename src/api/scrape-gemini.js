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
    // Lançar um erro aqui para impedir que o servidor inicie com uma configuração crucial faltando.
    throw new Error("GEMINI_API_KEY não configurada. O serviço de scraping não pode iniciar.");
}

// Mova a inicialização do genAI e model para depois da verificação da chave,
// e envolva em try-catch se a inicialização puder falhar mesmo com a chave (improvável mas seguro)
let genAI;
let model;

try {
    // Só tenta inicializar se a chave existir (já garantido pelo throw acima)
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest",
    });
    console.log("[scrape-gemini.js] API Gemini inicializada com sucesso.");
} catch (initError) {
    console.error("[scrape-gemini.js] Erro ao inicializar a API Gemini:", initError);
    // Re-lança o erro para garantir que a inicialização do módulo falhe.
    throw new Error(`Falha ao inicializar o modelo Gemini: ${initError.message}`);
}


const generationConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

async function scrapeProductDetails(productUrl) {
    console.log(`[scrape-gemini.js] scrapeProductDetails chamada para URL: ${productUrl}`);
    
    // Verifica se o modelo foi inicializado (redundante com o throw na inicialização, mas seguro)
    if (!model) { 
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
            const response = await fetch(productUrl);
            
            // --- CORREÇÃO: Verifique response.ok antes de ler o corpo ---
            if (!response.ok) {
                const errorBody = await response.text(); // Lê o corpo da resposta mesmo em caso de erro
                throw new Error(`Falha ao buscar HTML. Status: ${response.status} - ${response.statusText}. Detalhes: ${errorBody.substring(0, 200)}`);
            }
            // --- FIM CORREÇÃO ---

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

        const prompt = `Analise o HTML a seguir para extrair os detalhes de um produto.
        Retorne um objeto JSON com as seguintes propriedades:
        - name (string): Nome completo do produto.
        - price (number): Preço do produto. Use ponto como separador decimal.
        - image (string, opcional): URL da imagem principal do produto.
        - brand (string, opcional): Marca do produto.
        - description (string, opcional): Uma breve descrição do produto (máximo 200 caracteres).
        Se não encontrar alguma informação, omita a propriedade ou defina-a como null, exceto 'name' e 'price' que são obrigatórias.

        Exemplo de formato de saída esperado:
        \`\`\`json
        {
          "name": "Smartphone Exemplo X",
          "price": 1234.56,
          "image": "https://exemplo.com/imagem.jpg",
          "brand": "TechCorp",
          "description": "Um smartphone de última geração com câmera avançada e bateria de longa duração."
        }
        \`\`\`
        Conteúdo HTML:
        ${htmlContent}`;

        console.log("[scrape-gemini.js] Enviando prompt para Gemini...");
        const chatSession = model.startChat({ generationConfig, safetySettings, history: [] });
        const result = await chatSession.sendMessage(prompt);
        const geminiResponseText = result.response.text();
        console.log("[scrape-gemini.js] Resposta crua da Gemini:", geminiResponseText.substring(0,200) + "...");

        let jsonData;
        try {
            // Tenta extrair JSON de um bloco de código ou do texto direto
            const jsonMatch = geminiResponseText.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
            if (!jsonMatch || !(jsonMatch[1] || jsonMatch[2])) {
                console.error("JSON não encontrado na resposta da Gemini. Resposta completa:", geminiResponseText);
                throw new Error("JSON não encontrado na resposta do modelo de IA. A resposta da IA não seguiu o formato esperado.");
            }
            const jsonString = jsonMatch[1] || jsonMatch[2]; // Pega o conteúdo do grupo 1 (se bloco json) ou grupo 2 (se JSON direto)
            jsonData = JSON.parse(jsonString.trim());
            console.log("[scrape-gemini.js] JSON parseado:", jsonData);
        } catch (parseError) {
            console.error("[scrape-gemini.js] Erro parseando JSON da Gemini:", parseError.message, "Resposta:", geminiResponseText);
            throw new Error(`Formato de resposta inválido do serviço de extração (AI): ${parseError.message}`);
        }
        
        // Normalização e validação do preço
        if (jsonData.price !== null && typeof jsonData.price !== 'undefined') {
            let priceStr = String(jsonData.price).replace(/[^\d,.]/g, ''); // Permite apenas dígitos, vírgula e ponto
            // Lida com vírgula como separador decimal e remove outros pontos que não sejam o último
            if (priceStr.includes(',') && priceStr.includes('.')) {
                // Se a vírgula vier depois do ponto, é provável que seja o separador decimal brasileiro
                if (priceStr.indexOf(',') > priceStr.indexOf('.')) {
                    priceStr = priceStr.replace(/\./g, ''); // Remove todos os pontos
                    priceStr = priceStr.replace(',', '.');   // Troca vírgula por ponto
                } else {
                    // Ponto como separador decimal e vírgula como milhar (remove vírgulas)
                    priceStr = priceStr.replace(/,/g, '');
                }
            } else if (priceStr.includes(',')) {
                priceStr = priceStr.replace(',', '.'); // Troca vírgula por ponto se for o único separador
            }
            
            const priceNum = parseFloat(priceStr);
            jsonData.price = !isNaN(priceNum) ? priceNum : null;
            if (jsonData.price === null) console.warn(`[scrape-gemini.js] Preço "${jsonData.price}" inválido após normalização, usando null.`);
        } else {
             jsonData.price = null; // Garante que o preço seja null se não for extraído ou for inválido
        }

        if (!jsonData.name || jsonData.price === null) {
             console.warn("[scrape-gemini.js] Nome ou preço não extraídos ou inválidos:", jsonData);
             // Opcional: Lançar um erro aqui se nome e preço forem *obrigatórios* para prosseguir
             // throw new Error("Não foi possível extrair nome ou preço válidos do produto.");
        }
        return jsonData;

    } catch (error) {
        console.error("[scrape-gemini.js] Erro em scrapeProductDetails:", error.message);
        // Garante que o erro seja propagado com uma mensagem clara para o products.js
        if (!(error instanceof Error)) { // Converte para Error se for de outro tipo
            error = new Error(String(error));
        }
        error.message = `Erro no serviço de scraping (Gemini): ${error.message}`;
        throw error;
    }
}

console.log("[scrape-gemini.js] Definindo module.exports...");
module.exports = { 
    scrapeProductDetails  // A função scrapeProductDetails DEVE estar definida e acessível aqui.
};
console.log("[scrape-gemini.js] module.exports definido. Conteúdo de scrapeProductDetails:", typeof scrapeProductDetails);