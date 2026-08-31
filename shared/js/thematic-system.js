/**
 * Thematic Sentence System (language-agnostic)
 *
 * Category → subcategory → sentence list, with per-sentence playback and a
 * play-all mode. Japanese entries additionally carry a kana reading.
 */
const ThematicSystem = (() => {

    function create(cfg) {
        // cfg: { route, base, ttsLang, label, langName, blurb, global }
        let cats = null;
        const cache = {};
        let activeCat = null, activeSub = null;
        let playing = false, playIndex = -1;

        async function fetchJSON(url) {
            const r = await fetch(url);
            if (!r.ok) throw new Error(`${r.status} ${url}`);
            return r.json();
        }

        async function render(catId, subId) {
            if (!cats) {
                try {
                    cats = await fetchJSON(`${cfg.base}/categories.json`);
                } catch (e) {
                    console.error('Failed to load categories', e);
                    return;
                }
            }
            stop();
            activeCat = catId || null;
            activeSub = subId || null;

            const cat = activeCat ? cats.categories.find(c => c.id === activeCat) : null;
            const sub = cat && activeSub ? cat.subcategories.find(s => s.id === activeSub) : null;

            const crumbs = [
                { name: '首頁', path: '' },
                { name: cfg.langName, path: '' },
                { name: cfg.shortLabel, path: cfg.route }
            ];
            if (sub) crumbs.push({ name: sub.name, path: `${cfg.route}/${activeCat}/${activeSub}` });

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
                            <span class="topic-toggle-cap">學習主題</span>
                            <span class="topic-toggle-now" id="topic-toggle-now">${sub ? `${esc(cat.name)} · ${esc(sub.name)}` : '選擇一個主題'}</span>
                        </span>
                        <span class="topic-toggle-arrow" aria-hidden="true">&#9662;</span>
                    </button>
                    <div class="sidebar" id="sidebar"></div>
                    <div class="content-area" id="content-area"></div>
                </div>
            `;

            renderSidebar();
            setMenu(!sub);

            if (sub) loadSentences(activeCat, activeSub);
            else renderWelcome();
        }

        function renderSidebar() {
            const el = document.getElementById('sidebar');
            if (!el) return;
            el.innerHTML = cats.categories.map(cat => {
                const open = cat.id === activeCat;
                const subs = cat.subcategories.map((s, i) => `
                    <div class="sidebar-subcategory ${s.id === activeSub ? 'active' : ''}"
                         onclick="${cfg.global}.pick('${cat.id}','${s.id}')">
                        <span class="sub-num">${String(i + 1).padStart(2, '0')}</span>${esc(s.name)}
                    </div>
                `).join('');
                return `
                    <div class="sidebar-category">
                        <div class="sidebar-category-title ${open ? 'expanded' : ''}"
                             onclick="${cfg.global}.toggleCategory('${cat.id}')">
                            <span class="cat-marker" style="background:${cat.color || '#22d3ee'}"></span>
                            <span>${esc(cat.name)}</span>
                            <span class="arrow">&#9654;</span>
                        </div>
                        <div class="sidebar-subcategories ${open ? 'show' : ''}" id="sub-${cat.id}">${subs}</div>
                    </div>
                `;
            }).join('');
        }

        function renderWelcome() {
            const nSub = cats.categories.reduce((n, c) => n + c.subcategories.length, 0);
            document.getElementById('content-area').innerHTML = `
                <div class="vocab-welcome">
                    <h2>${esc(cfg.label)}</h2>
                    <p>${cats.categories.length} 個分類、${nSub} 個主題。${cfg.blurb}</p>
                    <div class="vocab-theme-grid">
                        ${cats.categories.map(c => `
                            <button class="vocab-theme-card" type="button" onclick="${cfg.global}.toggleCategoryAndOpen('${c.id}')">
                                <span class="vocab-theme-card-name">${esc(c.name)}</span>
                                <span class="vocab-theme-card-en">${esc(c.nameEn || '')}</span>
                                <span class="vocab-theme-card-count">${c.subcategories.length} 個主題</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        async function loadSentences(catId, subId) {
            const content = document.getElementById('content-area');
            content.innerHTML = '<div class="vocab-loading">載入中…</div>';
            const key = `${catId}/${subId}`;
            try {
                if (!cache[key]) cache[key] = await fetchJSON(`${cfg.base}/${catId}/${subId}.json`);
            } catch (e) {
                content.innerHTML = '<div class="vocab-loading">這個主題的內容載入失敗。</div>';
                return;
            }
            const d = cache[key];
            content.innerHTML = `
                <div class="content-header">
                    <h2>${esc(d.title)}</h2>
                    <p>${esc(d.description || '')} · ${d.sentences.length} 句</p>
                </div>
                <div class="vocab-toolbar">
                    <button class="vocab-btn" id="play-all" type="button" onclick="${cfg.global}.playAll()">▶ 播放全部</button>
                    <button class="vocab-btn" type="button" onclick="${cfg.global}.stop()">■ 停止</button>
                    <span class="vocab-count">${d.sentences.length} 句</span>
                </div>
                <div class="vocab-list" id="sent-list">
                    ${d.sentences.map((s, i) => `
                        <article class="vocab-item sent-item" id="sent-${i}">
                            <div class="vocab-ex" style="border:none;margin:0;padding:0">
                                <button class="vocab-speak" type="button" title="唸出句子"
                                        onclick="${cfg.global}.say(this.dataset.t)" data-t="${attr(s.jp || s.en)}">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>
                                </button>
                                <div>
                                    <p class="vocab-ex-en">${esc(s.jp || s.en)}</p>
                                    ${s.kana ? `<p class="sent-kana">${esc(s.kana)}</p>` : ''}
                                    <p class="vocab-ex-zh">${esc(s.zh)}</p>
                                </div>
                                <span class="sent-num">${i + 1}</span>
                            </div>
                        </article>
                    `).join('')}
                </div>
            `;
        }

        /* ===== Playback ===== */

        function currentSentences() {
            const d = cache[`${activeCat}/${activeSub}`];
            return d ? d.sentences : [];
        }

        function playAll() {
            const list = currentSentences();
            if (!list.length) return;
            playing = true;
            playIndex = -1;
            playNext();
        }

        function playNext() {
            const list = currentSentences();
            if (!playing) return;
            playIndex++;
            document.querySelectorAll('.sent-item.playing').forEach(e => e.classList.remove('playing'));
            if (playIndex >= list.length) { stop(); return; }
            const el = document.getElementById(`sent-${playIndex}`);
            if (el) { el.classList.add('playing'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
            const s = list[playIndex];
            if (typeof TTS !== 'undefined') TTS.speak(s.jp || s.en, cfg.ttsLang, () => playNext());
            else stop();
        }

        function stop() {
            playing = false;
            playIndex = -1;
            if (typeof TTS !== 'undefined') TTS.stop();
            document.querySelectorAll('.sent-item.playing').forEach(e => e.classList.remove('playing'));
        }

        function say(text) {
            stop();
            if (typeof TTS !== 'undefined') TTS.speak(text, cfg.ttsLang);
        }

        /* ===== Navigation ===== */

        function toggleCategory(catId) {
            const box = document.getElementById(`sub-${catId}`);
            if (!box) return;
            box.classList.toggle('show');
            box.previousElementSibling.classList.toggle('expanded');
        }

        function toggleCategoryAndOpen(catId) {
            const cat = cats.categories.find(c => c.id === catId);
            if (cat && cat.subcategories.length) pick(catId, cat.subcategories[0].id);
        }

        function pick(catId, subId) {
            setMenu(false);
            Router.navigate(`${cfg.route}/${catId}/${subId}`);
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

        return { render, pick, say, playAll, stop, toggleMenu, toggleCategory, toggleCategoryAndOpen };
    }

    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function attr(s) { return esc(s).replace(/"/g, '&quot;'); }

    return { create };
})();
