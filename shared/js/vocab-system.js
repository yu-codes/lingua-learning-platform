/**
 * Vocabulary System (language-agnostic)
 *
 * One implementation drives both the English and Japanese word lists. A
 * language supplies its data path, TTS locale and whether entries carry a
 * reading (kana / romaji) above the headword.
 */
const VocabSystem = (() => {

    function create(cfg) {
        // cfg: { route, base, ttsLang, label, hasReading, global }
        let index = null;
        const cache = {};
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
                    index = await fetchJSON(`${cfg.base}/index.json`);
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
                { name: cfg.langName, path: '' },
                { name: cfg.label, path: cfg.route }
            ];
            if (theme) crumbs.push({ name: theme.name, path: `${cfg.route}/${theme.id}` });

            document.getElementById('app').innerHTML = `
                ${Router.renderTopbar(crumbs)}
                <div class="thematic-layout">
                    <button class="topic-toggle" id="topic-toggle" type="button"
                            aria-controls="sidebar" aria-expanded="false"
                            onclick="${cfg.global}.toggleMenu()">
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
                     onclick="${cfg.global}.pick('${t.id}')">
                    <span class="sub-num">${String(i + 1).padStart(2, '0')}</span>
                    <span class="vocab-theme-name">${esc(t.name)}</span>
                    <span class="vocab-theme-count">${t.count}</span>
                </div>
            `).join('');
        }

        function renderWelcome() {
            const total = index.themes.reduce((n, t) => n + t.count, 0);
            document.getElementById('content-area').innerHTML = `
                <div class="vocab-welcome">
                    <h2>${esc(cfg.label)}</h2>
                    <p>${index.themes.length} 個主題，共 ${total} 個高頻單字。${cfg.blurb}</p>
                    <div class="vocab-theme-grid">
                        ${index.themes.map(t => `
                            <button class="vocab-theme-card" type="button" onclick="${cfg.global}.pick('${t.id}')">
                                <span class="vocab-theme-card-name">${esc(t.name)}</span>
                                <span class="vocab-theme-card-en">${esc(t.nameEn)}</span>
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
                if (!cache[themeId]) cache[themeId] = await fetchJSON(`${cfg.base}/${themeId}.json`);
            } catch (e) {
                content.innerHTML = '<div class="vocab-loading">這個主題的單字載入失敗。</div>';
                return;
            }
            renderWords();
        }

        function filtered() {
            const data = cache[activeTheme];
            if (!data) return [];
            const q = query.trim().toLowerCase();
            if (!q) return data.words;
            return data.words.filter(w =>
                w.w.toLowerCase().includes(q) ||
                (w.zh || '').includes(q) ||
                (w.kana || '').includes(q) ||
                (w.romaji || '').toLowerCase().includes(q));
        }

        function renderWords() {
            const theme = index.themes.find(t => t.id === activeTheme);
            const data = cache[activeTheme];
            const content = document.getElementById('content-area');
            if (!theme || !data) return;
            const words = filtered();

            content.innerHTML = `
                <div class="content-header">
                    <h2>${esc(theme.name)}</h2>
                    <p>${esc(theme.nameEn)} · ${data.words.length} 個單字</p>
                </div>
                <div class="vocab-toolbar">
                    <div class="vocab-search">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                            <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
                        </svg>
                        <input id="vocab-q" type="search" placeholder="${cfg.searchHint}" value="${attr(query)}"
                               oninput="${cfg.global}.search(this.value)" autocomplete="off">
                    </div>
                    <button class="vocab-btn ${hideZh ? 'active' : ''}" type="button" onclick="${cfg.global}.toggleZh()">
                        ${hideZh ? '顯示中文' : '隱藏中文'}
                    </button>
                    <span class="vocab-count">${words.length} / ${data.words.length}</span>
                </div>
                <div class="vocab-list ${hideZh ? 'hide-zh' : ''}" id="vocab-list">
                    ${words.length ? words.map(renderWord).join('') : '<div class="vocab-loading">沒有符合的單字。</div>'}
                </div>
            `;
        }

        function renderWord(w) {
            const reading = cfg.hasReading && (w.kana || w.romaji) ? `
                <div class="vocab-reading">
                    ${w.kana ? `<span class="vocab-kana">${esc(w.kana)}</span>` : ''}
                    ${w.romaji ? `<span class="vocab-romaji">${esc(w.romaji)}</span>` : ''}
                </div>` : '';

            const ex = w.ex ? `
                <div class="vocab-ex">
                    <button class="vocab-speak sm" type="button" title="唸出例句"
                            onclick="${cfg.global}.say(this.dataset.t)" data-t="${attr(w.ex)}">${speaker()}</button>
                    <div>
                        <p class="vocab-ex-en">${esc(w.ex)}</p>
                        <p class="vocab-ex-zh">${esc(w.exZh || '')}</p>
                    </div>
                </div>` : '';

            return `
                <article class="vocab-item">
                    <div class="vocab-head">
                        <button class="vocab-speak" type="button" title="唸出單字"
                                onclick="${cfg.global}.say(this.dataset.t)" data-t="${attr(w.w)}">${speaker()}</button>
                        <div class="vocab-headword">
                            ${reading}
                            <h3 class="vocab-word">${esc(w.w)}</h3>
                        </div>
                        <span class="vocab-pos">${esc(w.p || '')}</span>
                        <span class="vocab-zh">${esc(w.zh || '')}</span>
                    </div>
                    ${ex}
                </article>
            `;
        }

        function speaker() {
            return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>';
        }

        function say(text) {
            if (typeof TTS !== 'undefined') TTS.speak(text, cfg.ttsLang);
        }

        function search(v) {
            query = v;
            const list = document.getElementById('vocab-list');
            const data = cache[activeTheme];
            if (!list || !data) return;
            const words = filtered();
            list.innerHTML = words.length ? words.map(renderWord).join('') : '<div class="vocab-loading">沒有符合的單字。</div>';
            const c = document.querySelector('.vocab-count');
            if (c) c.textContent = `${words.length} / ${data.words.length}`;
        }

        function toggleZh() {
            hideZh = !hideZh;
            renderWords();
        }

        function pick(themeId) {
            setMenu(false);
            Router.navigate(`${cfg.route}/${themeId}`);
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

        return { render, pick, say, search, toggleZh, toggleMenu };
    }

    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function attr(s) { return esc(s).replace(/"/g, '&quot;'); }

    return { create };
})();
