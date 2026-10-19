import { reducedMotion, clamp } from "./utils.js";

/**
 * The cover's living neural network.
 *  - Neurons sit near fixed anchors and wobble a little, so edges stay stable.
 *  - Each neuron links to its 3 nearest neighbours.
 *  - A firing neuron sends signals along its edges; enough incoming charge
 *    makes the next neuron fire (with a refractory period so it calms down).
 *  - The pointer charges nearby neurons; a click fires the nearest one.
 */
export function initNeural(canvas, { onUserFire } = {}) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const hero = canvas.parentElement;
  const still = reducedMotion();

  let W = 0;
  let H = 0;
  let dpr = 1;
  let nodes = [];
  let signals = [];
  let colors = readColors();
  let pointer = { x: -9999, y: -9999, active: false };
  let running = false;
  let raf = 0;
  let lastSpont = 0;

  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    return {
      node: cs.getPropertyValue("--net-node").trim() || "242,230,201",
      fire: cs.getPropertyValue("--net-fire").trim() || "255,201,60",
      signal: cs.getPropertyValue("--net-signal").trim() || "46,196,214",
      bg: cs.getPropertyValue("--bg").trim() || "#15131f",
    };
  }

  function build() {
    const rect = hero.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // jittered grid gives an even but organic spread
    const count = clamp(Math.round((W * H) / 15000), 28, 95);
    const cols = Math.ceil(Math.sqrt((count * W) / H));
    const rows = Math.ceil(count / cols);
    const cw = W / cols;
    const ch = H / rows;
    nodes = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (nodes.length >= count) break;
        const ax = (c + 0.5 + (Math.random() - 0.5) * 0.8) * cw;
        const ay = (r + 0.5 + (Math.random() - 0.5) * 0.8) * ch;
        nodes.push({
          ax, ay, x: ax, y: ay,
          phase: Math.random() * Math.PI * 2,
          amp: 4 + Math.random() * 8,
          r: 2 + Math.random() * 2.2,
          charge: 0,
          glow: 0,
          rest: 0,
          links: [],
        });
      }
    }
    // 3 nearest neighbours each, stored both ways
    nodes.forEach((n, i) => {
      const near = nodes
        .map((m, j) => ({ j, d: (m.ax - n.ax) ** 2 + (m.ay - n.ay) ** 2 }))
        .filter((o) => o.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 3);
      near.forEach(({ j }) => {
        if (!n.links.includes(j)) n.links.push(j);
        if (!nodes[j].links.includes(i)) nodes[j].links.push(i);
      });
    });
    signals = [];
  }

  function fire(i, from = -1, strength = 1) {
    const n = nodes[i];
    if (!n || n.rest > 0) return;
    n.glow = 1;
    n.rest = 55; // frames of refractory time
    n.charge = 0;
    for (const j of n.links) {
      if (j === from) continue;
      if (signals.length > 140) break;
      if (Math.random() < 0.72 * strength) signals.push({ a: i, b: j, t: 0, v: 0.022 + Math.random() * 0.02 });
    }
  }

  function step(time) {
    // wobble
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x = n.ax + Math.sin(time * 0.0006 + n.phase) * n.amp;
      n.y = n.ay + Math.cos(time * 0.0005 + n.phase * 1.3) * n.amp;
      if (n.rest > 0) n.rest--;
      n.glow *= 0.94;
      n.charge *= 0.985;
      if (pointer.active) {
        const d = Math.hypot(n.x - pointer.x, n.y - pointer.y);
        if (d < 130) {
          n.charge += (1 - d / 130) * 0.05;
          if (n.charge > 1) fire(i, -1, 0.6);
        }
      }
    }
    // signals travel
    for (let k = signals.length - 1; k >= 0; k--) {
      const s = signals[k];
      s.t += s.v;
      if (s.t >= 1) {
        signals.splice(k, 1);
        const n = nodes[s.b];
        n.charge += 0.62;
        if (n.charge >= 1) fire(s.b, s.a, 0.85);
        else n.glow = Math.max(n.glow, 0.35);
      }
    }
    // spontaneous activity keeps it alive
    if (time - lastSpont > 900) {
      lastSpont = time;
      fire(Math.floor(Math.random() * nodes.length), -1, 0.9);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const { node, fire: fc, signal } = colors;

    ctx.lineWidth = 1.1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (const j of a.links) {
        if (j < i) continue;
        const b = nodes[j];
        const e = Math.max(a.glow, b.glow);
        ctx.strokeStyle = `rgba(${node},${0.1 + e * 0.35})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    for (const s of signals) {
      const a = nodes[s.a];
      const b = nodes[s.b];
      const x = a.x + (b.x - a.x) * s.t;
      const y = a.y + (b.y - a.y) * s.t;
      const tx = a.x + (b.x - a.x) * Math.max(0, s.t - 0.18);
      const ty = a.y + (b.y - a.y) * Math.max(0, s.t - 0.18);
      ctx.strokeStyle = `rgba(${signal},0.85)`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = `rgb(${signal})`;
      ctx.beginPath();
      ctx.arc(x, y, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const n of nodes) {
      const r = n.r + n.glow * 3.5;
      if (n.glow > 0.08) {
        ctx.fillStyle = `rgba(${fc},${n.glow * 0.25})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = n.glow > 0.3 ? `rgb(${fc})` : colors.bg;
      ctx.strokeStyle = `rgba(${node},${0.45 + n.glow * 0.5})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  function loop(time) {
    step(time);
    draw();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running || still) return;
    running = true;
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  // pointer input on the whole hero (text sits above the canvas)
  hero.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top, active: true };
  });
  hero.addEventListener("pointerleave", () => {
    pointer.active = false;
  });
  hero.addEventListener("click", (e) => {
    if (e.target.closest("a, button")) return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    let best = -1;
    let bestD = 90;
    nodes.forEach((n, i) => {
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best >= 0) {
      nodes[best].rest = 0;
      fire(best, -1, 1.3);
      if (still) draw();
      onUserFire?.();
    }
  });

  // re-read colours when the edition changes
  new MutationObserver(() => {
    colors = readColors();
    if (still) draw();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  let resizeTimer;
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      build();
      draw();
    }, 120);
  });
  ro.observe(hero);

  // only animate while the cover is on screen and the tab is visible
  let visible = true;
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visible && !document.hidden ? start() : stop();
  }).observe(hero);
  document.addEventListener("visibilitychange", () => {
    !document.hidden && visible ? start() : stop();
  });

  build();
  if (still) {
    // one calm frame with a few lit neurons
    for (let k = 0; k < 6; k++) nodes[Math.floor(Math.random() * nodes.length)].glow = 0.8;
    draw();
  } else {
    start();
  }
}
