// src/routes/belvo.js

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const User = require('../models/User');

console.log('>>> [ROTA] Arquivo belvo.js carregado.');

// Determina a URL da API da Belvo com base no ambiente (produção ou desenvolvimento)
const BELVO_API_URL = process.env.NODE_ENV === 'production' 
    ? 'https://api.belvo.com' 
    : 'https://sandbox.belvo.com';

const BELVO_SECRET_ID = process.env.BELVO_SECRET_ID;
const BELVO_SECRET_PASSWORD = process.env.BELVO_SECRET_PASSWORD;

// Log de diagnóstico para confirmar o carregamento das variáveis de ambiente
if (!BELVO_SECRET_ID || !BELVO_SECRET_PASSWORD) {
    console.error('>>> [ERRO CRÍTICO] As credenciais BELVO_SECRET_ID ou BELVO_SECRET_PASSWORD não foram encontradas!');
} else {
    console.log('>>> [DIAGNÓSTICO] Credenciais da Belvo carregadas.');
}

// --- ROTAS DA API ---

/**
 * @route   POST /api/belvo/get-widget-token
 * @desc    Obtém um token de acesso para inicializar o Widget do Belvo Connect.
 * @access  Private
 */
router.post('/get-widget-token', async (req, res) => {
    console.log('>>> [ROTA] Recebido pedido para /get-widget-token');
    
    if (!BELVO_SECRET_ID || !BELVO_SECRET_PASSWORD) {
        console.error('>>> [ERRO] Tentativa de gerar token sem as credenciais da Belvo estarem configuradas.');
        return res.status(500).json({ message: 'Erro de configuração no servidor: credenciais da Belvo ausentes.' });
    }

    try {
        console.log(`>>> [DIAGNÓSTICO] A solicitar token de acesso da Belvo no ambiente: ${BELVO_API_URL}`);
        
        const response = await fetch(`${BELVO_API_URL}/api/token/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // CORREÇÃO FINAL: As credenciais são enviadas no corpo (body) da requisição
            body: JSON.stringify({
                id: BELVO_SECRET_ID,
                password: BELVO_SECRET_PASSWORD,
                scope: 'read_institutions,links,accounts,transactions',
                grant_type: 'client_credentials'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('>>> [ERRO API BELVO] Resposta ao pedir token:', data);
            throw new Error(data.message || 'Falha ao autenticar com a Belvo.');
        }

        console.log('>>> [SUCESSO] Token de acesso para o widget obtido da Belvo.');
        res.json({ access: data.access });

    } catch (error) {
        console.error('>>> [ERRO] Falha na rota /get-widget-token:', error.message);
        res.status(500).json({ message: 'Erro no servidor ao comunicar com a Belvo.' });
    }
});

/**
 * @route   POST /api/belvo/register-link
 * @desc    O widget da Belvo chama esta rota (via frontend) após uma conexão bem-sucedida.
 * @access  Private
 */
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

/**
 * @route   GET /api/belvo/financial-data
 * @desc    Busca os dados financeiros (contas, transações) de um utilizador na Belvo.
 * @access  Private
 */
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
        // Para estas chamadas, a autenticação volta a ser pelo cabeçalho
        const authHeader = 'Basic ' + Buffer.from(`${BELVO_SECRET_ID}:${BELVO_SECRET_PASSWORD}`).toString('base64');

        for (const linkId of user.belvoLinks) {
            // Busca contas
            const accountsResponse = await fetch(`${BELVO_API_URL}/api/accounts/?link=${linkId}`, {
                headers: { 'Authorization': authHeader }
            });
            const accountsData = await accountsResponse.json();
            if (accountsData.results) {
                allData.accounts.push(...accountsData.results);
            }

            // Busca transações
            const transactionsResponse = await fetch(`${BELVO_API_URL}/api/transactions/?link=${linkId}`, {
                 headers: { 'Authorization': authHeader }
            });
            const transactionsData = await transactionsResponse.json();
            if (transactionsData.results) {
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