/**
 * Main Router
 * Handles hash-based navigation and delegates to appropriate module
 */
const Router = (() => {
    let expandedLang = null;

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
                <h1 class="home-title">Lingua Learning Platform</h1>
                <p class="home-subtitle">選擇語言，開始您的學習旅程</p>
                <div class="language-grid">
                    ${renderLanguageCard('japanese')}
                    ${renderLanguageCard('english')}
                </div>
            </div>
        `;
    }

    function renderLanguageCard(lang) {
        const data = langData[lang];
        const isExpanded = expandedLang === lang;

        const systemsHtml = isExpanded ? `
            <div class="system-list">
                ${data.systems.map(s => `
                    <div class="system-item" onclick="event.stopPropagation(); Router.navigate('${lang}/${s.id}')">
                        <div>
                            <div class="system-name">${s.name}</div>
                            <div class="system-desc">${s.desc}</div>
                        </div>
                        <span class="system-arrow">&#9654;</span>
                    </div>
                `).join('')}
            </div>
        ` : '';

        return `
            <div class="language-card ${isExpanded ? 'expanded' : ''}" onclick="Router.toggleLang('${lang}')">
                <div class="card-label">${data.label}</div>
                <div class="card-header">
                    <h3>${data.name}</h3>
                    <span class="card-arrow">&#9654;</span>
                </div>
                ${systemsHtml}
            </div>
        `;
    }

    function toggleLang(lang) {
        expandedLang = expandedLang === lang ? null : lang;
        renderHome();
    }

    function navigate(path) {
        if (typeof Player !== 'undefined') Player.stop();
        window.location.hash = path ? `#/${path}` : '#/';
    }

    return { init, navigate, toggleLang, renderTopbar, langData };
})();

document.addEventListener('DOMContentLoaded', Router.init);
