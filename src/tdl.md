### Checklist de Configuração e Segurança - App OrgaN na Vercel

**Fase 1: Correção do Deploy e Funcionamento Básico (Concluído)**

1.  **[X] Configurar `vercel.json` para API e Frontend Estático:**
    * Garantir que "Root Directory" nas configurações do projeto Vercel esteja definido como `src`.
    * Usar o arquivo `src/vercel.json` com as seguintes seções `builds`:
        ```json
        {
          "src": "api/index.js", // Para src/api/index.js
          "use": "@vercel/node"
        },
        {
          "src": "public",       // Para src/public/* (onde estão index.html, style.css, etc.)
          "use": "@vercel/static"
        }
        ```
    * Incluir `rewrites` para a API e para o fallback da SPA:
        ```json
        { "source": "/api/(.*)", "destination": "/api/index.js" },
        { "source": "/((?!api/).*)", "destination": "/index.html" }
        ```
2.  **[X] Corrigir Estrutura do `index.html`:**
    * Remover tag `<body>` duplicada.
    * Mover `<img src="/logo.png" ...>` do `<head>` para o `<body>` (ex: `div.sidebar-header`).
    * Garantir uma única inclusão do `renderer.js` no final do `<body>`.
    * Usar caminhos absolutos para assets locais (ex: `/style.css`, `/renderer.js`, `/logo.png`).
3.  **[X] Verificar Carregamento de Assets e Scripts:**
    * Confirmar no console do navegador (aba Network) que `index.html`, `/style.css`, `/renderer.js` e outras dependências (FontAwesome, Chart.js) estão carregando com status 200.
    * Verificar no console do navegador (aba Console) se não há erros de JavaScript impedindo a execução do `renderer.js`.

---

**Fase 2: Melhorias de Segurança e Prevenção de Abusos (Em Andamento/Próximos Passos)**

**Segurança na Criação de Contas e Login:**

1.  **[ ] Implementar CAPTCHA (ex: Google reCAPTCHA v2 ou v3 / hCaptcha):**
    * [ ] Formulário de criação de conta (`register-form`).
    * [ ] Formulário de login (`login-form`), especialmente após tentativas falhas.
2.  **[ ] Fortalecer Requisitos de Senha:**
    * [ ] Frontend: Adicionar feedback visual sobre a força da senha no formulário de registro.
    * [ ] Backend: Se não estiver completo, garantir validação de complexidade (maiúsculas, minúsculas, números, caracteres especiais, comprimento mínimo) na rota de registro (`POST /api/auth/register`).
3.  **[ ] Implementar Verificação de E-mail:**
    * [ ] Backend: Criar rota para gerar e enviar token de verificação por e-mail.
    * [ ] Backend: Criar rota para validar token e ativar conta.
    * [ ] Frontend: Informar usuário sobre necessidade de verificação.
4.  **[ ] (Opcional) Login Social (Google):**
    * [ ] Backend: Configurar Passport.js com `passport-google-oauth20`.
    * [ ] Frontend: Adicionar botão "Login com Google".
5.  **[ ] (Opcional) Autenticação de Dois Fatores (2FA):**
    * [ ] Permitir que usuários ativem 2FA (ex: via app autenticador TOTP).
6.  **[ ] Monitorar Tentativas de Login Falhas:**
    * [ ] Backend: Implementar lógica para bloqueio temporário de IP/conta após X tentativas.
    * [ ] Backend: (Opcional) Notificar usuário por e-mail sobre múltiplas falhas.
7.  **[ ] Melhorar Coleta de Dados no Cadastro (se necessário):**
    * [ ] Avaliar necessidade real de campos como Telefone e CPF.
    * [ ] Se CPF for mantido, implementar validação de formato e dígito verificador (backend e frontend). Lembrar da LGPD.

**Segurança na Adição de Produtos e Uso Geral:**

1.  **[ ] Implementar Limitação de Taxa (Rate Limiting) no Backend (Express):**
    * [ ] Rota de criação de contas (`POST /api/auth/register`).
    * [ ] Rota de login (`POST /api/auth/login`).
    * [ ] Rota de adição de produtos (`POST /api/products`).
    * [ ] Rota de scraping de URL (`POST /api/products/scrape-url`).
    * Usar `express-rate-limit` ou similar.
2.  **[ ] Reforçar Validação de Dados de Entrada no Backend:**
    * [ ] Em todas as rotas, especialmente `products.js` e `finances.js`.
    * Validar tipos, formatos, comprimentos, valores permitidos. Usar `express-validator` ou `joi`.
3.  **[ ] Sanitize URLs na Função de Scraping:**
    * Na rota `/api/products/scrape-url`, validar rigorosamente a URL antes de fazer a requisição externa.
4.  **[ ] Revisar e Reforçar Content Security Policy (CSP):**
    * No `index.html`, tentar remover `'unsafe-inline'` de `script-src` se possível, ou usar nonces/hashes.

**Segurança da API e Infraestrutura (Vercel):**

1.  **[X] Usar Variáveis de Ambiente Seguras na Vercel:** (Já em uso para JWT_SECRET, GEMINI_API_KEY)
2.  **[ ] Configurar Headers de Segurança HTTP no `vercel.json`:**
    * Ex: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`.
3.  **[ ] Manter Dependências Atualizadas:**
    * [ ] Rodar `npm audit` periodicamente e atualizar pacotes vulneráveis.

---
**Observações Adicionais:**

* Este checklist é um guia. A prioridade de cada item pode variar.
* Este documento pode ser atualizado conforme progredimos.