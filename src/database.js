const sqlite3 = require('sqlite3').verbose();
const path = require('path'); // Para caminhos de arquivo mais robustos
const { app } = require('electron'); // Para obter o userData path

// Determina o caminho do banco de dados dentro da pasta de dados do usuário
// Isso é mais robusto para aplicações empacotadas
const dbPath = path.join(app.getPath('userData'), 'finance_dashboard.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Erro ao abrir o banco de dados", err.message);
    } else {
        console.log("Conectado ao banco de dados SQLite em:", dbPath);
    }
});

// Habilitar chaves estrangeiras (bom para integridade referencial, se necessário no futuro)
db.run("PRAGMA foreign_keys = ON;");

// --- Criação de Tabelas ---
db.serialize(() => {
    // Criar tabela de produtos desejados (wishlist)
    db.run(`
        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            link TEXT,
            imagem TEXT,
            preco REAL NOT NULL,
            data_adicionado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error("Erro ao criar tabela produtos:", err.message);
        else console.log("Tabela 'produtos' verificada/criada.");
    });

    // Criar tabela de histórico de compras
    // (Similar a produtos, mas representa itens comprados)
    db.run(`
        CREATE TABLE IF NOT EXISTS historico_compras (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            link TEXT,
            imagem TEXT,
            preco REAL NOT NULL,
            data_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
        )
    `, (err) => {
        if (err) console.error("Erro ao criar tabela historico_compras:", err.message);
        else console.log("Tabela 'historico_compras' verificada/criada.");
    });


    // Criar tabela de finanças mensais
    db.run(`
        CREATE TABLE IF NOT EXISTS financas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mes_ano TEXT NOT NULL UNIQUE, /* Formato 'YYYY-MM' para fácil ordenação e unicidade */
            receita REAL DEFAULT 0,
            gastos REAL DEFAULT 0,
            data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error("Erro ao criar tabela financas:", err.message);
        else console.log("Tabela 'financas' verificada/criada.");
    });
});


// --- Funções CRUD para Produtos ---
function adicionarProduto(produto) {
    return new Promise((resolve, reject) => {
        const { nome, link, imagem, preco } = produto;
        if (!nome || preco === undefined || preco === null) {
            return reject(new Error("Nome e preço são obrigatórios para adicionar produto."));
        }
        const sql = `INSERT INTO produtos (nome, link, imagem, preco) VALUES (?, ?, ?, ?)`;
        db.run(sql, [nome, link, imagem, parseFloat(preco)], function (err) {
            if (err) {
                console.error("Erro ao adicionar produto ao DB:", err.message);
                reject(err);
            } else {
                console.log(`Produto adicionado com ID: ${this.lastID}`);
                resolve({ id: this.lastID, ...produto });
            }
        });
    });
}

function listarProdutos() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM produtos ORDER BY data_adicionado DESC`, (err, rows) => {
            if (err) {
                console.error("Erro ao recuperar produtos do DB:", err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function atualizarProduto(produto) {
    return new Promise((resolve, reject) => {
        const { id, nome, link, imagem, preco } = produto;
        if (!id || !nome || preco === undefined || preco === null) {
            return reject(new Error("ID, Nome e preço são obrigatórios para atualizar produto."));
        }
        const sql = `UPDATE produtos SET nome = ?, link = ?, imagem = ?, preco = ? WHERE id = ?`;
        db.run(sql, [nome, link, imagem, parseFloat(preco), id], function (err) {
            if (err) {
                console.error("Erro ao atualizar produto no DB:", err.message);
                reject(err);
            } else if (this.changes === 0) {
                reject(new Error(`Produto com ID ${id} não encontrado para atualização.`));
            } else {
                console.log(`Produto com ID ${id} atualizado.`);
                resolve(produto);
            }
        });
    });
}

function removerProduto(id) {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM produtos WHERE id = ?`;
        db.run(sql, [id], function (err) {
            if (err) {
                console.error("Erro ao remover produto do DB:", err.message);
                reject(err);
            } else if (this.changes === 0) {
                reject(new Error(`Produto com ID ${id} não encontrado para remoção.`));
            } else {
                console.log(`Produto com ID ${id} removido.`);
                resolve({ id, message: "Produto removido com sucesso" });
            }
        });
    });
}

