const mongoose = require('mongoose');

// Price history subdocument schema
const PriceHistorySchema = new mongoose.Schema({
    price: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});

// Main product schema
const ProductSchema = new mongoose.Schema({
    name: { type: String, required: [true, "Nome do produto é obrigatório"] },
    price: { type: Number, required: [true, "Preço do produto é obrigatório"], min: [0.01, "Preço deve ser positivo"] },
    // Dentro do seu ficheiro src/models/Product.js
    
    // ... outros campos do seu ProductSchema
        listId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'List',
            required: [true, 'O produto deve pertencer a uma lista.']
        },
    
    image: { type: String }, // URL da imagem
    brand: { type: String },
    description: { type: String },
    urlOrigin: { type: String, required: [true, "URL de origem do produto é obrigatória"] },
    userId: { type: String, required: [true, "ID do usuário é obrigatório"] }, // No futuro, pode ser mongoose.Schema.Types.ObjectId referenciando um User model
    status: {
        type: String,
        enum: {
            values: ['pendente', 'comprado', 'descartado'],
            message: '{VALUE} não é um status suportado. Use pendente, comprado ou descartado.'
        },
        default: 'pendente',
    },
    purchasedAt: { type: Date }, // Data em que o produto foi marcado como comprado
    category: { type: String },    // NOVO: Categoria do produto
    tags: [{ type: String }],      // NOVO: Array de tags
    priority: {                    // NOVO: Prioridade
        type: String,
        enum: ['Baixa', 'Média', 'Alta'],
        default: 'Baixa'
    },
    notes: { type: String },        // NOVO: Notas adicionais
    priceHistory: [PriceHistorySchema]
}, {
    timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

// Adicionar um índice composto pode ser útil para queries comuns
ProductSchema.index({ userId: 1, status: 1 });
ProductSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Product', ProductSchema);
