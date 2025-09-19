
const API_BASE_URL = window.location.origin;
const amigos = ['João', 'Breno', 'Rian', 'Eduardo', 'Guilherme'];
let eventos = [];

function formatarData(dataStr) {
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR');
}

async function carregarHistorico() {
    const loading = document.getElementById('loading-historico');
    const table = document.getElementById('historico-tabela');
    const tbody = document.getElementById('historico-body');
    loading.style.display = 'block';
    table.style.display = 'none';
    tbody.innerHTML = '';
    try {
        const res = await fetch(API_BASE_URL + '/eventos');
        eventos = await res.json();
        if (!eventos.length) {
            loading.textContent = 'Nenhum evento registrado ainda.';
            return;
        }
        loading.style.display = 'none';
        table.style.display = 'block';
        eventos.forEach(evento => {
            const row = document.createElement('tr');
            const dataCell = document.createElement('td');
            dataCell.textContent = formatarData(evento.data);
            row.appendChild(dataCell);
            amigos.forEach(amigo => {
                const cell = document.createElement('td');
                cell.innerHTML = evento.detalhes[amigo] ? '✅' : '❌';
                row.appendChild(cell);
            });
            tbody.appendChild(row);
        });
    } catch (e) {
        loading.textContent = 'Erro ao carregar histórico.';
    }
}

async function registrarEvento() {
    const data = document.getElementById('data').value;
    const detalhes = {};
    amigos.forEach(amigo => {
        detalhes[amigo] = document.getElementById(amigo.toLowerCase()).checked ? true : null;
    });
    try {
        const res = await fetch(API_BASE_URL + '/eventos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data, detalhes })
        });
        if (res.ok) {
            mostrarNotificacao('Evento registrado com sucesso!', 'success');
            amigos.forEach(amigo => document.getElementById(amigo.toLowerCase()).checked = false);
            carregarHistorico();
            carregarEstatisticas();
        } else {
            mostrarNotificacao('Erro ao registrar evento.', 'error');
        }
    } catch (e) {
        mostrarNotificacao('Erro de conexão.', 'error');
    }
}

async function carregarEstatisticas() {
    const loading = document.getElementById('loading-stats');
    const content = document.getElementById('stats-content');
    loading.style.display = 'block';
    content.style.display = 'none';
    try {
        const res = await fetch(API_BASE_URL + '/estatisticas');
        const stats = await res.json();
        document.getElementById('total-events').textContent = stats.total;
        let maior = '-';
        let maiorValor = 0;
        amigos.forEach(amigo => {
            if (stats.porAmigo[amigo] > maiorValor) {
                maior = amigo;
                maiorValor = stats.porAmigo[amigo];
            }
        });
        document.getElementById('most-active').textContent = maior;
        document.getElementById('avg-per-day').textContent = stats.total;
        document.getElementById('longest').textContent = '-';
        loading.style.display = 'none';
        content.style.display = 'block';
    } catch (e) {
        loading.textContent = 'Erro ao carregar estatísticas.';
    }
}

function mostrarNotificacao(mensagem, tipo = "info") {
    const notification = document.getElementById('notification');
    notification.textContent = mensagem;
    notification.style.background = tipo === 'success' ? 'var(--success)' : tipo === 'error' ? 'var(--danger)' : 'var(--primary)';
    notification.style.display = 'block';
    setTimeout(() => { notification.style.display = 'none'; }, 2500);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('data').value = new Date().toISOString().substr(0, 10);
    document.getElementById('btn-registrar').onclick = registrarEvento;
    carregarHistorico();
    carregarEstatisticas();
});