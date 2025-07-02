// src/routes/products.js - VERSÃO FINAL E COMPLETA

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');

// Importando as duas funções do nosso novo scraper
const { scrapeByAnalyzingHtml, scrapeBySearching } = require('./api_helpers/scrape-gemini');
const { obterProduto: scrapeWithCheerio } = require('../price-scraper');

// --- ROTAS DE DASHBOARD E ESTATÍSTICAS ---
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
        res.status(500).json({ message: 'Erro ao buscar estatísticas.' });
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
        res.status(500).json({ message: 'Erro ao buscar distribuição por categoria.' });
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
        res.status(500).json({ message: 'Erro ao buscar distribuição por prioridade.' });
    }
});

// --- ROTA DE SCRAPE COM A LÓGICA EM CASCATA ---
router.post('/scrape-url', async (req, res) => {
    const { url } = req.body;
    if (!url) { return res.status(400).json({ message: 'URL é obrigatória.' }); }

    let productDetails = null;

    try {
        console.log(`[Strategy] Etapa 1: Tentando com Gemini (Modo HTML)...`);
        productDetails = await scrapeByAnalyzingHtml(url);
    } catch (htmlError) {
        console.warn(`[Strategy] Modo HTML falhou: ${htmlError.message}. Acionando Modo Busca...`);
        try {
            productDetails = await scrapeBySearching(url);
        } catch (searchError) {
            console.error(`[Strategy] Modo Busca também falhou: ${searchError.message}`);
        }
    }

    if (productDetails && !productDetails.image) {
        console.log(`[Strategy] Caçando imagem com Cheerio...`);
        try {
            const imageResult = await scrapeWithCheerio(url);
            if (imageResult && imageResult.image) productDetails.image = imageResult.image;
        } catch (imageError) {
            console.warn(`[Strategy] Caça à imagem com Cheerio falhou.`);
        }
    }

    if (productDetails && productDetails.name && productDetails.price) {
        console.log(`[Strategy] Sucesso! Detalhes finais:`, productDetails);
        productDetails.urlOrigin = url; // Garante que a URL original esteja no resultado
        return res.status(200).json(productDetails);
    } else {
        console.error(`[Strategy] FALHA TOTAL para a URL: ${url}`);
        return res.status(422).json({ message: 'Não conseguimos ler os detalhes do produto nesta página. Tente adicionar as informações manualmente.' });
    }
});


// --- ROTAS CRUD (Criar, Ler, Atualizar, Deletar) PARA PRODUTOS ---
router.post('/', auth, async (req, res) => {
    const userId = req.user.userId;
    const { name, price, image, brand, description, urlOrigin, status, category, tags, priority, notes, listId } = req.body;

    if (!name || !price || !urlOrigin || !listId) {
        return res.status(400).json({ message: 'Campos obrigatórios (nome, preço, urlOrigin, listId) faltando.' });
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        return res.status(400).json({ message: 'Preço deve ser um número positivo.' });
    }

    try {
        const newProduct = new Product({
            name, price: parseFloat(price), image, brand, description, urlOrigin, userId, listId,
            status: status || 'pendente', category: category || 'Outros',
            tags: tags || [], priority: priority || 'Baixa', notes
        });
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao salvar produto.', details: error.toString() });
    }
});

