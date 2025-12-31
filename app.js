
// 全局状态
const state = {
    data: [],
    currentPage: 1,
    pageSize: 20,
    total: 0
};

// DOM 元素
const els = {
    totalIssues: document.getElementById('total-issues'),
    latestIssue: document.getElementById('latest-issue'),
    historyList: document.getElementById('history-list'),
    prevPageBtn: document.getElementById('prev-page'),
    nextPageBtn: document.getElementById('next-page'),
    pageInfo: document.getElementById('page-info'),
    generateBtn: document.getElementById('generate-btn'),
    generatedTicket: document.getElementById('generated-ticket'),
    chartCanvas: document.getElementById('lottoChart'),
    // AI Elements
    aiBtn: document.getElementById('ai-btn'),
    aiStatus: document.getElementById('ai-status'),
    aiResult: document.getElementById('ai-result'),
    aiBallsContainer: document.querySelector('.ai-result-container .balls-container')
};

let chartInstance = null;

// 初始化
async function init() {
    try {
        await fetchData();
        renderStats();
        renderChart();
        renderHistory();
        renderBlueBallAnalysis();
        renderMarkovAnalysis();
        renderSiteStats();
        setupEventListeners();
    } catch (e) {
        console.error("Init Error:", e);
    }
}

/** ----------------分析逻辑---------------- **/

// 蓝球深度分析 (概率、遗漏、加权预测)
function renderBlueBallAnalysis() {
    if (state.data.length === 0) return;

    const stats = {};
    for (let i = 1; i <= 16; i++) {
        stats[i] = { count: 0, lastIndex: -1, omit: 0, prob: 0 };
    }

    const total = state.data.length;
    let maxCount = 0;

    state.data.forEach((item, index) => {
        const blue = parseInt(item.back);
        if (stats[blue]) {
            stats[blue].count++;
            if (stats[blue].lastIndex === -1) stats[blue].lastIndex = index;
        }
    });

    let maxOmit = 0;
    let hotBall = 1, coldBall = 1;

    for (let i = 1; i <= 16; i++) {
        stats[i].omit = stats[i].lastIndex === -1 ? total : stats[i].lastIndex;
        stats[i].prob = stats[i].count / total;
        if (stats[i].count > stats[hotBall].count) hotBall = i;
        if (stats[i].omit > maxOmit) {
            maxOmit = stats[i].omit;
            coldBall = i;
        }
    }

    // 综合评分预测
    const scores = [];
    const actualMaxCount = Math.max(...Object.values(stats).map(s => s.count)) || 1;
    for (let i = 1; i <= 16; i++) {
        const normProb = stats[i].count / actualMaxCount;
        const normOmit = Math.min(stats[i].omit / 50, 1);
        const score = (normProb * 0.6) + (normOmit * 0.4);
        scores.push({ ball: i, score });
    }
    scores.sort((a, b) => b.score - a.score);
    const predictedBall = scores[0].ball;

    // 渲染
    if(document.getElementById('rec-hot')) document.getElementById('rec-hot').textContent = hotBall.toString().padStart(2, '0');
    if(document.getElementById('rec-cold')) {
        document.getElementById('rec-cold').textContent = coldBall.toString().padStart(2, '0');
        document.getElementById('cold-omit-count').textContent = maxOmit;
    }
    if(document.getElementById('rec-next')) document.getElementById('rec-next').textContent = predictedBall.toString().padStart(2, '0');

    const container = document.getElementById('blue-stats-container');
    if (container) {
        container.innerHTML = '';
        for (let i = 1; i <= 16; i++) {
            const s = stats[i];
            const el = document.createElement('div');
            el.className = 'blue-stat-item';
            const widthPct = actualMaxCount > 0 ? (s.count / actualMaxCount) * 100 : 0;
            el.innerHTML = `
                <span class="ball blue tiny">${i.toString().padStart(2, '0')}</span>
                <span class="omit-label">遗漏</span>
                <span class="omit-count" style="color:${s.omit > 15 ? '#ef4444' : '#94a3b8'}">${s.omit}期</span>
                <div class="prob-bar-container">
                    <div class="prob-bar" style="width: ${widthPct}%"></div>
                </div>
                <span class="omit-label" style="margin-top:4px">频次 ${s.count}</span>
            `;
            container.appendChild(el);
        }
    }
}

