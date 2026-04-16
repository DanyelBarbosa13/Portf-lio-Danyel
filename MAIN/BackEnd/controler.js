require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const connection = require('./bdConfig');
const secretKey = '17079924'; // Substitua pela sua chave secreta
const app = express();
app.use(express.json());


// Função auxiliar para calcular datas
const calculateDate = (period) => {
    const now = new Date();
    switch (period) {
        case '7_dias':
            return new Date(now.setDate(now.getDate() - 7));
        case '30_dias':
            return new Date(now.setMonth(now.getMonth() - 1));
        case '3_meses':
            return new Date(now.setMonth(now.getMonth() - 3));
        case '6_meses':
            return new Date(now.setMonth(now.getMonth() - 6));
        case '12_meses':
            return new Date(now.setFullYear(now.getFullYear() - 1));
        default:
            return null;
    }
};

// Listar todos os serviços com filtros
app.post('/filtraServicos', (req, res) => {
    const { tipo, urgencia, responsavel, periodo, concluido, local, id_servico } = req.body;
    let query = 'SELECT * FROM Servicos WHERE 1=1';
    const params = [];

    // Filtro por tipo de serviço (manutenção, limpeza, substituição)
    if (tipo) {
        query += ' AND tipo_servico = ?';
        params.push(tipo);
    }
    // Filtro por urgência (pouco urgente, urgente, muito urgente, emergência)
    if (urgencia) {
        query += ' AND urgencia = ?';
        params.push(urgencia);
    }
    // Filtro por responsável
    if (responsavel) {
        query += ' AND responsavel = ?';
        params.push(responsavel);
    }
    // Filtro por período de tempo (últimos 7 dias, 30 dias, 3 meses, 6 meses, 12 meses)
    if (periodo) {
        const startDate = calculateDate(periodo);
        if (startDate) {
            query += ' AND data_servico >= ?';
            params.push(startDate);
        }
    }
    // Filtro por conclusão (concluído ou não)
    if (concluido !== undefined) {
        query += ' AND concluido = ?';
        params.push(concluido);
    }
    // Filtro por local
    if (local) {
        query += ' AND local = ?';
        params.push(local);
    }
    // Filtro por ID do serviço
    if (id_servico) {
        query += ' AND id_servico = ?';
        params.push(id_servico);
    }
    connection.query(query, params, (err, rows) => {
        if (err) {
            console.error('Erro ao executar a consulta:', err);
            res.status(500).send('Erro interno do servidor');
            return;
        }
        res.json(rows);
    });
});


// Login de usuário
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        // Supondo que 'queryPromise' esteja definido como um wrapper para a consulta SQL
        const results = await queryPromise('SELECT * FROM Usuarios WHERE email = ?', [email]);

        if (results.length === 0) {
            return res.status(404).json({ error: 'E-mail não encontrado!' });
        }

        const user = results[0];

        console.log('Senha fornecida pelo usuário:', senha);
        console.log('Hash armazenado no banco:', user.senha);

        // Comparar a senha fornecida com o hash armazenado
        const isMatch = await bcrypt.compare(senha, user.senha);
        console.log('Senhas coincidem?', isMatch);

        if (!isMatch) {
            return res.status(403).json({ error: 'Senha incorreta.' });
        }

        // Gerar token JWT após autenticação bem-sucedida
        const token = jwt.sign({ id: user.id_usuario, nome: user.nome }, secretKey, { expiresIn: '1h' });

        // Retorna o token, nome e email
        res.json({ token, nome: user.nome, email: user.email });
    } catch (err) {
        console.error('Erro ao fazer login:', err.message);
        res.status(500).json({ error: 'Erro ao fazer login.' });
    }
});



