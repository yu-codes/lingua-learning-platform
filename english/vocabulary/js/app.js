/**
 * English Core Vocabulary
 * Themed word lists with a gloss, an example sentence and pronunciation.
 */
const EnglishVocabulary = (() => {
    const BASE = 'english/vocabulary/data';

    let index = null;          // { themes: [...] }
    const themeCache = {};     // themeId -> { words: [...] }
    let activeTheme = null;
    let query = '';
    let hideZh = false;

    async function fetchJSON(url) {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`${r.status} ${url}`);
        return r.json();
    }

    async function render(themeId) {
        if (!index) {
            try {
                index = await fetchJSON(`${BASE}/index.json`);
            } catch (e) {
                console.error('Failed to load vocabulary index', e);
                return;
            }
        }

        activeTheme = themeId && index.themes.some(t => t.id === themeId) ? themeId : null;
        query = '';

        const theme = activeTheme ? index.themes.find(t => t.id === activeTheme) : null;
        const crumbs = [
            { name: '首頁', path: '' },
            { name: '英語', path: '' },
            { name: '核心單字', path: 'english/vocabulary' }
        ];
        if (theme) crumbs.push({ name: theme.name, path: `english/vocabulary/${theme.id}` });

        document.getElementById('app').innerHTML = `
            ${Router.renderTopbar(crumbs)}
            <div class="thematic-layout">
                <button class="topic-toggle" id="topic-toggle" type="button"
                        aria-controls="sidebar" aria-expanded="false"
                        onclick="EnglishVocabulary.toggleMenu()">
                    <span class="topic-toggle-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <path d="M4 6h16M4 12h16M4 18h10"/>
                        </svg>
                    </span>
                    <span class="topic-toggle-body">
                        <span class="topic-toggle-cap">單字主題</span>
                        <span class="topic-toggle-now" id="topic-toggle-now">${theme ? theme.name : '選擇一個主題'}</span>
                    </span>
                    <span class="topic-toggle-arrow" aria-hidden="true">&#9662;</span>
                </button>
                <div class="sidebar" id="sidebar"></div>
                <div class="content-area" id="content-area"></div>
            </div>
        `;

        renderSidebar();
        setMenu(!activeTheme);

        if (activeTheme) loadTheme(activeTheme);
        else renderWelcome();
    }

    function renderSidebar() {
        const el = document.getElementById('sidebar');
        if (!el) return;
        el.innerHTML = index.themes.map((t, i) => `
            <div class="sidebar-subcategory ${t.id === activeTheme ? 'active' : ''}"
                 onclick="EnglishVocabulary.pick('${t.id}')">
                <span class="sub-num">${String(i + 1).padStart(2, '0')}</span>
                <span class="vocab-theme-name">${t.name}</span>
                <span class="vocab-theme-count">${t.count}</span>
            </div>
        `).join('');
    }

    function renderWelcome() {
        const total = index.themes.reduce((n, t) => n + t.count, 0);
        document.getElementById('content-area').innerHTML = `
            <div class="vocab-welcome">
                <h2>核心單字</h2>
                <p>${index.themes.length} 個主題，共 ${total} 個高頻單字。每個單字都附詞性、中文解釋與例句，可逐字或整句發音。</p>
                <div class="vocab-theme-grid">
                    ${index.themes.map(t => `
                        <button class="vocab-theme-card" type="button" onclick="EnglishVocabulary.pick('${t.id}')">
                            <span class="vocab-theme-card-name">${t.name}</span>
                            <span class="vocab-theme-card-en">${t.nameEn}</span>
                            <span class="vocab-theme-card-count">${t.count} 字</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    async function loadTheme(themeId) {
        const content = document.getElementById('content-area');
        content.innerHTML = '<div class="vocab-loading">載入中…</div>';
        try {
            if (!themeCache[themeId]) themeCache[themeId] = await fetchJSON(`${BASE}/${themeId}.json`);
        } catch (e) {
            content.innerHTML = '<div class="vocab-loading">這個主題的單字載入失敗。</div>';
            return;
        }
        renderWords();
    }

    function renderWords() {
        const theme = index.themes.find(t => t.id === activeTheme);
        const data = themeCache[activeTheme];
        const content = document.getElementById('content-area');
        if (!theme || !data) return;

        const q = query.trim().toLowerCase();
        const words = q
            ? data.words.filter(w => w.w.toLowerCase().includes(q) || (w.zh || '').includes(q))
            : data.words;

        content.innerHTML = `
            <div class="content-header">
                <h2>${theme.name}</h2>
                <p>${theme.nameEn} · ${data.words.length} 個單字</p>
            </div>
            <div class="vocab-toolbar">
                <div class="vocab-search">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                        <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
                    </svg>
                    <input id="vocab-q" type="search" placeholder="搜尋單字或中文" value="${escapeAttr(query)}"
                           oninput="EnglishVocabulary.search(this.value)" autocomplete="off">
                </div>
                <button class="vocab-btn ${hideZh ? 'active' : ''}" type="button" onclick="EnglishVocabulary.toggleZh()">
                    ${hideZh ? '顯示中文' : '隱藏中文'}
                </button>
                <span class="vocab-count">${words.length} / ${data.words.length}</span>
            </div>
            <div class="vocab-list ${hideZh ? 'hide-zh' : ''}" id="vocab-list">
                ${words.length ? words.map(renderWord).join('') : '<div class="vocab-loading">沒有符合的單字。</div>'}
            </div>
        `;
    }

    function renderWord(w, i) {
        const ex = w.ex ? `
            <div class="vocab-ex">
                <button class="vocab-speak sm" type="button" title="唸出例句"
                        onclick="EnglishVocabulary.say(this.dataset.t)" data-t="${escapeAttr(w.ex)}">
                    ${speakerIcon()}
                </button>
                <div>
                    <p class="vocab-ex-en">${escapeHtml(w.ex)}</p>
                    <p class="vocab-ex-zh">${escapeHtml(w.exZh || '')}</p>
                </div>
            </div>` : '';

        return `
            <article class="vocab-item">
                <div class="vocab-head">
                    <button class="vocab-speak" type="button" title="唸出單字"
                            onclick="EnglishVocabulary.say(this.dataset.t)" data-t="${escapeAttr(w.w)}">
                        ${speakerIcon()}
                    </button>
                    <h3 class="vocab-word">${escapeHtml(w.w)}</h3>
                    <span class="vocab-pos">${escapeHtml(w.p || '')}</span>
                    <span class="vocab-zh">${escapeHtml(w.zh || '')}</span>
                </div>
                ${ex}
            </article>
        `;
    }

    function speakerIcon() {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>';
    }

    /* ===== Actions ===== */

    function say(text) {
        if (typeof TTS !== 'undefined') TTS.speak(text, 'en-US');
    }

    function search(v) {
        query = v;
        const list = document.getElementById('vocab-list');
        const data = themeCache[activeTheme];
        if (!list || !data) return;
        const q = query.trim().toLowerCase();
        const words = q
            ? data.words.filter(w => w.w.toLowerCase().includes(q) || (w.zh || '').includes(q))
            : data.words;
        list.innerHTML = words.length ? words.map(renderWord).join('') : '<div class="vocab-loading">沒有符合的單字。</div>';
        const c = document.querySelector('.vocab-count');
        if (c) c.textContent = `${words.length} / ${data.words.length}`;
    }

    function toggleZh() {
        hideZh = !hideZh;
        renderWords();
        const input = document.getElementById('vocab-q');
        if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    }

    function pick(themeId) {
        setMenu(false);
        Router.navigate(`english/vocabulary/${themeId}`);
    }

    function setMenu(open) {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('topic-toggle');
        if (!sidebar || !toggle) return;
        sidebar.classList.toggle('is-open', open);
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function toggleMenu() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) setMenu(!sidebar.classList.contains('is-open'));
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function escapeAttr(s) {
        return escapeHtml(s).replace(/"/g, '&quot;');
    }

    return { render, pick, say, search, toggleZh, toggleMenu };
})();
