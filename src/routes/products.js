// src/routes/products.js

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// Importando todos os nossos "scrapers"
const { obterProduto: scrapeWithCheerio } = require('../price-scraper');
const { searchProductDetails } = require('./api_helpers/scrape-via-search');
const { scrapeProductDetails: scrapeWithGemini } = require('./api_helpers/scrape-gemini');

// ROTAS DE DASHBOARD E ESTATÍSTICAS
router.get('/stats', auth, async (req, res) => {
    const userId = req.user.userId;
    try {
        const totalProducts = await Product.countDocuments({ userId });
        const purchasedProducts = await Product.countDocuments({ userId, status: 'comprado' });
        const pendingProducts = await Product.countDocuments({ userId, status: 'pendente' });
        const totalSpentResult = await Product.aggregate([
            { $match: { userId: userId, status: 'comprado' } },
            { $group: { _id: null, total: { $sum: '$price' } } }
        ]);
        const totalSpent = totalSpentResult.length > 0 ? totalSpentResult[0].total : 0;
        res.json({ totalProducts, purchasedProducts, pendingProducts, totalSpent });
    } catch (error) {
        console.error('[API /products/stats] Erro ao buscar estatísticas:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar estatísticas do dashboard.' });
    }
});

router.get('/category-distribution', auth, async (req, res) => {
    const userId = req.user.userId;
    try {
        const categoryCounts = await Product.aggregate([
            { $match: { userId: userId } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $project: { _id: 0, category: '$_id', count: 1 } }
        ]);
        const labels = categoryCounts.map(item => item.category || 'Não Classificado');
        const data = categoryCounts.map(item => item.count);
        res.json({ labels, data });
    } catch (error) {
        console.error('[API /products/category-distribution] Erro ao buscar distribuição de categoria:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar distribuição por categoria.' });
    }
});

router.get('/priority-distribution', auth, async (req, res) => {
    const userId = req.user.userId;
    try {
        const priorityCounts = await Product.aggregate([
            { $match: { userId: userId, status: 'pendente' } },
            { $group: { _id: '$priority', count: { $sum: 1 } } },
            { $project: { _id: 0, priority: '$_id', count: 1 } }
        ]);
        const labels = priorityCounts.map(item => item.priority || 'Não Definida');
        const data = priorityCounts.map(item => item.count);
        res.json({ labels, data });
    } catch (error) {
        console.error('[API /products/priority-distribution] Erro ao buscar distribuição de prioridade:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar distribuição por prioridade.' });
    }
});

// ROTA DE SCRAPE ATUALIZADA COM A ESTRATÉGIA DE 3 TENTATIVAS
router.post('/scrape-url', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ message: 'URL é obrigatória.' });
    }

    let productDetails = null;

    // --- TENTATIVA 1: Cheerio (Rápido e Barato) ---
    try {
        console.log(`[Scrape Strategy] Etapa 1: Tentando com Cheerio para: ${url}`);
        const cheerioResult = await scrapeWithCheerio(url);
        if (cheerioResult && cheerioResult.name && cheerioResult.price) {
            productDetails = cheerioResult;
        } else {
            throw new Error("Cheerio não encontrou nome ou preço.");
        }
    } catch (cheerioError) {
        console.warn(`[Scrape Strategy] Cheerio falhou: ${cheerioError.message}`);
        
        // --- TENTATIVA 2: Google Search (Ótimo para sites bloqueados) ---
        try {
            console.log(`[Scrape Strategy] Etapa 2: Tentando com Google Search para: ${url}`);
            const searchResult = await searchProductDetails(url);
             if (searchResult && searchResult.name && searchResult.price) {
                productDetails = searchResult;
            } else {
                throw new Error("Google Search não encontrou nome ou preço.");
            }
        } catch (searchError) {
            console.warn(`[Scrape Strategy] Google Search falhou: ${searchError.message}`);

            // --- TENTATIVA 3: Gemini (Análise de IA como último recurso) ---
            try {
                console.log(`[Scrape Strategy] Etapa 3: Último recurso com Gemini para: ${url}`);
                const geminiResult = await scrapeWithGemini(url);
                if (geminiResult && geminiResult.name && geminiResult.price) {
                    productDetails = geminiResult;
                } else {
                    throw new Error("Gemini também não conseguiu extrair os dados essenciais.");
                }
            } catch (geminiError) {
                 console.error(`[Scrape Strategy] Gemini também falhou: ${geminiError.message}`);
            }
        }
    }

    // --- AVALIAÇÃO FINAL ---
    if (productDetails) {
        console.log(`[Scrape Strategy] Sucesso! Detalhes finais extraídos:`, productDetails);
        productDetails.urlOrigin = url;
        return res.status(200).json(productDetails);
    } else {
        console.error(`[Scrape Strategy] FALHA TOTAL: Nenhum método conseguiu extrair dados para: ${url}`);
        return res.status(422).json({
            message: 'Não conseguimos ler os detalhes do produto nesta página. Tente adicionar as informações manualmente.'
        });
    }
});

