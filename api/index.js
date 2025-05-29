// Conteúdo EXATO para: RAIZ_DO_PROJETO/api/index.js

// LOG IMEDIATO AO CARREGAR O ARQUIVO
console.log('[VERCEL EXECUTION TEST - STEP 0] Arquivo api/index.js foi lido pela Vercel.');

module.exports = (req, res) => {
  // LOG QUANDO A FUNÇÃO É INVOCADA
  console.log(`[VERCEL EXECUTION TEST - STEP 1] Função exportada de api/index.js foi INVOCADA. URL: ${req.url}, Método: ${req.method}`);

  if (req.url && (req.url.startsWith('/api/ping') || req.url.startsWith('/api/test-db'))) {
    console.log(`[VERCEL EXECUTION TEST - STEP 2] Rota de teste (${req.url}) alcançada com sucesso dentro do handler.`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: `Sucesso! Rota ${req.url} no handler minimalista de api/index.js foi executada.`,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  console.log(`[VERCEL EXECUTION TEST - STEP 3] Rota ${req.url} não correspondeu a /api/ping ou /api/test-db. Retornando 404 customizado.`);
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: `Rota ${req.url} não encontrada no handler minimalista de api/index.js.`,
    available_test_routes: ['/api/ping', '/api/test-db']
  }));
};

// LOG NO FINAL DO ARQUIVO
console.log('[VERCEL EXECUTION TEST - STEP 4] Arquivo api/index.js processado até o fim (definição do module.exports).');