const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Referencia o seu modelo de Usuário, se tiver um
        required: true,
    },
    originalURL: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        default: null, // Permite que o preço seja nulo se não for encontrado
    },
    imageUrl: {
        type: String,
    },
    description: {
        type: String,
    },
    brand: {
        type: String,
    },
    availability: {
        type: Boolean,
        default: false,
    },
    processingError: {
        type: String, // Para guardar mensagens de erro do Gemini, se houver
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Product', ProductSchema);