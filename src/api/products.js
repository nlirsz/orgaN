// src/api/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

console.log("[products.js] Tentando importar de './scrape-gemini'...");
const scrapeGeminiModule = require('./scrape-gemini'); // Importa o módulo inteiro primeiro

console.log("[products.js] Conteúdo do módulo scrapeGeminiModule:", scrapeGeminiModule);
console.log("[products.js] Tipo de scrapeGeminiModule:", typeof scrapeGeminiModule);

// Agora tenta desestruturar e verifica
const scrapeProductDetails = scrapeGeminiModule.scrapeProductDetails; 
// OU const { scrapeProductDetails } = scrapeGeminiModule; (equivalente se scrapeGeminiModule for o objeto module.exports)


console.log("[products.js] Tipo de scrapeProductDetails (após importação/desestruturação):", typeof scrapeProductDetails);

if (typeof scrapeProductDetails !== 'function') {
    console.error("***********************************************************************************");
    console.error("[products.js] ERRO CRÍTICO AO IMPORTAR: scrapeProductDetails NÃO é uma função!");
    console.error("Verifique o arquivo 'scrape-gemini.js' e sua exportação 'module.exports'.");
    console.error("Conteúdo recebido de require('./scrape-gemini'):", scrapeGeminiModule);
    console.error("***********************************************************************************");
    // Você pode até querer impedir o servidor de iniciar ou a rota de funcionar se esta dependência crítica falhar
}

// Rota POST /api/products
router.post('/', async (req, res) => {
    const { url, userId } = req.body;

    if (!url) return res.status(400).json({ message: 'URL do produto é obrigatória.' });
    if (!userId) return res.status(400).json({ message: 'userId é obrigatório.' });

    console.log(`[API /products POST] URL: ${url}, UserID: ${userId}`);

    if (typeof scrapeProductDetails !== 'function') { // Verificação final antes da chamada
        console.error("[API /products POST] Falha: scrapeProductDetails ainda não é uma função no momento da chamada.");
        return res.status(500).json({ message: 'Erro interno crítico: Serviço de scraping indisponível.' });
    }

    try {
        console.log("[API /products POST] Chamando scrapeProductDetails...");
        const productDetails = await scrapeProductDetails(url); // Linha 19 (ou próxima, dependendo dos logs)
        console.log("[API /products POST] Detalhes de scrapeProductDetails:", productDetails);
        
        if (!productDetails || productDetails.price === null || typeof productDetails.price === 'undefined' || !productDetails.name) {
            console.error('[API /products POST] Detalhes insuficientes (nome/preço):', productDetails);
            return res.status(422).json({ message: 'Não foi possível extrair nome/preço da URL.' });
        }
        
        const newProduct = new Product({
            name: productDetails.name,
            price: parseFloat(productDetails.price),
            image: productDetails.image,
            brand: productDetails.brand,
            description: productDetails.description,
            urlOrigin: url,
            userId: userId,
            status: 'pendente',
        });

        const savedProduct = await newProduct.save();
        console.log('[API /products POST] Produto salvo:', savedProduct._id);
        res.status(201).json(savedProduct);

    } catch (error) {
        console.error('[API /products POST] Erro ao adicionar produto:', error.message); // Log da mensagem de erro
        // console.error(error.stack); // Log do stack trace completo se precisar
        res.status(502).json({ 
            message: error.message || 'Erro ao comunicar com o serviço de extração.', 
            details: error.cause ? error.cause.toString() : (error.details || error.toString())
        });
    }
});

// ... (suas outras rotas GET, PATCH, PUT, DELETE como antes) ...
// GET /api/products - Listar produtos com filtro opcional de status
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
        // console.log(`[API] Buscando produtos para UserID=${userId} com query:`, query);
        const products = await Product.find(query).sort({ createdAt: -1 });
        // console.log(`[API] Encontrados ${products.length} produtos.`);
        res.json(products);
    } catch (error) {
        console.error('[API] Erro ao buscar produtos:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar produtos.' });
    }
});

// GET /api/products/:id - Obter um produto específico
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

// PATCH /api/products/:id/purchase - Marcar produto como comprado
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
        // console.log(`[API] Produto ${product._id} marcado como comprado para UserID=${userId}`);
        res.json(product);
    } catch (error) {
        console.error(`[API] Erro ao marcar produto ${req.params.id} como comprado:`, error);
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID do produto inválido.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// PUT /api/products/:id - Atualizar um produto
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
        // console.log(`[API] Produto ${product._id} atualizado para UserID=${userId}`);
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

// DELETE /api/products/:id - Excluir um produto
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
        // console.log(`[API] Produto ${req.params.id} excluído para UserID=${userId}`);
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