router.get('/', auth, async (req, res) => {
    const { status, listId } = req.query;
    const userId = req.user.userId;
    const query = { userId: userId };
    if (status) {
        query.status = status;
    }
    if (listId) {
        query.listId = listId;
    }
    try {
        // Usar .lean() para performance e para poder modificar o objeto
        const products = await Product.find(query).sort({ createdAt: -1 }).lean();

        // Adicionar a flag isBestPrice
        const productsWithBestPriceFlag = products.map(product => {
            let isBestPrice = false;
            // O produto deve ter um histórico para ser comparado
            if (product.priceHistory && product.priceHistory.length > 0) {
                // Encontra o menor preço no histórico
                const minPriceInHistory = Math.min(...product.priceHistory.map(h => h.price));
                // Compara com o preço atual
                if (product.price <= minPriceInHistory) {
                    isBestPrice = true;
                }
            } else {
                isBestPrice = true; // Se não há histórico, o preço atual é o único (e melhor) preço.
            }
            return { ...product, isBestPrice };
        });

        res.json(productsWithBestPriceFlag);
    } catch (error) {
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
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

router.put('/:id', auth, async (req, res) => {
    const userId = req.user.userId;
    const updateData = req.body; // Recebe todos os dados enviados
    try {
        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, userId: userId },
            { $set: updateData }, { new: true, runValidators: true }
        );
        if (!product) { return res.status(404).json({ message: 'Produto não encontrado.' }); }
        res.json(product);
    } catch (error) {
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
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Rota para buscar o histórico de preços de um produto
router.get('/:id/history', auth, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: 'ID de produto inválido.' });
    }

    try {
        // Busca o produto pelo ID e userId, selecionando apenas o histórico de preços
        const product = await Product.findOne({ _id: id, userId: userId }).select('priceHistory');

        if (!product) {
            return res.status(404).json({ msg: 'Produto não encontrado.' });
        }

        // Ordena o histórico da data mais antiga para a mais nova, ideal para gráficos
        const sortedHistory = product.priceHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json(sortedHistory);
    } catch (err) {
        console.error(`Erro ao buscar histórico para o produto ${id}:`, err.message);
        res.status(500).send('Erro no Servidor');
    }
});

// Rota para atualizar os preços de múltiplos produtos
router.post('/refresh-prices', auth, async (req, res) => {
    const { productIds } = req.body;
    const userId = req.user.userId;

    if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ message: 'A lista de IDs de produtos é obrigatória.' });
    }

    try {
        const updatedProducts = [];
        const errors = [];

        // Processa sequencialmente para não sobrecarregar os sites de destino
        for (const id of productIds) {
            try {
                const product = await Product.findOne({ _id: id, userId });
                if (!product) {
                    errors.push({ id, error: 'Produto não encontrado.' });
                    continue;
                }

                let newDetails = null;
                try {
                    newDetails = await scrapeByAnalyzingHtml(product.urlOrigin);
                } catch (htmlError) {
                    newDetails = await scrapeBySearching(product.urlOrigin);
                }

                if (newDetails && newDetails.price && newDetails.price !== product.price) {
                    product.priceHistory.push({ price: product.price, date: new Date() });
                    product.price = newDetails.price;
                    if (newDetails.name) product.name = newDetails.name;
                    if (newDetails.image) product.image = newDetails.image;
                    
                    const savedProduct = await product.save();
                    updatedProducts.push(savedProduct);
                }
            } catch (e) {
                errors.push({ id, error: `Falha no scrape: ${e.message}` });
            }
        }

        res.json({ message: `Atualização concluída. ${updatedProducts.length} produtos atualizados.`, updatedProducts, errors });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor durante a atualização.', details: error.message });
    }
});

router.post('/:id/refresh', auth, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        const product = await Product.findOne({ _id: id, userId });
        if (!product) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        let newDetails = null;
        try {
            newDetails = await scrapeByAnalyzingHtml(product.urlOrigin);
        } catch (htmlError) {
            console.warn(`[Scrape HTML] Falhou para ${id}, tentando com busca...`);
            try {
                newDetails = await scrapeBySearching(product.urlOrigin);
            } catch (searchError) {
                console.error(`[Scrape Busca] Também falhou para ${id}`);
                throw searchError; // Lança o erro para ser capturado abaixo
            }
        }

        if (newDetails && newDetails.price && newDetails.price !== product.price) {
            product.priceHistory.push({ price: product.price, date: new Date() });
            product.price = newDetails.price;
            if (newDetails.name) product.name = newDetails.name;
            if (newDetails.image) product.image = newDetails.image;
            
            const savedProduct = await product.save();
            return res.json({ updated: true, product: savedProduct });
        } else {
            return res.json({ updated: false, product: product });
        }
    } catch (e) {
        console.error(`Falha no scrape para o produto ${id}:`, e.message);
        return res.status(500).json({ message: `Falha no scrape: ${e.message}` });
    }
});

module.exports = router;