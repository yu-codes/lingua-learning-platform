/**
 * Main Router
 * Handles hash-based navigation and delegates to appropriate module
 */
const Router = (() => {
    // Adding a language means adding an entry here — the hero copy, the stat
    // strip and the panel grid all derive from this, nothing is hard-coded.
    const langData = {
        japanese: {
            name: '日語', label: 'Japanese', glyph: 'あ',
            tagline: '從假名開始，把發音練成反射動作。',
            systems: [
                { id: '50-sounds', name: '50音學習系統', desc: '平假名、片假名、濁音與拗音的發音訓練', tag: '發音' }
            ],
            stats: [
                { key: 'systems', label: '學習系統' },
                { key: 'units', label: '假名' },
                { key: 'groups', label: '音節分類' }
            ],
            async load() {
                const d = await fetchJSON('japanese/50-sounds/data/data.json');
                if (!d) return null;
                const groups = Object.keys(d);
                return {
                    systems: this.systems.length,
                    units: groups.reduce((n, k) => n + d[k].length, 0),
                    groups: groups.length,
                    topics: [
                        { name: '平假名' }, { name: '片假名' }, { name: '濁音' },
                        { name: '半濁音' }, { name: '拗音' }
                    ]
                };
            }
        },
        english: {
            name: '英語', label: 'English', glyph: 'Aa',
            tagline: '依生活情境分類，練的是真的用得上的句子。',
            systems: [
                { id: 'thematic', name: '主題式英文學習系統', desc: '依照生活主題分類的實用英文句型', tag: '句型' }
            ],
            stats: [
                { key: 'systems', label: '學習系統' },
                { key: 'units', label: '主題' },
                { key: 'groups', label: '分類' }
            ],
            async load() {
                const d = await fetchJSON('english/thematic/data/categories.json');
                if (!d || !d.categories) return null;
                return {
                    systems: this.systems.length,
                    units: d.categories.reduce((n, c) => n + (c.subcategories || []).length, 0),
                    groups: d.categories.length,
                    topics: d.categories.map(c => ({ name: c.name, path: `english/thematic/${c.id}` }))
                };
            }
        }
    };

    const statsCache = {};

    async function fetchJSON(url) {
        try {
            const r = await fetch(url);
            return r.ok ? await r.json() : null;
        } catch (e) {
            return null;
        }
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
        } else if (parts[0] === 'japanese' && parts[1] === '50-sounds') {
            JapaneseFiftySounds.render();
        } else if (parts[0] === 'english' && parts[1] === 'thematic') {
            const category = parts[2] || null;
            const subcategory = parts[3] || null;
            EnglishThematic.render(category, subcategory);
        } else {
            renderHome();
        }
    }

    function renderBrand() {
        return `
            <a class="brand" href="javascript:void(0)" onclick="Router.navigate('')" aria-label="回到首頁">
                <span class="brand-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
                        <circle cx="5" cy="7" r="1.9" fill="currentColor" stroke="none"/>
                        <circle cx="18" cy="5.5" r="1.5" fill="currentColor" stroke="none"/>
                        <circle cx="12" cy="13" r="2.2" fill="currentColor" stroke="none"/>
                        <circle cx="6" cy="18.5" r="1.5" fill="currentColor" stroke="none"/>
                        <circle cx="19" cy="17" r="1.9" fill="currentColor" stroke="none"/>
                        <path d="M5 7l7 6M18 5.5L12 13M12 13l-6 5.5M12 13l7 4" opacity="0.55"/>
                    </svg>
                </span>
                <span class="brand-text">Lingua<span class="brand-sub">YU</span></span>
            </a>
        `;
    }

    function renderTopbar(breadcrumbs) {
        const crumbs = (breadcrumbs && breadcrumbs.length)
            ? `<nav class="breadcrumb" aria-label="breadcrumb">${breadcrumbs.map((b, i) =>
                    i === breadcrumbs.length - 1
                        ? `<span class="breadcrumb-current">${b.name}</span>`
                        : `<a href="javascript:void(0)" onclick="Router.navigate('${b.path}')">${b.name}</a><span class="breadcrumb-sep">›</span>`
                ).join('')}</nav>`
            : '';

        return `
            <div class="topbar">
                <div class="topbar-inner">
                    ${renderBrand()}
                    ${crumbs}
                </div>
            </div>
        `;
    }

    function renderHome() {
        const langs = Object.keys(langData);

        document.getElementById('app').innerHTML = `
            ${renderTopbar()}
            <div class="home-container">
                <header class="hero">
                    <div class="home-eyebrow"><span class="dot"></span>Lingua Network</div>
                    <h1 class="home-title">讓每一種語言<br>都<span class="grad">練成直覺</span></h1>
                    <p class="home-subtitle">選一種語言，進入它的學習系統。發音、詞彙與句型都拆成可反覆練習的最小單位，隨時聽、隨時跟讀。</p>
                    <div class="hero-stats" id="hero-stats">
                        <div class="hero-stat"><b>${langs.length}</b><span>語言</span></div>
                        <div class="hero-stat"><b id="hs-systems">—</b><span>學習系統</span></div>
                        <div class="hero-stat"><b id="hs-topics">—</b><span>可練習單元</span></div>
                    </div>
                </header>

                <div class="lang-grid">
                    ${langs.map(renderLanguagePanel).join('')}
                </div>
            </div>
        `;

        hydrateHome();
    }

    function renderLanguagePanel(lang) {
        const d = langData[lang];
        const stats = d.stats.map(s =>
            `<div class="lang-stat"><b id="st-${lang}-${s.key}">—</b><span>${s.label}</span></div>`
        ).join('');

        const systems = d.systems.map(s => `
            <button class="lang-system" type="button" onclick="Router.navigate('${lang}/${s.id}')">
                <span class="lang-system-tag">${s.tag}</span>
                <span class="lang-system-body">
                    <span class="lang-system-name">${s.name}</span>
                    <span class="lang-system-desc">${s.desc}</span>
                </span>
                <span class="lang-system-go" aria-hidden="true">→</span>
            </button>
        `).join('');

        return `
            <article class="lang-panel">
                <div class="lang-panel-head">
                    <span class="lang-glyph" aria-hidden="true">${d.glyph}</span>
                    <div class="lang-headings">
                        <span class="lang-label">${d.label}</span>
                        <h2 class="lang-name">${d.name}</h2>
                        <p class="lang-tagline">${d.tagline}</p>
                    </div>
                </div>
                <div class="lang-stats">${stats}</div>
                <div class="lang-systems">${systems}</div>
                <div class="lang-topics" id="topics-${lang}"></div>
            </article>
        `;
    }

    async function hydrateHome() {
        const langs = Object.keys(langData);
        const results = await Promise.all(langs.map(async lang => {
            if (!statsCache[lang]) statsCache[lang] = await langData[lang].load();
            return [lang, statsCache[lang]];
        }));

        let systems = 0, topics = 0;

        results.forEach(([lang, s]) => {
            if (!s) return;
            systems += s.systems || 0;
            topics += s.units || 0;

            langData[lang].stats.forEach(st => {
                const el = document.getElementById(`st-${lang}-${st.key}`);
                if (el && s[st.key] != null) el.textContent = s[st.key];
            });

            const host = document.getElementById(`topics-${lang}`);
            if (!host || !s.topics || !s.topics.length) return;
            const shown = s.topics.slice(0, 8);
            host.innerHTML = `
                <span class="lang-topics-cap">收錄主題</span>
                <span class="lang-topics-list">
                    ${shown.map(tp => tp.path
                        ? `<button class="topic-chip is-link" type="button" onclick="Router.navigate('${tp.path}')">${tp.name}</button>`
                        : `<span class="topic-chip">${tp.name}</span>`).join('')}
                    ${s.topics.length > shown.length ? `<span class="topic-chip is-more">+${s.topics.length - shown.length}</span>` : ''}
                </span>
            `;
        });

        const a = document.getElementById('hs-systems');
        const b = document.getElementById('hs-topics');
        if (a) a.textContent = systems || '—';
        if (b) b.textContent = topics || '—';
    }

    function showSystemModal(lang) {
        // Remove existing modal if any
        const existing = document.getElementById('lang-modal-overlay');
        if (existing) { existing.remove(); return; }

        const data = langData[lang];
        const overlay = document.createElement('div');
        overlay.id = 'lang-modal-overlay';
        overlay.className = 'lang-modal-overlay';
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });

        overlay.innerHTML = `
            <div class="lang-modal">
                <div class="lang-modal-header">
                    <span class="lang-modal-label">${data.label}</span>
                    <span class="lang-modal-title">${data.name}</span>
                    <span class="lang-modal-close" onclick="document.getElementById('lang-modal-overlay').remove()">&#10005;</span>
                </div>
                ${data.systems.map(s => `
                    <div class="lang-modal-system-item" onclick="document.getElementById('lang-modal-overlay').remove(); Router.navigate('${lang}/${s.id}')">
                        <div>
                            <div class="lang-modal-system-name">${s.name}</div>
                            <div class="lang-modal-system-desc">${s.desc}</div>
                        </div>
                        <span class="lang-modal-system-arrow">&#9654;</span>
                    </div>
                `).join('')}
            </div>
        `;

        document.body.appendChild(overlay);
    }

    function toggleLang(lang) {
        showSystemModal(lang);
    }

    function navigate(path) {
        if (typeof Player !== 'undefined') Player.stop();
        window.location.hash = path ? `#/${path}` : '#/';
    }

    return { init, navigate, toggleLang, showSystemModal, renderTopbar, langData };
})();

document.addEventListener('DOMContentLoaded', Router.init);
