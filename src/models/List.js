const mongoose = require('mongoose');

const ListSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'O nome da lista é obrigatório.'],
        trim: true,
        maxlength: [100, 'O nome da lista não pode exceder 100 caracteres.']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'A descrição não pode exceder 500 caracteres.']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

module.exports = mongoose.model('List', ListSchema);
