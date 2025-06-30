// -----------------------------------------------------------------------------
// ARQUIVO: src/routes/belvo.js
// OBJETIVO: Ponto de acesso seguro para comunicar com a API da Belvo, com logs de diagnóstico.
// -----------------------------------------------------------------------------

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const User = require('../models/User');

console.log('>>> [ROTA] Ficheiro belvo.js carregado.');

// --- Configuração das Credenciais da Belvo ---
const BELVO_API_URL = 'https://sandbox.belvo.com';
const BELVO_SECRET_ID = process.env.BELVO_SECRET_ID;
const BELVO_SECRET_PASSWORD = process.env.BELVO_SECRET_PASSWORD;

// ** LOG DE DIAGNÓSTICO **
// Esta mensagem ajuda a confirmar se o seu ficheiro .env está a ser lido.
if (!BELVO_SECRET_ID || !BELVO_SECRET_PASSWORD) {
    console.error('>>> [ERRO CRÍTICO] As credenciais BELVO_SECRET_ID ou BELVO_SECRET_PASSWORD não foram encontradas no .env!');
} else {
    console.log('>>> [DIAGNÓSTICO] Credenciais da Belvo carregadas do .env com sucesso.');
}

// Função para obter o Token de Acesso da Belvo
const getBelvoAccessToken = async () => {
    if (!BELVO_SECRET_ID || !BELVO_SECRET_PASSWORD) {
        throw new Error('As credenciais da Belvo não foram configuradas no servidor.');
    }
    
    console.log('>>> [DIAGNÓSTICO] A tentar obter token de acesso da Belvo...');
    const response = await fetch(`${BELVO_API_URL}/api/token/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(`${BELVO_SECRET_ID}:${BELVO_SECRET_PASSWORD}`).toString('base64')
        },
        body: JSON.stringify({ scope: 'read_institutions,links,accounts,transactions', grant_type: 'client_credentials' })
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('>>> [ERRO API BELVO] Resposta da Belvo ao pedir token:', data);
        throw new Error(data.detail || 'Falha ao autenticar com a Belvo. Verifique as suas credenciais.');
    }
    
    console.log('>>> [SUCESSO] Token de acesso da Belvo obtido.');
    return data.access;
};

// --- ROTAS DA API ---

// Rota 1: O frontend chama esta rota para obter um token para o widget
router.post('/get-widget-token', async (req, res) => {
    console.log('>>> [ROTA] Recebido pedido para /get-widget-token');
    try {
        const belvoAccessToken = await getBelvoAccessToken();
        res.json({ access: belvoAccessToken });
    } catch (error) {
        console.error('>>> [ERRO] Falha na rota /get-widget-token:', error.message);
        res.status(500).json({ message: 'Erro no servidor ao comunicar com a Belvo.' });
    }
});

// Rota 2: O frontend envia o link_id para o backend após o sucesso do widget
router.post('/register-link', async (req, res) => {
    const { linkId, userId } = req.body;
    if (!linkId || !userId) {
        return res.status(400).json({ message: 'linkId e userId são obrigatórios.' });
    }
    try {
        await User.findByIdAndUpdate(userId, { $push: { belvoLinks: linkId } });
        res.status(200).json({ message: 'Link registado com sucesso!' });
    } catch (error) {
        console.error('Erro ao registar link da Belvo na base de dados:', error);
        res.status(500).json({ message: 'Erro ao guardar a ligação da conta.' });
    }
});

// Rota 3: O frontend pede os dados financeiros, e o backend busca na Belvo
router.get('/financial-data', async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ message: 'userId é obrigatório.' });
    }
    try {
        const user = await User.findById(userId);
        if (!user || !user.belvoLinks || user.belvoLinks.length === 0) {
            return res.json({ accounts: [], transactions: [] });
        }

        const allData = { accounts: [], transactions: [] };
        const authHeader = 'Basic ' + Buffer.from(`${BELVO_SECRET_ID}:${BELVO_SECRET_PASSWORD}`).toString('base64');

        for (const linkId of user.belvoLinks) {
            const accountsResponse = await fetch(`${BELVO_API_URL}/api/accounts/?link=${linkId}`, {
                headers: { 'Authorization': authHeader }
            });
            const accountsData = await accountsResponse.json();
            if (accountsData.results) {
                allData.accounts.push(...accountsData.results);
            }

            const transactionsResponse = await fetch(`${BELVO_API_URL}/api/transactions/?link=${linkId}`, {
                 headers: { 'Authorization': authHeader }
            });
            const transactionsData = await transactionsResponse.json();
            if(transactionsData.results) {
                allData.transactions.push(...transactionsData.results);
            }
        }
        
        res.json(allData);

    } catch (error) {
        console.error('Erro ao buscar dados financeiros da Belvo:', error);
        res.status(500).json({ message: 'Erro ao buscar dados financeiros.' });
    }
});

module.exports = router;