// 马尔科夫链分析
function renderMarkovAnalysis() {
    if (state.data.length < 2) return;
    const matrix = Array.from({ length: 17 }, () => new Array(17).fill(0));
    for (let i = state.data.length - 1; i > 0; i--) {
        const current = parseInt(state.data[i].back);
        const next = parseInt(state.data[i-1].back);
        if (!isNaN(current) && !isNaN(next)) matrix[current][next]++;
    }
    const lastBlue = parseInt(state.data[0].back);
    const row = matrix[lastBlue];
    let maxCount = -1, predicted = -1;
    for (let i = 1; i <= 16; i++) {
        if (row[i] > maxCount) {
            maxCount = row[i];
            predicted = i;
        }
    }
    const el = document.getElementById('rec-markov');
    if (el) el.textContent = (predicted !== -1 && maxCount > 0) ? predicted.toString().padStart(2, '0') : '?';
}

/** ----------------站点统计---------------- **/

async function renderSiteStats() {
    const panel = document.getElementById('admin-stats-panel');
    const pvEl = document.getElementById('site-pv');
    const uvEl = document.getElementById('site-uv');
    const logsEl = document.getElementById('visit-logs');
    
    if (!panel || !pvEl || !logsEl) return;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') !== '1') {
        panel.classList.add('hidden');
        return;
    }
    panel.classList.remove('hidden');

    try {
        const res = await fetch('/api/stats');
        if (!res.ok) throw new Error("Stats API failed");
        const data = await res.json();
        
        pvEl.textContent = data.total.toLocaleString();
        if (uvEl) uvEl.textContent = data.unique.toLocaleString();
        
        logsEl.innerHTML = '';
        if (!data.recent || data.recent.length === 0) {
            logsEl.innerHTML = '<tr><td colspan="4" style="text-align:center">暂无访问记录</td></tr>';
            return;
        }

        data.recent.forEach(log => {
            const row = document.createElement('tr');
            const date = new Date(log.lastTime).toLocaleString('zh-CN', {
                month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit'
            });
            let device = 'PC';
            if (log.ua) {
                if (log.ua.includes('iPhone')) device = '📱 iPhone';
                else if (log.ua.includes('Android')) device = '📱 Android';
                else if (log.ua.includes('Mac')) device = '💻 Mac';
                else if (log.ua.includes('Windows')) device = '💻 Windows';
            }
            row.innerHTML = `
                <td style="color:#94a3b8; font-size:0.85rem">${date}</td>
                <td style="font-family:monospace">${log.ip || '未知'}</td>
                <td style="font-weight:bold; color:var(--accent-blue)">${log.count}</td>
                <td>${device}</td>
            `;
            logsEl.appendChild(row);
        });
    } catch (e) {
        console.error('无法加载统计数据', e);
    }
}

/** ----------------核心数据获取---------------- **/

async function fetchData() {
    const response = await fetch('/data/ssq-full-data.json');
    if (!response.ok) throw new Error('Failed to load data');
    state.data = await response.json();
    state.data.sort((a, b) => new Date(b.date) - new Date(a.date));
    state.total = state.data.length;
}

function renderStats() {
    if (state.data.length === 0) return;
    els.totalIssues.textContent = state.data.length.toLocaleString();
    const latest = state.data[0];
    els.latestIssue.textContent = `${latest.issue} (${latest.date.split('(')[0]})`;
}

/** ----------------图表逻辑---------------- **/