// Middleware de autenticação
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Rota que usa o middleware
app.get('/dados-seguros', authenticateToken, (req, res) => {
    res.json({ message: 'Dados acessados com sucesso!', user: req.user });
});
// Wrapper para usar Promises com connection.query
const queryPromise = (query, params) => {
    return new Promise((resolve, reject) => {
        connection.query(query, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

app.get('/atualizar-senhas', async (req, res) => {
    try {
        const users = await queryPromise('SELECT id_usuario, senha FROM Usuarios');

        for (const user of users) {
            // Verifique se a senha já é um hash
            if (!user.senha.startsWith('$2b$')) {
                const hashedPassword = await bcrypt.hash(user.senha, 10);
                await queryPromise('UPDATE Usuarios SET senha = ? WHERE id_usuario = ?', [hashedPassword, user.id_usuario]);
                console.log(`Senha do usuário ${user.id_usuario} atualizada com sucesso.`);
            }
        }

        res.json({ message: 'Senhas atualizadas com sucesso!' });
    } catch (err) {
        console.error('Erro ao atualizar senhas:', err.message);
        res.status(500).json({ error: 'Erro ao atualizar senhas.' });
    }
});


// Cadastro de novo usuário para Login
app.post('/register', (req, res) => {
    const { nome, email, senha } = req.body;

    // Validações no backend
    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    bcrypt.hash(senha, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao processar a senha.' });
        }

        const query = 'INSERT INTO Usuarios (nome, email, senha) VALUES (?, ?, ?)';
        connection.query(query, [nome, email, hashedPassword], (err) => {
            if (err) {
                console.error("Erro no banco de dados:", err);
                return res.status(500).json({ error: 'Erro ao salvar no banco de dados.' });
            }
            res.status(201).json({ message: 'Usuário criado com sucesso!' });
        });
    });
});


app.get('/servicostotal', (req, res) => {
    connection.query('SELECT * FROM Servicos ORDER BY data_servico ASC;', (err, rows) => {
        if (err) {
            console.error('Erro ao buscar serviços:', err);
            res.status(500).send('Erro interno do servidor');
            return;
        }
        res.json(rows);
    });
});


// Buscar todos os serviços
app.get('/servicos', (req, res) => {
    connection.query('SELECT * FROM ListagemServico ORDER BY id_servico ASC;', (err, rows) => {
        if (err) {
            console.error('Erro ao buscar serviços:', err);
            res.status(500).send('Erro interno do servidor');
            return;
        }
        res.json(rows);
    });
});

// Buscar um serviço pelo ID
app.get('/servicos/:id', (req, res) => {
    const servicoId = req.params.id;  // Obtém o ID do serviço da URL
    const query = `
        SELECT 
            s.id_servico, 
            m.descricao AS maquina, 
            s.tipo_servico, 
            s.urgencia, 
            s.responsavel, 
            s.data_servico, 
            l.descricao AS locall, 
            s.descricao, 
            r.resolucao, 
            s.concluido AS status_conclusao 
        FROM Servicos s 
        JOIN Maquina m ON s.fk_maquina_id = m.id 
        JOIN Locall l ON s.fk_locall_id = l.id 
        LEFT JOIN Resolucao r ON s.id_servico = r.id_servico 
        WHERE s.id_servico = ?  -- Filtra pelo ID do serviço
        ORDER BY s.data_servico DESC
    `;
    
    connection.query(query, [servicoId], (err, rows) => {
        if (err) {
            console.error('Erro ao executar a consulta:', err);
            res.status(500).send('Erro interno do servidor');
            return;
        }
        if (rows.length === 0) {
            res.status(404).send('Serviço não encontrado');
            return;
        }
        res.json(rows[0]);  // Retorna o primeiro (e único) registro encontrado
    });
});

// Obter ID da máquina pelo código
app.get('/maquina/:codigo', (req, res) => {
    const codigo = req.params.codigo;
    connection.query('SELECT id FROM Maquina WHERE descricao = ?', [codigo], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar ID da máquina:', err);
            return res.status(500).send('Erro interno do servidor');
        }
        if (rows.length === 0) {
            return res.status(404).send('Máquina não encontrada');
        }
        res.json({ id: rows[0].id });
    });
});

// Obter ID do local pelo código
app.get('/local/:descricao', (req, res) => {
    const descricao = req.params.descricao;
    connection.query('SELECT id FROM Locall WHERE descricao = ?', [descricao], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar ID do local:', err);
            return res.status(500).send('Erro interno do servidor');
        }
        if (rows.length === 0) {
            return res.status(404).send('Local não encontrado');
        }
        res.json({ id: rows[0].id });
    });
});

app.get('/servicos', async (req, res) => {
    try {
        const resultados = await db.query('SELECT * FROM ListagemServico ORDER BY id_servico ASC');
        res.json(resultados.rows);
    } catch (error) {
        console.error('Erro ao buscar serviços:', error);
        res.status(500).send('Erro ao buscar serviços');
    }
});




