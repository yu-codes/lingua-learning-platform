/**
 * Japanese 50-Sounds Learning System
 */
const JapaneseFiftySounds = (() => {
    const BASE_PATH = getBasePath();
    let soundsData = null;
    let currentTab = 'hiragana';
    let practiceMode = false;
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

        document.getElementById('app').innerHTML = `
            <div class="header">
                <button class="back-btn" onclick="Router.navigate('japanese')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    返回
                </button>
                <div class="brand">
                    <h1>50音學習系統</h1>
                </div>
            </div>
            <div class="fifty-sounds-page">
                <div class="fifty-sounds-tabs">
                    <div class="fifty-sounds-tab ${currentTab === 'hiragana' ? 'active' : ''}" onclick="JapaneseFiftySounds.switchTab('hiragana')">平假名</div>
                    <div class="fifty-sounds-tab ${currentTab === 'katakana' ? 'active' : ''}" onclick="JapaneseFiftySounds.switchTab('katakana')">片假名</div>
                    <div class="fifty-sounds-tab ${currentTab === 'dakuon' ? 'active' : ''}" onclick="JapaneseFiftySounds.switchTab('dakuon')">濁音・半濁音</div>
                    <div class="fifty-sounds-tab ${currentTab === 'youon' ? 'active' : ''}" onclick="JapaneseFiftySounds.switchTab('youon')">拗音</div>
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
        event.target.classList.add('active');
        renderTabContent();
    }

    function renderTabContent() {
        const container = document.getElementById('sounds-content');
        if (!container || !soundsData) return;

        if (currentTab === 'practice') {
            renderPractice(container);
            return;
        }

        let html = '';

        if (currentTab === 'hiragana') {
            html += renderGrid('清音 — 平假名 (ひらがな)', soundsData.hiragana);
        } else if (currentTab === 'katakana') {
            html += renderGrid('清音 — 片假名 (カタカナ)', soundsData.katakana);
        } else if (currentTab === 'dakuon') {
            html += renderGrid('濁音 (だくおん)', soundsData.dakuon_hiragana);
            html += renderGrid('半濁音 (はんだくおん)', soundsData.handakuon_hiragana);
        } else if (currentTab === 'youon') {
            html += renderGrid('拗音 — 平假名', soundsData.youon_hiragana);
        }

        container.innerHTML = html;
    }

    function renderGrid(title, sounds) {
        if (!sounds || sounds.length === 0) return '';
        const cards = sounds.map((s, i) => {
            if (!s.kana || s.kana.trim() === '' || s.kana === '　') {
                return `<div class="sound-card empty"><div class="kana">&nbsp;</div></div>`;
            }
            return `
                <div class="sound-card" onclick="JapaneseFiftySounds.playSound('${s.romaji}', this)" id="sound-${currentTab}-${i}">
                    <div class="kana">${s.kana}</div>
                    <div class="romaji">${s.romaji}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="sounds-section-title">${title}</div>
            <div class="sounds-grid">${cards}</div>
        `;
    }

    function renderPractice(container) {
        const source = currentTab === 'katakana' ? soundsData.katakana : soundsData.hiragana;
        practiceList = source.filter(s => s.kana && s.kana.trim() !== '' && s.kana !== '　');

        if (practiceIndex >= practiceList.length) practiceIndex = 0;
        const current = practiceList[practiceIndex];

        container.innerHTML = `
            <div class="practice-section">
                <div class="practice-title">隨機練習模式</div>
                <div class="practice-controls">
                    <button class="practice-btn ${!practiceMode ? 'active' : ''}" onclick="JapaneseFiftySounds.setPracticeSource('hiragana')">平假名</button>
                    <button class="practice-btn ${practiceMode ? 'active' : ''}" onclick="JapaneseFiftySounds.setPracticeSource('katakana')">片假名</button>
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
        practiceMode = (type === 'katakana');
        const source = practiceMode ? soundsData.katakana : soundsData.hiragana;
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
        if (kanaEl) kanaEl.textContent = current.kana;
        if (romajiEl) romajiEl.textContent = current.romaji;
    }

    return {
        render, switchTab, playSound,
        setPracticeSource, toggleRomaji,
        shufflePractice, nextPractice, prevPractice,
        playCurrentPractice
    };
})();
