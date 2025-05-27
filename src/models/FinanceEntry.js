// src/models/FinanceEntry.js

const mongoose = require('mongoose');

const financeEntrySchema = new mongoose.Schema({
    userId: { // Para vincular o registro financeiro a um usuário específico
        type: String, // Ou mongoose.Schema.Types.ObjectId, se tiver um modelo de usuário referenciado
        required: true,
        index: true // Adicionar um índice para buscas eficientes por usuário
    },
    mes_ano: { // Ex: "2024-05"
        type: String,
        required: true,
        match: /^\d{4}-\d{2}$/ // Garante o formato AAAA-MM
    },
    receita: { // Receita para o mês
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    gastos: { // Gastos para o mês
        type: Number,
        required: true,
        min: 0,
        default: 0
    }
}, {
    timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

// Adicionar um índice único composto para garantir que cada usuário só tenha um registro por mês
financeEntrySchema.index({ userId: 1, mes_ano: 1 }, { unique: true });

module.exports = mongoose.model('FinanceEntry', financeEntrySchema);