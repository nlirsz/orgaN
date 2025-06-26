// Em src/routes/products.js, substitua a rota /scrape-url

router.post('/scrape-url', async (req, res) => {
    const { url } = req.body;
    if (!url) { return res.status(400).json({ message: 'URL é obrigatória.' }); }

    let productDetails = null;

    try {
        console.log(`[Scrape Strategy] Etapa 1: Tentando com Gemini para obter dados de texto...`);
        productDetails = await scrapeWithGemini(url);
        
        // Se a IA não retornou a imagem, usamos nosso especialista.
        if (productDetails && !productDetails.image) {
            console.log(`[Scrape Strategy] IA não encontrou imagem. Usando Cheerio como fallback de imagem...`);
            const imageResult = await scrapeWithCheerio(url);
            if (imageResult && imageResult.image) {
                productDetails.image = imageResult.image;
            }
        }
    } catch (aiError) {
        console.warn(`[Scrape Strategy] Gemini falhou: ${aiError.message}. Tentando com Cheerio como fallback total...`);
        try {
            // Fallback total para o Cheerio se a IA falhar
            productDetails = await scrapeWithCheerio(url);
        } catch (cheerioError) {
            console.error(`[Scrape Strategy] Cheerio também falhou: ${cheerioError.message}`);
        }
    }

    if (productDetails && productDetails.name && productDetails.price) {
        console.log(`[Scrape Strategy] Sucesso! Detalhes finais:`, productDetails);
        return res.status(200).json(productDetails);
    } else {
        console.error(`[Scrape Strategy] FALHA TOTAL para: ${url}`);
        return res.status(422).json({
            message: 'Não conseguimos ler os detalhes do produto nesta página. Tente adicionar as informações manualmente.'
        });
    }
});