// src/routes/products.js - VERSÃO FINAL COM ORQUESTRADOR

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// Importando as duas funções do nosso novo scraper
const { scrapeByAnalyzingHtml, scrapeBySearching } = require('./api_helpers/scrape-gemini');
const { obterProduto: scrapeWithCheerio } = require('../price-scraper');


// SUAS ROTAS DE DASHBOARD (stats, etc.) CONTINUAM AQUI
router.get('/stats', auth, async (req, res) => { /* Seu código... */ });
router.get('/category-distribution', auth, async (req, res) => { /* Seu código... */ });
router.get('/priority-distribution', auth, async (req, res) => { /* Seu código... */ });


// --- ROTA DE SCRAPE COM A LÓGICA EM CASCATA CORRETA ---
router.post('/scrape-url', async (req, res) => {
    const { url } = req.body;
    if (!url) { return res.status(400).json({ message: 'URL é obrigatória.' }); }

    let productDetails = null;

    try {
        // TENTATIVA 1: Análise de HTML (bom para imagens)
        console.log(`[Strategy] Etapa 1: Tentando com Gemini (Modo HTML)...`);
        productDetails = await scrapeByAnalyzingHtml(url);
    } catch (htmlError) {
        console.warn(`[Strategy] Modo HTML falhou: ${htmlError.message}. Acionando Modo Busca...`);
        
        // TENTATIVA 2: Busca com IA (bom para textos em sites bloqueados)
        try {
            productDetails = await scrapeBySearching(url);
        } catch (searchError) {
            console.error(`[Strategy] Modo Busca também falhou: ${searchError.message}`);
        }
    }

    // TENTATIVA 3: Caça à imagem com Cheerio (se ainda estiver faltando)
    if (productDetails && !productDetails.image) {
        console.log(`[Strategy] Caçando imagem com Cheerio...`);
        try {
            const imageResult = await scrapeWithCheerio(url);
            if (imageResult && imageResult.image) {
                productDetails.image = imageResult.image;
            }
        } catch (imageError) {
            console.warn(`[Strategy] Caça à imagem com Cheerio falhou.`);
        }
    }

    // AVALIAÇÃO FINAL
    if (productDetails && productDetails.name && productDetails.price) {
        console.log(`[Strategy] Sucesso! Detalhes finais:`, productDetails);
        return res.status(200).json(productDetails);
    } else {
        console.error(`[Strategy] FALHA TOTAL para a URL: ${url}`);
        return res.status(422).json({
            message: 'Não conseguimos ler os detalhes do produto nesta página. Tente adicionar as informações manualmente.'
        });
    }
});


// --- ROTAS CRUD (Criar, Ler, Atualizar, Deletar) PARA PRODUTOS ---
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