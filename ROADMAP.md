Roadmap de Melhorias para o orgaN
Este documento serve como um guia estratégico para as próximas funcionalidades a serem implementadas no projeto.

Prioridade Atual: Refatoração do Sistema de Listas
O objetivo é substituir a criação de listas personalizadas por um sistema de categorias fixas, simplificando a experiência do usuário.

1. Backend: Alterações na Base de Dados e API
[ ] a) Alterar o Modelo de Dados:

[ ] Remover o modelo List.

[ ] Adicionar um campo category (String) ao modelo Product.

[ ] b) Ajustar a Lógica de Adicionar Produto:

[ ] Modificar a rota de criação de produto para receber e salvar a category escolhida.

2. Frontend: Desenvolvimento da Nova Interface (UI)
[ ] a) Remover a Interface Antiga:

[ ] Apagar o código HTML e JavaScript relacionado com a criação e seleção de listas personalizadas (o dropdown select).

[ ] b) Desenvolver Nova Interface de Filtros:

[ ] Criar uma nova secção na products-tab com botões para cada categoria fixa ("Geral", "Casa", "Roupas", etc.).

[ ] Estilizar os botões usando flexbox para alinhamento horizontal.

[ ] c) Criar Elemento para Exibir o Total:

[ ] Adicionar um elemento de texto na UI para mostrar o valor total da lista selecionada.

3. Frontend: Implementação da Lógica (JavaScript)
[ ] a) Implementar Lógica de Filtragem:

[ ] Escrever a função JavaScript que filtra os produtos com base no botão de categoria clicado.

[ ] Garantir que a categoria "Geral" exibe todos os produtos.

[ ] Atualizar o DOM para renderizar apenas os produtos filtrados.

[ ] b) Implementar Cálculo do Total:

[ ] Desenvolver a função JavaScript que calcula a soma dos preços dos produtos atualmente visíveis e atualiza o texto na UI.

4. Lógica do Histórico de Preços
[ ] a) Otimizar Atualizações:

[ ] Backend: Modificar a função de atualização de preços para adicionar um novo ponto ao priceHistory apenas se o preço novo for diferente do último preço registado.

Próximas Funcionalidades
[ ] Engajamento: Compartilhamento de Listas de Desejos

[ ] Backend: Criar uma rota na API (ex: /api/share/:listId).

[ ] Frontend: Criar uma página simples para exibir a lista pública.

[ ] Frontend: Implementar a função de copiar a URL de partilha no botão "Compartilhar".

[ ] Engajamento: Metas de Economia

[ ] Backend: Adicionar um campo targetPrice no modelo de dados do produto.

[ ] Frontend: Adicionar um campo de input no card do produto para definir a meta.

[ ] Backend: Aprimorar o sistema de notificação para alertar quando currentPrice <= targetPrice.

Funcionalidades Concluídas
[x] Inteligência: Gráfico de Histórico de Preços

[x] Inteligência: Badge de "Melhor Preço Histórico"

[x] Usabilidade: Botão para Atualizar Preços

[x] Usabilidade: Animações Sutis (Micro-interações)

[x] Dashboard: Cards de Resumo

[x] Dashboard: "Produtos em Destaque"

[x] Dashboard: Gráfico de Gastos por Categoria