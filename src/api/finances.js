// src/routes/finances.js
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth'); // Ajustado o caminho
const FinanceEntry = require('../../models/FinanceEntry'); // Ajustado o caminho

// Rota GET para listar registros financeiros
router.get('/', auth, async (req, res) => {
    const userId = req.user.userId;

    try {
        // Busca todos os registros financeiros para o userId autenticado
        const financeEntries = await FinanceEntry.find({ userId }).sort({ mes_ano: -1 }); // Ordena do mais recente
        res.json(financeEntries);
    } catch (error) {
        console.error('[API /finances GET] Erro ao buscar finanças:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar finanças.' });
    }
});

// Rota POST para adicionar um novo registro financeiro
router.post('/', auth, async (req, res) => {
    const userId = req.user.userId; // Obtém userId do token JWT

    const { mes_ano, receita, gastos } = req.body;

    // Validação básica
    if (!mes_ano || isNaN(receita) || isNaN(gastos)) {
        return res.status(400).json({ message: 'Campos obrigatórios (mês/ano, receita, gastos) estão faltando ou são inválidos.' });
    }
    if (!mes_ano.match(/^\d{4}-\d{2}$/)) {
        return res.status(400).json({ message: 'Formato de mês/ano inválido. Use AAAA-MM.' });
    }

    try {
        // Tenta encontrar um registro existente para o mesmo mês/ano e usuário
        let existingEntry = await FinanceEntry.findOne({ userId, mes_ano });
        if (existingEntry) {
            return res.status(409).json({ message: `Já existe um registro financeiro para ${mes_ano}. Por favor, edite-o.` });
        }

        const newEntry = new FinanceEntry({
            userId,
            mes_ano,
            receita: parseFloat(receita),
            gastos: parseFloat(gastos)
        });

        const savedEntry = await newEntry.save();
        res.status(201).json(savedEntry);

    } catch (error) {
        console.error('[API /finances POST] Erro ao adicionar registro financeiro:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: 'Erro de validação ao salvar registro.', details: messages });
        }
        res.status(500).json({ message: 'Erro ao salvar o registro financeiro no banco de dados.', details: error.toString() });
    }
});

// Rota PUT para atualizar um registro financeiro
router.put('/:id', auth, async (req, res) => {
    const userId = req.user.userId; // Obtém userId do token JWT
    const { id } = req.params;
    const { mes_ano, receita, gastos } = req.body;

    // Validação básica
    if (!mes_ano || isNaN(receita) || isNaN(gastos)) {
        return res.status(400).json({ message: 'Campos obrigatórios (mês/ano, receita, gastos) estão faltando ou são inválidos para atualização.' });
    }
    if (!mes_ano.match(/^\d{4}-\d{2}$/)) {
        return res.status(400).json({ message: 'Formato de mês/ano inválido. Use AAAA-MM.' });
    }

    try {
        // Tenta encontrar e atualizar o registro, garantindo que pertença ao usuário logado
        const updatedEntry = await FinanceEntry.findOneAndUpdate(
            { _id: id, userId: userId }, // Filtra por ID do registro E userId
            { mes_ano, receita: parseFloat(receita), gastos: parseFloat(gastos) },
            { new: true, runValidators: true } // Retorna o documento atualizado e executa validações
        );

        if (!updatedEntry) {
            return res.status(404).json({ message: 'Registro financeiro não encontrado ou não pertence a este usuário.' });
        }
        res.json(updatedEntry);

    } catch (error) {
        console.error(`[API /finances PUT] Erro ao atualizar registro financeiro ${id}:`, error);
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID do registro financeiro inválido.' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: 'Erro de validação ao atualizar registro.', details: messages });
        }
        if (error.code === 11000) { // Erro de duplicidade (índice único)
             return res.status(409).json({ message: 'Já existe um registro para este mês/ano para este usuário. Por favor, escolha outro mês ou edite o registro existente.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar registro financeiro.' });
    }
});

// Rota DELETE para excluir um registro financeiro
router.delete('/:id', auth, async (req, res) => {
    const userId = req.user.userId; // Obtém userId do token JWT
    const { id } = req.params;

    try {
        // Tenta encontrar e deletar o registro, garantindo que pertença ao usuário logado
        const result = await FinanceEntry.deleteOne({ _id: id, userId: userId }); // Filtra por ID do registro E userId

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Registro financeiro não encontrado ou não pertence a este usuário.' });
        }
        res.status(204).send(); // Resposta 204 indica sucesso sem conteúdo de retorno

    } catch (error) {
        console.error(`[API /finances DELETE] Erro ao excluir registro financeiro ${id}:`, error);
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID do registro financeiro inválido.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao excluir registro financeiro.' });
    }
});

module.exports = router;