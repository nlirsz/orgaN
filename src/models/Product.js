const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: [true, "Nome do produto é obrigatório"] },
    price: { type: Number, required: [true, "Preço do produto é obrigatório"], min: [0.01, "Preço deve ser positivo"] },
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
    purchasedAt: { type: Date } // Data em que o produto foi marcado como comprado
}, { 
    timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

// Adicionar um índice composto pode ser útil para queries comuns
productSchema.index({ userId: 1, status: 1 });
productSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);