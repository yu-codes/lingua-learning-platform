/**
 * Main Router
 * Handles hash-based navigation and delegates to appropriate module
 */
const Router = (() => {
    const langData = {
        japanese: { name: '日語', label: 'Japanese', systems: [
            { id: '50-sounds', name: '50音學習系統', desc: '平假名與片假名基礎發音訓練' }
        ]},
        english: { name: '英語', label: 'English', systems: [
            { id: 'thematic', name: '主題式英文學習系統', desc: '依照生活主題分類的實用英文句型' }
        ]}
    };

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

    function renderTopbar(breadcrumbs) {
        if (!breadcrumbs || breadcrumbs.length === 0) {
            return `
                <div class="topbar">
                    <span class="site-logo" onclick="Router.navigate('')">YU</span>
                </div>
            `;
        }

        const crumbs = breadcrumbs.map((b, i) => {
            if (i === breadcrumbs.length - 1) {
                return `<span class="breadcrumb-current">${b.name}</span>`;
            }
            return `<a href="javascript:void(0)" onclick="Router.navigate('${b.path}')">${b.name}</a><span class="breadcrumb-sep">›</span>`;
        }).join('');

        return `
            <div class="topbar">
                <span class="site-logo" onclick="Router.navigate('')">YU</span>
                <nav class="breadcrumb" aria-label="breadcrumb">
                    ${crumbs}
                </nav>
            </div>
        `;
    }

    function renderHome() {
        document.getElementById('app').innerHTML = `
            ${renderTopbar()}
            <div class="home-container">
                <div class="home-eyebrow"><span class="dot"></span>Lingua Network</div>
                <h1 class="home-title">Lingua <span class="grad">Learning</span> Platform</h1>
                <p class="home-subtitle">在漂浮的語料星圖之間，選一條路徑開始。日語五十音、英語主題句型 — 內容清晰，背景安靜。</p>
                <div class="language-grid">
                    ${renderLanguageCard('japanese')}
                    ${renderLanguageCard('english')}
                </div>
            </div>
        `;
    }

    function renderLanguageCard(lang) {
        const data = langData[lang];

        return `
            <div class="language-card" onclick="Router.showSystemModal('${lang}')">
                <div class="card-label">${data.label}</div>
                <div class="card-header">
                    <h3>${data.name}</h3>
                    <span class="card-arrow">&#9654;</span>
                </div>
            </div>
        `;
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
