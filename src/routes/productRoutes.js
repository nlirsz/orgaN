// Em seu arquivo de rotas, ex: routes/productRoutes.js

const express = require('express');
const router = express.Router();
const Product = require('../models/Product'); // Ajuste o caminho para o seu modelo
const mongoose = require('mongoose');

/**
 * @route   GET /api/products/:id/history
 * @desc    Busca o histórico de preços de um produto específico
 * @access  Public
 */
router.get('/:id/history', async (req, res) => {
    try {
        const { id } = req.params;

        // Valida se o ID é um ObjectId válido do MongoDB
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ msg: 'ID de produto inválido.' });
        }

        // Busca o produto pelo ID e seleciona apenas o campo priceHistory
        const product = await Product.findById(id).select('priceHistory');

        if (!product) {
            return res.status(404).json({ msg: 'Produto não encontrado.' });
        }

        // Retorna o histórico de preços ordenado pela data mais recente primeiro
        const sortedHistory = product.priceHistory.sort((a, b) => b.date - a.date);

        res.json(sortedHistory);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
});

// Exporte o router para ser usado no seu arquivo principal do Express
module.exports = router;