function renderChart() {
    if (state.data.length === 0 || !els.chartCanvas) return;
    const recentData = state.data.slice(0, 30).reverse();
    const labels = recentData.map(item => item.issue);
    const datasets = [];
    for (let i = 0; i < 6; i++) {
        datasets.push({
            label: `红球 ${i + 1}`,
            data: recentData.map(item => parseInt(item.front[i])),
            borderColor: 'rgba(239, 68, 68, 0.6)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 2,
            tension: 0.3, pointRadius: 3, pointBackgroundColor: '#ef4444'
        });
    }
    datasets.push({
        label: '蓝球',
        data: recentData.map(item => parseInt(item.back)),
        borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3, borderDash: [5, 5], tension: 0.3, pointRadius: 4,
        pointBackgroundColor: '#3b82f6', yAxisID: 'y1'
    });

    if (chartInstance) chartInstance.destroy();
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
    chartInstance = new Chart(els.chartCanvas, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    padding: 10,
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toString().padStart(2, '0')}`
                    }
                }
            },
            scales: {
                y: { min: 1, max: 33, title: { display: true, text: '红球 (1-33)' } },
                y1: { position: 'right', min: 1, max: 16, grid: { drawOnChartArea: false }, title: { display: true, text: '蓝球 (1-16)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderHistory() {
    const start = (state.currentPage - 1) * state.pageSize;
    const currentData = state.data.slice(start, start + state.pageSize);
    els.historyList.innerHTML = '';
    currentData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span style="font-family: monospace; font-weight: 600; color: #cbd5e1">${item.issue}</span></td>
            <td style="color: #94a3b8">${item.date}</td>
            <td>
                <div class="small-balls">
                    ${item.front.map(num => `<span class="ball red small">${num}</span>`).join('')}
                    <span class="ball blue small">${item.back}</span>
                </div>
            </td>
        `;
        els.historyList.appendChild(row);
    });
    els.pageInfo.textContent = `第 ${state.currentPage} 页 / 共 ${Math.ceil(state.total / state.pageSize)} 页`;
    els.prevPageBtn.disabled = state.currentPage === 1;
    els.nextPageBtn.disabled = state.currentPage >= Math.ceil(state.total / state.pageSize);
}

/** ----------------AI & 随机选号---------------- **/

/** ----------------AI Transformer 预测模块 (修复版)---------------- **/

async function runAIPrediction() {
    if (!window.tf) {
        els.aiStatus.textContent = "数据引擎未就绪...";
        return;
    }

    els.aiBtn.disabled = true;
    els.aiStatus.classList.remove('hidden');
    els.aiStatus.textContent = "正在从服务器加载 AI 模型...";
    els.aiResult.classList.add('hidden');

    try {
        const model = await tf.loadLayersModel('/model/model.json');
        els.aiStatus.textContent = "全量自适应残差模型加载成功...";

        const LOOKBACK = 12; // 严格适配 12 期
        if (state.data.length < LOOKBACK) throw new Error("历史数据不足以进行 12 期时序分析");

        // 1. 全局统计 (用于 Z-Score)
        const allNumericData = state.data.flatMap(d => [...d.front.map(Number), Number(d.back)]);
        const mean = allNumericData.reduce((a, b) => a + b, 0) / allNumericData.length;
        const std = Math.sqrt(allNumericData.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / allNumericData.length);
        const zScore = (v) => (v - mean) / (std || 1);

        const globalFreq = { red: Array(34).fill(0), blue: Array(17).fill(0) };
        state.data.forEach(d => {
            d.front.forEach(n => globalFreq.red[Number(n)]++);
            globalFreq.blue[Number(d.back)]++;
        });

        // 2. 状态追溯提取
        const recentHistory = [...state.data].slice(0, LOOKBACK).reverse();
        let currentOmit = { red: Array(34).fill(0), blue: Array(17).fill(0) };
        const historySorted = [...state.data].reverse();
        const beforeWindow = historySorted.slice(0, historySorted.length - LOOKBACK);
        
        beforeWindow.forEach(d => {
            for(let j=1; j<=33; j++) currentOmit.red[j]++;
            for(let j=1; j<=16; j++) currentOmit.blue[j]++;
            d.front.forEach(n => currentOmit.red[Number(n)] = 0);
            currentOmit.blue[Number(d.back)] = 0;
        });

        let windowVector = [];
        recentHistory.forEach(current => {
            for(let j=1; j<=33; j++) currentOmit.red[j]++;
            for(let j=1; j<=16; j++) currentOmit.blue[j]++;
            current.front.forEach(n => currentOmit.red[Number(n)] = 0);
            currentOmit.blue[Number(current.back)] = 0;

            const redInts = current.front.map(Number);
            const rangeRed = (Math.max(...redInts) - Math.min(...redInts)) / 32;
            const avgDev = (redInts.reduce((a, b) => a + Math.abs(b - 17), 0) / 6) / 16;
            
            // 新增 4 个高级统计特征 (同步 train.js)
            const sumRed = (redInts.reduce((a, b) => a + b, 0)) / 198;
            const oddCount = redInts.filter(n => n % 2 !== 0).length / 6;
            const bigCount = redInts.filter(n => n > 16).length / 6;
            const sortedReds = [...redInts].sort((a, b) => a - b);
            let serialCount = 0;
            for(let s=0; s<sortedReds.length-1; s++) {
                if(sortedReds[s+1] === sortedReds[s]+1) serialCount++;
            }
            serialCount /= 5;

            const base = [...redInts.map(zScore), zScore(Number(current.back))];
            const freq = [...redInts.map(n => globalFreq.red[n] / state.data.length), globalFreq.blue[Number(current.back)] / state.data.length];
            const omit = [...redInts.map(n => Math.min(currentOmit.red[n] / 50, 1)), Math.min(currentOmit.blue[Number(current.back)] / 50, 1)];
            
            // 总计 30 维/期
            windowVector.push(...base, ...freq, ...omit, rangeRed, avgDev, sumRed, oddCount, bigCount, serialCount);
        });

        // 3. 推理
        const inputTensor = tf.tensor2d([windowVector]);
        const prediction = model.predict(inputTensor);
        const resultData = await prediction.data();

        // --- 反归一化优化逻辑 ---
        let rawFront = Array.from(resultData.slice(0, 6)).map(n => n * 33);
        let rawBack = resultData[6] * 16;

        let finalFront = [];
        let sortedIndices = rawFront.map((val, idx) => ({ val, idx }))
                                    .sort((a, b) => a.val - b.val);
        
        sortedIndices.forEach(item => {
            let val = Math.max(1, Math.min(33, Math.round(item.val)));
            while (finalFront.includes(val)) {
                if (val < 33) val++; else val = 1;
            }
            finalFront.push(val);
        });
        finalFront.sort((a, b) => a - b);

        let finalBack = Math.max(1, Math.min(16, Math.round(rawBack)));
        renderAIResult(finalFront, finalBack);
        
        tf.dispose([inputTensor, prediction, model]);
        els.aiStatus.textContent = "时序推理完成";
        setTimeout(() => els.aiStatus.classList.add('hidden'), 2000);
        els.aiBtn.disabled = false;

    } catch (e) {
        console.error("AI Error:", e);
        els.aiStatus.textContent = "失败: " + e.message;
        els.aiBtn.disabled = false;
    }
}

