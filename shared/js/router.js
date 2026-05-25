/**
 * Main Router
 * Handles hash-based navigation and delegates to appropriate module
 */
const Router = (() => {
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
                JapaneseFiftySounds.render();
            } else {
                renderLanguageSystems('japanese');
            }
        } else if (parts[0] === 'english') {
            if (parts[1] === 'thematic') {
                const category = parts[2] || null;
                const subcategory = parts[3] || null;
                EnglishThematic.render(category, subcategory);
            } else {
                renderLanguageSystems('english');
            }
        }
    }

    function renderHome() {
        document.getElementById('app').innerHTML = `
            <div class="header">
                <div class="brand">
                    <div class="brand-icon">
                        <svg viewBox="0 0 24 24"><path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>
                    </div>
                    <h1>Lingua Learning Platform</h1>
                </div>
            </div>
            <div class="home-container">
                <h2>選擇學習語言</h2>
                <p class="subtitle">選擇您想學習的語言，開始您的學習旅程</p>
                <div class="language-grid">
                    <div class="language-card" onclick="Router.navigate('japanese')">
                        <div class="card-label">Japanese</div>
                        <h3>日語</h3>
                        <p>50音學習系統 — 平假名與片假名基礎發音訓練</p>
                    </div>
                    <div class="language-card" onclick="Router.navigate('english')">
                        <div class="card-label">English</div>
                        <h3>英語</h3>
                        <p>主題式英文學習系統 — 依照生活情境分類的實用句型</p>
                    </div>
                </div>
            </div>
        `;
    }

    function renderLanguageSystems(lang) {
        const langData = {
            japanese: { name: '日語', systems: [
                { id: '50-sounds', name: '50音學習系統', desc: '學習日語平假名與片假名的基礎發音，包含語音播放與互動練習' }
            ]},
            english: { name: '英語', systems: [
                { id: 'thematic', name: '主題式英文學習系統', desc: '依照生活主題分類，涵蓋 9 大領域、66 個子主題的實用英文句型' }
            ]}
        };

        const data = langData[lang];
        document.getElementById('app').innerHTML = `
            <div class="header">
                <button class="back-btn" onclick="Router.navigate('')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    返回
                </button>
                <div class="brand">
                    <h1>${data.name} — 選擇學習系統</h1>
                </div>
            </div>
            <div class="systems-container">
                ${data.systems.map(s => `
                    <div class="system-card" onclick="Router.navigate('${lang}/${s.id}')">
                        <h3>${s.name}</h3>
                        <p>${s.desc}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function navigate(path) {
        if (typeof Player !== 'undefined') Player.stop();
        window.location.hash = path ? `#/${path}` : '#/';
    }

    return { init, navigate };
})();

document.addEventListener('DOMContentLoaded', Router.init);