// ROTAS CRUD DE PRODUTOS
router.post('/', auth, async (req, res) => {
    const userId = req.user.userId;
    const { name, price, image, brand, description, urlOrigin, status, category, tags, priority, notes } = req.body;

    if (!name || !price || !urlOrigin) {
        return res.status(400).json({ message: 'Campos obrigatórios (nome, preço, urlOrigin) faltando.' });
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        return res.status(400).json({ message: 'Preço deve ser um número positivo.' });
    }

    try {
        const newProduct = new Product({
            name, price: parseFloat(price), image, brand, description, urlOrigin, userId,
            status: status || 'pendente', category: category || 'Outros',
            tags: tags || [], priority: priority || 'Baixa', notes
        });
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        console.error('[products.js POST /] Erro ao adicionar produto:', error.message);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: 'Erro de validação.', details: messages });
        }
        res.status(500).json({ message: 'Erro ao salvar produto.', details: error.toString() });
    }
});

router.get('/', auth, async (req, res) => {
    const { status } = req.query;
    const userId = req.user.userId;
    const query = { userId: userId };
    if (status) {
        if (!['pendente', 'comprado', 'descartado'].includes(status)) {
            return res.status(400).json({ message: 'Status inválido.' });
        }
        query.status = status;
    }
    try {
        const products = await Product.find(query).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error('[products.js GET /] Erro ao buscar produtos:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

router.patch('/:id/purchase', auth, async (req, res) => {
    const userId = req.user.userId;
    try {
        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, userId: userId },
            { status: 'comprado', purchasedAt: new Date() }, { new: true }
        );
        if (!product) { return res.status(404).json({ message: 'Produto não encontrado.' }); }
        res.json(product);
    } catch (error) {
        console.error(`[products.js PATCH /:id/purchase] Erro:`, error);
        if (error.name === 'CastError') { return res.status(400).json({ message: 'ID do produto inválido.' }); }
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

router.put('/:id', auth, async (req, res) => {
    const userId = req.user.userId;
    const { name, price, brand, description, image, urlOrigin, category, tags, priority, notes, status } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) {
        const priceAsNumber = parseFloat(price);
        if (isNaN(priceAsNumber) || priceAsNumber <=0) { return res.status(400).json({ message: 'Preço inválido.' }); }
        updateData.price = priceAsNumber;
    }
    if (brand !== undefined) updateData.brand = brand;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (urlOrigin !== undefined) updateData.urlOrigin = urlOrigin;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags.map(tag => tag.trim()).filter(tag => tag) : [];
    if (priority !== undefined) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;
    if (Object.keys(updateData).length === 0) { return res.status(400).json({ message: "Nenhum dado para atualização."}); }

    try {
        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, userId: userId },
            { $set: updateData }, { new: true, runValidators: true }
        );
        if (!product) { return res.status(404).json({ message: 'Produto não encontrado.' }); }
        res.json(product);
    } catch (error) {
        console.error(`[products.js PUT /:id] Erro:`, error);
        if (error.name === 'CastError') { return res.status(400).json({ message: 'ID do produto inválido.' }); }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: 'Erro de validação', details: messages });
        }
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

router.delete('/:id', auth, async (req, res) => {
    const userId = req.user.userId;
    try {
        const result = await Product.deleteOne({ _id: req.params.id, userId: userId });
        if (result.deletedCount === 0) { return res.status(404).json({ message: 'Produto não encontrado.' }); }
        res.status(204).send();
    } catch (error) {
        console.error(`[products.js DELETE /:id] Erro:`, error);
        if (error.name === 'CastError') { return res.status(400).json({ message: 'ID do produto inválido.' }); }
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

router.get('/:id', auth, async (req, res) => {
    const userId = req.user.userId;
    try {
        const product = await Product.findOne({ _id: req.params.id, userId: userId });
        if (!product) { return res.status(404).json({ message: 'Produto não encontrado.' }); }
        res.json(product);
    } catch (error) {
        console.error(`[products.js GET /:id] Erro:`, error);
        if (error.name === 'CastError') { return res.status(400).json({ message: 'ID do produto inválido.' }); }
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

module.exports = router;