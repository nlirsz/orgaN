// src/routes/finances.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // CORRIGIDO
const FinanceEntry = require('../models/FinanceEntry'); // CORRIGIDO

router.get('/', auth, async (req, res) => {
    const userId = req.user.userId;
    try {
        const financeEntries = await FinanceEntry.find({ userId }).sort({ mes_ano: -1 });
        res.json(financeEntries);
    } catch (error) {
        console.error('[finances.js GET /] Erro ao buscar finanças:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar finanças.' });
    }
});

router.post('/', auth, async (req, res) => {
    const userId = req.user.userId;
    const { mes_ano, receita, gastos } = req.body;

    if (!mes_ano || isNaN(parseFloat(receita)) || isNaN(parseFloat(gastos))) { // Validar parseFloat
        return res.status(400).json({ message: 'Campos obrigatórios (mês/ano, receita, gastos) faltando ou inválidos.' });
    }
    if (!mes_ano.match(/^\d{4}-\d{2}$/)) {
        return res.status(400).json({ message: 'Formato de mês/ano inválido. Use AAAA-MM.' });
    }

    try {
        let existingEntry = await FinanceEntry.findOne({ userId, mes_ano });
        if (existingEntry) {
            return res.status(409).json({ message: `Já existe um registro financeiro para ${mes_ano}.` });
        }
        const newEntry = new FinanceEntry({
            userId, mes_ano,
            receita: parseFloat(receita),
            gastos: parseFloat(gastos)
        });
        const savedEntry = await newEntry.save();
        res.status(201).json(savedEntry);
    } catch (error) {
        console.error('[finances.js POST /] Erro ao adicionar registro:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Erro de validação.', details: Object.values(error.errors).map(val => val.message) });
        }
        if (error.code === 11000) { // Conflito de chave única
             return res.status(409).json({ message: `Já existe um registro para ${mes_ano}.` });
        }
        res.status(500).json({ message: 'Erro ao salvar registro financeiro.', details: error.toString() });
    }
});

router.put('/:id', auth, async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;
    const { mes_ano, receita, gastos } = req.body;

    if (!mes_ano || isNaN(parseFloat(receita)) || isNaN(parseFloat(gastos))) {
        return res.status(400).json({ message: 'Campos obrigatórios faltando ou inválidos para atualização.' });
    }
    if (!mes_ano.match(/^\d{4}-\d{2}$/)) {
        return res.status(400).json({ message: 'Formato de mês/ano inválido. Use AAAA-MM.' });
    }

    try {
        // Verificar se o novo mes_ano já existe para este usuário (excluindo o documento atual)
        const conflictingEntry = await FinanceEntry.findOne({ userId, mes_ano, _id: { $ne: id } });
        if (conflictingEntry) {
            return res.status(409).json({ message: `Já existe um registro financeiro para ${mes_ano}. Não é possível duplicar.` });
        }

        const updatedEntry = await FinanceEntry.findOneAndUpdate(
            { _id: id, userId: userId },
            { mes_ano, receita: parseFloat(receita), gastos: parseFloat(gastos) },
            { new: true, runValidators: true }
        );
        if (!updatedEntry) {
            return res.status(404).json({ message: 'Registro financeiro não encontrado.' });
        }
        res.json(updatedEntry);
    } catch (error) {
        console.error(`[finances.js PUT /:id] Erro ao atualizar registro ${id}:`, error);
        if (error.name === 'CastError') { return res.status(400).json({ message: 'ID do registro inválido.' }); }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Erro de validação.', details: Object.values(error.errors).map(val => val.message) });
        }
        if (error.code === 11000) {
             return res.status(409).json({ message: 'Já existe um registro para este mês/ano.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

router.delete('/:id', auth, async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;
    try {
        const result = await FinanceEntry.deleteOne({ _id: id, userId: userId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Registro financeiro não encontrado.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error(`[finances.js DELETE /:id] Erro ao excluir registro ${id}:`, error);
        if (error.name === 'CastError') { return res.status(400).json({ message: 'ID do registro inválido.' }); }
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

module.exports = router;