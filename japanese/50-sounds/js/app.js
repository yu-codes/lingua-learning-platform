/**
 * Japanese 50-Sounds Learning System
 * Two tabs: Learn (with expandable cards) and Practice
 */
const JapaneseFiftySounds = (() => {
    const BASE_PATH = getBasePath();
    let soundsData = null;
    let currentTab = 'learn';
    let expandedCards = { hiragana: true, katakana: false, dakuon: false, youon: false };
    let practiceSource = 'hiragana';
    let practiceIndex = 0;
    let practiceList = [];
    let showRomaji = true;

    function getBasePath() {
        const path = window.location.pathname;
        if (path.includes('/lingua-learning-platform')) {
            return path.substring(0, path.indexOf('/lingua-learning-platform') + '/lingua-learning-platform'.length);
        }
        return '';
    }

    async function render() {
        if (!soundsData) {
            try {
                const res = await fetch(`${BASE_PATH}/japanese/50-sounds/data/data.json`);
                soundsData = await res.json();
            } catch (e) {
                console.error('Failed to load 50 sounds data:', e);
                return;
            }
        }

        const breadcrumbs = [
            { name: '首頁', path: '' },
            { name: '日語', path: '' },
            { name: '50音學習系統', path: 'japanese/50-sounds' }
        ];

        document.getElementById('app').innerHTML = `
            ${Router.renderTopbar(breadcrumbs)}
            <div class="fifty-sounds-page">
                <div class="fifty-sounds-tabs">
                    <div class="fifty-sounds-tab ${currentTab === 'learn' ? 'active' : ''}" onclick="JapaneseFiftySounds.switchTab('learn')">學習</div>
                    <div class="fifty-sounds-tab ${currentTab === 'practice' ? 'active' : ''}" onclick="JapaneseFiftySounds.switchTab('practice')">練習</div>
                </div>
                <div class="fifty-sounds-content" id="sounds-content"></div>
            </div>
        `;

        renderTabContent();
    }

    function switchTab(tab) {
        currentTab = tab;
        document.querySelectorAll('.fifty-sounds-tab').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.fifty-sounds-tab').forEach(el => {
            if (el.textContent.trim() === (tab === 'learn' ? '學習' : '練習')) {
                el.classList.add('active');
            }
        });
        renderTabContent();
    }

    function renderTabContent() {
        const container = document.getElementById('sounds-content');
        if (!container || !soundsData) return;

        if (currentTab === 'practice') {
            renderPractice(container);
        } else {
            renderLearn(container);
        }
    }

    function renderLearn(container) {
        const cards = [
            { id: 'hiragana', title: '清音 — 平假名 (ひらがな)', data: soundsData.hiragana },
            { id: 'katakana', title: '清音 — 片假名 (カタカナ)', data: soundsData.katakana },
            { id: 'dakuon', title: '濁音・半濁音', data: [...(soundsData.dakuon_hiragana || []), ...(soundsData.handakuon_hiragana || [])] },
            { id: 'youon', title: '拗音 (ようおん)', data: soundsData.youon_hiragana }
        ];

        container.innerHTML = cards.map(card => {
            const isExpanded = expandedCards[card.id];
            const gridHtml = isExpanded ? renderGrid(card.data, card.id) : '';
            return `
                <div class="learn-card">
                    <div class="learn-card-header" onclick="JapaneseFiftySounds.toggleCard('${card.id}')">
                        <span class="learn-card-title">${card.title}</span>
                        <span class="learn-card-arrow ${isExpanded ? 'expanded' : ''}">&#9654;</span>
                    </div>
                    <div class="learn-card-body ${isExpanded ? 'show' : ''}">
                        ${gridHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderGrid(sounds, cardId) {
        if (!sounds || sounds.length === 0) return '<p style="color:var(--text-muted);padding:1rem;">尚無資料</p>';
        const cards = sounds.map((s, i) => {
            if (!s.kana || s.kana.trim() === '' || s.kana === '　') {
                return `<div class="sound-card empty"><div class="kana">&nbsp;</div></div>`;
            }
            return `
                <div class="sound-card" onclick="JapaneseFiftySounds.playSound('${s.romaji}', this)">
                    <div class="kana">${s.kana}</div>
                    <div class="romaji">${s.romaji}</div>
                </div>
            `;
        }).join('');

        return `<div class="sounds-grid">${cards}</div>`;
    }

    function toggleCard(cardId) {
        expandedCards[cardId] = !expandedCards[cardId];
        renderTabContent();
    }

    function renderPractice(container) {
        const source = practiceSource === 'katakana' ? soundsData.katakana : soundsData.hiragana;
        practiceList = source.filter(s => s.kana && s.kana.trim() !== '' && s.kana !== '　');

        if (practiceIndex >= practiceList.length) practiceIndex = 0;
        const current = practiceList[practiceIndex];

        container.innerHTML = `
            <div class="practice-section">
                <div class="practice-title">隨機練習模式</div>
                <div class="practice-controls">
                    <button class="practice-btn ${practiceSource === 'hiragana' ? 'active' : ''}" onclick="JapaneseFiftySounds.setPracticeSource('hiragana')">平假名</button>
                    <button class="practice-btn ${practiceSource === 'katakana' ? 'active' : ''}" onclick="JapaneseFiftySounds.setPracticeSource('katakana')">片假名</button>
                    <button class="practice-btn" onclick="JapaneseFiftySounds.toggleRomaji()" id="romaji-toggle">
                        ${showRomaji ? '隱藏羅馬拼音' : '顯示羅馬拼音'}
                    </button>
                    <button class="practice-btn" onclick="JapaneseFiftySounds.shufflePractice()">隨機排序</button>
                </div>
                <div class="practice-display">
                    <div class="big-kana">${current ? current.kana : ''}</div>
                    <div class="big-romaji ${showRomaji ? '' : 'hidden'}">${current ? current.romaji : ''}</div>
                    <div class="practice-nav">
                        <button onclick="JapaneseFiftySounds.prevPractice()">&#9664; 上一個</button>
                        <button onclick="JapaneseFiftySounds.playCurrentPractice()">&#9654; 發音</button>
                        <button onclick="JapaneseFiftySounds.nextPractice()">下一個 &#9654;</button>
                    </div>
                    <div class="practice-progress">${practiceIndex + 1} / ${practiceList.length}</div>
                </div>
            </div>
        `;
    }

    function playSound(romaji, el) {
        if (!romaji) return;
        document.querySelectorAll('.sound-card').forEach(c => c.classList.remove('playing'));
        if (el) el.classList.add('playing');

        TTS.speak(romaji, 'ja-JP', () => {
            if (el) setTimeout(() => el.classList.remove('playing'), 300);
        });
    }

    function setPracticeSource(type) {
        practiceSource = type;
        const source = type === 'katakana' ? soundsData.katakana : soundsData.hiragana;
        practiceList = source.filter(s => s.kana && s.kana.trim() !== '' && s.kana !== '　');
        practiceIndex = 0;
        renderTabContent();
    }

    function toggleRomaji() {
        showRomaji = !showRomaji;
        const el = document.querySelector('.big-romaji');
        if (el) el.classList.toggle('hidden', !showRomaji);
        const btn = document.getElementById('romaji-toggle');
        if (btn) btn.textContent = showRomaji ? '隱藏羅馬拼音' : '顯示羅馬拼音';
    }

    function shufflePractice() {
        for (let i = practiceList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [practiceList[i], practiceList[j]] = [practiceList[j], practiceList[i]];
        }
        practiceIndex = 0;
        updatePracticeDisplay();
    }

    function nextPractice() {
        practiceIndex = (practiceIndex + 1) % practiceList.length;
        updatePracticeDisplay();
    }

    function prevPractice() {
        practiceIndex = (practiceIndex - 1 + practiceList.length) % practiceList.length;
        updatePracticeDisplay();
    }

    function playCurrentPractice() {
        const current = practiceList[practiceIndex];
        if (current) playSound(current.romaji, null);
    }

    function updatePracticeDisplay() {
        const current = practiceList[practiceIndex];
        if (!current) return;
        const kanaEl = document.querySelector('.big-kana');
        const romajiEl = document.querySelector('.big-romaji');
        const progressEl = document.querySelector('.practice-progress');
        if (kanaEl) kanaEl.textContent = current.kana;
        if (romajiEl) romajiEl.textContent = current.romaji;
        if (progressEl) progressEl.textContent = `${practiceIndex + 1} / ${practiceList.length}`;
    }

    return {
        render, switchTab, playSound, toggleCard,
        setPracticeSource, toggleRomaji,
        shufflePractice, nextPractice, prevPractice,
        playCurrentPractice
    };
})();
