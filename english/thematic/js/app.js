/**
 * English Thematic Learning System
 */
const EnglishThematic = (() => {
    const BASE_PATH = getBasePath();
    let categoriesData = null;

    function getBasePath() {
        const path = window.location.pathname;
        if (path.includes('/lingua-learning-platform')) {
            return path.substring(0, path.indexOf('/lingua-learning-platform') + '/lingua-learning-platform'.length);
        }
        return '';
    }

    async function render(categoryId, subcategoryId) {
        if (!categoriesData) {
            try {
                const res = await fetch(`${BASE_PATH}/english/thematic/data/categories.json`);
                categoriesData = await res.json();
            } catch (e) {
                console.error('Failed to load categories:', e);
                return;
            }
        }

        // Build breadcrumbs
        const breadcrumbs = [
            { name: '首頁', path: '' },
            { name: '英語', path: '' }
        ];
        if (categoryId && subcategoryId) {
            const cat = categoriesData.categories.find(c => c.id === categoryId);
            const sub = cat ? cat.subcategories.find(s => s.id === subcategoryId) : null;
            breadcrumbs.push({ name: '主題式英文', path: 'english/thematic' });
            if (sub) {
                breadcrumbs.push({ name: sub.name, path: `english/thematic/${categoryId}/${subcategoryId}` });
            }
        } else {
            breadcrumbs.push({ name: '主題式英文', path: 'english/thematic' });
        }

        document.getElementById('app').innerHTML = `
            ${Router.renderTopbar(breadcrumbs)}
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

        const colors = {
            'daily-life': '#10b981',
            'transportation': '#f59e0b',
            'work': '#3b82f6',
            'social': '#8b5cf6',
            'emergency': '#ef4444',
            'education': '#f97316',
            'tech': '#6b7280',
            'consumer': '#1f2937',
            'advanced': '#06b6d4'
        };

        sidebar.innerHTML = categoriesData.categories.map(cat => {
            const isExpanded = cat.id === activeCategoryId;
            const color = colors[cat.id] || '#6b7280';
            // Per-category numbering: restart from 1 for each category
            const subcatsHtml = cat.subcategories.map((sub, idx) => {
                const num = String(idx + 1).padStart(2, '0');
                return `
                    <div class="sidebar-subcategory ${sub.id === activeSubcategoryId ? 'active' : ''}"
                         onclick="Router.navigate('english/thematic/${cat.id}/${sub.id}')">
                        <span class="sub-num">${num}</span>
                        ${sub.name}
                    </div>
                `;
            }).join('');

            return `
                <div class="sidebar-category">
                    <div class="sidebar-category-title ${isExpanded ? 'expanded' : ''}" 
                         onclick="EnglishThematic.toggleCategory('${cat.id}')">
                        <span class="cat-marker" style="background:${color}"></span>
                        <span>${cat.name}</span>
                        <span class="arrow">&#9654;</span>
                    </div>
                    <div class="sidebar-subcategories ${isExpanded ? 'show' : ''}" id="subcat-${cat.id}">
                        ${subcatsHtml}
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
                <div class="icon-placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--text-muted)">
                        <path d="M9 5l7 7-7 7"/>
                    </svg>
                </div>
                <p>從左側選單選擇學習主題</p>
            </div>
        `;
    }

    async function loadSubcategoryContent(categoryId, subcategoryId) {
        const content = document.getElementById('content-area');
        if (!content) return;

        content.innerHTML = '<div class="welcome-content"><p>載入中...</p></div>';

        try {
            const res = await fetch(`${BASE_PATH}/english/thematic/data/${categoryId}/${subcategoryId}.json`);
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
                <button class="player-btn" id="play-btn" onclick="EnglishThematic.playerPlay()">
                    &#9654; 播放全部
                </button>
                <button class="player-btn" id="pause-btn" onclick="EnglishThematic.playerPause()" style="display:none;">
                    &#10074;&#10074; 暫停
                </button>
                <button class="player-btn stop-btn" id="stop-btn" onclick="EnglishThematic.playerStop()" style="display:none;">
                    &#9632; 停止
                </button>
                <select id="loop-select" onchange="EnglishThematic.setLoop(this.value)">
                    <option value="none">不循環</option>
                    <option value="all">全部循環</option>
                    <option value="single">單句循環</option>
                </select>
                <span class="player-status" id="player-status"></span>
            </div>
            <div class="sentence-list">
                ${data.sentences.map((s, i) => `
                    <div class="sentence-item" id="sentence-${i}">
                        <button class="speak-btn" onclick="EnglishThematic.speakSingle(${i})" title="念誦此句">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                            </svg>
                        </button>
                        <div class="sentence-text">
                            <div class="sentence-en">${s.en}</div>
                            <div class="sentence-zh">${s.zh}</div>
                        </div>
                        <button class="sentence-loop-btn" onclick="EnglishThematic.toggleSingleLoop(${i})" title="設定此句為循環目標">
                            &#8635;
                        </button>
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
            if (status) status.textContent = `播放中 ${state.currentIndex + 1} / ${state.total}`;
        } else if (state.isPaused) {
            playBtn.style.display = 'flex';
            playBtn.innerHTML = '&#9654; 繼續';
            pauseBtn.style.display = 'none';
            stopBtn.style.display = 'flex';
            if (status) status.textContent = `已暫停 ${state.currentIndex + 1} / ${state.total}`;
        } else {
            playBtn.style.display = 'flex';
            playBtn.innerHTML = '&#9654; 播放全部';
            pauseBtn.style.display = 'none';
            stopBtn.style.display = 'none';
            if (status) status.textContent = '';
        }
    }

    function playerPlay() {
        const state = Player.getState();
        if (state.isPaused) {
            Player.resume();
        } else if (state.loopMode === 'single' && state.singleLoopIndex >= 0) {
            Player.play(state.singleLoopIndex);
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
        const status = document.getElementById('player-status');
        if (mode === 'single' && status) {
            status.textContent = '點擊句子右側 ↻ 按鈕選擇循環句';
        }
    }

    function toggleSingleLoop(index) {
        const currentLoop = Player.getSingleLoopIndex();
        if (currentLoop === index) {
            Player.setSingleLoopIndex(-1);
        } else {
            Player.setLoopMode('single');
            Player.setSingleLoopIndex(index);
            document.getElementById('loop-select').value = 'single';
            // If already playing, safely switch to this sentence
            const state = Player.getState();
            if (state.isPlaying) {
                Player.switchToSentence(index);
            }
        }
    }

    function speakSingle(index) {
        Player.stop();
        const items = document.querySelectorAll('.sentence-item');
        items.forEach(el => el.classList.remove('playing'));
        if (items[index]) items[index].classList.add('playing');

        const allSentences = document.querySelectorAll('.sentence-en');
        if (allSentences[index]) {
            TTS.speak(allSentences[index].textContent, 'en-US', () => {
                if (items[index]) items[index].classList.remove('playing');
            });
        }
    }

    return {
        render, toggleCategory,
        playerPlay, playerPause, playerStop,
        setLoop, toggleSingleLoop, speakSingle
    };
})();
