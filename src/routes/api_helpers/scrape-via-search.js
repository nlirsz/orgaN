// src/routes/api_helpers/scrape-via-search.js
const { search } = require('@google/generative-ai'); // Simula a importação da ferramenta

function extractPrice(text) {
    if (!text) return null;
    const priceMatch = text.match(/R\$\s*([\d.,]+)|([\d,]+\.\d{2})/);
    if (!priceMatch) return null;
    let priceStr = priceMatch[1] || priceMatch[2];
    priceStr = priceStr.replace(/\./g, '').replace(',', '.');
    const priceNum = parseFloat(priceStr);
    return !isNaN(priceNum) ? priceNum : null;
}

async function searchProductDetails(productUrl) {
    try {
        const urlParts = productUrl.split('/');
        const queryParts = urlParts.slice(-2).join(' ').replace(/-/g, ' ').replace('.html', '');
        const search_query = `site:${new URL(productUrl).hostname} ${queryParts}`;

        console.log(`[scrape-via-search] Buscando com a query: "${search_query}"`);

        // Simulação da chamada da ferramenta de busca
        const searchResults = await search({ queries: [search_query] });
        
        if (!searchResults || searchResults.length === 0 || !searchResults[0].results || searchResults[0].results.length === 0) {
            console.warn("[scrape-via-search] Nenhum resultado encontrado na busca.");
            return null;
        }

        const firstResult = searchResults[0].results[0];
        const title = firstResult.source_title;
        const snippet = firstResult.snippet;
        let price = extractPrice(snippet) || extractPrice(title);
        const name = title ? title.split('|')[0].trim() : null;

        if (!name || !price) {
            console.warn("[scrape-via-search] Não foi possível extrair nome ou preço dos resultados.");
            return null;
        }

        return {
            name: name,
            price: price,
            image: null,
            brand: new URL(productUrl).hostname.split('.').slice(-2, -1)[0] || 'Marca Desconhecida',
            description: snippet,
            urlOrigin: productUrl,
        };
    } catch (error) {
        console.error(`[scrape-via-search] Erro na função searchProductDetails: ${error.message}`);
        return null; // Retorna nulo em caso de qualquer erro
    }
}

module.exports = { searchProductDetails };