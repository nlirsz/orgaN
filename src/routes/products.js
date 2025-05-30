// src/routes/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product'); // Este já estava correto
const auth = require('../middleware/auth'); // CORRIGIDO
const { scrapeProductDetails } = require('./api_helpers/scrape-gemini'); // CORRIGIDO
const { obterProduto: scrapeWithCheerio } = require('../price-scraper'); // CORRIGIDO

// ROTAS PARA DASHBOARD
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

// ROTAS DE PRODUTOS
router.post('/scrape-url', async (req, res) => { // Removido 'auth' daqui, pois é para pré-visualização
    const { url } = req.body;
    if (!url) { return res.status(400).json({ message: 'URL é obrigatória.' }); }
    let productDetails = null;
    try {
        console.log(`[products.js /scrape-url] Tentando scraping com Gemini para: ${url}`);
        productDetails = await scrapeProductDetails(url);

        if (!productDetails || !productDetails.name || productDetails.price === null) {
            console.warn(`[products.js /scrape-url] Gemini falhou. Tentando fallback com Cheerio para: ${url}`);
            productDetails = await scrapeWithCheerio(url); // scrapeWithCheerio é importado de ../price-scraper.js
            if (!productDetails || !productDetails.name || productDetails.price === null) {
                console.error(`[products.js /scrape-url] Falha em extrair nome/preço com ambos os métodos para: ${url}`);
                return res.status(422).json({ message: 'Não foi possível extrair nome e/ou preço da URL.' });
            }
        }
        res.status(200).json(productDetails);
    } catch (error) {
        console.error('[products.js /scrape-url] Erro geral no scraping:', error.message);
        res.status(500).json({ message: `Erro ao realizar scraping: ${error.message}` });
    }
});

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
    const { name, price, brand, description, image, urlOrigin, category, tags, priority, notes, status } = req.body; // Adicionado status
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
    if (status !== undefined) updateData.status = status; // Adicionado para atualizar status
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