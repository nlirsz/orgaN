const axios = require('axios');
const cheerio = require('cheerio');

async function obterProduto(link) {
    try {
        console.log("Buscando produto:", link);

        const response = await axios.get(link);
        const html = response.data;
        const $ = cheerio.load(html);

        // Capturar nome do produto
        let nome = $('h1').first().text().trim();

        // Capturar preço do produto
        let preco = $('#variacaoPreco').text().trim() || 
                    $('#preco_atual').val() || 
                    $('.precoAvista span').text().replace(',', '.').trim();

        // Capturar imagem do produto
        let imagem = $('img.produto').attr('src');

        console.log("Produto encontrado:", { nome, preco, imagem });

        return { nome, preco, imagem };
    } catch (error) {
        console.error("Erro ao buscar produto:", error);
        return { nome: "Produto não encontrado", preco: "N/A", imagem: "placeholder.jpg" };
    }
}

module.exports = { obterProduto };