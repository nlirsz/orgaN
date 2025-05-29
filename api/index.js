// Conteúdo EXATO para: RAIZ_DO_PROJETO/api/index.js

// LOG DE INÍCIO ABSOLUTO DO ARQUIVO
console.log('[SUPER MINIMAL API CHECK 0] Arquivo api/index.js FOI CARREGADO pela Vercel.');

const http = require('http'); // Usando 'http' básico

module.exports = (req, res) => {
  // LOG QUANDO A FUNÇÃO É INVOCADA PELA VERCEL
  console.log(`[SUPER MINIMAL API CHECK 1] Função em api/index.js EXECUTADA. URL: ${req.url}, Método: ${req.method}`);

  if (req.url && (req.url.startsWith('/api/ping') || req.url.startsWith('/api/test-db'))) {
    console.log(`[SUPER MINIMAL API CHECK 2] Rota de teste (${req.url}) alcançada com sucesso dentro do handler.`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: `Sucesso! Rota ${req.url} no handler minimalista de api/index.js foi executada.`,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  console.log(`[SUPER MINIMAL API CHECK 3] Rota ${req.url} não correspondeu a /api/ping ou /api/test-db. Retornando 404 customizado.`);
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: `Rota ${req.url} não encontrada no handler minimalista de api/index.js.`,
    available_test_routes: ['/api/ping', '/api/test-db']
  }));
};

// LOG NO FINAL DO ARQUIVO
console.log('[SUPER MINIMAL API CHECK 4] Arquivo api/index.js processado até o fim (definição do module.exports).');