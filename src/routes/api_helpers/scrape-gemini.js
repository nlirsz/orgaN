// src/api/scrape-gemini.js
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const fetch = require('node-fetch');

console.log("[scrape-gemini.js] Módulo sendo carregado...");

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
    model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest",
    });
    console.log("[scrape-gemini.js] API Gemini inicializada com sucesso.");
} catch (initError) {
    console.error("[scrape-gemini.js] Erro ao inicializar a API Gemini:", initError);
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

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Falha ao buscar HTML. Status: ${response.status} - ${response.statusText}. Detalhes: ${errorBody.substring(0, 200)}`);
            }

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

// PROMPT ATUALIZADO: Categoria mais detalhada e com exemplos
        const prompt = `Analise o conteúdo da página web para extrair os detalhes de um produto a partir do HTML fornecido. Se o HTML estiver vazio ou incompleto, use sua ferramenta de busca interna para encontrar as informações na URL original.
        Retorne um objeto JSON com as seguintes propriedades:
        - name (string): Nome completo do produto.
        - price (number): Preço do produto. Use ponto como separador decimal.
        - image (string, opcional): A URL da imagem principal do produto. Dê prioridade para a URL na meta tag 'og:image'.
        - brand (string, opcional): Marca do produto.
        - category (string, opcional): Categorize o produto em uma das seguintes opções, baseando-se no que melhor descreve o produto. Escolha "Outros" se nenhuma se encaixar bem.
            Opções de Categoria:
            - "Eletrônicos": Smartphones, TVs, computadores, fones de ouvido, monitores, câmeras, tablets.
            - "Roupas e Acessórios": Camisetas, calças, vestidos, sapatos, joias, bolsas, cintos, relógios (não smartwatches).
            - "Casa e Decoração": Móveis, eletrodomésticos (geladeira, fogão, microondas), utensílios de cozinha, itens de cama/mesa/banho, decoração, iluminação.
            - "Livros e Mídia": Livros físicos, e-books, DVDs, CDs, jogos de videogame (mídia física ou digital).
            - "Esportes e Lazer": Equipamentos esportivos, roupas de ginástica, itens para atividades ao ar livre, brinquedos, instrumentos musicais.
            - "Ferramentas e Construção": Ferramentas manuais, elétricas, materiais de construção, itens de jardinagem.
            - "Alimentos e Bebidas": Produtos alimentícios perecíveis e não perecíveis, bebidas (não alcoólicas e alcoólicas).
            - "Saúde e Beleza": Cosméticos, maquiagem, produtos de higiene pessoal, suplementos, medicamentos sem receita, produtos para cabelo/pele.
            - "Automotivo": Peças de carro, acessórios para veículos, produtos de limpeza automotiva.
            - "Pet Shop": Ração, brinquedos para pets, acessórios para animais de estimação.
            - "Outros": Para produtos que não se encaixam claramente nas categorias acima.
        - description (string, opcional): Uma breve descrição do produto (máximo 200 caracteres).
        Se não encontrar alguma informação, omita a propriedade ou defina-a como null, exceto 'name' e 'price' que são obrigatórias.

        Exemplo de formato de saída esperado:
        \`\`\`json
        {
          "name": "Nome do Produto",
          "price": 123.45,
          "image": "https://example.com/image.jpg",
          "brand": "Marca",
          "category": "Eletrônicos",
          "description": "Descrição breve do produto."
        }
        \`\`\`
        Conteúdo HTML (pode estar vazio):
        ${htmlContent}`;

        
        console.log("[scrape-gemini.js] Enviando prompt para Gemini...");
        const chatSession = model.startChat({ generationConfig, safetySettings, history: [] });
        const result = await chatSession.sendMessage(prompt);
        const geminiResponseText = result.response.text();
        console.log("[scrape-gemini.js] Resposta crua da Gemini (PRIMEIROS 500 CHARS):", geminiResponseText.substring(0,500) + "...");
        console.log("[scrape-gemini.js] Resposta CRUA COMPLETA da Gemini:", geminiResponseText);

        let jsonData;
        try {
            const jsonMatch = geminiResponseText.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
            if (!jsonMatch || !(jsonMatch[1] || jsonMatch[2])) {
                console.error("JSON não encontrado na resposta da Gemini. Resposta completa:", geminiResponseText);
                throw new Error("JSON não encontrado na resposta do modelo de IA. A resposta da IA não seguiu o formato esperado.");
            }
            const jsonString = jsonMatch[1] || jsonMatch[2];
            jsonData = JSON.parse(jsonString.trim());
            console.log("[scrape-gemini.js] JSON parseado:", jsonData);
        } catch (parseError) {
            console.error("[scrape-gemini.js] Erro parseando JSON da Gemini:", parseError.message, "Resposta:", geminiResponseText);
            throw new Error(`Formato de resposta inválido do serviço de extração (AI): ${parseError.message}`);
        }

        if (jsonData.price !== null && typeof jsonData.price !== 'undefined') {
            let priceStr = String(jsonData.price).replace(/[^\d,.]/g, '');
            if (priceStr.includes(',') && priceStr.includes('.')) {
                if (priceStr.indexOf(',') > priceStr.indexOf('.')) {
                    priceStr = priceStr.replace(/\./g, '');
                    priceStr = priceStr.replace(',', '.');
                } else {
                    priceStr = priceStr.replace(/,/g, '');
                }
            } else if (priceStr.includes(',')) {
                priceStr = priceStr.replace(',', '.');
            }

            const priceNum = parseFloat(priceStr);
            jsonData.price = !isNaN(priceNum) ? priceNum : null;
            if (jsonData.price === null) console.warn(`[scrape-gemini.js] Preço "${jsonData.price}" inválido após normalização, usando null.`);
        } else {
             jsonData.price = null;
        }

        if (!jsonData.name || jsonData.price === null) {
             console.warn("[scrape-gemini.js] Nome ou preço não extraídos ou inválidos pelo Gemini:", jsonData);
        }
        return jsonData;

    } catch (error) {
        console.error("[scrape-gemini.js] Erro em scrapeProductDetails:", error.message);
        if (!(error instanceof Error)) {
            error = new Error(String(error));
        }
        error.message = `Erro no serviço de scraping (Gemini): ${error.message}`;
        throw error;
    }
}

console.log("[scrape-gemini.js] Definindo module.exports...");
module.exports = {
    scrapeProductDetails
};
console.log("[scrape-gemini.js] module.exports definido. Conteúdo de scrapeProductDetails:", typeof scrapeProductDetails);