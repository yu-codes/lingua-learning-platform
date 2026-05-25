/**
 * Main Application Module
 * Handles routing, page rendering, and data loading
 */
const App = (() => {
    const BASE_PATH = getBasePath();
    let categoriesData = null;
    let currentView = 'home';

    function getBasePath() {
        const path = window.location.pathname;
        const segments = path.split('/').filter(Boolean);
        if (segments.length > 0 && segments[0] === 'lingua-learning-platform') {
            return '/lingua-learning-platform';
        }
        return '';
    }

    function init() {
        window.addEventListener('hashchange', handleRoute);
        handleRoute();
    }

    function handleRoute() {
        const hash = window.location.hash.slice(1) || '/';
        const parts = hash.split('/').filter(Boolean);

        if (parts.length === 0) {
            renderHome();
        } else if (parts[0] === 'japanese') {
            if (parts[1] === '50-sounds') {
                renderFiftySounds();
            } else {
                renderLanguageSystems('japanese');
            }
        } else if (parts[0] === 'english') {
            if (parts[1] === 'thematic') {
                const category = parts[2] || null;
                const subcategory = parts[3] || null;
                renderThematic(category, subcategory);
            } else {
                renderLanguageSystems('english');
            }
        }
    }

    // ===== Home Page =====
    function renderHome() {
        currentView = 'home';
        document.getElementById('app').innerHTML = `
            <div class="header">
                <h1>🌐 語言學習平台</h1>
            </div>
            <div class="home-container">
                <h2>選擇學習語言</h2>
                <p>請選擇您想學習的語言</p>
                <div class="language-grid">
                    <div class="language-card" onclick="App.navigate('japanese')">
                        <div class="icon">🇯🇵</div>
                        <h3>日語</h3>
                        <p>50音學習系統</p>
                    </div>
                    <div class="language-card" onclick="App.navigate('english')">
                        <div class="icon">🇺🇸</div>
                        <h3>英語</h3>
                        <p>主題式英文學習系統</p>
                    </div>
                </div>
            </div>
        `;
    }

    // ===== Language Systems Page =====
    function renderLanguageSystems(lang) {
        currentView = 'systems';
        const langData = {
            japanese: { name: '日語', icon: '🇯🇵', systems: [
                { id: '50-sounds', name: '50音學習系統', desc: '學習日語平假名與片假名的基礎發音' }
            ]},
            english: { name: '英語', icon: '🇺🇸', systems: [
                { id: 'thematic', name: '主題式英文學習系統', desc: '依照生活主題分類，學習實用英文句型' }
            ]}
        };

        const data = langData[lang];
        document.getElementById('app').innerHTML = `
            <div class="header">
                <button class="back-btn" onclick="App.navigate('')">← 返回</button>
                <h1>${data.icon} ${data.name}學習系統</h1>
            </div>
            <div class="home-container">
                <h2>選擇學習系統</h2>
                <p>請選擇您想使用的學習系統</p>
                <div class="system-grid">
                    ${data.systems.map(s => `
                        <div class="system-card" onclick="App.navigate('${lang}/${s.id}')">
                            <h3>${s.name}</h3>
                            <p>${s.desc}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // ===== 50 Sounds Page =====
    async function renderFiftySounds() {
        currentView = '50-sounds';
        document.getElementById('app').innerHTML = `
            <div class="header">
                <button class="back-btn" onclick="App.navigate('japanese')">← 返回</button>
                <h1>🇯🇵 50音學習系統</h1>
            </div>
            <div class="fifty-sounds-container">
                <h2>平假名 (ひらがな)</h2>
                <div class="sounds-grid" id="hiragana-grid"></div>
                <h2 style="margin-top:2rem;">片假名 (カタカナ)</h2>
                <div class="sounds-grid" id="katakana-grid"></div>
            </div>
        `;

        try {
            const res = await fetch(`${BASE_PATH}/data/japanese/50-sounds/data.json`);
            const data = await res.json();
            renderSoundsGrid('hiragana-grid', data.hiragana);
            renderSoundsGrid('katakana-grid', data.katakana);
        } catch (e) {
            console.error('Failed to load 50 sounds data:', e);
        }
    }

    function renderSoundsGrid(containerId, sounds) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = sounds.map(s => `
            <div class="sound-card" onclick="TTS.speak('${s.romaji}', 'ja-JP')">
                <div class="kana">${s.kana}</div>
                <div class="romaji">${s.romaji}</div>
            </div>
        `).join('');
    }

    // ===== Thematic English System =====
    async function renderThematic(categoryId, subcategoryId) {
        currentView = 'thematic';

        if (!categoriesData) {
            try {
                const res = await fetch(`${BASE_PATH}/data/english/thematic/categories.json`);
                categoriesData = await res.json();
            } catch (e) {
                console.error('Failed to load categories:', e);
                return;
            }
        }

        document.getElementById('app').innerHTML = `
            <div class="header">
                <button class="back-btn" onclick="App.navigate('english')">← 返回</button>
                <h1>📚 主題式英文學習系統</h1>
            </div>
            <div class="thematic-layout">
                <div class="sidebar" id="sidebar"></div>
                <div class="content-area" id="content-area"></div>
            </div>
        `;

        renderSidebar(categoryId, subcategoryId);

        if (categoryId && subcategoryId) {
            loadSubcategoryContent(categoryId, subcategoryId);
        } else {
            renderWelcomeContent();
        }
    }

    function renderSidebar(activeCategoryId, activeSubcategoryId) {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar || !categoriesData) return;

        sidebar.innerHTML = categoriesData.categories.map(cat => {
            const isExpanded = cat.id === activeCategoryId;
            return `
                <div class="sidebar-category">
                    <div class="sidebar-category-title ${isExpanded ? 'expanded' : ''}" 
                         onclick="App.toggleCategory('${cat.id}')">
                        <span>${cat.icon} ${cat.name}</span>
                        <span class="arrow">▶</span>
                    </div>
                    <div class="sidebar-subcategories ${isExpanded ? 'show' : ''}" id="subcat-${cat.id}">
                        ${cat.subcategories.map(sub => `
                            <div class="sidebar-subcategory ${sub.id === activeSubcategoryId ? 'active' : ''}"
                                 onclick="App.navigate('english/thematic/${cat.id}/${sub.id}')">
                                ${sub.name}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    function toggleCategory(catId) {
        const title = document.querySelector(`#subcat-${catId}`).previousElementSibling;
        const subcats = document.getElementById(`subcat-${catId}`);
        title.classList.toggle('expanded');
        subcats.classList.toggle('show');
    }

    function renderWelcomeContent() {
        const content = document.getElementById('content-area');
        if (!content) return;
        content.innerHTML = `
            <div class="welcome-content">
                <div class="icon">👈</div>
                <p>請從左側選單選擇學習主題</p>
            </div>
        `;
    }

    async function loadSubcategoryContent(categoryId, subcategoryId) {
        const content = document.getElementById('content-area');
        if (!content) return;

        content.innerHTML = '<div class="welcome-content"><p>載入中...</p></div>';

        try {
            const res = await fetch(`${BASE_PATH}/data/english/thematic/${categoryId}/${subcategoryId}.json`);
            const data = await res.json();
            renderSentences(data);
        } catch (e) {
            content.innerHTML = '<div class="welcome-content"><p>載入失敗，請稍後再試</p></div>';
            console.error('Failed to load subcategory:', e);
        }
    }

    function renderSentences(data) {
        const content = document.getElementById('content-area');
        if (!content) return;

        Player.stop();
        Player.setSentences(data.sentences);
        Player.setOnStateChange(updatePlayerUI);

        content.innerHTML = `
            <div class="content-header">
                <h2>${data.title}</h2>
                <p>${data.description}</p>
            </div>
            <div class="player-controls">
                <button class="player-btn" id="play-btn" onclick="App.playerPlay()">
                    ▶ 播放全部
                </button>
                <button class="player-btn" id="pause-btn" onclick="App.playerPause()" style="display:none;">
                    ⏸ 暫停
                </button>
                <button class="player-btn stop-btn" id="stop-btn" onclick="App.playerStop()" style="display:none;">
                    ⏹ 停止
                </button>
                <select class="loop-select" id="loop-select" onchange="App.setLoop(this.value)">
                    <option value="none">不循環</option>
                    <option value="all">全部循環</option>
                    <option value="single">單句循環</option>
                </select>
                <span class="player-status" id="player-status"></span>
            </div>
            <div class="sentence-list">
                ${data.sentences.map((s, i) => `
                    <div class="sentence-item" id="sentence-${i}">
                        <button class="speak-btn" onclick="App.speakSingle(${i})" title="念誦此句">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                            </svg>
                        </button>
                        <div class="sentence-text">
                            <div class="sentence-en">${s.en}</div>
                            <div class="sentence-zh">${s.zh}</div>
                        </div>
                        <span class="sentence-number">${i + 1}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function updatePlayerUI(state) {
        const playBtn = document.getElementById('play-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const stopBtn = document.getElementById('stop-btn');
        const status = document.getElementById('player-status');

        if (!playBtn) return;

        if (state.isPlaying && !state.isPaused) {
            playBtn.style.display = 'none';
            pauseBtn.style.display = 'flex';
            stopBtn.style.display = 'flex';
            if (status) status.textContent = `播放中 ${state.currentIndex + 1}/${state.total}`;
        } else if (state.isPaused) {
            playBtn.style.display = 'flex';
            playBtn.innerHTML = '▶ 繼續';
            pauseBtn.style.display = 'none';
            stopBtn.style.display = 'flex';
            if (status) status.textContent = `已暫停 ${state.currentIndex + 1}/${state.total}`;
        } else {
            playBtn.style.display = 'flex';
            playBtn.innerHTML = '▶ 播放全部';
            pauseBtn.style.display = 'none';
            stopBtn.style.display = 'none';
            if (status) status.textContent = '';
            document.querySelectorAll('.sentence-item').forEach(el => el.classList.remove('playing'));
        }
    }

    // Player controls
    function playerPlay() {
        const state = Player.getState();
        if (state.isPaused) {
            Player.resume();
        } else {
            Player.play(0);
        }
    }

    function playerPause() {
        Player.pause();
    }

    function playerStop() {
        Player.stop();
    }

    function setLoop(mode) {
        Player.setLoopMode(mode);
    }

    function speakSingle(index) {
        Player.stop();
        const items = document.querySelectorAll('.sentence-item');
        items.forEach(el => el.classList.remove('playing'));
        if (items[index]) items[index].classList.add('playing');
        
        const sentences = Player.getState();
        const allSentences = document.querySelectorAll('.sentence-en');
        if (allSentences[index]) {
            TTS.speak(allSentences[index].textContent, 'en-US', () => {
                if (items[index]) items[index].classList.remove('playing');
            });
        }
    }

    function navigate(path) {
        Player.stop();
        window.location.hash = path ? `#/${path}` : '#/';
    }

    return {
        init, navigate, toggleCategory,
        playerPlay, playerPause, playerStop,
        setLoop, speakSingle
    };
})();

document.addEventListener('DOMContentLoaded', App.init);
