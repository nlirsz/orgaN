// src/routes/connections.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Para não precisar criar um novo Model, vamos usar uma coleção simples
// que pode ser reutilizada para outras métricas no futuro.
const SystemMetricSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: Number, default: 0 }
});

// Usamos mongoose.models para evitar recriar o modelo em cada chamada (comum em ambientes serverless)
const SystemMetric = mongoose.models.SystemMetric || mongoose.model('SystemMetric', SystemMetricSchema);
const CONNECTION_KEY = 'belvoConnectionsCount';

// --- Rota para obter a contagem atual ---
router.get('/count', async (req, res) => {
    try {
        const metric = await SystemMetric.findOne({ key: CONNECTION_KEY });
        res.json({ count: metric ? metric.value : 0 });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar contagem de conexões.' });
    }
});

// --- Rota para incrementar a contagem (quando uma conta é conectada) ---
router.post('/increment', async (req, res) => {
    try {
        const metric = await SystemMetric.findOneAndUpdate(
            { key: CONNECTION_KEY },
            { $inc: { value: 1 } },
            { new: true, upsert: true } // `new` retorna o doc atualizado, `upsert` cria se não existir
        );
        res.json({ count: metric.value });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao incrementar contagem.' });
    }
});

// --- Rota para decrementar a contagem (quando uma conta é desconectada) ---
router.post('/decrement', async (req, res) => {
    try {
        const metric = await SystemMetric.findOneAndUpdate(
            { key: CONNECTION_KEY },
            { $inc: { value: -1 } },
            { new: true, upsert: true }
        );
        // Garante que o contador não fique negativo
        if (metric.value < 0) {
            metric.value = 0;
            await metric.save();
        }
        res.json({ count: metric.value });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao decrementar contagem.' });
    }
});

module.exports = router;