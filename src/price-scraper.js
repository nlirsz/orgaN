// src/price-scraper.js - ESPECIALISTA EM IMAGENS

const axios = require('axios');
const cheerio = require('cheerio');

async function obterProduto(link) {
    try {
        const { data: html } = await axios.get(link, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(html);

        let image = null, name = null, price = null;

        // Prioridade 1: Meta tag 'og:image' (a mais comum e confiável)
        image = $('meta[property="og:image"]').attr('content');

        // Se não encontrou, tenta a segunda tag mais comum
        if (!image) {
            image = $('meta[property="twitter:image"]').attr('content');
        }
        
        // Extrai nome e preço como bônus, caso a IA falhe completamente
        name = $('meta[property="og:title"]').attr('content') || $('h1').first().text().trim();
        let priceText = $('[itemprop="price"]').attr('content') || $('.price').first().text().trim();
        if (priceText) {
            price = parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(',', '.'));
        }

        return {
            name: name || null,
            price: isNaN(price) ? null : price,
            image: image || null,
        };
    } catch (error) {
        console.error(`[price-scraper] Erro ao buscar ${link}: ${error.message}`);
        return { image: null, name: null, price: null };
    }
}

module.exports = { obterProduto };