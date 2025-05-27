const axios = require('axios');
const cheerio = require('cheerio');

async function obterProduto(link) {
    try {
        console.log("[price-scraper.js] Buscando produto com Cheerio:", link);

        const response = await axios.get(link, {
            headers: {
                // Adiciona um User-Agent para tentar evitar bloqueios simples
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = response.data;
        const $ = cheerio.load(html);

        let name = null;
        let price = null;
        let image = null;
        let brand = null;
        let description = null;

        // Tentar capturar nome do produto
        // Seletores comuns para nome
        name = $('h1').first().text().trim();
        if (!name) name = $('meta[property="og:title"]').attr('content')?.trim();
        if (!name) name = $('meta[name="twitter:title"]').attr('content')?.trim();
        if (!name) name = $('[itemprop="name"]').first().text().trim();
        if (!name) name = $('.product-title-word-break').first().text().trim(); // Específico da Amazon


        // Tentar capturar preço do produto
        // Seletores comuns para preço
        let priceText = null;
        priceText = $('[itemprop="price"]').attr('content')?.trim();
        if (!priceText) priceText = $('.price,.product-price,.new-price,.actual-price').first().text().trim();
        if (!priceText) priceText = $('#priceblock_ourprice').text().trim(); // Amazon
        if (!priceText) priceText = $('.a-price-whole').first().text().trim(); // Amazon novo seletor
        if (!priceText) priceText = $('#variacaoPreco').text().trim(); // Seu seletor original
        if (!priceText) priceText = $('#price_inside_buybox').text().trim(); // Amazon Buy Box

        if (priceText) {
            // Limpa o texto do preço, removendo moedas, espaços e usando ponto como decimal
            priceText = priceText.replace(/[^0-9.,]/g, '').replace(',', '.');
            // Se houver múltiplos pontos e uma vírgula no final (formato BR), ajusta
            if (priceText.indexOf('.') !== -1 && priceText.indexOf(',') !== -1 && priceText.indexOf(',') > priceText.indexOf('.')) {
                priceText = priceText.replace(/\./g, '');
                priceText = priceText.replace(',', '.');
            } else {
                priceText = priceText.replace(/,/g, ''); // Remove vírgulas de milhar
            }
            price = parseFloat(priceText);
            if (isNaN(price)) price = null;
        }


        // Tentar capturar imagem do produto
        // Seletores comuns para imagem
        image = $('meta[property="og:image"]').attr('content');
        if (!image) image = $('meta[name="twitter:image"]').attr('content');
        if (!image) image = $('[itemprop="image"]').attr('src');
        if (!image) image = $('img.product-image-main').attr('src'); // Exemplo de seletor comum
        if (!image) image = $('#imgTagWrapperId img').attr('src'); // Amazon

        // Tentar capturar marca (brand)
        brand = $('meta[property="og:brand"]').attr('content')?.trim();
        if (!brand) brand = $('#brand').text().trim(); // Seletor genérico
        if (!brand) brand = $('#bylineInfo').text().trim().split('Visite a loja de').pop()?.trim(); // Amazon

        // Tentar capturar descrição (description)
        description = $('meta[property="og:description"]').attr('content')?.trim();
        if (!description) description = $('meta[name="description"]').attr('content')?.trim();
        if (!description) description = $('#productDescription p').first().text().trim().substring(0,200); // Amazon

        const productDetails = {
            name: name || null,
            price: price,
            image: image || null,
            brand: brand || null,
            description: description || null
            // Outros campos como category, tags, priority, notes não são facilmente extraíveis via Cheerio de forma genérica
        };

        console.log("[price-scraper.js] Produto encontrado com Cheerio:", productDetails);

        return productDetails;
    } catch (error) {
        console.error("[price-scraper.js] Erro ao buscar produto com Cheerio:", error.message);
        // Retorna um objeto com nulls para indicar que a extração falhou, mas de forma controlada
        return { name: null, price: null, image: null, brand: null, description: null };
    }
}

module.exports = { obterProduto };