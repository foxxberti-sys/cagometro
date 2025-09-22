
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://cagometro_user:Msm9IWJHwgY6JID9Q34vcwMDpRcmgn30@dpg-d36oqnu3jp1c73f296n0-a.oregon-postgres.render.com/cagometro',
  ssl: { rejectUnauthorized: false }
});

const AMIGOS = ['joao', 'breno', 'rian', 'eduardo', 'guilherme'];


// NOVAS ROTAS PARA O NOVO FRONTEND

// POST /api/cagada - marca uma cagada para um nome
app.post('/api/cagada', async (req, res) => {
  const { nome } = req.body;
  if (!nome || typeof nome !== 'string') {
    return res.status(400).json({ error: 'Nome obrigatório' });
  }
  try {
    // Salva no banco: incrementa ou cria registro
    await pool.query(
      `INSERT INTO cagadas (nome, cagadas) VALUES ($1, 1)
       ON CONFLICT (nome) DO UPDATE SET cagadas = cagadas + 1`,
      [nome.trim()]
    );
    res.status(201).json({ message: 'Cagada registrada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar cagada' });
  }
});

// GET /api/ranking - retorna ranking geral
app.get('/api/ranking', async (req, res) => {
  try {
    const result = await pool.query('SELECT nome, cagadas FROM cagadas ORDER BY cagadas DESC, nome ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar ranking' });
  }
});

// Rotas antigas para compatibilidade (opcional)
// GET todos os registros
app.get('/eventos', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, data, detalhes FROM eventos ORDER BY data DESC, id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar eventos' });
  }
});

// POST novo registro
app.post('/eventos', async (req, res) => {
  const { data, detalhes } = req.body;
  if (!data || !detalhes) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }
  // Garante formato correto
  const detalhesLimpo = {};
  for (const amigo of AMIGOS) {
    detalhesLimpo[amigo] = detalhes[amigo] === true ? true : null;
  }
  try {
    await pool.query('INSERT INTO eventos (data, detalhes) VALUES ($1, $2)', [data, detalhesLimpo]);
    res.status(201).json({ message: 'Evento registrado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar evento' });
  }
});

// GET estatísticas simples
app.get('/estatisticas', async (req, res) => {
  try {
    const result = await pool.query('SELECT detalhes FROM eventos');
    const stats = {};
    for (const amigo of AMIGOS) stats[amigo] = 0;
    let total = 0;
    for (const row of result.rows) {
      for (const amigo of AMIGOS) {
        if (row.detalhes[amigo] === true) {
          stats[amigo]++;
          total++;
        }
      }
    }
    res.json({ total, porAmigo: stats });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log('Servidor rodando na porta ' + PORT);
});