// Inserir um novo serviço
app.post('/servicos', (req, res) => {
    const { tipo_servico, urgencia, responsavel, data_servico, concluido, fk_maquina_id, fk_locall_id, descricao } = req.body;
    
    // Verifica se todos os dados necessários estão presentes
    if (!tipo_servico || !urgencia || !responsavel || !data_servico || concluido === undefined || fk_maquina_id === undefined || fk_locall_id === undefined || !descricao) {
        return res.status(400).send('Dados incompletos');
    }

    // Insere o novo serviço (a resolução será inserida automaticamente via trigger no banco de dados)
    connection.query(
        'INSERT INTO Servicos (tipo_servico, urgencia, responsavel, data_servico, concluido, fk_maquina_id, fk_locall_id, descricao) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [tipo_servico, urgencia, responsavel, data_servico, concluido, fk_maquina_id, fk_locall_id, descricao],
        (err) => {
            if (err) {
                console.error('Erro ao inserir serviço:', err);
                return res.status(500).send('Erro interno do servidor');
            }
            res.status(201).send('Serviço criado com sucesso');
        }
    );
});

// Atualizar informações de um serviço
app.patch('/servicos/:id', async (req, res) => {
    const servicoId = req.params.id;
    const {
        tipo_servico,
        urgencia,
        responsavel,
        data_servico,
        fk_locall_id,
        fk_maquina_id,
        descricao,
    } = req.body;

    try {
        // Buscar IDs de locall e máquina se necessário
        const locallId = fk_locall_id
            ? await buscarLocallId(fk_locall_id)
            : null;

        const maquinaId = fk_maquina_id
            ? await buscarMaquinaId(fk_maquina_id)
            : null;

        // Atualizar o serviço
        connection.query(
            `
            UPDATE Servicos
            SET tipo_servico = ?, urgencia = ?, responsavel = ?, data_servico = ?, 
                fk_locall_id = ?, fk_maquina_id = ?, descricao = ?
            WHERE id_servico = ?
            `,
            [
                tipo_servico || null,
                urgencia || null,
                responsavel || null,
                data_servico || null,
                locallId,
                maquinaId,
                descricao || null,
                servicoId,
            ],
            (err, result) => {
                if (err) {
                    console.error('Erro ao atualizar serviço:', err);
                    return res.status(500).send('Erro ao atualizar serviço');
                }
                if (result.affectedRows === 0) {
                    return res.status(404).send('Serviço não encontrado');
                }
                res.send('Serviço atualizado com sucesso');
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

// Função para buscar Locall ID
const buscarLocallId = (descricao) => {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT id FROM Locall WHERE descricao = ?',
            [descricao],
            (err, results) => {
                if (err) return reject(err);
                if (results.length === 0) return reject(new Error('Locall não encontrado'));
                resolve(results[0].id);
            }
        );
    });
};

const buscarMaquinaId = (descricao) => {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT id FROM Maquina WHERE descricao = ?',
            [descricao],
            (err, results) => {
                if (err) return reject(err);
                if (results.length === 0) return reject(new Error('Máquina não encontrada'));
                resolve(results[0].id);
            }
        );
    });
};





// Deletar um serviço
app.delete('/servicos/:id', (req, res) => {
    const servicoId = req.params.id;
    connection.query('DELETE FROM Servicos WHERE id_servico = ?', [servicoId], (err, result) => {
        if (err) {
            console.error('Erro ao deletar serviço:', err);
            return res.status(500).send('Erro interno do servidor');
        }
        res.send('Serviço deletado com sucesso');
    });
});


app.get('/verificar-dependencias/:id', (req, res) => {
    const servicoId = req.params.id;
    connection.query('SELECT COUNT(*) as count FROM Resolucao WHERE id_servico = ?', [servicoId], (err, results) => {
        if (err) {
            console.error('Erro ao verificar dependências:', err);
            return res.status(500).send('Erro interno do servidor');
        }
        const count = results[0].count;
        res.send({ hasDependencies: count > 0 });
    });
});

app.get('/maquinas', (req, res) => {
    const sql = 'SELECT id, descricao FROM Maquina';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send('Erro ao buscar máquinas');
        res.json(results);
    });
});

app.get('/locais', (req, res) => {
    const sql = 'SELECT id, descricao FROM Locall';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send('Erro ao buscar locais');
        res.json(results);
    });
});



module.exports = app;
