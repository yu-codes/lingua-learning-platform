/**
 * Grammar System (language-agnostic)
 *
 * Chapter-based lessons shared by the English and Japanese grammar courses:
 * explanation blocks, contrast tables, right/wrong examples and self-checks.
 */
const GrammarSystem = (() => {
    let quizSeq = 0;

    function create(cfg) {
        // cfg: { route, base, ttsLang, label, langName, blurb, global }
        let index = null;
        const cache = {};
        let activePart = null;

        async function fetchJSON(url) {
            const r = await fetch(url);
            if (!r.ok) throw new Error(`${r.status} ${url}`);
            return r.json();
        }

        async function render(partId) {
            if (!index) {
                try {
                    index = await fetchJSON(`${cfg.base}/index.json`);
                } catch (e) {
                    console.error('Failed to load grammar index', e);
                    return;
                }
            }

            activePart = partId && index.parts.some(p => p.id === partId) ? partId : null;
            const part = activePart ? index.parts.find(p => p.id === activePart) : null;

            const crumbs = [
                { name: '首頁', path: '' },
                { name: cfg.langName, path: '' },
                { name: cfg.shortLabel, path: cfg.route }
            ];
            if (part) crumbs.push({ name: part.title, path: `${cfg.route}/${part.id}` });

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
                            <span class="topic-toggle-cap">文法章節</span>
                            <span class="topic-toggle-now" id="topic-toggle-now">${part ? `Part ${part.no} · ${esc(part.title)}` : '選擇一個章節'}</span>
                        </span>
                        <span class="topic-toggle-arrow" aria-hidden="true">&#9662;</span>
                    </button>
                    <div class="sidebar" id="sidebar"></div>
                    <div class="content-area" id="content-area"></div>
                </div>
            `;

            renderSidebar();
            setMenu(!activePart);

            if (activePart) loadPart(activePart);
            else renderWelcome();
        }

        function renderSidebar() {
            const el = document.getElementById('sidebar');
            if (!el) return;
            el.innerHTML = index.parts.map(p => `
                <div class="sidebar-subcategory ${p.id === activePart ? 'active' : ''}"
                     onclick="${cfg.global}.pick('${p.id}')">
                    <span class="sub-num">${String(p.no).padStart(2, '0')}</span>
                    <span class="gr-side-title">${esc(p.title)}</span>
                </div>
            `).join('');
        }

        function renderWelcome() {
            const sections = index.parts.reduce((n, p) => n + (p.sections || 0), 0);
            document.getElementById('content-area').innerHTML = `
                <div class="vocab-welcome">
                    <h2>${esc(cfg.label)}</h2>
                    <p>${index.parts.length} 個章節、${sections} 個單元。${cfg.blurb}</p>
                    <div class="gr-part-grid">
                        ${index.parts.map(p => `
                            <button class="gr-part-card" type="button" onclick="${cfg.global}.pick('${p.id}')">
                                <span class="gr-part-no">PART ${String(p.no).padStart(2, '0')}</span>
                                <span class="gr-part-title">${esc(p.title)}</span>
                                <span class="gr-part-sub">${esc(p.subtitle)}</span>
                                <span class="gr-part-meta">${p.sections} 單元</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        async function loadPart(partId) {
            const content = document.getElementById('content-area');
            content.innerHTML = '<div class="vocab-loading">載入中…</div>';
            try {
                if (!cache[partId]) cache[partId] = await fetchJSON(`${cfg.base}/${partId}.json`);
            } catch (e) {
                content.innerHTML = '<div class="vocab-loading">這個章節載入失敗。</div>';
                return;
            }
            const p = cache[partId];
            const meta = index.parts.find(x => x.id === partId);
            const i = index.parts.findIndex(x => x.id === partId);
            const prev = i > 0 ? index.parts[i - 1] : null;
            const next = i < index.parts.length - 1 ? index.parts[i + 1] : null;

            content.innerHTML = `
                <div class="content-header">
                    <span class="gr-eyebrow">PART ${String(meta.no).padStart(2, '0')} · ${esc(meta.subtitle)}</span>
                    <h2>${esc(p.title)}</h2>
                    <p>${esc(p.summary || '')}</p>
                </div>
                <nav class="gr-toc">
                    ${p.sections.map((s, n) => `
                        <button type="button" onclick="${cfg.global}.jump('sec-${n}')">
                            <span>${String(n + 1).padStart(2, '0')}</span>${esc(s.title)}
                        </button>
                    `).join('')}
                </nav>
                ${p.sections.map((s, n) => `
                    <section class="gr-section" id="sec-${n}">
                        <h3 class="gr-section-title"><span>${String(n + 1).padStart(2, '0')}</span>${esc(s.title)}</h3>
                        ${(s.blocks || []).map(renderBlock).join('')}
                    </section>
                `).join('')}
                <div class="gr-nav">
                    ${prev ? `<button class="gr-nav-btn" type="button" onclick="${cfg.global}.pick('${prev.id}')">← Part ${prev.no}　${esc(prev.title)}</button>` : '<span></span>'}
                    ${next ? `<button class="gr-nav-btn" type="button" onclick="${cfg.global}.pick('${next.id}')">Part ${next.no}　${esc(next.title)} →</button>` : '<span></span>'}
                </div>
            `;
        }

        function renderBlock(b) {
            switch (b.type) {
                case 'text':
                    return `<p class="gr-text">${esc(b.value)}</p>`;
                case 'rule':
                    return `<div class="gr-rule"><span class="gr-rule-cap">規則</span><span>${esc(b.value)}</span></div>`;
                case 'list':
                    return `<ul class="gr-list">${b.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
                case 'table':
                    return `<div class="gr-table-wrap"><table class="gr-table">
                        <thead><tr>${b.headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
                        <tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
                    </table></div>`;
                case 'examples':
                    return `<div class="gr-examples">${b.items.map(x => `
                        <div class="gr-ex ${x.bad ? 'is-bad' : ''}">
                            <button class="vocab-speak sm" type="button" title="唸出例句"
                                    onclick="${cfg.global}.say(this.dataset.t)" data-t="${attr(x.en)}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>
                            </button>
                            <div>
                                <p class="gr-ex-en">${x.bad ? '<span class="gr-x">✗</span>' : ''}${esc(x.en)}</p>
                                ${x.reading ? `<p class="gr-ex-reading">${esc(x.reading)}</p>` : ''}
                                ${x.zh ? `<p class="gr-ex-zh">${esc(x.zh)}</p>` : ''}
                                ${x.note ? `<p class="gr-ex-note">${esc(x.note)}</p>` : ''}
                            </div>
                        </div>`).join('')}</div>`;
                case 'tip':
                    return `<div class="gr-tip"><span aria-hidden="true">💡</span><span>${esc(b.value)}</span></div>`;
                case 'trap':
                    return `<div class="gr-trap"><span class="gr-trap-cap">${esc(cfg.trapLabel || '常見陷阱')}</span><span>${esc(b.value)}</span></div>`;
                case 'quiz':
                    return renderQuiz(b);
                default:
                    return '';
            }
        }

        function renderQuiz(b) {
            const id = `q${quizSeq++}`;
            return `
                <div class="gr-quiz" id="${id}">
                    <p class="gr-quiz-q">${esc(b.q)}</p>
                    <div class="gr-quiz-opts">
                        ${b.options.map((o, i) => `
                            <button type="button" class="gr-opt" data-i="${i}"
                                    onclick="${cfg.global}.answer('${id}', ${i}, ${b.answer})">
                                <span class="gr-opt-k">${'ABCD'[i]}</span>${esc(o)}
                            </button>
                        `).join('')}
                    </div>
                    <p class="gr-quiz-explain" hidden>${esc(b.explain || '')}</p>
                </div>
            `;
        }

        function answer(id, picked, correct) {
            const box = document.getElementById(id);
            if (!box || box.classList.contains('answered')) return;
            box.classList.add('answered');
            box.querySelectorAll('.gr-opt').forEach(btn => {
                const i = Number(btn.dataset.i);
                if (i === correct) btn.classList.add('is-right');
                else if (i === picked) btn.classList.add('is-wrong');
                btn.disabled = true;
            });
            const ex = box.querySelector('.gr-quiz-explain');
            if (ex) ex.hidden = false;
        }

        function jump(id) {
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        function say(text) {
            if (typeof TTS !== 'undefined') TTS.speak(text, cfg.ttsLang);
        }

        function pick(partId) {
            setMenu(false);
            Router.navigate(`${cfg.route}/${partId}`);
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

        return { render, pick, jump, say, answer, toggleMenu };
    }

    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function attr(s) { return esc(s).replace(/"/g, '&quot;'); }

    return { create };
})();