function renderAIResult(front, back) {
    els.aiResult.classList.remove('hidden');
    els.aiBallsContainer.innerHTML = '';
    front.forEach(n => {
        const span = document.createElement('span');
        span.className = 'ball red small animate';
        span.textContent = n.toString().padStart(2,'0');
        els.aiBallsContainer.appendChild(span);
    });
    const bSpan = document.createElement('span');
    bSpan.className = 'ball blue small animate';
    bSpan.textContent = back.toString().padStart(2,'0');
    els.aiBallsContainer.appendChild(bSpan);
}

function generateLuckyNumber() {
    const lucky = {
        front: [],
        back: Math.floor(Math.random()*16+1).toString().padStart(2,'0')
    };
    while(lucky.front.length < 6) {
        const n = Math.floor(Math.random()*33+1).toString().padStart(2,'0');
        if(!lucky.front.includes(n)) lucky.front.push(n);
    }
    lucky.front.sort((a,b)=>a-b);
    
    const container = els.generatedTicket.querySelector('.balls-container');
    container.innerHTML = '';
    [...lucky.front, lucky.back].forEach((n, i) => {
        const s = document.createElement('span');
        s.className = `ball ${i===6?'blue':'red'} animate`;
        s.style.animationDelay = `${i*100}ms`;
        s.textContent = n;
        container.appendChild(s);
    });
}

function setupEventListeners() {
    els.prevPageBtn.onclick = () => { if(state.currentPage>1) { state.currentPage--; renderHistory(); }};
    els.nextPageBtn.onclick = () => { if(state.currentPage < Math.ceil(state.total/state.pageSize)) { state.currentPage++; renderHistory(); }};
    els.generateBtn.onclick = generateLuckyNumber;
    if(els.aiBtn) els.aiBtn.onclick = runAIPrediction;
}

init();
