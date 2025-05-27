// src/models/Finance.js
const mongoose = require('mongoose');
const financeSchema = new mongoose.Schema({
    mes_ano: { type: String, required: true }, // Formato "AAAA-MM"
    receita: { type: Number, required: true, default: 0 },
    gastos: { type: Number, required: true, default: 0 },
    userId: { type: String, required: true }, // Ou mongoose.Schema.Types.ObjectId referenciando 'User'
    // Poderia adicionar campos calculados ou outras informações se necessário
}, { timestamps: true });

financeSchema.index({ userId: 1, mes_ano: 1 }, { unique: true }); // Um usuário só pode ter um registro por mês/ano
module.exports = mongoose.model('Finance', financeSchema);