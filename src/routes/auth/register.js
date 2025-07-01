const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const User = require('../../models/User');
const List = require('../../models/List');

// @route   POST /api/auth/register
// @desc    Regista um novo utilizador e cria uma lista padrão "Geral"
// @access  Public
router.post('/', async (req, res) => {
    const { username, email, password, 'g-recaptcha-response': recaptchaResponse } = req.body;

    // 1. (Opcional, mas recomendado) Validar reCAPTCHA no ambiente de produção
    if (process.env.NODE_ENV === 'production') {
        if (!recaptchaResponse) {
            return res.status(400).json({ message: 'Por favor, complete o reCAPTCHA.' });
        }
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        if (!secretKey) {
            console.error("ERRO: RECAPTCHA_SECRET_KEY não está definida no ambiente.");
            return res.status(500).json({ message: 'Erro de configuração do servidor.' });
        }
        const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaResponse}`;

        try {
            const recaptchaResult = await fetch(verificationURL, { method: 'POST' }).then(res => res.json());
            if (!recaptchaResult.success) {
                return res.status(400).json({ message: 'Falha na verificação do reCAPTCHA. Tente novamente.' });
            }
        } catch (error) {
            console.error("Erro ao verificar reCAPTCHA:", error);
            return res.status(500).json({ message: 'Erro no servidor ao verificar o reCAPTCHA.' });
        }
    }

    // 2. Validar dados do utilizador
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Por favor, preencha todos os campos obrigatórios.' });
    }

    try {
        // 3. Verificar se o utilizador ou e-mail já existem
        let user = await User.findOne({ $or: [{ username }, { email }] });
        if (user) {
            return res.status(400).json({ message: 'Utilizador ou e-mail já existe.' });
        }

        // 4. Criar e guardar o novo utilizador
        user = new User({ username, email, password });
        await user.save();

        // 5. ✨ A MÁGICA ACONTECE AQUI: Criar a lista padrão "Geral"
        try {
            const defaultList = new List({
                name: 'Geral',
                description: 'Sua lista de desejos principal.',
                userId: user._id
            });
            await defaultList.save();
            console.log(`Lista 'Geral' criada com sucesso para o utilizador ${user.username}`);
        } catch (listError) {
            // Se a criação da lista falhar, não impede o registo. Apenas regista o erro.
            console.error(`Falha ao criar lista padrão para o utilizador ${user.username} (ID: ${user._id}):`, listError);
        }

        // 6. Enviar resposta de sucesso
        res.status(201).json({ message: 'Utilizador registado com sucesso!' });

    } catch (error) {
        console.error('Erro no registo do utilizador:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

module.exports = router;