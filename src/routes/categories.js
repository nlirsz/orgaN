// src/routes/categories.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Category = require('../models/Category');

// GET: Listar todas as categorias do usuário
router.get('/', auth, async (req, res) => {
    try {
        const categories = await Category.find({ userId: req.user.userId }).sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar categorias.' });
    }
});

// POST: Adicionar uma nova categoria
router.post('/', auth, async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'O nome da categoria é obrigatório.' });
    }
    try {
        const newCategory = new Category({ name, userId: req.user.userId });
        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Essa categoria já existe.' });
        }
        res.status(500).json({ message: 'Erro ao criar categoria.' });
    }
});

// DELETE: Remover uma categoria
router.delete('/:id', auth, async (req, res) => {
    try {
        const category = await Category.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
        if (!category) {
            return res.status(404).json({ message: 'Categoria não encontrada.' });
        }
        res.status(204).send(); // Sucesso, sem conteúdo
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar categoria.' });
    }
});

module.exports = router;