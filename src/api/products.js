// src/api/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { scrapeProductDetails } = require('./scrape-gemini');

// Rota POST /api/products/scrape-url - Apenas para scraping (NOVO)
router.post('/scrape-url', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ message: 'URL é obrigatória.' });
    }

    try {
        const productDetails = await scrapeProductDetails(url);
        if (!productDetails || !productDetails.name || !productDetails.price) {
             return res.status(422).json({ message: 'Não foi possível extrair nome/preço da URL.' });
        }
        res.status(200).json(productDetails);
    } catch (error) {
        console.error('[API /scrape-url] Erro:', error.message);
        res.status(502).json({ message: error.message || 'Erro ao comunicar com o serviço de extração.' });
    }
});


// Rota POST /api/products - Salva o produto (AJUSTADO)
router.post('/', async (req, res) => {
    // A rota agora espera todos os detalhes, pré-validados pelo frontend
    const { name, price, image, brand, description, urlOrigin, userId, status } = req.body;

    // Validação básica
    if (!name || !price || !urlOrigin || !userId) {
        return res.status(400).json({ message: 'Campos obrigatórios (nome, preço, urlOrigin, userId) estão faltando.' });
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
        });

        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);

    } catch (error) {
        console.error('[API /products POST] Erro ao adicionar produto:', error.message);
        res.status(500).json({ 
            message: 'Erro ao salvar o produto no banco de dados.', 
            details: error.toString()
        });
    }
});


// GET /api/products - Listar produtos (ORIGINAL MANTIDO)
router.get('/', async (req, res) => {
    const { status, userId } = req.query;

    if (!userId) {
        return res.status(400).json({ message: 'userId é obrigatório na query string.' });
    }

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

// GET /api/products/:id - Obter um produto específico (ORIGINAL MANTIDO)
router.get('/:id', async (req, res) => {
    const { userId } = req.query; 
    if (!userId) {
        return res.status(400).json({ message: 'userId é obrigatório na query string para buscar produto específico.' });
    }
    try {
        const product = await Product.findOne({ _id: req.params.id, userId: userId });
        if (!product) {
            return res.status(404).json({ message: 'Produto não encontrado ou não pertence a este usuário.' });
        }
        res.json(product);
    } catch (error) {
        console.error(`[API] Erro ao buscar produto por ID ${req.params.id}:`, error);
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID do produto inválido.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// PATCH /api/products/:id/purchase - Marcar produto como comprado (ORIGINAL MANTIDO)
router.patch('/:id/purchase', async (req, res) => {
    const { userId } = req.body; 
    if (!userId) {
        return res.status(400).json({ message: 'userId é obrigatório no corpo da requisição.' });
    }
    try {
        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, userId: userId },
            { status: 'comprado', purchasedAt: new Date() },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Produto não encontrado ou não pertence a este usuário.' });
        }
        res.json(product);
    } catch (error) {
        console.error(`[API] Erro ao marcar produto ${req.params.id} como comprado:`, error);
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID do produto inválido.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// PUT /api/products/:id - Atualizar um produto (ORIGINAL MANTIDO)
router.put('/:id', async (req, res) => {
    const { userId, name, price, brand, description } = req.body;
    if (!userId) {
        return res.status(400).json({ message: 'userId é obrigatório.' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) {
        const priceAsNumber = parseFloat(price);
        if (isNaN(priceAsNumber) || priceAsNumber <=0) {
            return res.status(400).json({ message: 'Preço fornecido para atualização é inválido.' });
        }
        updateData.price = priceAsNumber;
    }
    if (brand !== undefined) updateData.brand = brand;
    if (description !== undefined) updateData.description = description;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "Nenhum dado fornecido para atualização."})
    }

    try {
        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, userId: userId },
            { $set: updateData },
            { new: true, runValidators: true }
        );
        if (!product) {
            return res.status(404).json({ message: 'Produto não encontrado ou não pertence a este usuário.' });
        }
        res.json(product);
    } catch (error) {
        console.error(`[API] Erro ao atualizar produto ${req.params.id}:`, error);
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID do produto inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Erro de validação', details: error.errors });
        }
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// DELETE /api/products/:id - Excluir um produto (ORIGINAL MANTIDO)
router.delete('/:id', async (req, res) => {
    const { userId } = req.body; 
    if (!userId) {
        return res.status(400).json({ message: 'userId é obrigatório no corpo da requisição.' });
    }
    try {
        const result = await Product.deleteOne({ _id: req.params.id, userId: userId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Produto não encontrado ou não pertence a este usuário.' });
        }
        res.status(204).send(); 
    } catch (error) {
        console.error(`[API] Erro ao excluir produto ${req.params.id}:`, error);
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID do produto inválido.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

module.exports = router;