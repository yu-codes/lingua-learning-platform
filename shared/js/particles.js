/**
 * Particle Field
 * A drifting dot/line network rendered behind the app. Lives outside #app so
 * router re-renders never touch it.
 */
const ParticleField = (() => {
    const CONNECT_DIST = 124;     // px between dots before a line is drawn
    const MOUSE_RADIUS = 150;
    const BASE_SPEED = 0.28;      // slow macro drift
    const MAX_DPR = 2;

    let canvas, ctx, dock;
    let sprite = null, spriteR = 0;
    let pairs = [], pairAge = 0;
    let particles = [];
    let raf = null;
    let mouse = { x: null, y: null };
    let w = 0, h = 0, dpr = 1;
    let paused = false;
    let connections = true;
    let reduced = false;

    // FPS readout for the control dock
    let frames = 0, fpsMark = 0, fps = 60;

    function prefersReducedMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function load(key, fallback) {
        try {
            const v = localStorage.getItem(key);
            return v === null ? fallback : v === '1';
        } catch (e) {
            return fallback;   // private mode
        }
    }

    function save(key, val) {
        try { localStorage.setItem(key, val ? '1' : '0'); } catch (e) { /* ignore */ }
    }

    /** Density scales with viewport area, capped so phones stay smooth. */
    function targetCount() {
        const area = w * h;
        const n = Math.round(area / 15000);
        return Math.max(30, Math.min(w < 760 ? 46 : 110, n));
    }

    function makeParticle() {
        const size = Math.random() * 3.2 + 1.6;        // 1.6 - 4.8px
        return {
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * BASE_SPEED,
            vy: (Math.random() - 0.5) * BASE_SPEED,
            size,
            baseAlpha: Math.random() * 0.45 + 0.12,     // 0.12 - 0.57
            alpha: 0.3,
            pulseSpeed: 0.6 + Math.random() * 1.1,
            pulseOffset: Math.random() * Math.PI * 2
        };
    }

    function sync() {
        const want = targetCount();
        while (particles.length < want) particles.push(makeParticle());
        if (particles.length > want) particles.length = want;
    }

    /** One radial-gradient sprite, stamped per particle — far cheaper than
        an arc fill plus ctx.shadowBlur on every dot, every frame. */
    function buildSprite() {
        spriteR = 24;
        sprite = document.createElement('canvas');
        sprite.width = sprite.height = spriteR * 2;
        const c = sprite.getContext('2d');
        const g = c.createRadialGradient(spriteR, spriteR, 0, spriteR, spriteR, spriteR);
        g.addColorStop(0.00, 'rgba(190, 245, 255, 1)');
        g.addColorStop(0.28, 'rgba(126, 224, 245, 0.85)');
        g.addColorStop(0.55, 'rgba(103, 216, 240, 0.22)');
        g.addColorStop(1.00, 'rgba(103, 216, 240, 0)');
        c.fillStyle = g;
        c.fillRect(0, 0, spriteR * 2, spriteR * 2);
    }

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        sync();
        pairAge = 0;
        if (paused || reduced) drawFrame();   // keep a static field visible
    }

    function step(dt) {
        const t = performance.now() * 0.001;
        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha = p.baseAlpha + Math.sin(t * p.pulseSpeed + p.pulseOffset) * 0.1;

            if (mouse.x !== null) {
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const d = Math.hypot(dx, dy);
                if (d < MOUSE_RADIUS && d > 0.01) {
                    const force = (MOUSE_RADIUS - d) / MOUSE_RADIUS;
                    p.vx -= (dx / d) * force * 0.05;
                    p.vy -= (dy / d) * force * 0.05;
                }
            }

            // Ease back to the calm drift speed after a nudge
            const sp = Math.hypot(p.vx, p.vy);
            if (sp > BASE_SPEED * 1.6) { p.vx *= 0.95; p.vy *= 0.95; }

            if (p.x < 0) { p.x = w; pairAge = 0; } else if (p.x > w) { p.x = 0; pairAge = 0; }
            if (p.y < 0) { p.y = h; pairAge = 0; } else if (p.y > h) { p.y = 0; pairAge = 0; }
        }
    }

    /** Pairs within a slightly padded radius, so they stay valid between rebuilds. */
    function rebuildPairs() {
        const R = CONNECT_DIST + 8;
        pairs.length = 0;
        for (let i = 0; i < particles.length; i++) {
            const a = particles[i];
            for (let j = i + 1; j < particles.length; j++) {
                const b = particles[j];
                const dx = a.x - b.x;
                if (dx > R || dx < -R) continue;
                const dy = a.y - b.y;
                if (dy > R || dy < -R) continue;
                if (dx * dx + dy * dy < R * R) pairs.push(a, b);
            }
        }
    }

    function drawFrame() {
        ctx.clearRect(0, 0, w, h);

        if (connections) {
            // Which dots are near each other barely changes at this drift speed,
            // so the O(n^2) pass runs every few frames while the lines are still
            // drawn from live positions. This is the single biggest frame cost.
            if (--pairAge <= 0) { rebuildPairs(); pairAge = 4; }
            ctx.lineWidth = 0.6;
            for (let k = 0; k < pairs.length; k += 2) {
                const a = pairs[k], b = pairs[k + 1];
                const d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d >= CONNECT_DIST) continue;
                ctx.strokeStyle = `rgba(103, 216, 240, ${(1 - d / CONNECT_DIST) * 0.18})`;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
        }

        for (const p of particles) {
            const r = p.size * 2.6;
            ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
            ctx.drawImage(sprite, p.x - r, p.y - r, r * 2, r * 2);
        }
        ctx.globalAlpha = 1;
    }

    function loop(now) {
        raf = requestAnimationFrame(loop);

        frames++;
        if (now - fpsMark >= 1000) {
            fps = Math.round((frames * 1000) / (now - fpsMark));
            frames = 0;
            fpsMark = now;
            const el = document.getElementById('pf-fps');
            if (el) el.textContent = 'FPS ' + fps;
        }

        if (!paused && !reduced) step();
        drawFrame();
    }

    function start() {
        if (raf === null) { fpsMark = performance.now(); raf = requestAnimationFrame(loop); }
    }

    function stop() {
        if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
    }

    /* ===== Controls ===== */

    const ICON = {
        pause: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 5v14M15 5v14"/></svg>',
        play: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M7 4.5v15l12-7.5z"/></svg>',
        link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.3 10.8l7.4-4.3M8.3 13.2l7.4 4.3"/></svg>'
    };

    function buildDock() {
        dock = document.createElement('div');
        dock.className = 'pf-dock';
        dock.innerHTML = `
            <span class="pf-fps" id="pf-fps">FPS ${fps}</span>
            <span class="pf-sep"></span>
            <button class="pf-btn" id="pf-pause" type="button"></button>
            <button class="pf-btn" id="pf-conn" type="button">${ICON.link}</button>
        `;
        document.body.appendChild(dock);
        dock.querySelector('#pf-pause').addEventListener('click', () => setPaused(!paused));
        dock.querySelector('#pf-conn').addEventListener('click', () => setConnections(!connections));
        syncDock();
    }

    function syncDock() {
        const pb = document.getElementById('pf-pause');
        const cb = document.getElementById('pf-conn');
        if (pb) {
            pb.innerHTML = paused ? ICON.play : ICON.pause;
            pb.classList.toggle('active', paused);
            pb.title = paused ? '恢復粒子動態' : '停止粒子動態';
            pb.setAttribute('aria-label', pb.title);
        }
        if (cb) {
            cb.classList.toggle('active', connections);
            cb.title = connections ? '隱藏連線（降噪）' : '顯示連線';
            cb.setAttribute('aria-label', cb.title);
        }
    }

    function setPaused(v) {
        paused = v;
        save('lingua-pf-paused', v);
        syncDock();
    }

    function setConnections(v) {
        connections = v;
        save('lingua-pf-conn', v);
        syncDock();
    }

    /* ===== Boot ===== */

    function init() {
        reduced = prefersReducedMotion();
        paused = load('lingua-pf-paused', reduced);
        connections = load('lingua-pf-conn', true);

        canvas = document.createElement('canvas');
        canvas.className = 'pf-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        document.body.insertBefore(canvas, document.body.firstChild);
        ctx = canvas.getContext('2d');

        buildSprite();
        resize();
        buildDock();

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
        window.addEventListener('mouseout', e => { if (!e.relatedTarget) { mouse.x = mouse.y = null; } });
        // Never burn frames on a tab nobody is looking at
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) stop(); else start();
        });

        start();
    }

    return { init, setPaused, setConnections };
})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ParticleField.init);
} else {
    ParticleField.init();
}
