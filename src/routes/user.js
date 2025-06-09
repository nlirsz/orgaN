// Crie o arquivo src/routes/user.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @route   POST /api/user/change-password
// @desc    Altera a senha do usuário logado
// @access  Private
router.post('/change-password', auth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
    }

    if (newPassword.length < 6) { // Mantenha a mesma validação do seu model User.js
        return res.status(400).json({ message: 'A nova senha deve ter no mínimo 6 caracteres.' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Verifica se a senha atual está correta
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'A senha atual está incorreta.' });
        }

        // Atualiza para a nova senha (o hook 'pre-save' no model fará o hash)
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Senha alterada com sucesso!' });

    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

module.exports = router;