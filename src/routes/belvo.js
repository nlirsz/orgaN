// OBJETIVO: Usar as variáveis de ambiente em vez de colocar as chaves no código.

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const User = require('../models/User');

// --- Configuração das credenciais da Belvo a partir do .env ---
const BELVO_API_URL = '[https://sandbox.belvo.com](https://sandbox.belvo.com)';

// O Node.js lê as variáveis do .env e as coloca em 'process.env'
const BELVO_SECRET_ID = process.env.BELVO_SECRET_ID;
const BELVO_SECRET_PASSWORD = process.env.BELVO_SECRET_PASSWORD;

// Função para obter o Token de Acesso da Belvo
const getBelvoAccessToken = async () => {
    // Verifica se as chaves foram carregadas do .env
    if (!BELVO_SECRET_ID || !BELVO_SECRET_PASSWORD) {
        throw new Error('As credenciais da Belvo não foram encontradas no arquivo .env');
    }

    const response = await fetch(`${BELVO_API_URL}/api/token/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // A lógica aqui usa as constantes que leem do process.env
            'Authorization': 'Basic ' + Buffer.from(`${BELVO_SECRET_ID}:${BELVO_SECRET_PASSWORD}`).toString('base64')
        },
        body: JSON.stringify({
            scope: 'read_institutions,links,accounts,transactions',
            grant_type: 'client_credentials'
        })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || 'Falha ao obter token da Belvo');
    }
    return data.access;
};

// Rota para obter o token para o widget do frontend
router.post('/get-widget-token', async (req, res) => {
    try {
        const belvoAccessToken = await getBelvoAccessToken();
        res.json({ access: belvoAccessToken });
    } catch (error) {
        console.error('Erro ao obter token do widget Belvo:', error.message);
        res.status(500).json({ message: 'Erro no servidor ao comunicar com a Belvo.' });
    }
});

// O resto das rotas (register-link, financial-data) continua exatamente igual,
// pois elas já usam as constantes BELVO_SECRET_ID e BELVO_SECRET_PASSWORD.
// ... (código das outras rotas aqui) ...

router.post('/register-link', async (req, res) => {
    const { linkId, userId } = req.body;
    if (!linkId || !userId) {
        return res.status(400).json({ message: 'linkId e userId são obrigatórios' });
    }
    try {
        await User.findByIdAndUpdate(userId, { $push: { belvoLinks: linkId } });
        res.status(200).json({ message: 'Link registrado com sucesso!' });
    } catch (error) {
        console.error('Erro ao registrar link da Belvo:', error);
        res.status(500).json({ message: 'Erro ao salvar link' });
    }
});

router.get('/financial-data', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId é obrigatório' });

    try {
        const user = await User.findById(userId);
        if (!user || !user.belvoLinks || user.belvoLinks.length === 0) {
            return res.json({ accounts: [], transactions: [] });
        }

        const allData = { accounts: [], transactions: [] };

        for (const linkId of user.belvoLinks) {
            const authHeader = 'Basic ' + Buffer.from(`${BELVO_SECRET_ID}:${BELVO_SECRET_PASSWORD}`).toString('base64');
            
            const accountsResponse = await fetch(`${BELVO_API_URL}/api/accounts/?link=${linkId}`, {
                headers: { 'Authorization': authHeader }
            });
            const accountsData = await accountsResponse.json();
            if (accountsData.results) allData.accounts.push(...accountsData.results);

            const transactionsResponse = await fetch(`${BELVO_API_URL}/api/transactions/?link=${linkId}`, {
                 headers: { 'Authorization': authHeader }
            });
            const transactionsData = await transactionsResponse.json();
            if(transactionsData.results) allData.transactions.push(...transactionsData.results);
        }

        res.json(allData);

    } catch (error) {
        console.error('Erro ao buscar dados da Belvo:', error);
        res.status(500).json({ message: 'Erro ao buscar dados financeiros' });
    }
});


module.exports = router;