const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const List = require('../models/List');
const Product = require('../models/Product');

// @route   GET /api/lists
// @desc    Get all lists for a user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const lists = await List.find({ userId: req.user.userId }).sort({ createdAt: 'asc' });
        res.json(lists);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
});

// @route   POST /api/lists
// @desc    Create a new list
// @access  Private
router.post('/', auth, async (req, res) => {
    const { name, description } = req.body;

    try {
        const newList = new List({
            name,
            description,
            userId: req.user.userId
        });

        const list = await newList.save();
        res.status(201).json(list);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).send('Erro no Servidor');
    }
});

// @route   PUT /api/lists/:id
// @desc    Update a list
// @access  Private
router.put('/:id', auth, async (req, res) => {
    const { name, description } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (typeof description !== 'undefined') updateData.description = description;

    try {
        let list = await List.findById(req.params.id);

        if (!list) {
            return res.status(404).json({ message: 'Lista não encontrada.' });
        }

        if (list.userId.toString() !== req.user.userId) {
            return res.status(401).json({ message: 'Não autorizado.' });
        }

        list = await List.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.json(list);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
});

// @route   DELETE /api/lists/:id
// @desc    Delete a list and its products
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const list = await List.findById(req.params.id);

        if (!list) {
            return res.status(404).json({ message: 'Lista não encontrada.' });
        }

        if (list.userId.toString() !== req.user.userId) {
            return res.status(401).json({ message: 'Não autorizado.' });
        }

        // Decisão de design: Excluir produtos associados.
        // Alternativa seria movê-los para uma lista "Geral" ou deixá-los órfãos.
        await Product.deleteMany({ listId: req.params.id, userId: req.user.userId });

        await List.findByIdAndDelete(req.params.id);

        res.json({ message: 'Lista e todos os produtos associados foram excluídos.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
});

module.exports = router;
