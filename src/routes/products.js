// src/api/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../../middleware/auth'); // Ajustado o caminho
const { scrapeProductDetails } = require('./api_helpers/scrape-gemini'); // CORRIGIDO
const { obterProduto: scrapeWithCheerio } = require('../price-scraper'); // CORRIGIDO


// ====================================================================================================
// ROTAS PARA DASHBOARD (MOVidas para o topo para evitar conflitos com :id)
// ====================================================================================================

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

// ====================================================================================================
// ROTAS DE PRODUTOS
// ====================================================================================================

// Rota POST /api/products/scrape-url - Para scraping e pre-visualização
router.post('/scrape-url', async (req, res) => {
    const { url } = req.body;
    if (!url) { return res.status(400).json({ message: 'URL é obrigatória.' }); }
    let productDetails = null;
    try {
        console.log(`[API /scrape-url] Tentando scraping com Gemini para: ${url}`);
        productDetails = await scrapeProductDetails(url);

        // Se Gemini falhar nos essenciais (name, price), tenta Cheerio
        if (!productDetails || !productDetails.name || productDetails.price === null) {
            console.warn(`[API /scrape-url] Gemini falhou em extrair nome/preço. Tentando fallback com Cheerio para: ${url}`);
            productDetails = await scrapeWithCheerio(url);
            if (!productDetails || !productDetails.name || productDetails.price === null) {
                console.error(`[API /scrape-url] Falha em extrair nome/preço com Gemini e Cheerio para: ${url}`);
                return res.status(422).json({ message: 'Não foi possível extrair nome e/ou preço da URL com nenhum método.' });
            }
        }
        res.status(200).json(productDetails);
    } catch (error) {
        console.error('[API /scrape-url] Erro geral no scraping:', error.message);
        res.status(500).json({ message: `Erro ao realizar scraping: ${error.message}` });
    }
});

// Rota POST /api/products - Salva o produto (agora para scraping ou manual)
router.post('/', auth, async (req, res) => {
    const userId = req.user.userId;
    const { name, price, image, brand, description, urlOrigin, status, category, tags, priority, notes } = req.body;

    // Campos obrigatórios, seja via scraping ou manual
    if (!name || !price || !urlOrigin) {
        return res.status(400).json({ message: 'Campos obrigatórios (nome, preço, urlOrigin) estão faltando.' });
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        return res.status(400).json({ message: 'Preço deve ser um número positivo.' });
    }

    try {
        const newProduct = new Product({
            name,
            price: parseFloat(price),
            image,
            brand,
            description,
            urlOrigin,
            userId,
            status: status || 'pendente',
            category: category || 'Outros',
            tags: tags || [],
            priority: priority || 'Baixa',
            notes
        });
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        console.error('[API /products POST] Erro ao adicionar produto:', error.message);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: 'Erro de validação ao salvar produto.', details: messages });
        }
        res.status(500).json({ message: 'Erro ao salvar o produto no banco de dados.', details: error.toString() });
    }
});


router.get('/', auth, async (req, res) => {
    const { status } = req.query;
    const userId = req.user.userId;
    const query = { userId: userId };
    if (status) {
        if (!['pendente', 'comprado', 'descartado'].includes(status)) {
            return res.status(400).json({ message: 'Status inválido. Valores permitidos: pendente, comprado, descartado.' });
        }
        query.status = status;
    }
    try {
        const products = await Product.find(query).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error('[API] Erro ao buscar produtos:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar produtos.' });
    }
});

router.patch('/:id/purchase', auth, async (req, res) => {
    const userId = req.user.userId;
    try {
        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, userId: userId },
            { status: 'comprado', purchasedAt: new Date() },
            { new: true }
        );
        if (!product) { return res.status(404).json({ message: 'Produto não encontrado ou não pertence a este usuário.' }); }
        res.json(product);
    } catch (error) {
        console.error(`[API] Erro ao marcar produto ${req.params.id} como comprado:`, error);
        if (error.name === 'CastError' && error.kind === 'ObjectId') { return res.status(400).json({ message: 'ID do produto inválido.' }); }
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

router.put('/:id', auth, async (req, res) => {
    const userId = req.user.userId;
    const { name, price, brand, description, image, urlOrigin, category, tags, priority, notes } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) {
        const priceAsNumber = parseFloat(price);
        if (isNaN(priceAsNumber) || priceAsNumber <=0) { return res.status(400).json({ message: 'Preço fornecido para atualização é inválido.' }); }
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
    if (Object.keys(updateData).length === 0) { return res.status(400).json({ message: "Nenhum dado fornecido para atualização."}); }
    try {
        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, userId: userId },
            { $set: updateData },
            { new: true, runValidators: true }
        );
        if (!product) { return res.status(404).json({ message: 'Produto não encontrado ou não pertence a este usuário.' }); }
        res.json(product);
    } catch (error) {
        console.error(`[API] Erro ao atualizar produto ${req.params.id}:`, error);
        if (error.name === 'CastError' && error.kind === 'ObjectId') { return res.status(400).json({ message: 'ID do produto inválido.' }); }
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
        if (result.deletedCount === 0) { return res.status(404).json({ message: 'Produto não encontrado ou não pertence a este usuário.' }); }
        res.status(204).send();
    } catch (error) {
        console.error(`[API] Erro ao excluir produto ${req.params.id}:`, error);
        if (error.name === 'CastError' && error.kind === 'ObjectId') { return res.status(400).json({ message: 'ID do produto inválido.' }); }
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// MUDANÇA CRUCIAL: Esta rota foi movida para o FINAL para evitar conflitos com /stats e /category-distribution
router.get('/:id', auth, async (req, res) => {
    const userId = req.user.userId;
    try {
        const product = await Product.findOne({ _id: req.params.id, userId: userId });
        if (!product) { return res.status(404).json({ message: 'Produto não encontrado ou não pertence a este usuário.' }); }
        res.json(product);
    } catch (error) {
        console.error(`[API] Erro ao buscar produto por ID ${req.params.id}:`, error);
        if (error.name === 'CastError' && error.kind === 'ObjectId') { return res.status(400).json({ message: 'ID do produto inválido.' }); }
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

module.exports = router;