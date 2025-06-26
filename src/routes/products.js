// src/routes/products.js - VERSÃO FINAL COM ORQUESTRADOR

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// Importando as duas funções do nosso novo scraper
const { scrapeByAnalyzingHtml, scrapeBySearching } = require('./api_helpers/scrape-gemini');
const { obterProduto: scrapeWithCheerio } = require('../price-scraper');


// SUAS ROTAS DE DASHBOARD (stats, etc.) CONTINUAM AQUI
router.get('/stats', auth, async (req, res) => { /* Seu código... */ });
router.get('/category-distribution', auth, async (req, res) => { /* Seu código... */ });
router.get('/priority-distribution', auth, async (req, res) => { /* Seu código... */ });


// --- ROTA DE SCRAPE COM A LÓGICA EM CASCATA CORRETA ---
router.post('/scrape-url', async (req, res) => {
    const { url } = req.body;
    if (!url) { return res.status(400).json({ message: 'URL é obrigatória.' }); }

    let productDetails = null;

    try {
        // TENTATIVA 1: Análise de HTML (bom para imagens)
        console.log(`[Strategy] Etapa 1: Tentando com Gemini (Modo HTML)...`);
        productDetails = await scrapeByAnalyzingHtml(url);
    } catch (htmlError) {
        console.warn(`[Strategy] Modo HTML falhou: ${htmlError.message}. Acionando Modo Busca...`);
        
        // TENTATIVA 2: Busca com IA (bom para textos em sites bloqueados)
        try {
            productDetails = await scrapeBySearching(url);
        } catch (searchError) {
            console.error(`[Strategy] Modo Busca também falhou: ${searchError.message}`);
        }
    }

    // TENTATIVA 3: Caça à imagem com Cheerio (se ainda estiver faltando)
    if (productDetails && !productDetails.image) {
        console.log(`[Strategy] Caçando imagem com Cheerio...`);
        try {
            const imageResult = await scrapeWithCheerio(url);
            if (imageResult && imageResult.image) {
                productDetails.image = imageResult.image;
            }
        } catch (imageError) {
            console.warn(`[Strategy] Caça à imagem com Cheerio falhou.`);
        }
    }

    // AVALIAÇÃO FINAL
    if (productDetails && productDetails.name && productDetails.price) {
        console.log(`[Strategy] Sucesso! Detalhes finais:`, productDetails);
        return res.status(200).json(productDetails);
    } else {
        console.error(`[Strategy] FALHA TOTAL para a URL: ${url}`);
        return res.status(422).json({
            message: 'Não conseguimos ler os detalhes do produto nesta página. Tente adicionar as informações manualmente.'
        });
    }
});


// SUAS ROTAS CRUD (POST, GET, PUT, DELETE) CONTINUAM AQUI
router.post('/', auth, async (req, res) => { /* Seu código... */ });
router.get('/', auth, async (req, res) => { /* Seu código... */ });
router.patch('/:id/purchase', auth, async (req, res) => { /* Seu código... */ });
router.put('/:id', auth, async (req, res) => { /* Seu código... */ });
router.delete('/:id', auth, async (req, res) => { /* Seu código... */ });
router.get('/:id', auth, async (req, res) => { /* Seu código... */ });


module.exports = router;