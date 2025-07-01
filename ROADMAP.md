Roadmap de Melhorias para o orgaN
Este documento serve como um guia estratégico para as próximas funcionalidades a serem implementadas no projeto.

1. Engajamento e Retenção do Usuário
O objetivo aqui é fazer com que os usuários voltem sempre e usem o app de forma mais ativa.

[ ] a) Compartilhamento de Listas de Desejos

[ ] Backend: Criar uma nova rota na API (ex: /api/share/:listId).

[ ] Frontend: Criar uma página simples para exibir a lista pública.

[ ] Frontend: Implementar a função de copiar a URL de partilha no botão "Compartilhar".

[ ] b) Metas de Economia

[ ] Backend: Adicionar um campo targetPrice no modelo de dados do produto.

[ ] Frontend: Adicionar um campo de input no card do produto para definir a meta.

[ ] Backend: Aprimorar o sistema de notificação para alertar quando currentPrice <= targetPrice.

2. Inteligência e Valor Agregado
O objetivo é usar os dados que você já tem para oferecer insights valiosos ao usuário.

[x] a) Gráfico de Histórico de Preços

[x] Backend: Criar uma rota na API (ex: /api/products/:id/history) que retorne a lista de preços e datas.

[x] Frontend: Integrar uma biblioteca de gráficos (ex: Chart.js) no modal de detalhes do produto.

[x] Frontend: Fazer a chamada à API e renderizar o gráfico com os dados recebidos.

[x] b) Badge de "Melhor Preço Histórico"

[x] Backend: Implementar a lógica para comparar o preço atual com o menor preço do histórico.

[x] Frontend: Criar e exibir um ícone de selo/badge no card do produto quando a condição for verdadeira.

3. Usabilidade e "Polimento" da Interface
O objetivo é melhorar a experiência do dia a dia com pequenos ajustes que fazem uma grande diferença.

[x] a) Separação de Listas e Filtros

[x] Backend: Adicionar um modelo de dados List no banco de dados.

[x] Backend: Associar os produtos a uma List.

[x] Frontend: Desenvolver a interface na sidebar para criar, ver e selecionar listas.

[x] Frontend: Modificar a visualização principal para exibir apenas produtos da lista selecionada.

[x] b) Botão para Atualizar Preços

[x] Backend: Criar uma rota na API (ex: POST /api/products/refresh-prices) que recebe uma lista de IDs e dispara o scraping.

[x] Frontend: Adicionar o botão "Atualizar Tudo" na interface.

[x] Frontend: Implementar a chamada à API e um indicador de carregamento.

[x] c) Animações Sutis (Micro-interações)

[x] Frontend: Aplicar transições de CSS para animar a adição de um novo produto (ex: fade-in).

[x] Frontend: Aplicar transições de CSS para animar a remoção de um produto (ex: slide-out e fade-out).

4. Dashboard Principal (Painel de Controle) Aprimorado
O objetivo é transformar a aba "Painel Principal" em um verdadeiro centro de comando com informações úteis e rápidas.

[ ] a) Cards de Resumo

[ ] Frontend: Desenvolver os cards de "Valor Total", "Economia Potencial" e "Alertas de Preço".

[ ] Frontend/Backend: Implementar a lógica para calcular estas métricas.

[ ] b) "Produtos em Destaque"

[ ] Backend: Criar a lógica para identificar os produtos com maior queda de preço ou que atingiram o melhor preço histórico.

[ ] Frontend: Desenvolver a secção na UI para exibir estes produtos em destaque.

[ ] c) Gráfico de Gastos por Categoria

[ ] Frontend: Implementar a lógica para agrupar produtos por categoria e somar seus valores.

[ ] Frontend: Usar a Chart.js para renderizar um gráfico de pizza ou de barras com os dados.