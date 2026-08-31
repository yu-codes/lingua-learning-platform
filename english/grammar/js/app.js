/**
 * TOEIC Grammar & Sentence Patterns
 * Chapter-based lessons: explanation blocks, contrast tables, examples and
 * self-check questions.
 */
const EnglishGrammar = (() => {
    const BASE = 'english/grammar/data';

    let index = null;            // { parts: [...] }
    const partCache = {};
    let activePart = null;

    async function fetchJSON(url) {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`${r.status} ${url}`);
        return r.json();
    }

    async function render(partId) {
        if (!index) {
            try {
                index = await fetchJSON(`${BASE}/index.json`);
            } catch (e) {
                console.error('Failed to load grammar index', e);
                return;
            }
        }

        activePart = partId && index.parts.some(p => p.id === partId) ? partId : null;
        const part = activePart ? index.parts.find(p => p.id === activePart) : null;

        const crumbs = [
            { name: '首頁', path: '' },
            { name: '英語', path: '' },
            { name: '多益文法', path: 'english/grammar' }
        ];
        if (part) crumbs.push({ name: part.title, path: `english/grammar/${part.id}` });

        document.getElementById('app').innerHTML = `
            ${Router.renderTopbar(crumbs)}
            <div class="thematic-layout">
                <button class="topic-toggle" id="topic-toggle" type="button"
                        aria-controls="sidebar" aria-expanded="false"
                        onclick="EnglishGrammar.toggleMenu()">
                    <span class="topic-toggle-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <path d="M4 6h16M4 12h16M4 18h10"/>
                        </svg>
                    </span>
                    <span class="topic-toggle-body">
                        <span class="topic-toggle-cap">文法章節</span>
                        <span class="topic-toggle-now" id="topic-toggle-now">${part ? `Part ${part.no} · ${part.title}` : '選擇一個章節'}</span>
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
                 onclick="EnglishGrammar.pick('${p.id}')">
                <span class="sub-num">${String(p.no).padStart(2, '0')}</span>
                <span class="gr-side-title">${p.title}</span>
            </div>
        `).join('');
    }

    function renderWelcome() {
        const sections = index.parts.reduce((n, p) => n + (p.sections || 0), 0);
        document.getElementById('content-area').innerHTML = `
            <div class="vocab-welcome">
                <h2>讓人多益滿分的句型與文法</h2>
                <p>${index.parts.length} 個章節、${sections} 個單元。從句子結構一路到長句閱讀與應試策略，每個單元都有對照表、例句與自我檢測題。</p>
                <div class="gr-part-grid">
                    ${index.parts.map(p => `
                        <button class="gr-part-card" type="button" onclick="EnglishGrammar.pick('${p.id}')">
                            <span class="gr-part-no">PART ${String(p.no).padStart(2, '0')}</span>
                            <span class="gr-part-title">${p.title}</span>
                            <span class="gr-part-sub">${p.subtitle}</span>
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
            if (!partCache[partId]) partCache[partId] = await fetchJSON(`${BASE}/${partId}.json`);
        } catch (e) {
            content.innerHTML = '<div class="vocab-loading">這個章節載入失敗。</div>';
            return;
        }
        const p = partCache[partId];
        const meta = index.parts.find(x => x.id === partId);
        const i = index.parts.findIndex(x => x.id === partId);
        const prev = i > 0 ? index.parts[i - 1] : null;
        const next = i < index.parts.length - 1 ? index.parts[i + 1] : null;

        content.innerHTML = `
            <div class="content-header">
                <span class="gr-eyebrow">PART ${String(meta.no).padStart(2, '0')} · ${meta.subtitle}</span>
                <h2>${escapeHtml(p.title)}</h2>
                <p>${escapeHtml(p.summary || '')}</p>
            </div>
            <nav class="gr-toc">
                ${p.sections.map((s, n) => `
                    <button type="button" onclick="EnglishGrammar.jump('sec-${n}')">
                        <span>${String(n + 1).padStart(2, '0')}</span>${escapeHtml(s.title)}
                    </button>
                `).join('')}
            </nav>
            ${p.sections.map((s, n) => renderSection(s, n)).join('')}
            <div class="gr-nav">
                ${prev ? `<button class="gr-nav-btn" type="button" onclick="EnglishGrammar.pick('${prev.id}')">← Part ${prev.no}　${escapeHtml(prev.title)}</button>` : '<span></span>'}
                ${next ? `<button class="gr-nav-btn" type="button" onclick="EnglishGrammar.pick('${next.id}')">Part ${next.no}　${escapeHtml(next.title)} →</button>` : '<span></span>'}
            </div>
        `;
        document.getElementById('content-area').scrollTop = 0;
    }

    function renderSection(s, n) {
        return `
            <section class="gr-section" id="sec-${n}">
                <h3 class="gr-section-title"><span>${String(n + 1).padStart(2, '0')}</span>${escapeHtml(s.title)}</h3>
                ${(s.blocks || []).map(renderBlock).join('')}
            </section>
        `;
    }

    function renderBlock(b, i) {
        switch (b.type) {
            case 'text':
                return `<p class="gr-text">${escapeHtml(b.value)}</p>`;
            case 'rule':
                return `<div class="gr-rule"><span class="gr-rule-cap">規則</span><span>${escapeHtml(b.value)}</span></div>`;
            case 'list':
                return `<ul class="gr-list">${b.items.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`;
            case 'table':
                return `<div class="gr-table-wrap"><table class="gr-table">
                    <thead><tr>${b.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
                    <tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody>
                </table></div>`;
            case 'examples':
                return `<div class="gr-examples">${b.items.map(x => `
                    <div class="gr-ex ${x.bad ? 'is-bad' : ''}">
                        <button class="vocab-speak sm" type="button" title="唸出例句"
                                onclick="EnglishGrammar.say(this.dataset.t)" data-t="${escapeAttr(x.en)}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>
                        </button>
                        <div>
                            <p class="gr-ex-en">${x.bad ? '<span class="gr-x">✗</span>' : ''}${escapeHtml(x.en)}</p>
                            ${x.zh ? `<p class="gr-ex-zh">${escapeHtml(x.zh)}</p>` : ''}
                            ${x.note ? `<p class="gr-ex-note">${escapeHtml(x.note)}</p>` : ''}
                        </div>
                    </div>`).join('')}</div>`;
            case 'tip':
                return `<div class="gr-tip"><span aria-hidden="true">💡</span><span>${escapeHtml(b.value)}</span></div>`;
            case 'trap':
                return `<div class="gr-trap"><span class="gr-trap-cap">多益陷阱</span><span>${escapeHtml(b.value)}</span></div>`;
            case 'quiz':
                return renderQuiz(b);
            default:
                return '';
        }
    }

    let quizSeq = 0;
    function renderQuiz(b) {
        const id = `q${quizSeq++}`;
        return `
            <div class="gr-quiz" id="${id}">
                <p class="gr-quiz-q">${escapeHtml(b.q)}</p>
                <div class="gr-quiz-opts">
                    ${b.options.map((o, i) => `
                        <button type="button" class="gr-opt" data-i="${i}"
                                onclick="EnglishGrammar.answer('${id}', ${i}, ${b.answer})">
                            <span class="gr-opt-k">${'ABCD'[i]}</span>${escapeHtml(o)}
                        </button>
                    `).join('')}
                </div>
                <p class="gr-quiz-explain" hidden>${escapeHtml(b.explain || '')}</p>
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
        if (typeof TTS !== 'undefined') TTS.speak(text, 'en-US');
    }

    function pick(partId) {
        setMenu(false);
        Router.navigate(`english/grammar/${partId}`);
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
    function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }

    return { render, pick, jump, say, answer, toggleMenu };
})();
