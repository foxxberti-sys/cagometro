const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Arquivo para armazenar dados
const DATA_FILE = path.join(__dirname, 'data.json');

// Função para carregar dados
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
  return [];
}

// Função para salvar dados
function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
    return false;
  }
}

// Rotas da API

// GET /eventos - Retorna todos os eventos
app.get('/eventos', (req, res) => {
  const eventos = loadData();
  res.json(eventos);
});

// POST /eventos - Adiciona um novo evento
app.post('/eventos', (req, res) => {
  const novoEvento = req.body;
  
  // Validar dados
  if (!novoEvento.data || !novoEvento.detalhes) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }
  
  const eventos = loadData();
  eventos.push(novoEvento);
  
  if (saveData(eventos)) {
    res.status(201).json({ message: 'Evento adicionado com sucesso' });
  } else {
    res.status(500).json({ error: 'Erro ao salvar evento' });
  }
});

// GET /estatisticas - Retorna estatísticas consolidadas
app.get('/estatisticas', (req, res) => {
  const eventos = loadData();
  
  // Calcular estatísticas
  const totalEventos = eventos.reduce((total, evento) => {
    return total + Object.values(evento.detalhes).filter(d => d !== null).length;
  }, 0);
  
  const diasUnicos = new Set(eventos.map(e => e.data));
  const mediaPorDia = diasUnicos.size > 0 ? (totalEventos / diasUnicos.size).toFixed(1) : 0;
  
  // Calcular por pessoa
  const pessoas = {};
  eventos.forEach(evento => {
    for (const [pessoa, detalhes] of Object.entries(evento.detalhes)) {
      if (detalhes) {
        if (!pessoas[pessoa]) {
          pessoas[pessoa] = { total: 0, pontuacao: 0 };
        }
        pessoas[pessoa].total += 1;
        pessoas[pessoa].pontuacao += detalhes.classificacao === 'normal' ? 1 :
                                    detalhes.classificacao === 'urgente' ? 2 :
                                    detalhes.classificacao === 'epico' ? 3 : 1.5;
      }
    }
  });
  
  res.json({
    totalEventos,
    mediaPorDia,
    diasRegistrados: diasUnicos.size,
    pessoas
  });
});

// Rota padrão para servir o frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});