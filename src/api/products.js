// Arquivo: src/api/products.js (BACKEND)

const express = require('express');
const router = express.Router();
// Caminhos ajustados para refletir a estrutura src/api/, src/models/, src/middleware/
const Product = require('../models/Product'); 
const auth = require('../middleware/auth');    
const { extractProductDataFromUrl } = require('./scrape-gemini'); // scrape-gemini.js está na mesma pasta 'api'

// ... (todo o restante do seu código de rotas permanece o mesmo) ...

router.post('/', /* auth, */ async (req, res) => {
    try {
        const { url, name: formName, price: formPrice, imageUrl: formImageUrl } = req.body;
        const userId = '6831e3fe888215b3f1e5a933'; 

        if (!url) {
            return res.status(400).json({ error: 'A URL do produto é obrigatória.' });
        }

        console.log(`Backend: Iniciando adição de produto com URL: ${url} para usuário: ${userId}`);
        const productDetails = await extractProductDataFromUrl(url);

        if (productDetails.error) {
            console.error("Backend: Falha ao extrair dados da URL via Gemini:", productDetails.error);
            return res.status(422).json({ error: `Não foi possível processar a URL: ${productDetails.error}` });
        }

        const newProduct = new Product({
            userId,
            originalURL: url,
            name: formName || productDetails.nome || 'Nome não encontrado',
            price: formPrice || productDetails.preco,                     
            imageUrl: formImageUrl || productDetails.imagemUrl,           
            description: productDetails.descricao, // Assumindo que o Gemini pode retornar isso
            brand: productDetails.marca,           // Assumindo que o Gemini pode retornar isso
            status: 'pendente' 
        });

        await newProduct.save();
        res.status(201).json({
            message: "Produto adicionado com sucesso!",
            product: newProduct, 
        });

    } catch (error) {
        console.error('Erro crítico na rota POST /api/products:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao adicionar produto.' });
    }
});

router.get('/', /* auth, */ async (req, res) => {
    try {
        const userId = '6831e3fe888215b3f1e5a933'; 
        let query = { userId: userId }; 
        if (req.query.status) {
            query.status = req.query.status;
        }
        console.log("Backend: Buscando produtos com query:", query);
        const products = await Product.find(query).sort({ createdAt: -1 });
        res.json(products); 
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ error: 'Erro ao buscar produtos no servidor.' });
    }
});

router.get('/:id', /* auth, */ async (req, res) => {
    try {
        const userId = '6831e3fe888215b3f1e5a933'; 
        const product = await Product.findOne({ _id: req.params.id, userId: userId });
        if (!product) {
            return res.status(404).json({ error: 'Produto não encontrado ou não pertence ao usuário.' });
        }
        res.json(product); 
    } catch (error) {
        console.error('Erro ao buscar produto por ID:', error);
        if (error.kind === 'ObjectId') { 
             return res.status(400).json({ error: 'ID do produto inválido.' });
        }
        res.status(500).json({ error: 'Erro ao buscar produto por ID no servidor.' });
    }
});

router.put('/:id', /* auth, */ async (req, res) => {
    try {
        const userId = '6831e3fe888215b3f1e5a933'; 
        const { url, name: formName, price: formPrice, imageUrl: formImageUrl } = req.body;

        if (!url) { 
            return res.status(400).json({ error: 'A URL do produto é obrigatória para atualização.' });
        }
        
        console.log(`Backend: Atualizando produto ID ${req.params.id}`);
        const productDetails = await extractProductDataFromUrl(url);

        if (productDetails.error) {
            return res.status(422).json({ error: `Não foi possível processar a URL para atualização: ${productDetails.error}` });
        }

        const updatedFields = {
            originalURL: url,
            name: formName || productDetails.nome || 'Nome não encontrado',
            price: formPrice || productDetails.preco,
            imageUrl: formImageUrl || productDetails.imagemUrl,
            description: productDetails.descricao,
            brand: productDetails.marca,
        };

        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, userId: userId },
            { $set: updatedFields },
            { new: true } 
        );

        if (!product) {
            return res.status(404).json({ error: 'Produto não encontrado para atualização ou não pertence ao usuário.' });
        }
        res.json({ message: "Produto atualizado com sucesso!", product });

    } catch (error) {
        console.error(`Erro ao atualizar produto ID ${req.params.id}:`, error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ error: 'ID do produto inválido.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor ao atualizar produto.' });
    }
});

router.put('/:id/purchase', /* auth, */ async (req, res) => {
    try {
        const userId = '6831e3fe888215b3f1e5a933'; 
        
        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, userId: userId },
            { $set: { status: 'comprado' } }, 
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ error: 'Produto não encontrado para marcar como comprado ou não pertence ao usuário.' });
        }
        console.log(`Backend: Produto ID ${req.params.id} marcado como comprado.`);
        res.json({ message: "Produto marcado como comprado!", product });

    } catch (error) {
        console.error(`Erro ao marcar produto ID ${req.params.id} como comprado:`, error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ error: 'ID do produto inválido.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor ao marcar como comprado.' });
    }
});

router.delete('/:id', /* auth, */ async (req, res) => {
    try {
        const userId = '6831e3fe888215b3f1e5a933'; 
        
        const product = await Product.findOneAndDelete({ _id: req.params.id, userId: userId });

        if (!product) {
            return res.status(404).json({ error: 'Produto não encontrado para exclusão ou não pertence ao usuário.' });
        }
        console.log(`Backend: Produto ID ${req.params.id} excluído.`);
        res.json({ message: 'Produto excluído com sucesso!' });

    } catch (error) {
        console.error(`Erro ao excluir produto ID ${req.params.id}:`, error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ error: 'ID do produto inválido.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor ao excluir produto.' });
    }
});

module.exports = router;