// --- Funções CRUD para Histórico de Compras ---
function adicionarAoHistorico(produtoComprado) {
    return new Promise((resolve, reject) => {
        const { nome, link, imagem, preco } = produtoComprado;
        if (!nome || preco === undefined || preco === null) {
            return reject(new Error("Nome e preço são obrigatórios para adicionar ao histórico."));
        }
        // data_compra é DEFAULT CURRENT_TIMESTAMP
        const sql = `INSERT INTO historico_compras (nome, link, imagem, preco) VALUES (?, ?, ?, ?)`;
        db.run(sql, [nome, link, imagem, parseFloat(preco)], function (err) {
            if (err) {
                console.error("Erro ao adicionar ao histórico no DB:", err.message);
                reject(err);
            } else {
                console.log(`Item adicionado ao histórico com ID: ${this.lastID}`);
                resolve({ id: this.lastID, ...produtoComprado });
            }
        });
    });
}

function listarHistorico() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM historico_compras ORDER BY data_compra DESC`, (err, rows) => {
            if (err) {
                console.error("Erro ao recuperar histórico do DB:", err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function removerDoHistorico(id) {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM historico_compras WHERE id = ?`;
        db.run(sql, [id], function (err) {
            if (err) {
                console.error("Erro ao remover item do histórico no DB:", err.message);
                reject(err);
            } else if (this.changes === 0) {
                reject(new Error(`Item do histórico com ID ${id} não encontrado para remoção.`));
            } else {
                console.log(`Item do histórico com ID ${id} removido.`);
                resolve({ id, message: "Item do histórico removido com sucesso" });
            }
        });
    });
}


// --- Funções CRUD para Finanças ---
function adicionarRegistroFinanceiro(registro) {
    return new Promise((resolve, reject) => {
        const { mes_ano, receita, gastos } = registro; // mes_ano deve ser 'YYYY-MM'
        if (!mes_ano || receita === undefined || gastos === undefined) {
            return reject(new Error("Mês/Ano, receita e gastos são obrigatórios."));
        }
        const sql = `INSERT INTO financas (mes_ano, receita, gastos) VALUES (?, ?, ?)
                     ON CONFLICT(mes_ano) DO UPDATE SET receita=excluded.receita, gastos=excluded.gastos`;
        db.run(sql, [mes_ano, parseFloat(receita), parseFloat(gastos)], function (err) {
            if (err) {
                console.error("Erro ao salvar registro financeiro no DB:", err.message);
                reject(err);
            } else {
                // Se foi um INSERT, this.lastID será o ID. Se foi UPDATE, será 0, mas o registro foi atualizado.
                const newId = this.lastID || (rows => rows.length > 0 ? rows[0].id : null); // Tenta buscar o ID se foi update
                console.log(`Registro financeiro para ${mes_ano} salvo/atualizado.`);
                // Para retornar o ID correto em caso de UPDATE, precisaríamos de uma consulta SELECT após.
                // Por simplicidade, retornamos o registro original.
                // Para ter o ID em caso de conflito e update:
                db.get("SELECT id FROM financas WHERE mes_ano = ?", [mes_ano], (err, row) => {
                    if (err) reject(err);
                    else resolve({ id: row.id, ...registro });
                });
            }
        });
    });
}

function listarFinancas() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM financas ORDER BY mes_ano ASC`, (err, rows) => {
            if (err) {
                console.error("Erro ao recuperar finanças do DB:", err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function removerRegistroFinanceiro(id) {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM financas WHERE id = ?`;
        db.run(sql, [id], function (err) {
            if (err) {
                console.error("Erro ao remover registro financeiro do DB:", err.message);
                reject(err);
            } else if (this.changes === 0) {
                reject(new Error(`Registro financeiro com ID ${id} não encontrado.`));
            } else {
                console.log(`Registro financeiro com ID ${id} removido.`);
                resolve({ id, message: "Registro financeiro removido com sucesso" });
            }
        });
    });
}


module.exports = {
    db, // Exportar a instância do DB pode ser útil para fechar ao sair
    adicionarProduto,
    listarProdutos,
    atualizarProduto,
    removerProduto,
    adicionarAoHistorico,
    listarHistorico,
    removerDoHistorico,
    adicionarRegistroFinanceiro,
    listarFinancas,
    removerRegistroFinanceiro
};