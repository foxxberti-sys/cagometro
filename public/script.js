

// Novo script para o layout moderno do Cagômetro

async function fetchRanking() {
    const res = await fetch('/api/ranking');
    if (!res.ok) return [];
    return res.json();
}

async function marcarCagada(nome) {
    const res = await fetch('/api/cagada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome })
    });
    return res.ok;
}

function renderChart(ranking) {
    const ctx = document.getElementById('rankingChart').getContext('2d');
    if (window.rankingChart) window.rankingChart.destroy();
    const nomes = ranking.map(r => r.nome);
    const cagadas = ranking.map(r => r.cagadas);
    window.rankingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: nomes,
            datasets: [{
                label: 'Cagadas',
                data: cagadas,
                backgroundColor: '#4caf50',
                borderRadius: 8,
                maxBarThickness: 38
            }]
        },
        options: {
            indexAxis: 'y',
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { beginAtZero: true, ticks: { precision:0 } },
                y: { ticks: { font: { weight: 'bold' } } }
            }
        }
    });
}

async function atualizarRanking() {
    const ranking = await fetchRanking();
    renderChart(ranking);
}

document.getElementById('cagada-form').addEventListener('submit', async e => {
    e.preventDefault();
    const nomeInput = document.getElementById('nome');
    const nome = nomeInput.value.trim();
    if (!nome) return;
    nomeInput.disabled = true;
    e.submitter.disabled = true;
    const ok = await marcarCagada(nome);
    nomeInput.value = '';
    nomeInput.disabled = false;
    e.submitter.disabled = false;
    atualizarRanking();
});

// Inicializa ranking ao carregar
atualizarRanking();